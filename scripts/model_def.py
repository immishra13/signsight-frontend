# scripts/model_def.py
# ⬇️ Replace this with your actual architecture
import torch
import torch.nn as nn

class YourModelClass(nn.Module):
    """
    Example MLP for gestures:
    - Per-frame: input [B, 63]  -> logits [B, num_classes]
    - Sequence:  input [B, T, 63] -> logits [B, num_classes]  (via simple LSTM)
    Set USE_LSTM = True if your model is sequence-based.
    """
    def __init__(self, num_classes=10, use_lstm=True, hidden=128):
        super().__init__()
        self.use_lstm = use_lstm
        if use_lstm:
            self.lstm = nn.LSTM(input_size=63, hidden_size=hidden, batch_first=True)
            self.head = nn.Sequential(
                nn.LayerNorm(hidden),
                nn.ReLU(),
                nn.Linear(hidden, num_classes)
            )
        else:
            self.head = nn.Sequential(
                nn.Linear(63, 256), nn.ReLU(),
                nn.Linear(256, 128), nn.ReLU(),
                nn.Linear(128, num_classes)
            )

    def forward(self, x):
        # x: [B,63] or [B,T,63]
        if self.use_lstm:
            # Expect [B,T,63]
            if x.dim() == 2:
                x = x.unsqueeze(1)  # [B,1,63]
            out, _ = self.lstm(x)      # [B,T,H]
            out = out[:, -1, :]        # last step [B,H]
            return self.head(out)      # [B,num_classes]
        else:
            # Expect [B,63]
            if x.dim() == 3:
                x = x[:, -1, :]        # use last frame
            return self.head(x)
