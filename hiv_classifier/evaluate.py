from typing import Dict, Optional

import matplotlib.pyplot as plt
import numpy as np
import torch
from sklearn.metrics import roc_auc_score, roc_curve
from torch.utils.data import DataLoader


@torch.no_grad()
def collect_probabilities_and_labels(
    model: torch.nn.Module,
    loader: DataLoader,
    device: torch.device,
) -> Dict[str, np.ndarray]:
    """Collect sigmoid probabilities and true labels for a loader."""
    model.eval()

    all_probs = []
    all_labels = []

    for features, labels in loader:
        features = features.to(device, non_blocking=True)
        logits = model(features)
        probs = torch.sigmoid(logits).squeeze(1).cpu().numpy()

        all_probs.append(probs)
        all_labels.append(labels.squeeze(1).numpy())

    return {
        "probs": np.concatenate(all_probs, axis=0),
        "labels": np.concatenate(all_labels, axis=0).astype(int),
    }


def compute_roc_metrics(labels: np.ndarray, probs: np.ndarray) -> Dict[str, Optional[np.ndarray]]:
    """Compute ROC curve and AUC when both classes are present."""
    unique_values = np.unique(labels)
    if len(unique_values) < 2:
        return {"fpr": None, "tpr": None, "auc": None}

    fpr, tpr, _ = roc_curve(labels, probs)
    auc_value = roc_auc_score(labels, probs)
    return {"fpr": fpr, "tpr": tpr, "auc": auc_value}


def plot_loss_curves(
    train_losses,
    val_losses,
    dpi: int = 140,
    save_path: Optional[str] = None,
    show_plot: bool = True,
) -> None:
    """Plot training and validation loss over epochs."""
    epochs = np.arange(1, len(train_losses) + 1)

    plt.figure(figsize=(8, 5), dpi=dpi)
    plt.plot(epochs, train_losses, label="Training Loss", linewidth=2)
    plt.plot(epochs, val_losses, label="Validation Loss", linewidth=2)
    plt.title("Training vs Validation Loss")
    plt.xlabel("Epoch")
    plt.ylabel("BCEWithLogitsLoss")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()

    if save_path:
        plt.savefig(save_path)

    if show_plot:
        plt.show()
    else:
        plt.close()


def plot_roc_curve(
    fpr,
    tpr,
    auc_value,
    dpi: int = 140,
    save_path: Optional[str] = None,
    show_plot: bool = True,
) -> None:
    """Plot ROC curve and annotate with AUC score."""
    plt.figure(figsize=(8, 5), dpi=dpi)

    if fpr is None or tpr is None or auc_value is None:
        plt.text(0.5, 0.5, "ROC unavailable (single class in test set)", ha="center", va="center")
        plt.title("Test ROC Curve")
        plt.axis("off")
    else:
        plt.plot(fpr, tpr, linewidth=2, label="ROC Curve")
        plt.plot([0, 1], [0, 1], linestyle="--", linewidth=1, label="Random")
        plt.title("Test ROC Curve")
        plt.xlabel("False Positive Rate")
        plt.ylabel("True Positive Rate")
        plt.text(
            0.60,
            0.08,
            f"AUC = {auc_value:.4f}",
            transform=plt.gca().transAxes,
            fontsize=11,
            bbox={"boxstyle": "round", "facecolor": "white", "alpha": 0.8},
        )
        plt.grid(alpha=0.3)
        plt.legend(loc="lower right")

    plt.tight_layout()

    if save_path:
        plt.savefig(save_path)

    if show_plot:
        plt.show()
    else:
        plt.close()
