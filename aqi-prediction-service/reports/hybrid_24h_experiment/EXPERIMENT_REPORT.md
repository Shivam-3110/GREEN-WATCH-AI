# Hybrid 24-hour AQI experiment

## Method and selection

At each origin, the existing recursive model and all 24 direct models were run. The hybrid then selected one of those two predictions independently per lead. For each lead, selection used the lower validation MAE on common valid pairs; ties or unavailable pairs defaulted to recursive. The mapping was frozen before Q4 evaluation and is recorded in `model_selection_config.json`.

The base models' fit origins precede 2023-01-01: the recursive model trains from 2017-10-03 18:00 through 2022-12-31 22:00; direct horizon training periods are stored individually in model metadata (lead 1 ends 2022-12-31 22:00; lead 24 ends 2022-12-30 23:00). Base-model validation labels are from 2023-01-01 through September 2023, with horizon-aware target purging before 2023-10-01. Hybrid-family selection forecasts use daily 23:00 origins from 2023-01-01 through 2023-09-29 and target timestamps strictly before 2023-10-01. This interval was also used for early stopping/model selection of the underlying artifacts, so the family-selection scores are not an independent validation estimate.

## Implementation and tests

Hybrid inference: `src/aqi_prediction_service/hybrid_forecast.py`; comparison runner: `training/evaluate_hybrid_24h.py`; automated coverage: `tests/test_hybrid_forecast.py`.

## Q4 2023 descriptive comparison

Q4 was previously examined and is not an untouched test. Methods are scored on the exact same valid origin/target rows across recursive, direct, hybrid, and persistence. Persistence repeats AQI observed at the origin. MAE/RMSE are reported lead-by-lead; positive hybrid MAE improvement means benchmark MAE minus hybrid MAE.

