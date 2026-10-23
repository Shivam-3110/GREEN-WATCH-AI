# Recursive 24-hour AQI backtest: error analysis

## 1. Executive summary

The existing report covers **71 completed origins**, **1704 forecast rows**, and **1702 valid prediction–target pairs**. There are 92 attempted origins and 21 skips. The two missing target readings are retained as rows but excluded from both model and persistence metrics.

At lead 1, model MAE is **1.73 AQI points higher** than persistence (−1.73 MAE improvement, −11.00%). It first beats persistence at **lead 2** and wins every lead from 2 through 23. It loses again at lead 24 by **4.01 MAE points**. This pattern is not monotonic: model MAE rises through lead 11, declines through lead 18, then rises sharply near leads 21–24. Its minimum is at lead 1 (17.50) and maximum at lead 24 (57.43).

The worst cases show the main weakness: recursive forecasts can miss abrupt transitions and can remain too low during a sharp rise or too high after a sharp decline. Results are retrospective and limited to 71 completed daily windows in the final quarter of 2023; they do not establish production readiness.

## 2. Artifact and metric verification

- The report’s convention is correct: the origin is the final observed timestamp, and lead 1 is `origin + 1 hour`.
- All 1704 rows satisfy `target_timestamp = origin_timestamp + lead_hour`; there are no duplicate origin/lead pairs.
- The persistence value in every row equals the observed AQI at that origin.
- Recalculated valid-pair counts and MAE/RMSE for every lead match `metrics_by_lead_hour.csv` within floating-point tolerance. Model and baseline use the same rows with nonmissing actual AQI.
- Rows with missing actual AQI have null model and persistence error fields, rather than silently scored values.

## 3. Per-lead-hour performance

MAE improvement is `(persistence MAE − model MAE)`. Percentage improvement uses persistence MAE as denominator. Positive values favor the model; negative values favor persistence. All persistence MAEs are available and nonzero in this file.

| Lead | N | Model MAE | Model RMSE | Persistence MAE | Persistence RMSE | MAE improvement | MAE improvement % | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 71 | 17.50 | 22.59 | 15.77 | 22.18 | -1.73 | -11.00% | Model loses |
| 2 | 71 | 20.28 | 27.27 | 22.77 | 33.85 | +2.49 | +10.94% | Model wins |
| 3 | 71 | 22.75 | 29.08 | 30.97 | 40.76 | +8.22 | +26.53% | Model wins |
| 4 | 71 | 26.61 | 34.48 | 38.65 | 51.62 | +12.04 | +31.14% | Model wins |
| 5 | 71 | 26.87 | 34.01 | 44.30 | 58.11 | +17.43 | +39.34% | Model wins |
| 6 | 71 | 27.11 | 35.03 | 51.58 | 66.81 | +24.47 | +47.44% | Model wins |
| 7 | 71 | 30.25 | 39.59 | 59.71 | 77.50 | +29.46 | +49.33% | Model wins |
| 8 | 71 | 31.18 | 40.45 | 59.80 | 76.81 | +28.62 | +47.86% | Model wins |
| 9 | 71 | 35.20 | 47.12 | 53.12 | 72.92 | +17.92 | +33.73% | Model wins |
| 10 | 71 | 39.57 | 51.33 | 48.75 | 67.28 | +9.17 | +18.82% | Model wins |
| 11 | 71 | 41.45 | 53.86 | 49.67 | 66.01 | +8.22 | +16.54% | Model wins |
| 12 | 71 | 40.71 | 53.68 | 54.08 | 71.16 | +13.37 | +24.72% | Model wins |
| 13 | 71 | 40.09 | 52.01 | 65.57 | 86.48 | +25.48 | +38.86% | Model wins |
| 14 | 71 | 34.97 | 45.91 | 76.29 | 95.92 | +41.32 | +54.16% | Model wins |
| 15 | 71 | 32.87 | 41.99 | 81.82 | 103.45 | +48.95 | +59.82% | Model wins |
| 16 | 71 | 29.46 | 39.08 | 92.30 | 114.23 | +62.84 | +68.08% | Model wins |
| 17 | 71 | 26.29 | 35.60 | 95.52 | 117.81 | +69.24 | +72.48% | Model wins |
| 18 | 71 | 24.86 | 32.83 | 95.89 | 117.83 | +71.03 | +74.08% | Model wins |
| 19 | 70 | 26.38 | 33.66 | 89.21 | 112.62 | +62.83 | +70.43% | Model wins |
| 20 | 71 | 31.22 | 38.02 | 74.30 | 94.18 | +43.08 | +57.98% | Model wins |
| 21 | 71 | 42.55 | 53.35 | 60.78 | 76.88 | +18.23 | +30.00% | Model wins |
| 22 | 71 | 46.22 | 60.12 | 51.42 | 67.60 | +5.20 | +10.11% | Model wins |
| 23 | 70 | 49.84 | 65.26 | 52.86 | 68.43 | +3.02 | +5.72% | Model wins |
| 24 | 71 | 57.43 | 73.96 | 53.42 | 72.14 | -4.01 | -7.52% | Model loses |

