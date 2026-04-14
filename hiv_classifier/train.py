from typing import Dict, List, Optional

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader


def compute_pos_weight(y_train: np.ndarray) -> float:
    """
    Compute positive class weight for BCEWithLogitsLoss.
    Formula: pos_weight = N_negative / N_positive
    """
    n_pos = int(np.sum(y_train == 1))
    n_neg = int(np.sum(y_train == 0))

    if n_pos == 0:
        raise ValueError("No positive samples in training set, cannot compute class weight.")
    return float(n_neg / n_pos)


def run_one_epoch(
    model: torch.nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
    optimizer: Optional[torch.optim.Optimizer] = None,
) -> float:
    """
    Run one training or validation epoch and return average loss.

    When optimizer is provided: training mode.
    When optimizer is None: evaluation mode.
    """
    is_training = optimizer is not None
    model.train() if is_training else model.eval()

    total_loss = 0.0
    total_count = 0

    for features, labels in loader:
        features = features.to(device, non_blocking=True)
        labels = labels.to(device, non_blocking=True)

        if is_training:
            optimizer.zero_grad(set_to_none=True)

        with torch.set_grad_enabled(is_training):
            logits = model(features)
            loss = criterion(logits, labels)

            if is_training:
                loss.backward()
                optimizer.step()

        batch_size = features.size(0)
        total_loss += float(loss.item()) * batch_size
        total_count += batch_size

    return total_loss / max(total_count, 1)


def train_model(
    model: torch.nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    epochs: int,
) -> Dict[str, List[float]]:
    """Train for the requested epochs and record train/validation loss history."""
    history = {"train_loss": [], "val_loss": []}

    for epoch in range(1, epochs + 1):
        train_loss = run_one_epoch(
            model=model,
            loader=train_loader,
            criterion=criterion,
            device=device,
            optimizer=optimizer,
        )
        val_loss = run_one_epoch(
            model=model,
            loader=val_loader,
            criterion=criterion,
            device=device,
            optimizer=None,
        )

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)

        print(
            f"Epoch {epoch:02d}/{epochs} | "
            f"Train Loss: {train_loss:.4f} | "
            f"Val Loss: {val_loss:.4f}"
        )

    return history