| lead_hour | attempted_origins | completed_forecast_origins | valid_pairs | missing_target_pairs | recursive_MAE | recursive_RMSE | direct_MAE | direct_RMSE | hybrid_MAE | hybrid_RMSE | persistence_MAE | persistence_RMSE | hybrid_MAE_improvement_vs_recursive | hybrid_MAE_improvement_pct_vs_recursive | hybrid_MAE_improvement_vs_direct | hybrid_MAE_improvement_pct_vs_direct | hybrid_MAE_improvement_vs_persistence | hybrid_MAE_improvement_pct_vs_persistence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 92 | 71 | 71 | 0 | 17.502 | 22.588 | 17.502 | 22.588 | 17.502 | 22.588 | 15.768 | 22.182 | 0.000 | 0.000 | 0.000 | 0.000 | -1.734 | -10.997 |
| 2 | 92 | 71 | 71 | 0 | 20.277 | 27.268 | 20.913 | 28.047 | 20.913 | 28.047 | 22.768 | 33.847 | -0.636 | -3.136 | 0.000 | 0.000 | 1.854 | 8.144 |
| 3 | 92 | 71 | 71 | 0 | 22.754 | 29.077 | 25.128 | 30.710 | 25.128 | 30.710 | 30.972 | 40.756 | -2.374 | -10.432 | 0.000 | 0.000 | 5.844 | 18.869 |
| 4 | 92 | 71 | 71 | 0 | 26.611 | 34.479 | 27.651 | 35.289 | 26.611 | 34.479 | 38.648 | 51.620 | 0.000 | 0.000 | 1.040 | 3.761 | 12.037 | 31.144 |
| 5 | 92 | 71 | 71 | 0 | 26.869 | 34.006 | 29.430 | 36.432 | 26.869 | 34.006 | 44.296 | 58.106 | 0.000 | 0.000 | 2.561 | 8.701 | 17.426 | 39.341 |
| 6 | 92 | 71 | 71 | 0 | 27.114 | 35.027 | 31.291 | 39.319 | 27.114 | 35.027 | 51.585 | 66.814 | 0.000 | 0.000 | 4.177 | 13.348 | 24.471 | 47.438 |
| 7 | 92 | 71 | 71 | 0 | 30.253 | 39.595 | 34.320 | 43.416 | 30.253 | 39.595 | 59.711 | 77.501 | 0.000 | 0.000 | 4.067 | 11.850 | 29.458 | 49.334 |
| 8 | 92 | 71 | 71 | 0 | 31.179 | 40.447 | 32.284 | 41.739 | 31.179 | 40.447 | 59.803 | 76.815 | 0.000 | 0.000 | 1.105 | 3.423 | 28.624 | 47.864 |
| 9 | 92 | 71 | 71 | 0 | 35.202 | 47.118 | 35.746 | 46.246 | 35.202 | 47.118 | 53.120 | 72.922 | 0.000 | 0.000 | 0.544 | 1.522 | 17.918 | 33.731 |
| 10 | 92 | 71 | 71 | 0 | 39.572 | 51.326 | 37.505 | 47.970 | 37.505 | 47.970 | 48.746 | 67.281 | 2.067 | 5.223 | 0.000 | 0.000 | 11.242 | 23.062 |
| 11 | 92 | 71 | 71 | 0 | 41.453 | 53.865 | 40.450 | 51.230 | 41.453 | 53.865 | 49.669 | 66.008 | 0.000 | 0.000 | -1.003 | -2.479 | 8.216 | 16.542 |
| 12 | 92 | 71 | 71 | 0 | 40.712 | 53.681 | 39.071 | 52.681 | 40.712 | 53.681 | 54.085 | 71.161 | 0.000 | 0.000 | -1.642 | -4.202 | 13.372 | 24.724 |
| 13 | 92 | 71 | 71 | 0 | 40.092 | 52.008 | 40.152 | 52.591 | 40.092 | 52.008 | 65.570 | 86.475 | 0.000 | 0.000 | 0.060 | 0.150 | 25.478 | 38.856 |
| 14 | 92 | 71 | 71 | 0 | 34.971 | 45.911 | 35.771 | 47.055 | 34.971 | 45.911 | 76.289 | 95.925 | 0.000 | 0.000 | 0.801 | 2.238 | 41.318 | 54.160 |
| 15 | 92 | 71 | 71 | 0 | 32.873 | 41.987 | 33.390 | 41.895 | 32.873 | 41.987 | 81.824 | 103.451 | 0.000 | 0.000 | 0.517 | 1.549 | 48.951 | 59.824 |
| 16 | 92 | 71 | 71 | 0 | 29.463 | 39.084 | 30.297 | 39.899 | 29.463 | 39.084 | 92.303 | 114.226 | 0.000 | 0.000 | 0.834 | 2.754 | 62.840 | 68.080 |
| 17 | 92 | 71 | 71 | 0 | 26.286 | 35.596 | 28.639 | 38.271 | 26.286 | 35.596 | 95.521 | 117.814 | 0.000 | 0.000 | 2.353 | 8.215 | 69.235 | 72.482 |
| 18 | 92 | 71 | 71 | 0 | 24.858 | 32.830 | 26.527 | 33.581 | 26.527 | 33.581 | 95.887 | 117.832 | -1.670 | -6.718 | 0.000 | 0.000 | 69.360 | 72.335 |
| 19 | 92 | 71 | 70 | 1 | 26.385 | 33.656 | 26.452 | 32.767 | 26.452 | 32.767 | 89.214 | 112.619 | -0.067 | -0.255 | 0.000 | 0.000 | 62.762 | 70.350 |
| 20 | 92 | 71 | 71 | 0 | 31.218 | 38.021 | 30.545 | 36.178 | 30.545 | 36.178 | 74.296 | 94.179 | 0.673 | 2.157 | 0.000 | 0.000 | 43.751 | 58.887 |
| 21 | 92 | 71 | 71 | 0 | 42.550 | 53.349 | 40.008 | 50.807 | 40.008 | 50.807 | 60.782 | 76.884 | 2.541 | 5.973 | 0.000 | 0.000 | 20.773 | 34.177 |
| 22 | 92 | 71 | 71 | 0 | 46.224 | 60.121 | 43.678 | 56.097 | 43.678 | 56.097 | 51.423 | 67.596 | 2.545 | 5.507 | 0.000 | 0.000 | 7.744 | 15.060 |
| 23 | 92 | 71 | 70 | 1 | 49.840 | 65.260 | 46.289 | 60.611 | 46.289 | 60.611 | 52.864 | 68.431 | 3.551 | 7.125 | 0.000 | 0.000 | 6.575 | 12.438 |
| 24 | 92 | 71 | 71 | 0 | 57.430 | 73.963 | 53.092 | 67.393 | 53.092 | 67.393 | 53.415 | 72.145 | 4.338 | 7.553 | 0.000 | 0.000 | 0.323 | 0.605 |