The model’s first winning lead is hour 2. It wins continuously at hours 2–23, although the gain narrows to 5.72% at hour 23, and it loses at hour 24. The largest percentage MAE gain is 74.08% at hour 18. The lowest absolute model MAE is 17.50 at hour 1, despite persistence winning there; the highest is 57.43 at hour 24. Lead-hour 19 and 23 have 70 valid pairs rather than 71 because each has one missing actual target.

## 4. Ten worst individual predictions

Ranked by model absolute error. Errors are absolute AQI points. Persistence uses the origin reading.

| Origin | Target | Lead | Predicted | Actual | Persistence | Model absolute error | Persistence absolute error |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2023-10-05 23:00 | 2023-10-06 23:00 | 24 | 93.4 | 306.5 | 89.5 | 213.1 | 217.0 |
| 2023-10-05 23:00 | 2023-10-06 22:00 | 23 | 90.0 | 299.5 | 89.5 | 209.5 | 210.0 |
| 2023-10-05 23:00 | 2023-10-06 21:00 | 22 | 86.2 | 279.0 | 89.5 | 192.8 | 189.5 |
| 2023-12-29 23:00 | 2023-12-30 23:00 | 24 | 281.5 | 107.0 | 138.0 | 174.5 | 31.0 |
| 2023-12-27 23:00 | 2023-12-28 10:00 | 11 | 242.9 | 69.5 | 222.5 | 173.4 | 153.0 |
| 2023-12-27 23:00 | 2023-12-28 09:00 | 10 | 235.8 | 62.5 | 222.5 | 173.3 | 160.0 |
| 2023-12-23 23:00 | 2023-12-24 12:00 | 13 | 230.2 | 71.0 | 243.0 | 159.2 | 172.0 |
| 2023-12-29 23:00 | 2023-12-30 21:00 | 22 | 259.0 | 103.0 | 138.0 | 156.0 | 35.0 |
| 2023-12-29 23:00 | 2023-12-30 22:00 | 23 | 272.4 | 118.0 | 138.0 | 154.4 | 20.0 |
| 2023-12-27 23:00 | 2023-12-28 08:00 | 9 | 218.2 | 69.0 | 222.5 | 149.2 | 153.5 |

The largest miss is a late forecast during the October 5 origin window: actual AQI rose from 169.5 to 279.0 in the hour before the lead-22 target, then to 306.5 by lead 24, while the recursive model predicted only 86–93. The worst negative-direction cases include December 27, where AQI fell from an origin value of 222.5 to 69.5 around leads 10–11, while the model remained above 235. These observations support sensitivity to rapid reversals; they are individual examples, not a causal diagnosis.

## 5. Ten worst forecast windows

Ranked by model MAE over valid targets in each completed origin window. The persistence MAE uses exactly the same targets.

