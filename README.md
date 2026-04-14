# HIV Inhibition Classifier — Predicting Molecular Bioactivity with Deep Learning

A reproducible PyTorch pipeline that predicts HIV inhibitory activity from SMILES strings using Morgan fingerprints and a multi-layer perceptron (MLP). Trained and evaluated on the MoleculeNet HIV benchmark dataset (\~41,000 molecules).

---

## Key Results

| Metric | Score |
|---|---|
| ROC-AUC | **0.788** |
| PR-AUC | **0.356** |
| Balanced Accuracy | **0.690** |
| MCC | **0.371** |
| Precision @ 0.5 | 0.384 |
| Recall @ 0.5 | 0.403 |
| F1 @ 0.5 | 0.393 |

> The HIV dataset is heavily class-imbalanced (~3.5% positive). PR-AUC and MCC are the primary evaluation targets for this reason.

---

## Architecture

```
SMILES  ──►  Morgan Fingerprint (1024-bit, radius 2)
                       │
               Linear(1024 → 512)
               ReLU + Dropout(0.5)
               Linear(512 → 256)
               ReLU + Dropout(0.5)
               Linear(256 → 1)   ──►  BCEWithLogitsLoss
                                       (pos_weight handles imbalance)
```

Training: Adam (lr=0.001), 50 epochs, 80/10/10 split, seed=42.

---

## Repository Structure

```
hiv-inhibition-classifier/
│
├── hiv_classifier/          # Core package (importable)
│   ├── data.py              #   SMILES → fingerprint pipeline + DataLoaders
│   ├── model.py             #   HIVMLP architecture definition
│   ├── train.py             #   Training loop, pos_weight computation
│   ├── evaluate.py          #   ROC/PR metrics, loss & ROC plot utilities
│   └── utils.py             #   Seed, device, YAML config helpers
│
├── config/
│   └── default.yaml         # All hyperparameters (edit here, not in code)
│
├── scripts/
│   └── run_training.py      # CLI entrypoint — full train → evaluate pipeline
│
├── notebooks/
│   ├── colab_hiv_wrapper.ipynb        # Step-by-step Colab/local notebook
│   └── HIV_Inhibition_Presentation.ipynb  # RISE slideshow presentation
│
├── results/
│   ├── best_model.pth        # Saved model weights
│   ├── extra_metrics.json    # Full metrics from evaluation run
│   ├── loss_curve.png        # Training vs validation loss
│   └── roc_curve.png         # Test ROC curve
│
├── requirements.txt
└── README.md
```

---

## Quick Start (Local)

```bash
git clone https://github.com/<your-username>/hiv-inhibition-classifier.git
cd hiv-inhibition-classifier

python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python scripts/run_training.py --config config/default.yaml
```

Outputs are written to `results/`: `best_model.pth`, `loss_curve.png`, `roc_curve.png`, `extra_metrics.json`.

---

## Quick Start (Google Colab)

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/<your-username>/hiv-inhibition-classifier/blob/main/notebooks/colab_hiv_wrapper.ipynb)

```python
# In Colab, after cloning the repo:
!git clone https://github.com/<your-username>/hiv-inhibition-classifier.git
%cd hiv-inhibition-classifier
!pip install -r requirements.txt
```

Then run `notebooks/colab_hiv_wrapper.ipynb` cell by cell for a guided walkthrough.

---

## Notebooks

| Notebook | Purpose |
|---|---|
| **[`hiv_classification_project.ipynb`](notebooks/hiv_classification_project.ipynb)** | **Main project notebook — full pipeline from raw data to all results** |
| [`HIV_Inhibition_Presentation.ipynb`](notebooks/HIV_Inhibition_Presentation.ipynb) | RISE slideshow presentation with interactive ipywidgets |
| [`colab_hiv_wrapper.ipynb`](notebooks/colab_hiv_wrapper.ipynb) | Lightweight wrapper that calls the modular package directly |

> **Start here:** `notebooks/hiv_classification_project.ipynb` is the single end-to-end deliverable. Run all cells top-to-bottom to reproduce the full dataset exploration, training run, and evaluation results.

---

## Configuration

All tunable parameters live in `config/default.yaml`. No code edits needed for experiments:

| Section | Key Parameters |
|---|---|
| `data` | `fingerprint_bits`, `fingerprint_radius`, train/val/test split ratios |
| `model` | `hidden_dim_1`, `hidden_dim_2`, `dropout` |
| `training` | `epochs`, `learning_rate` |
| `plots` | `dpi`, `show_plots`, `save_plots` |

---

## Dataset

[MoleculeNet HIV dataset](http://moleculenet.org/datasets-1) — 41,127 molecules screened for HIV inhibitory activity. Labels: `1` = active (inhibitor), `0` = inactive. Class ratio ~1:28 (positive:negative).

Data is loaded automatically via DeepChem's `molnet.load_hiv()` on first run. A CSV fallback loader is included for environments where DeepChem is unavailable.

---

## Tech Stack

| Library | Role |
|---|---|
| PyTorch | Model definition, training loop, GPU/CPU device abstraction |
| RDKit | SMILES parsing, Morgan fingerprint generation |
| DeepChem | MoleculeNet HIV dataset loading |
| scikit-learn | Train/val/test split, ROC-AUC, PR-AUC, MCC, balanced accuracy |
| matplotlib | Loss curves, ROC curve, presentation visuals |
| ipywidgets | Interactive sliders and dropdowns in presentation notebook |
| RISE | Reveal.js slideshow rendering in Jupyter |
| PyYAML | Configuration file parsing |

---

## Reproducing the Saved Results

The `results/` folder contains outputs from a completed training run (seed=42, 50 epochs). To reproduce:

```bash
python scripts/run_training.py --config config/default.yaml
```

Expected test ROC-AUC: ~0.788 (may vary slightly due to data download randomness).
