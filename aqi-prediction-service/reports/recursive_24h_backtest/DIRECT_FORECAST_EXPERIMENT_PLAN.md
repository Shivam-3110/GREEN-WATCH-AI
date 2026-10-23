# Direct 24-hour AQI experiment plan

## Goal and guardrails

Compare the current recursive one-hour XGBoost model with a direct approach that uses **24 independent XGBoost regressors**, one for each lead hour `h = 1...24`. The dashboard requirement is exactly 24 hourly AQI predictions per forecast origin, with output timestamps `origin + 1 hour` through `origin + 24 hours`.

This is a plan only. Do not train models, alter inference behavior, overwrite saved artifacts, or change the FastAPI request or response contract. Keep the existing recursive model and persistence baseline implementations unchanged for comparison. Keep the experiment separate from FastAPI.

## Verified current system and contract

`data/lucknow_hourly.csv` is the city-median AQI history from seven Lucknow monitoring stations, with missing readings represented as null. The selected one-hour artifact is `saved_models/aqi_xgboost.json`, checked against `saved_models/aqi_xgboost_metadata.json`. Its canonical ordered 22-feature schema, defined by `src/aqi_prediction_service/feature_engineering.py`, is:

1. Lags: `lag_1`, `lag_2`, `lag_3`, `lag_4`, `lag_5`, `lag_6`, `lag_12`, `lag_24`, `lag_48`, `lag_72`, `lag_168`.
2. Rolling statistics: `rolling_mean_3`, `rolling_mean_6`, `rolling_mean_24`, `rolling_std_6`, `rolling_max_24`, `rolling_min_24`.
3. `current_aqi`.
4. Calendar fields: `hour`, `day_of_week`, `month`, `day_of_year`.

At origin `t`, lag and rolling inputs are from observed history at or before `t`; rolling windows follow the shared builder's definitions and sample standard deviation (`ddof=1`). `current_aqi` is the observed AQI at `t`; calendar features describe `t`. The existing one-hour model predicts `AQI(t+1)`. Every direct horizon model will consume this same schema and feature order and predict `AQI(t+h)` for its fixed `h`. No target after `t` is an input.

The existing missing-history rule is strict: do not interpolate nulls or timestamp gaps; inference requires 169 consecutive observed hourly positions. Invalid origins are skipped. Keep that policy unchanged and apply it to all compared methods where applicable.

The recursive backtest uses the last observed timestamp as origin and targets `origin+h`; persistence repeats the observed origin AQI. Its previously inspected Q4 2023 report attempted 92 origins, completed 71, skipped 21 (20 for required history and one without a complete future timestamp window), and recorded two missing target values. Q4 has already been examined, so it is a frozen comparative benchmark, not an untouched final test set.

## Direct model design

Train **24 independent single-output `XGBRegressor` models**. The model for lead `h` receives the canonical 22 origin-time features and predicts the exact timestamp-offset target `AQI(t+h)`. Each model independently learns its horizon's target function; it does not receive forecasts from other horizons, does not roll predictions into synthetic history, and does not consume any future actual values as features. At inference, build the feature row once from the eligible history through origin `t`, call each model, and emit exactly one prediction per lead `1...24` in timestamp order.

This is a natural extension of the current single-output XGBoost pipeline and permits horizon-specific fitting and early stopping. It also creates 24 artifacts and 24 model-selection results, so keep the parameter/search budget fixed and modest across leads, record every choice, and avoid widening search based on test results. Independent models may produce a non-smooth forecast curve; do not add post-processing unless it is declared and evaluated as a separate method.

A shared multi-output estimator is not proposed for this experiment: the immediate dashboard contract is one prediction at each of 24 leads, while independent single-output models preserve the established training and serialization path and allow each lead to retain its own valid target rows. Multi-output XGBoost support and its missing-label behavior would add avoidable complexity. The direct approach is a challenger, not presumed to beat recursion.

## Leakage-safe target construction and chronological splits

For each hourly origin `t`, build `X(t)` only through the shared canonical feature builder using available observations at or before `t`. For each `h` from 1 through 24, form `y_h(t)` by exact timestamp lookup at `t + h hours`. If that timestamp or AQI value is missing, that origin/lead row has no label and is excluded for that horizon; do not interpolate. Assert the target timestamp equals the intended offset. No values in `(t, t+h]`, including future rolling values, may enter `X(t)`.

Retain the existing chronological cutoffs for comparability, with target-aware boundary purging:

| Split | Eligibility rule |
|---|---|
| Train | Origin before `2023-01-01 00:00` and `t+h` strictly before that cutoff. |
| Validation | Origin at/after `2023-01-01 00:00`, target `t+h` strictly before `2023-10-01 00:00`. |
| Test | Origin at/after `2023-10-01 00:00`; score only observed targets available in the data. |