| Origin | Valid targets | Model MAE | Persistence MAE | Model − baseline | Origin AQI | Actual min–max | Final − origin |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2023-12-29 23:00 | 24 | 81.74 | 37.33 | +44.41 | 138.0 | 76.0–123.0 | -31.0 |
| 2023-10-05 23:00 | 24 | 78.91 | 58.25 | +20.66 | 89.5 | 92.0–306.5 | +217.0 |
| 2023-12-27 23:00 | 24 | 73.49 | 89.92 | -16.42 | 222.5 | 62.5–266.5 | -9.0 |
| 2023-12-23 23:00 | 24 | 68.49 | 82.98 | -14.49 | 243.0 | 67.0–296.0 | -68.5 |
| 2023-12-06 23:00 | 24 | 60.98 | 171.04 | -110.06 | 301.0 | 76.5–264.0 | -162.0 |
| 2023-11-29 23:00 | 24 | 58.28 | 128.44 | -70.16 | 313.5 | 112.0–327.5 | -68.5 |
| 2023-12-03 23:00 | 24 | 56.12 | 72.67 | -16.55 | 147.0 | 49.5–117.0 | -85.0 |
| 2023-11-16 23:00 | 24 | 55.82 | 119.48 | -63.66 | 304.0 | 64.0–303.0 | -132.0 |
| 2023-11-21 23:00 | 24 | 55.51 | 38.42 | +17.10 | 240.0 | 181.5–318.0 | +54.5 |
| 2023-12-26 23:00 | 24 | 53.09 | 91.50 | -38.41 | 283.0 | 99.5–308.0 | -60.5 |

Three of these ten windows have worse model MAE than persistence (Dec 29, Oct 5, and Nov 21); the model beats persistence in the other seven despite sizable model errors. Window extrema/net changes show both abrupt increases (Oct 5) and high-to-low reversals (Dec 23, Dec 27, Dec 29, and others). High AQI alone does not explain poor performance: several windows start above 300 and the model’s MAE is still substantially below persistence. The worst cases instead include large within-window ranges and changing direction.

Across scored pairs, the top decile of model absolute errors (threshold 75.1) has mean absolute deviation from the persistence/origin value of **107.0**, versus **53.7** for the other 90%. Their mean actual AQI is 165.4 versus 152.6, and the share above 200 is 29.8% versus 26.1%. This is a descriptive association: it indicates that larger changes from the origin are common among the largest errors, while the high-AQI share differs only modestly. The top-decile group is selected by model error, so this comparison is not an independent test of causation.

## 6. Category-transition analysis

The existing project defines categories in `app/utils/preprocessor.py`: Good ≤50, Moderate 51–100, Poor 101–150, Very Poor 151–200, and Severe >200. These are the application’s coded thresholds and labels, used here as-is; this is not an assertion that they are the governing regulatory AQI standard. Category matching is separate from numeric error.

Overall category matched **941 / 1702 (55.3%)** valid pairs.

| Lead | Valid pairs | Category matches | Match rate |
| --- | --- | --- | --- |
| 1 | 71 | 54 | 76.1% |
| 2 | 71 | 52 | 73.2% |
| 3 | 71 | 50 | 70.4% |
| 4 | 71 | 50 | 70.4% |
| 5 | 71 | 42 | 59.2% |
| 6 | 71 | 41 | 57.7% |
| 7 | 71 | 41 | 57.7% |
| 8 | 71 | 34 | 47.9% |
| 9 | 71 | 36 | 50.7% |
| 10 | 71 | 37 | 52.1% |
| 11 | 71 | 40 | 56.3% |
| 12 | 71 | 35 | 49.3% |
| 13 | 71 | 38 | 53.5% |
| 14 | 71 | 29 | 40.8% |
| 15 | 71 | 30 | 42.3% |
| 16 | 71 | 36 | 50.7% |
| 17 | 71 | 39 | 54.9% |
| 18 | 71 | 36 | 50.7% |
| 19 | 70 | 34 | 48.6% |
| 20 | 71 | 32 | 45.1% |
| 21 | 71 | 37 | 52.1% |
| 22 | 71 | 40 | 56.3% |
| 23 | 70 | 42 | 60.0% |
| 24 | 71 | 36 | 50.7% |

