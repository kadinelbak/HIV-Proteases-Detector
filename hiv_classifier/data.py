from dataclasses import dataclass
from typing import Dict, List, Tuple

import csv
import io
import urllib.request

import numpy as np
import torch
from rdkit import Chem, DataStructs
from rdkit.Chem import AllChem
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset


@dataclass
class DataBundle:
    train_loader: DataLoader
    val_loader: DataLoader
    test_loader: DataLoader
    y_train: np.ndarray
    y_val: np.ndarray
    y_test: np.ndarray


class FingerprintDataset(Dataset):
    """PyTorch dataset for fingerprint vectors and binary labels."""

    def __init__(self, features: np.ndarray, labels: np.ndarray):
        self.features = torch.tensor(features, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.float32).unsqueeze(1)

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, idx: int):
        return self.features[idx], self.labels[idx]


def _load_hiv_from_deepchem() -> Tuple[np.ndarray, np.ndarray]:
    """Load HIV data using DeepChem MoleculeNet helper."""
    import deepchem as dc  # Lazy import so environments without DeepChem can still run via fallback.

    _, datasets, _ = dc.molnet.load_hiv(featurizer="Raw", splitter="random", reload=False)

    all_smiles = np.concatenate([ds.ids for ds in datasets], axis=0)
    all_y = np.concatenate([ds.y.reshape(-1) for ds in datasets], axis=0)
    all_w = np.concatenate([ds.w.reshape(-1) for ds in datasets], axis=0)

    valid_mask = (all_w > 0) & np.isfinite(all_y)
    smiles = all_smiles[valid_mask]
    labels = all_y[valid_mask].astype(np.float32)
    return smiles, labels


def _load_hiv_from_csv_fallback() -> Tuple[np.ndarray, np.ndarray]:
    """
    Fallback loader for environments where DeepChem is unavailable.

    Source is the public MoleculeNet HIV CSV used by DeepChem.
    """
    url = "https://deepchemdata.s3-us-west-1.amazonaws.com/datasets/HIV.csv"
    with urllib.request.urlopen(url, timeout=60) as response:
        content = response.read().decode("utf-8")

    smiles: List[str] = []
    labels: List[float] = []

    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        smi = row.get("smiles")
        label_value = row.get("HIV_active")
        if smi is None or label_value is None:
            continue

        try:
            y = float(label_value)
        except ValueError:
            continue

        smiles.append(smi)
        labels.append(y)

    return np.array(smiles), np.array(labels, dtype=np.float32)


def load_hiv_smiles_and_labels() -> Tuple[np.ndarray, np.ndarray]:
    """
    Load MoleculeNet HIV and return SMILES + labels.

    Preferred path: DeepChem loader.
    Fallback path: direct CSV download if DeepChem is not installed.
    """
    try:
        return _load_hiv_from_deepchem()
    except Exception:
        return _load_hiv_from_csv_fallback()


def smiles_to_morgan(
    smiles: np.ndarray,
    labels: np.ndarray,
    radius: int = 2,
    n_bits: int = 1024,
) -> Tuple[np.ndarray, np.ndarray, Dict[str, int]]:
    """
    Convert SMILES to Morgan fingerprints.

    Invalid SMILES are skipped gracefully and counted in stats.
    """
    features: List[np.ndarray] = []
    kept_labels: List[float] = []
    invalid_smiles = 0

    for smi, y in zip(smiles, labels):
        mol = Chem.MolFromSmiles(str(smi))
        if mol is None:
            invalid_smiles += 1
            continue

        fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=radius, nBits=n_bits)
        arr = np.zeros((n_bits,), dtype=np.float32)
        DataStructs.ConvertToNumpyArray(fp, arr)

        features.append(arr)
        kept_labels.append(float(y))

    X = np.array(features, dtype=np.float32)
    y = np.array(kept_labels, dtype=np.float32)

    stats = {
        "invalid_smiles": invalid_smiles,
        "valid_molecules": int(len(y)),
        "total_seen": int(len(smiles)),
    }
    return X, y, stats


def split_data(
    X: np.ndarray,
    y: np.ndarray,
    train_ratio: float,
    val_ratio: float,
    test_ratio: float,
    seed: int,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Split into train/val/test using stratification when class counts allow.

    Desired split: 80/10/10 by default.
    """
    if abs((train_ratio + val_ratio + test_ratio) - 1.0) > 1e-8:
        raise ValueError("train_ratio + val_ratio + test_ratio must equal 1.0")

    classes, counts = np.unique(y, return_counts=True)
    can_stratify = (len(classes) > 1) and np.all(counts >= 2)
    strat_target = y if can_stratify else None

    # First split off test.
    X_temp, X_test, y_temp, y_test = train_test_split(
        X,
        y,
        test_size=test_ratio,
        random_state=seed,
        stratify=strat_target,
    )

    # Split remaining portion into train and val.
    val_fraction_of_temp = val_ratio / (train_ratio + val_ratio)
    strat_temp = y_temp if can_stratify else None

    X_train, X_val, y_train, y_val = train_test_split(
        X_temp,
        y_temp,
        test_size=val_fraction_of_temp,
        random_state=seed,
        stratify=strat_temp,
    )

    return X_train, X_val, X_test, y_train, y_val, y_test


def build_dataloaders(
    X_train: np.ndarray,
    X_val: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_val: np.ndarray,
    y_test: np.ndarray,
    batch_size_train: int,
    batch_size_eval: int,
    num_workers: int,
) -> DataBundle:
    """Create Dataset and DataLoader objects for all splits."""
    train_ds = FingerprintDataset(X_train, y_train)
    val_ds = FingerprintDataset(X_val, y_val)
    test_ds = FingerprintDataset(X_test, y_test)

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size_train,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size_eval,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )
    test_loader = DataLoader(
        test_ds,
        batch_size=batch_size_eval,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )

    return DataBundle(
        train_loader=train_loader,
        val_loader=val_loader,
        test_loader=test_loader,
        y_train=y_train,
        y_val=y_val,
        y_test=y_test,
    )