### Pooled metrics

Pooled rows include every lead from 1 through the named lead and use the four-way common valid targets.

| pooled_through_lead_hour | included_leads | valid_pairs | method | MAE | RMSE |
| --- | --- | --- | --- | --- | --- |
| 1 | 1..1 | 71 | recursive | 17.502 | 22.588 |
| 1 | 1..1 | 71 | direct | 17.502 | 22.588 |
| 1 | 1..1 | 71 | hybrid | 17.502 | 22.588 |
| 1 | 1..1 | 71 | persistence | 15.768 | 22.182 |
| 6 | 1..6 | 426 | recursive | 23.521 | 30.745 |
| 6 | 1..6 | 426 | direct | 25.319 | 32.554 |
| 6 | 1..6 | 426 | hybrid | 24.023 | 31.124 |
| 6 | 1..6 | 426 | persistence | 34.006 | 47.965 |
| 12 | 1..12 | 852 | recursive | 29.958 | 40.324 |
| 12 | 1..12 | 852 | direct | 30.941 | 40.646 |
| 12 | 1..12 | 852 | hybrid | 30.037 | 40.125 |
| 12 | 1..12 | 852 | persistence | 44.097 | 61.221 |
| 24 | 1..24 | 1702 | recursive | 33.398 | 45.051 |
| 24 | 1..24 | 1702 | direct | 33.586 | 44.281 |
| 24 | 1..24 | 1702 | hybrid | 32.943 | 43.842 |
| 24 | 1..24 | 1702 | persistence | 59.093 | 80.371 |

### Category agreement

Existing thresholds are Good <=50, Moderate <=100, Poor <=150, Very Poor <=200, Severe >200. Weighted agreements use valid target counts.

| method | weighted_agreement |
| --- | --- |
| recursive | 0.553 |
| direct | 0.530 |
| hybrid | 0.545 |
| persistence | 0.447 |

### Large AQI changes

Thresholds are training-only per lead: q90 of positive and q10 of negative origin-to-target changes; at least 30 training events to define a threshold and at least 10 common evaluation pairs to report slice metrics. See `rise_fall_metrics.csv`.

## Coverage and limitations

- Validation origins attempted: 272; skipped: 73.
- Q4 origins attempted: 92; forecasted: 71; skipped: 21; valid pairs: 1702; missing target pairs: 2.
- The dataset ends 2023-12-31. Q4 has prior exposure, and validation also participated in early stopping for the existing models. Obtain newer untouched data for confirmatory assessment.
- No interpolation was used. Origins require 169 consecutive observed readings.
- This experiment does not integrate the hybrid into FastAPI and does not establish production readiness.

## Skip details

{
  "validation": [
    {
      "origin": "2023-01-01T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-01-21T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-01-22T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-01-23T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-01-24T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-01-25T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-01-26T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-01-27T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-08T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-09T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-10T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-11T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-12T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-13T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-14T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-17T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-18T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-19T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-20T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-21T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-22T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-03-23T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-13T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-14T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-15T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-16T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-17T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-18T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-19T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-20T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-21T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-22T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-23T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-24T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-25T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-26T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-27T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-04-28T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-05-10T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-05-11T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-05-12T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-05-13T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-05-14T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-05-15T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-05-16T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-02T23:00:00",
      "reason": "missing_AQI_at_origin"
    },
    {
      "origin": "2023-06-03T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-04T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-05T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-06T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-07T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-08T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-09T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-14T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-15T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-16T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-17T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-18T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-19T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-20T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-21T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-22T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-23T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-24T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-25T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-06-26T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-07-21T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-07-22T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-07-23T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-07-24T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-07-25T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-07-26T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-07-27T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    }
  ],
  "q4": [
    {
      "origin": "2023-11-02T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-03T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-04T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-05T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-06T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-07T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-08T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-09T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-10T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-11T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-12T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-13T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-11-14T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-12-15T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-12-16T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-12-17T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-12-18T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-12-19T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-12-20T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-12-21T23:00:00",
      "reason": "insufficient_or_missing_history",
      "detail": "history must contain 169 consecutive observed hourly positions"
    },
    {
      "origin": "2023-12-31T23:00:00",
      "reason": "incomplete_target_timestamp_window",
      "missing_timestamps": 24
    }
  ],
  "inference_failures": []
}

