import torch.nn as nn


class HIVMLP(nn.Module):
    """
    Exact requested architecture:
    1024 -> 512 (ReLU, Dropout 0.5) -> 256 (ReLU, Dropout 0.5) -> 1 (logit)
    """

    def __init__(
        self,
        input_dim: int = 1024,
        hidden_dim_1: int = 512,
        hidden_dim_2: int = 256,
        dropout: float = 0.5,
    ):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim_1),
            nn.ReLU(),
            nn.Dropout(p=dropout),
            nn.Linear(hidden_dim_1, hidden_dim_2),
            nn.ReLU(),
            nn.Dropout(p=dropout),
            nn.Linear(hidden_dim_2, 1),
        )

    def forward(self, x):
        return self.network(x)
