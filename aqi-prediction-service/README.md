# AQI prediction service

## Lucknow one-hour AQI model

This offline XGBoost model predicts Lucknow city-median AQI at timestamp `t +
1 hour` from hourly AQI history available through `t`. It uses 22 ordered
features: AQI lags, rolling summaries of earlier readings, current AQI at `t`,
and calendar features. It does not use pollutant readings, weather, city names,
or coordinates.

The model is separate from the existing pollutant-input 24-hour service. The
previous 21-feature recursive forecast model is preserved at
`saved_models/aqi_xgboost_recursive_legacy.json`; the new one-hour model uses
`saved_models/aqi_xgboost.json`. The old recursive forecast scripts continue
to use their legacy model. The old pollutant-input trainer/service use
`saved_models/aqi_pollutant_legacy_24h.json`.

## Setup and reproducibility

From this directory, use the existing Python 3.11 `uv` environment:

```powershell
uv sync --frozen
```

Generate the hourly Lucknow timeline and shared training features, then train
and evaluate. `prepare_lucknow.py` is only needed if rebuilding the hourly
series from `data/cpcb-aqi.parquet`.

```powershell
uv run python training/prepare_lucknow.py
uv run python training/create_features.py
uv run python training/train_one_hour.py
uv run python training/evaluate_one_hour.py
uv run python -m unittest discover -s tests
```

Training uses all examples before 2023-01-01. Validation runs from 2023-01-01
through 2023-09-30 and selects the number of boosting rounds through early
stopping. Test runs from 2023-10-01 onward and is scored after model selection;
it is not used to fit or select the model. Training verifies that the saved
feature table matches the shared feature generator and that every target maps
to the source AQI at exactly one hour after its row timestamp. The final origin
row in training and validation is purged where its `t+1` target would cross
into the next period.

The model is saved in native XGBoost JSON format at
`saved_models/aqi_xgboost.json`. Feature order, expected input schema, library
versions, model version, split dates, and test metrics are saved alongside in
`saved_models/aqi_xgboost_metadata.json` and
`saved_models/aqi_xgboost_metrics.json`.

## Local inference

Supply a CSV containing numeric `AQI` and hourly `timestamp` columns, sorted or
unsorted, including the latest observed AQI. The input must provide at least
169 hourly positions spanning 168 hours. Required lag and rolling-window AQI
values must be present and in the range 0–500. Missing observations are not
filled; invalid or insufficient history raises `ValueError`.

```python
import pandas as pd
from aqi_prediction_service.one_hour_inference import OneHourAQIPredictor

history = pd.read_csv("recent_aqi.csv", parse_dates=["timestamp"])
predictor = OneHourAQIPredictor()  # loads saved model; does not retrain
predicted_aqi: float = predictor.predict(history)
print(predicted_aqi)
```

The input feature construction is shared between training and inference in
`src/aqi_prediction_service/feature_engineering.py`. It rejects duplicate
timestamps, invalid AQI types, missing required history, and incompatible model
feature order. The inference method returns one numeric AQI forecast.

## Dataset and evaluation

The hourly Lucknow series spans 2017-09-26 18:00 through 2023-12-31 23:00 and
contains 54,894 hourly rows, including 514 missing AQI observations. The source
was formed by taking the median of available monitoring-station AQI readings
for each city-hour. The feature generator keeps the target only when the next
hour is observed, and does not bridge missing target hours. Missing AQI in a
required lag or rolling window also removes that training row.

The run using the requested chronological split produced:

| Split | Rows | Model MAE | Model RMSE | Model R² | Persistence MAE | Persistence RMSE | Persistence R² |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Validation (Jan–Sep 2023) | 6,201 | 11.99 | 20.64 | 0.8930 | 12.12 | 22.53 | 0.8725 |
| Test (Oct–Dec 2023) | 2,095 | 16.43 | 23.99 | 0.9127 | 18.80 | 28.49 | 0.8770 |

On the test period, XGBoost reduces MAE by 2.37 AQI points (12.6%) and RMSE by
4.50 (15.8%) versus persistence, and improves R² by 0.0358. These metrics
describe the held-out 2023 quarter only; they are not a guarantee of future
performance.

The earlier reference numbers (model MAE 23.17/RMSE 33.19; persistence MAE
30.62/RMSE 44.23) were not reproduced exactly. Running the existing saved
21-feature model on the current test rows gave MAE 23.03/RMSE 32.91, close to
that reference. Its training features omit AQI at timestamp `t`, and its
baseline uses `lag_1` (AQI at `t-1`) while the target is `AQI(t+1)`. That is a
two-hour offset from the latest available observation, so the reference setup
was not a correctly aligned one-hour forecast. The corrected model includes
`current_aqi` and uses that same-time AQI for persistence.

## Limitations

- This is a Lucknow-only historical AQI model, evaluated on data ending in
  2023. It is not validated for other cities or current conditions.
- It uses no weather or pollutant features and does not accept city or location
  inputs.
- Inference requires sufficiently complete recent history for the model's
  required lags and rolling windows; it does not impute missing readings.
- The one-hour model is a local Python module. This change does not expose it
  through FastAPI or integrate it with the Node.js backend.
