import argparse
import os

import torch
import torch.nn as nn

from hiv_classifier.data import build_dataloaders, load_hiv_smiles_and_labels, smiles_to_morgan, split_data
from hiv_classifier.evaluate import (
    collect_probabilities_and_labels,
    compute_roc_metrics,
    plot_loss_curves,
    plot_roc_curve,
)
from hiv_classifier.model import HIVMLP
from hiv_classifier.train import compute_pos_weight, run_one_epoch, train_model
from hiv_classifier.utils import ensure_dir, get_device, load_yaml_config, set_seed


def parse_args():
    parser = argparse.ArgumentParser(description="Train HIV classifier on MoleculeNet HIV")
    parser.add_argument(
        "--config",
        type=str,
        default="config/default.yaml",
        help="Path to YAML config file",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    cfg = load_yaml_config(args.config)

    # Helpful reminder for Colab users.
    print("If dependencies are missing in Colab, run:")
    print("  !pip install deepchem rdkit torch scikit-learn matplotlib pyyaml")

    set_seed(int(cfg["seed"]))
    device = get_device(cfg["device"])
    print(f"Using device: {device}")

    results_dir = cfg["paths"]["results_dir"]
    ensure_dir(results_dir)

    # 1) Load raw HIV data.
    smiles, labels = load_hiv_smiles_and_labels()
    print(f"Loaded labeled molecules: {len(labels)}")

    # 2) Convert SMILES -> Morgan fingerprints.
    fp_bits = int(cfg["data"]["fingerprint_bits"])
    fp_radius = int(cfg["data"]["fingerprint_radius"])
    X, y, fp_stats = smiles_to_morgan(smiles=smiles, labels=labels, radius=fp_radius, n_bits=fp_bits)
    print(f"Morgan conversion stats: {fp_stats}")

    # 3) Split data into 80/10/10.
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(
        X=X,
        y=y,
        train_ratio=float(cfg["data"]["train_ratio"]),
        val_ratio=float(cfg["data"]["val_ratio"]),
        test_ratio=float(cfg["data"]["test_ratio"]),
        seed=int(cfg["seed"]),
    )
    print(f"Train: {len(y_train)}, Val: {len(y_val)}, Test: {len(y_test)}")

    # 4) Build dataloaders.
    bundle = build_dataloaders(
        X_train=X_train,
        X_val=X_val,
        X_test=X_test,
        y_train=y_train,
        y_val=y_val,
        y_test=y_test,
        batch_size_train=int(cfg["data"]["batch_size_train"]),
        batch_size_eval=int(cfg["data"]["batch_size_eval"]),
        num_workers=int(cfg["data"]["num_workers"]),
    )

    # 5) Build model.
    model = HIVMLP(
        input_dim=int(cfg["model"]["input_dim"]),
        hidden_dim_1=int(cfg["model"]["hidden_dim_1"]),
        hidden_dim_2=int(cfg["model"]["hidden_dim_2"]),
        dropout=float(cfg["model"]["dropout"]),
    ).to(device)

    # 6) Class imbalance handling.
    pos_weight_value = compute_pos_weight(bundle.y_train)
    print(f"Computed pos_weight for BCEWithLogitsLoss: {pos_weight_value:.4f}")

    criterion = nn.BCEWithLogitsLoss(
        pos_weight=torch.tensor([pos_weight_value], dtype=torch.float32, device=device)
    )
    optimizer = torch.optim.Adam(model.parameters(), lr=float(cfg["training"]["learning_rate"]))

    # 7) Train.
    history = train_model(
        model=model,
        train_loader=bundle.train_loader,
        val_loader=bundle.val_loader,
        criterion=criterion,
        optimizer=optimizer,
        device=device,
        epochs=int(cfg["training"]["epochs"]),
    )

    # Optional: save checkpoint.
    checkpoint_path = cfg["paths"]["checkpoint_path"]
    ensure_dir(os.path.dirname(checkpoint_path))
    torch.save(model.state_dict(), checkpoint_path)
    print(f"Saved model checkpoint to: {checkpoint_path}")

    # 8) Evaluate on test set.
    test_loss = run_one_epoch(
        model=model,
        loader=bundle.test_loader,
        criterion=criterion,
        device=device,
        optimizer=None,
    )
    print(f"Test Loss: {test_loss:.4f}")

    pred_data = collect_probabilities_and_labels(model=model, loader=bundle.test_loader, device=device)
    roc_info = compute_roc_metrics(labels=pred_data["labels"], probs=pred_data["probs"])

    if roc_info["auc"] is None:
        print("Test ROC-AUC: undefined (test set has a single class)")
    else:
        print(f"Test ROC-AUC: {roc_info['auc']:.4f}")

    # 9) Plot and save results.
    show_plots = bool(cfg["plots"]["show_plots"])
    save_plots = bool(cfg["plots"]["save_plots"])
    dpi = int(cfg["plots"]["dpi"])

    loss_plot_path = cfg["plots"]["loss_plot_path"] if save_plots else None
    roc_plot_path = cfg["plots"]["roc_plot_path"] if save_plots else None

    plot_loss_curves(
        train_losses=history["train_loss"],
        val_losses=history["val_loss"],
        dpi=dpi,
        save_path=loss_plot_path,
        show_plot=show_plots,
    )

    plot_roc_curve(
        fpr=roc_info["fpr"],
        tpr=roc_info["tpr"],
        auc_value=roc_info["auc"],
        dpi=dpi,
        save_path=roc_plot_path,
        show_plot=show_plots,
    )


if __name__ == "__main__":
    main()