Most common category errors (actual → predicted):

| Actual → predicted category | Count |
| --- | --- |
| Poor → Very Poor | 169 |
| Moderate → Poor | 154 |
| Very Poor → Severe | 96 |
| Severe → Very Poor | 90 |
| Good → Moderate | 50 |
| Very Poor → Poor | 49 |
| Poor → Severe | 46 |
| Moderate → Very Poor | 44 |

The most frequent mismatches are one-category overprediction from Poor to Very Poor (169) and Moderate to Poor (154), followed by Very Poor to Severe (96) and Severe to Very Poor (90). These counts describe mismatches across all valid leads and windows; they should not be interpreted as category probabilities for future forecasts.

## 7. Skipped origins and missingness

The evaluator preserves missing AQI values. It does not interpolate. Forecast origins require 169 consecutive observed hourly positions through the origin. Gaps in that history cause the shared recursive inference path to reject an origin; a missing future AQI remains in the prediction CSV and is excluded from both metric sides. An origin is also skipped if its full set of future hourly timestamps is absent.

There are 21 skipped origins: 20 because required history contained a missing observation, concentrated in two periods (Nov 2–14: 13 daily origins; Dec 15–21: 7), and Dec 31 because all 24 future target timestamps are beyond the dataset endpoint. The two missing actual target pairs are:

| Origin | Target timestamp | Lead |
| --- | --- | --- |
| 2023-11-01 23:00 | 2023-11-02 18:00 | 19 |
| 2023-12-14 23:00 | 2023-12-15 22:00 | 23 |

Detailed skip records and exact error messages remain in `backtest_summary.json`:

- 2023-11-02T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-03T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-04T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-05T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-06T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-07T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-08T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-09T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-10T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-11T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-12T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-13T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-11-14T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-12-15T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-12-16T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-12-17T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-12-18T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-12-19T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-12-20T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-12-21T23:00:00: `forecast_error` — history must contain 169 consecutive observed hourly positions through forecast_start
- 2023-12-31T23:00:00: `incomplete_target_timestamp_window` — 24 future timestamps absent

The 20 history-related skips remove roughly a week of origins after missing-history periods. This limits coverage and may make completed-window metrics unrepresentative of periods with data gaps. The missing targets at leads 19 and 23 are not skipped origins; their forecast pairs are simply not scored.

## 8. Recommended next steps, ordered

1. **Treat lead 1 and lead 24 separately.** Persistence is stronger at both ends (especially lead 1); report per-lead metrics instead of relying only on pooled 24-hour gains.
2. **Add event-focused diagnostics for rapid reversals.** Review prediction trajectories for the October 5 rise and late-December declines; quantify forecast bias and error versus change from origin on a larger, independently held-out set.
3. **Improve evaluation coverage before drawing broad conclusions.** Report the fraction of origins available under the strict 169-hour completeness rule and preserve skip reasons. Seek complete historical observations or evaluate a documented, separately validated missing-data strategy; do not silently impute.
4. **Validate across more periods and seasons.** A 71-window 2023 Q4 backtest is narrow. Repeat the same predeclared protocol over additional held-out periods before selecting a model or operational horizon.
5. **Keep category metrics separate.** Confirm the AQI category standard and labels intended for users before interpreting category match rates as health-relevant performance.

## 9. Limitations and uncertainty

This analysis uses only the saved backtest artifacts and source series; it does not retrain or modify a model. It evaluates one Lucknow city-median dataset ending in 2023 with daily 23:00 origins, not every possible forecast start time. Skipped origins reduce coverage, and temporal patterns in a single season may not generalize. Individual hourly errors within a forecast window are related, so the 1,702 pairs are not 1,702 independent samples. No confidence intervals or significance tests are provided. Numeric and category scores do not establish current performance, generalization to other locations, or production readiness.
