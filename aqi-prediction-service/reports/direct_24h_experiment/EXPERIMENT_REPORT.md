# Direct 24-hour AQI experiment

## Methodology

Twenty-four independent XGBoost regressors use the canonical 22 features at each forecast origin and predict AQI at origin + h for h=1..24. Training targets are purged at 2023-01-01; validation targets are purged at 2023-10-01. Existing recursive inference and origin-AQI persistence are unchanged. Q4 2023 was previously examined and is descriptive only. Missing AQI and gaps are not interpolated; origins need 169 consecutive observed hours.

Direct, recursive, and persistence metrics use identical valid origin/target pairs at each lead. Positive MAE improvement means direct MAE is lower. AQI category thresholds are Good <=50, Moderate <=100, Poor <=150, Very Poor <=200, Severe >200. Rise/fall cutoffs are lead-specific training-only q90/q10 thresholds; threshold minimum is 30 training events and event metric minimum is 10 scored pairs.

## Data coverage

- Dataset: 2017-09-26 18:00:00 to 2023-12-31 23:00:00
- Attempted Q4 origins: 92; origins with common predictions and targets: 71; skipped: 21; missing target pairs: 2.
- Direct model failures: 0; recursive failures: 0.

## Per-lead metrics

MAE improvement is persistence/recursive MAE minus direct MAE; percentage divides by the corresponding baseline MAE.

