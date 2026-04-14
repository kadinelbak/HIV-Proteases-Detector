import os
import random
from typing import Any, Dict

import numpy as np
import torch
import yaml


def set_seed(seed: int) -> None:
    """Set all random seeds for reproducible experiments."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_device(device_setting: str = "auto") -> torch.device:
    """
    Return a torch device based on config.

    device_setting options:
    - "auto": use CUDA when available, otherwise CPU
    - "cuda": force CUDA
    - "cpu": force CPU
    """
    if device_setting == "auto":
        return torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device_setting == "cuda":
        return torch.device("cuda")
    return torch.device("cpu")


def ensure_dir(path: str) -> None:
    """Create a directory when it does not exist."""
    os.makedirs(path, exist_ok=True)


def load_yaml_config(path: str) -> Dict[str, Any]:
    """Load a YAML configuration file into a plain dictionary."""
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)