Apply the purge separately for every lead, so each horizon's last eligible training/validation origin respects its target boundary. Historical observations before a split boundary may form features for an origin after that boundary because they were already known then; labels may not cross a split boundary. Fit each lead model on its own valid training rows and use only its own validation targets for early stopping/model selection. Freeze feature set, hyperparameter budget, origin schedule, missingness policy, event definitions, and evaluation rules before looking at test comparisons. Do not tune any choices on Q4 scores.

Q4 2023 is already inspected and cannot support blind confirmatory claims. Use it only for a predeclared, frozen comparative replication. The source data ends in 2023, so confirmatory evaluation requires newer observations in a later untouched period.

## Fair evaluation protocol

Keep the existing recursive model and persistence baseline unchanged. Use the same predeclared forecast origins for recursive, direct, and persistence forecasts wherever possible, including the existing daily 23:00 origin convention for a Q4 replication. For **each of all 24 leads**, create one paired comparison set: same origin, same target timestamp, observed target, eligible 169-hour history, observed origin AQI for persistence, and finite predictions from all compared methods. Exclude a row from all three methods' metrics if any of these common-pair conditions fail. Also preserve a detailed ledger of unpaired/invalid rows and reasons, so common-set filtering is auditable. Counts may vary by lead due to missing targets; publish the count for every method comparison and lead.

Persistence at each lead is exactly `AQI(t)` from the forecast origin, repeated for target `t+h`; do not substitute `lag_1` (which is `AQI(t-1)`). The recursive forecast remains the existing recursive implementation, with each prior prediction fed into subsequent recursive steps. The direct forecast produces each lead independently from the same origin-time feature vector.

Report for every lead `1...24`:

- Common valid pair/sample count and eligible/attempted origin counts.
- Direct, recursive, and persistence MAE and RMSE, computed on identical pairs.
- Direct minus recursive and direct minus persistence paired error differences, with sign convention stated; include uncertainty intervals using forecast origins/windows as the resampling unit.
- AQI category agreement and confusion matrices for all three methods, using existing `app/utils/preprocessor.py` thresholds unchanged: Good `≤50`, Moderate `≤100`, Poor `≤150`, Very Poor `≤200`, Severe `>200`.
- Missing target counts, skip counts/reasons, and each lead's coverage.

Do not present incomparable metrics calculated over different target pairs. Do not claim a win from aggregate-only scores; inspect every lead, category agreement, coverage, and event slices. Do not use a pooled score to obscure weak leads. If an additional pooled summary is reported, explicitly identify the included lead rows and compute it on the same pair set for each method.

### Sudden AQI increases and decreases

For each lead, compute actual origin-to-target change `AQI(t+h)-AQI(t)`. Predefine large-rise and large-fall thresholds from training data only (for example, horizon-specific upper quantile of positive changes and lower quantile of negative changes), freeze before test scoring, and report thresholds and event counts. If a direction has too few training events to define a stable threshold, mark its slice unavailable rather than deriving a threshold from test data. Compare direct, recursive, and persistence MAE/RMSE and signed error on the same event target pairs. Signed error should reveal underprediction during rises and overprediction during falls. Treat the quantile choice and minimum event count as pre-implementation assumptions to resolve before model fitting.

## Missing history and target policy

Preserve missing observations and gaps exactly; never interpolate. Use shared feature construction and the existing 169-consecutive-observation eligibility requirement for origin features. Invalid history/origin rows are skipped under the same documented rule for recursive and direct comparisons; persistence also requires the observed origin AQI. A missing future target removes only that lead's target pair, not other valid targets at the same origin. Keep and report all attempted origins, skipped origins and reasons, and missing target rows. The direct training table is horizon-specific: a missing label at one lead must not discard that origin for another lead whose target is observed. Do not relax the missing-history policy to increase forecast availability in this experiment.

## Proposed files and artifacts for a later implementation

### Files to add

1. `src/aqi_prediction_service/direct_inference.py` — load and validate all 24 direct artifacts and metadata, build one feature row with the shared 22-feature builder, and return exactly 24 ordered direct predictions without recursive feedback. Keep this module separate from FastAPI.
2. `training/train_direct_horizons.py` — build exact timestamp-offset targets for leads 1–24, apply per-lead target-boundary purges, fit 24 regressors with a fixed modest configuration/search budget and validation-only early stopping, and write only to new direct-specific paths.
3. `training/evaluate_direct_vs_recursive.py` — create the common origin/target ledger, run unchanged recursive forecasts and direct inference, apply origin-AQI persistence, and generate paired per-lead metrics, categories, event slices, skip accounting, and comparison report.
4. `tests/test_direct_horizon_training.py`, `tests/test_direct_inference.py`, `tests/test_direct_vs_recursive_evaluation.py` — cover target timestamp offsets and every horizon, exact feature names/order/parity, all 24 outputs and their timestamps, recursive independence of direct predictions, horizon-aware split purging, strict gaps/null behavior, history minimum, common target pairs, persistence origin timing, category thresholds, event threshold freezing, skips, error propagation, and deterministic outputs.

