import torch
import torch.nn as nn


class AQILSTMModel(nn.Module):
    """
    LSTM model for AQI time-series prediction.
    Input:  sequence of past AQI readings (features per timestep)
    Output: predicted AQI values for next N hours
    """

    def __init__(self, input_size=8, hidden_size=128, num_layers=2, output_size=24, dropout=0.2):
        super(AQILSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, output_size),
            nn.ReLU(),  # AQI is always positive
        )

    def forward(self, x):
        # x shape: (batch, seq_len, input_size)
        lstm_out, _ = self.lstm(x)
        # Use last timestep output
        out = self.fc(lstm_out[:, -1, :])
        return out  # shape: (batch, output_size=24)
