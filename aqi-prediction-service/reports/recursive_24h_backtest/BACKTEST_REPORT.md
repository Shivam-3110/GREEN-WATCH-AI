# Recursive 24-hour Lucknow AQI backtest

## Method

- Dataset range: 2017-09-26T18:00:00 to 2023-12-31T23:00:00
- Origins: Daily at 23:00; origin is the final observed timestamp. Lead 1 is origin + 1 hour.
- Target alignment: The next 24 hourly timestamps, origin + 1 hour through origin + 24 hours inclusive.
- Model: `saved_models\aqi_xgboost.json` through the shared one-hour inference and recursive forecast code.
- Forecast history was cut off at each origin. Actual values were joined only after forecasting.
- Persistence predicts the observed AQI at the origin for all lead hours. Model and baseline use identical valid target pairs.
- Cumulative metrics pool every valid origin/lead pair from lead 1 through the named horizon.
- Missing AQI targets remain in the prediction output and are excluded from both model and baseline metrics.

## Run counts

- Attempted origins: 92
- Completed origins: 71
- Skipped origins: 21 ({'forecast_error': 20, 'incomplete_target_timestamp_window': 1})
- Forecast rows: 1704; scored pairs: 1702; missing targets: 2.

## Cumulative metrics

Differences are model minus baseline; negative values favor the model.

| horizon_hours | valid_pairs | missing_target_pairs | model_MAE | model_RMSE | baseline_MAE | baseline_RMSE | MAE_difference_model_minus_baseline | RMSE_difference_model_minus_baseline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 71 | 0 | 17.502 | 22.588 | 15.768 | 22.182 | 1.734 | 0.407 |
| 6 | 426 | 0 | 23.521 | 30.745 | 34.006 | 47.965 | -10.485 | -17.220 |
| 12 | 852 | 0 | 29.958 | 40.324 | 44.097 | 61.221 | -14.139 | -20.897 |
| 24 | 1702 | 2 | 33.398 | 45.051 | 59.093 | 80.371 | -25.694 | -35.320 |

## Interpretation and limitations

This is a retrospective evaluation on one Lucknow city-median series ending in 2023. The model is recursively rolled forward, so multi-hour errors can compound. Daily 23:00 origins produce non-overlapping 24-hour target windows. The result does not establish current-period accuracy, generalization to other cities, or production readiness. No model was retrained or modified.

Per-lead metrics and all prediction rows are in the adjacent CSV files; detailed skip reasons are in `backtest_summary.json`.