| lead_hour | attempted_origins | completed_forecast_origins | valid_pairs | missing_target_pairs | direct_forecast_failures | recursive_forecast_failures | direct_MAE | direct_RMSE | recursive_MAE | recursive_RMSE | persistence_MAE | persistence_RMSE | MAE_improvement_vs_recursive | MAE_improvement_pct_vs_recursive | MAE_improvement_vs_persistence | MAE_improvement_pct_vs_persistence | bootstrap_95pct_abs_error_diff_direct_minus_recursive | bootstrap_95pct_abs_error_diff_direct_minus_persistence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 92 | 71 | 71 | 0 | 0 | 0 | 17.502 | 22.588 | 17.502 | 22.588 | 15.768 | 22.182 | 0.000 | 0.000 | -1.734 | -10.997 | (0.0, 0.0) | (-0.3249839339457767, 3.7571072793342695) |
| 2 | 92 | 71 | 71 | 0 | 0 | 0 | 20.913 | 28.047 | 20.277 | 27.268 | 22.768 | 33.847 | -0.636 | -3.136 | 1.854 | 8.144 | (-0.9330986130405479, 2.3348037316765566) | (-5.879606482008813, 2.0742267528050373) |
| 3 | 92 | 71 | 71 | 0 | 0 | 0 | 25.128 | 30.710 | 22.754 | 29.077 | 30.972 | 40.756 | -2.374 | -10.432 | 5.844 | 18.869 | (0.5943954494637503, 4.283022981294444) | (-11.898494860152123, 0.4465837357749367) |
| 4 | 92 | 71 | 71 | 0 | 0 | 0 | 27.651 | 35.289 | 26.611 | 34.479 | 38.648 | 51.620 | -1.040 | -3.908 | 10.997 | 28.453 | (-1.0806034947784855, 3.1840954659690293) | (-17.927296095834652, -4.2223124369769165) |
| 5 | 92 | 71 | 71 | 0 | 0 | 0 | 29.430 | 36.432 | 26.869 | 34.006 | 44.296 | 58.106 | -2.561 | -9.531 | 14.866 | 33.560 | (0.052134955768853866, 5.269723976833719) | (-23.160295627486537, -6.707819522266659) |
| 6 | 92 | 71 | 71 | 0 | 0 | 0 | 31.291 | 39.319 | 27.114 | 35.027 | 51.585 | 66.814 | -4.177 | -15.405 | 20.294 | 39.341 | (1.5152760102715293, 7.1315726213052235) | (-29.00346407151558, -11.50084545377275) |
| 7 | 92 | 71 | 71 | 0 | 0 | 0 | 34.320 | 43.416 | 30.253 | 39.595 | 59.711 | 77.501 | -4.067 | -13.443 | 25.391 | 42.523 | (1.4388402804522449, 7.064809378771713) | (-35.154017754675635, -16.356242774909653) |
| 8 | 92 | 71 | 71 | 0 | 0 | 0 | 32.284 | 41.739 | 31.179 | 40.447 | 59.803 | 76.815 | -1.105 | -3.544 | 27.519 | 46.016 | (-2.115140048550888, 4.67807989792085) | (-37.20262518466358, -18.34017156412904) |
| 9 | 92 | 71 | 71 | 0 | 0 | 0 | 35.746 | 46.246 | 35.202 | 47.118 | 53.120 | 72.922 | -0.544 | -1.546 | 17.374 | 32.707 | (-2.772287521899586, 4.2576217597639054) | (-26.03420441855847, -8.80439504569685) |
| 10 | 92 | 71 | 71 | 0 | 0 | 0 | 37.505 | 47.970 | 39.572 | 51.326 | 48.746 | 67.281 | 2.067 | 5.223 | 11.242 | 23.062 | (-5.648613349484726, 1.8152021931930267) | (-19.405100923188975, -3.510751631562145) |
| 11 | 92 | 71 | 71 | 0 | 0 | 0 | 40.450 | 51.230 | 41.453 | 53.865 | 49.669 | 66.008 | 1.003 | 2.419 | 9.219 | 18.560 | (-5.690883155607842, 3.662685931568412) | (-16.862514824934408, -1.7774513862502428) |
| 12 | 92 | 71 | 71 | 0 | 0 | 0 | 39.071 | 52.681 | 40.712 | 53.681 | 54.085 | 71.161 | 1.642 | 4.032 | 15.014 | 27.760 | (-6.657911577359052, 3.3257589555122475) | (-24.102162754703574, -6.419214049863148) |
| 13 | 92 | 71 | 71 | 0 | 0 | 0 | 40.152 | 52.591 | 40.092 | 52.008 | 65.570 | 86.475 | -0.060 | -0.150 | 25.418 | 38.765 | (-3.6934742215653538, 4.081777294588752) | (-36.98732719555707, -15.007222354244181) |
| 14 | 92 | 71 | 71 | 0 | 0 | 0 | 35.771 | 47.055 | 34.971 | 45.911 | 76.289 | 95.925 | -0.801 | -2.289 | 40.517 | 53.111 | (-2.162798735121606, 4.00832328930707) | (-53.68531395818146, -28.054966170351275) |
| 15 | 92 | 71 | 71 | 0 | 0 | 0 | 33.390 | 41.895 | 32.873 | 41.987 | 81.824 | 103.451 | -0.517 | -1.573 | 48.434 | 59.193 | (-2.5072321327639298, 3.6860388473725614) | (-63.25320478224419, -34.03415479525714) |
| 16 | 92 | 71 | 71 | 0 | 0 | 0 | 30.297 | 39.899 | 29.463 | 39.084 | 92.303 | 114.226 | -0.834 | -2.832 | 62.006 | 67.176 | (-2.7992628554223287, 4.830204297455262) | (-78.5063718204767, -45.04310939278401) |
| 17 | 92 | 71 | 71 | 0 | 0 | 0 | 28.639 | 38.271 | 26.286 | 35.596 | 95.521 | 117.814 | -2.353 | -8.951 | 66.883 | 70.019 | (-1.2297504035519882, 6.011757349632153) | (-83.61532267583928, -49.45261381713438) |
| 18 | 92 | 71 | 71 | 0 | 0 | 0 | 26.527 | 33.581 | 24.858 | 32.830 | 95.887 | 117.832 | -1.670 | -6.718 | 69.360 | 72.335 | (-1.2744121699266031, 5.0855854947802035) | (-85.47415972158942, -53.593078715364705) |
| 19 | 92 | 71 | 70 | 1 | 0 | 0 | 26.452 | 32.767 | 26.385 | 33.656 | 89.214 | 112.619 | -0.067 | -0.255 | 62.762 | 70.350 | (-2.9242942006247383, 3.1359621143341054) | (-77.72133683613369, -47.261251085826366) |
| 20 | 92 | 71 | 71 | 0 | 0 | 0 | 30.545 | 36.178 | 31.218 | 38.021 | 74.296 | 94.179 | 0.673 | 2.157 | 43.751 | 58.887 | (-3.7774100733474945, 2.4447865096616064) | (-56.56051516734379, -31.721239807236362) |
| 21 | 92 | 71 | 71 | 0 | 0 | 0 | 40.008 | 50.807 | 42.550 | 53.349 | 60.782 | 76.884 | 2.541 | 5.973 | 20.773 | 34.177 | (-6.498516352747528, 1.44712003654157) | (-30.84870610035641, -11.403649999054387) |
| 22 | 92 | 71 | 71 | 0 | 0 | 0 | 43.678 | 56.097 | 46.224 | 60.121 | 51.423 | 67.596 | 2.545 | 5.507 | 7.744 | 15.060 | (-6.62694375884365, 1.4363579521716432) | (-15.269432970503686, -0.2923903210062393) |
| 23 | 92 | 71 | 70 | 1 | 0 | 0 | 46.289 | 60.611 | 49.840 | 65.260 | 52.864 | 68.431 | 3.551 | 7.125 | 6.575 | 12.438 | (-7.960185484204973, 0.7982630143846725) | (-14.083299905232021, 1.2728573499407085) |
| 24 | 92 | 71 | 71 | 0 | 0 | 0 | 53.092 | 67.393 | 57.430 | 73.963 | 53.415 | 72.145 | 4.338 | 7.553 | 0.323 | 0.605 | (-9.473133769505461, 1.2798389945231683) | (-7.5005049342840495, 6.9784596376016035) |