Do not modify `app/`, the existing one-hour trainer, recursive inference code, current model artifacts, or FastAPI contracts as part of the experiment implementation.

### New model artifact names and metadata

Write 24 model files under a separate namespace, for example:

- `saved_models/direct_horizons/aqi_xgboost_h01.json`
- `saved_models/direct_horizons/aqi_xgboost_h02.json`
- ...
- `saved_models/direct_horizons/aqi_xgboost_h24.json`

Add one direct-specific metadata file, e.g. `saved_models/direct_horizons/aqi_xgboost_direct_metadata.json`. It must map every integer horizon 1–24 to its artifact and record the exact ordered 22-feature schema, target formula/units, origin convention, feature builder/version, 169-hour history and no-interpolation policy, split cutoffs and per-horizon purge rule, XGBoost/dependency versions, parameters and seed, best iteration, training/validation row counts per lead, target availability counts, and creation timestamp. Validate there are no missing or duplicate horizon mappings and each model's feature schema matches metadata. Keep existing recursive, canonical one-hour, and legacy artifacts and metadata untouched.

### New evaluation outputs

Write results only to a separate directory such as `reports/direct_vs_recursive/`, leaving `reports/recursive_24h_backtest/` untouched. Include:

- Prediction ledger with origin, timestamp, horizon 1–24, actual AQI, direct prediction, recursive prediction, persistence prediction, and validity/exclusion reason.
- Per-lead CSV/JSON containing common sample counts, attempted/eligible counts, MAE, RMSE, category agreement, paired differences, and uncertainty intervals for all methods.
- Per-lead category confusion results and large-rise/fall thresholds, counts, and metrics.
- Skip/missing-target summary and a methodology report describing split purges, pairing, and prior Q4 exposure.

Independently recompute reported metrics from the saved ledger and assert pair counts agree before publishing results.

## Reproducible workflow

1. Verify data timestamp uniqueness/order/hourly grid, null/gap counts, and per-lead target availability.
2. Generate origin features with the canonical builder; assert exact feature order and independently verify `target_time = origin + h hours` for every lead.
3. Freeze split cutoffs, lead-specific purge rules, model parameters/search budget, daily evaluation origins, missing-data policy, category thresholds, event definitions, and paired scoring protocol.
4. Fit 24 horizon models only on their respective training rows, using validation only for selection/early stopping. Save artifacts and direct-specific metadata to new paths.
5. Test loading/serialization and inference for all 24 leads; verify exact output count, order, timestamps, schema, and no future input access.
6. Run the predeclared comparison for all 24 leads against unchanged recursive and persistence implementations on common valid pairs.
7. Recompute all metrics from the ledger, verify common-pair counts, and write the report to the new evaluation directory. Keep the experiment outside FastAPI.

## Decision criteria and limitations

Judge the direct method lead by lead against both unchanged comparators. Primary outcomes are paired MAE/RMSE differences and uncertainty by origin/window; secondary outcomes are category agreement/confusion and frozen large-rise/fall slices. Report sample counts and skipped origins alongside every score. A candidate is worth further consideration only if improvements are repeatable at dashboard-relevant leads, there is no material harm elsewhere, category/event results and coverage remain acceptable, leakage checks pass, and a later untouched period confirms the result. Define practical AQI-point improvement and non-inferiority margins with the product owner before examining comparative test scores. A result on Q4 2023 is descriptive because that period has already been reviewed; do not call it a blind test or evidence of production readiness. Twenty-four separate fits increase training, artifact, validation, and maintenance costs and can yield inconsistent behavior across adjacent leads. Event slices may be small, and the historical missingness policy reduces coverage.

## Remaining assumptions

1. Existing daily 23:00 Q4 origins are the desired frozen comparative origin schedule; confirm this when implementation begins if dashboard issuance cadence differs.
2. The existing canonical feature builder and its 169-hour strict eligibility rule remain the source of truth; verify this against current checked-in code before implementation.
3. The current application AQI thresholds are intended for numeric category-parity evaluation; confirm product semantics before interpreting category agreement as a health-quality measure.
4. Select and freeze the large-rise/fall quantiles and minimum event counts using training data before fitting/evaluation.
5. No newer post-2023 AQI data is available in the current dataset. Obtain a later untouched period before confirmatory performance claims.

## Recommendation

When implementation is authorized, train 24 separate single-output XGBoost regressors on the canonical origin-time 22-feature schema, with each model targeting exactly `AQI(origin+h)` for its assigned lead. Apply target-aware chronological purges, retain the strict no-interpolation history policy, and score every lead against the unchanged recursive model and persistence on identical valid targets. Save all new artifacts and reports separately; do not integrate with FastAPI or alter existing artifacts. Treat Q4 2023 as an already-inspected comparative benchmark, not an untouched final test.