## Category agreement

| lead_hour | direct | persistence | recursive |
| --- | --- | --- | --- |
| 1 | 0.761 | 0.803 | 0.761 |
| 2 | 0.761 | 0.746 | 0.732 |
| 3 | 0.690 | 0.648 | 0.704 |
| 4 | 0.620 | 0.620 | 0.704 |
| 5 | 0.577 | 0.437 | 0.592 |
| 6 | 0.507 | 0.451 | 0.577 |
| 7 | 0.521 | 0.437 | 0.577 |
| 8 | 0.521 | 0.408 | 0.479 |
| 9 | 0.549 | 0.479 | 0.507 |
| 10 | 0.507 | 0.535 | 0.521 |
| 11 | 0.577 | 0.521 | 0.563 |
| 12 | 0.465 | 0.437 | 0.493 |
| 13 | 0.493 | 0.437 | 0.535 |
| 14 | 0.380 | 0.352 | 0.408 |
| 15 | 0.437 | 0.268 | 0.423 |
| 16 | 0.465 | 0.155 | 0.507 |
| 17 | 0.437 | 0.169 | 0.549 |
| 18 | 0.423 | 0.183 | 0.507 |
| 19 | 0.486 | 0.257 | 0.486 |
| 20 | 0.394 | 0.310 | 0.451 |
| 21 | 0.465 | 0.451 | 0.521 |
| 22 | 0.535 | 0.507 | 0.563 |
| 23 | 0.629 | 0.557 | 0.600 |
| 24 | 0.521 | 0.563 | 0.507 |

## Sudden rises and falls

See `rise_fall_metrics.csv` and thresholds in `summary.json`. Empty/undefined event metrics indicate insufficient event pairs, not zero error.

## Limitations and next steps

This evaluates historical data ending in 2023 and Q4 2023 has already been inspected. These scores are not an independent confirmation and do not establish production readiness. Strict no-imputation history requirements reduce coverage. Twenty-four independent fits can be noisy across adjacent leads. Obtain a newer untouched period before making confirmatory claims; retain the current recursive and persistence methods unless a predeclared lead-wise decision rule supports change.

## Skipped origins and failures

[
  {
    "origin_timestamp": "2023-11-02T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-03T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-04T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-05T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-06T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-07T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-08T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-09T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-10T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-11T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-12T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-13T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-11-14T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-12-15T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-12-16T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-12-17T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-12-18T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-12-19T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-12-20T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-12-21T23:00:00",
    "reason": "insufficient_or_missing_history",
    "detail": "ValueError: history must contain 169 consecutive observed hourly positions"
  },
  {
    "origin_timestamp": "2023-12-31T23:00:00",
    "reason": "incomplete_target_timestamp_window",
    "missing_timestamps": 24
  }
]

[]
