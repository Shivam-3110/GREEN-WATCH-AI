"""Evaluate direct lead models against the unchanged recursive and persistence forecasts."""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, confusion_matrix
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"src")); sys.path.insert(0,str(ROOT/"training"))
from aqi_prediction_service.direct_inference import DirectAQIForecaster, validate_direct_history
from aqi_prediction_service.feature_engineering import build_inference_features
from aqi_prediction_service.recursive_forecast import forecast_24h
from aqi_prediction_service.one_hour_inference import OneHourAQIPredictor
from direct_horizon_common import HORIZONS, build_horizon_frame, split_horizon_frame, validate_hourly
DATA=ROOT/"data"/"lucknow_hourly.csv"; OUT=ROOT/"reports"/"direct_24h_experiment"; MODEL_DIR=ROOT/"saved_models"/"direct_horizons"
START=pd.Timestamp("2023-10-01 23:00:00"); END=pd.Timestamp("2023-12-31 23:00:00")
CATEGORIES=("Good","Moderate","Poor","Very Poor","Severe")

def category(aqi):
    if aqi<=50:return "Good"
    if aqi<=100:return "Moderate"
    if aqi<=150:return "Poor"
    if aqi<=200:return "Very Poor"
    return "Severe"
def _markdown_table(frame, floatfmt=".3f"):
    headers=[str(c) for c in frame.columns]
    lines=["| "+" | ".join(headers)+" |","| "+" | ".join(["---"]*len(headers))+" |"]
    for row in frame.itertuples(index=False,name=None):
        cells=[]
        for value in row:
            if pd.isna(value): cells.append("")
            elif isinstance(value,(float,np.floating)): cells.append(format(float(value),floatfmt))
            else: cells.append(str(value))
        lines.append("| "+" | ".join(cells)+" |")
    return "\n".join(lines)
def _metrics(actual,pred):
    if not len(actual): return {"mae":None,"rmse":None}
    return {"mae":float(mean_absolute_error(actual,pred)),"rmse":float(np.sqrt(mean_squared_error(actual,pred)))}
def _bootstrap_diff_ci(errors_a,errors_b,seed=42,reps=2000):
    # paired error differences, resampled by forecast origin/window
    diff=np.asarray(errors_a)-np.asarray(errors_b)
    if len(diff)<2:return (None,None)
    rng=np.random.default_rng(seed); samples=rng.choice(diff,size=(reps,len(diff)),replace=True).mean(axis=1)
    return tuple(float(v) for v in np.quantile(samples,[.025,.975]))
def _thresholds(data):
    result={}
    for h in HORIZONS:
        f=build_horizon_frame(data,h); s=split_horizon_frame(f)["train"]
        delta=(s.target_AQI-s.current_aqi).to_numpy(dtype=float)
        rises=delta[delta>0]; falls=delta[delta<0]
        up=float(np.quantile(rises,.90)) if len(rises)>=30 else None
        down=float(np.quantile(falls,.10)) if len(falls)>=30 else None
        result[h]={"large_rise_threshold":up,"large_fall_threshold":down,"positive_training_changes":int(len(rises)),"negative_training_changes":int(len(falls)),"threshold_minimum_training_events":30,"evaluation_minimum_events":10,"quantiles":{"rise":.90,"fall":.10}}
    return result
def _append_empty_origin(rows,origin,reason):
    for h in HORIZONS:
        rows.append({"origin_timestamp":origin,"target_timestamp":origin+pd.Timedelta(hours=h),"lead_hour":h,"actual_AQI":np.nan,"direct_AQI":np.nan,"recursive_AQI":np.nan,"persistence_AQI":np.nan,"origin_AQI":np.nan,"direct_error":np.nan,"recursive_error":np.nan,"persistence_error":np.nan,"common_valid":False,"exclusion_reason":reason})
def evaluate(data, direct, recursive_predictor, *, start=START,end=END):
    hourly=validate_hourly(data); indexed=hourly.set_index("timestamp").AQI
    origins=pd.date_range(start=start,end=end,freq="24h"); rows=[]; skipped=[]; failures=[]
    for origin in origins:
        target_times=pd.date_range(origin+pd.Timedelta(hours=1),periods=24,freq="h")
        missing_times=target_times.difference(hourly.timestamp)
        if len(missing_times):
            why="incomplete_target_timestamp_window"; skipped.append({"origin_timestamp":origin.isoformat(),"reason":why,"missing_timestamps":len(missing_times)}); _append_empty_origin(rows,origin,why); continue
        origin_aqi=indexed.get(origin,np.nan)
        if pd.isna(origin_aqi):
            why="missing_AQI_at_origin"; skipped.append({"origin_timestamp":origin.isoformat(),"reason":why}); _append_empty_origin(rows,origin,why); continue
        history=hourly.loc[hourly.timestamp<=origin,["timestamp","AQI"]].copy()
        try:
            validate_direct_history(history)
        except Exception as exc:
            why="insufficient_or_missing_history"; detail=f"{type(exc).__name__}: {exc}"
            skipped.append({"origin_timestamp":origin.isoformat(),"reason":why,"detail":detail})
            _append_empty_origin(rows,origin,why)
            continue
        try:
            direct_values=direct.predict(history)
            if direct_values.shape!=(24,) or not np.isfinite(direct_values).all():raise ValueError("direct output must contain 24 finite values")
        except Exception as exc:
            why="direct_forecast_error"; detail=f"{type(exc).__name__}: {exc}"; failures.append({"origin_timestamp":origin.isoformat(),"model":"direct","error":detail}); skipped.append({"origin_timestamp":origin.isoformat(),"reason":why,"detail":detail}); _append_empty_origin(rows,origin,why); continue
        try:
            recursive=forecast_24h(history,origin,recursive_predictor)
            recursive_values=recursive.predicted_AQI.to_numpy(dtype=float)
            if recursive.horizon.tolist()!=list(HORIZONS) or len(recursive_values)!=24:raise ValueError("recursive output must have 24 ordered predictions")
        except Exception as exc:
            why="recursive_forecast_error"; detail=f"{type(exc).__name__}: {exc}"; failures.append({"origin_timestamp":origin.isoformat(),"model":"recursive","error":detail}); skipped.append({"origin_timestamp":origin.isoformat(),"reason":why,"detail":detail}); _append_empty_origin(rows,origin,why); continue
        actual=indexed.reindex(target_times).to_numpy(dtype=float)
        for h in HORIZONS:
            i=h-1; a=actual[i]; dp=float(direct_values[i]); rp=float(recursive_values[i]); bp=float(origin_aqi)
            common=bool(np.isfinite(a) and np.isfinite(dp) and np.isfinite(rp) and np.isfinite(bp))
            reason="" if common else ("missing_target_AQI" if not np.isfinite(a) else "non_finite_prediction")
            rows.append({"origin_timestamp":origin,"target_timestamp":target_times[i],"lead_hour":h,"actual_AQI":float(a) if np.isfinite(a) else np.nan,"direct_AQI":dp,"recursive_AQI":rp,"persistence_AQI":bp,"origin_AQI":bp,"direct_error":dp-float(a) if np.isfinite(a) else np.nan,"recursive_error":rp-float(a) if np.isfinite(a) else np.nan,"persistence_error":bp-float(a) if np.isfinite(a) else np.nan,"common_valid":common,"exclusion_reason":reason})
    ledger=pd.DataFrame(rows)
    thresholds=_thresholds(hourly)
    metrics=[]; category_rows=[]; event_rows=[]
    for h in HORIZONS:
        part=ledger[ledger.lead_hour==h]; valid=part[part.common_valid].copy(); actual=valid.actual_AQI.to_numpy(dtype=float)
        method_cols={"direct":"direct_AQI","recursive":"recursive_AQI","persistence":"persistence_AQI"}; scored={}
        for name,col in method_cols.items():
            scored[name]=_metrics(actual,valid[col].to_numpy(dtype=float))
            scored[name]["category_agreement"]=(float(np.mean([category(a)==category(p) for a,p in zip(actual,valid[col].to_numpy(dtype=float))])) if len(valid) else None)
            scored[name]["category_confusion_matrix"]=(confusion_matrix([category(a) for a in actual],[category(p) for p in valid[col]],labels=CATEGORIES).tolist() if len(valid) else None)
        def improvement(benchmark):
            m=scored["direct"]["mae"]; b=scored[benchmark]["mae"]
            if m is None or b is None:return (None,None)
            absolute=b-m; pct=None if b==0 else 100*absolute/b
            return float(absolute),float(pct) if pct is not None else None
        imp_r=improvement("recursive"); imp_p=improvement("persistence")
        d_ci_r=_bootstrap_diff_ci(np.abs(valid.direct_error),np.abs(valid.recursive_error))
        d_ci_p=_bootstrap_diff_ci(np.abs(valid.direct_error),np.abs(valid.persistence_error))
        metrics.append({"lead_hour":h,"attempted_origins":len(origins),"completed_forecast_origins":int(part.loc[part.direct_AQI.notna()&part.recursive_AQI.notna(),"origin_timestamp"].nunique()),"valid_pairs":len(valid),"missing_target_pairs":int((part.exclusion_reason=="missing_target_AQI").sum()),"direct_forecast_failures":sum(x["model"]=="direct" for x in failures),"recursive_forecast_failures":sum(x["model"]=="recursive" for x in failures),"direct_MAE":scored["direct"]["mae"],"direct_RMSE":scored["direct"]["rmse"],"recursive_MAE":scored["recursive"]["mae"],"recursive_RMSE":scored["recursive"]["rmse"],"persistence_MAE":scored["persistence"]["mae"],"persistence_RMSE":scored["persistence"]["rmse"],"MAE_improvement_vs_recursive":imp_r[0],"MAE_improvement_pct_vs_recursive":imp_r[1],"MAE_improvement_vs_persistence":imp_p[0],"MAE_improvement_pct_vs_persistence":imp_p[1],"bootstrap_95pct_abs_error_diff_direct_minus_recursive":d_ci_r,"bootstrap_95pct_abs_error_diff_direct_minus_persistence":d_ci_p})
        for name in method_cols:
            category_rows.append({"lead_hour":h,"method":name,"valid_pairs":len(valid),"category_agreement":scored[name]["category_agreement"],"labels":list(CATEGORIES),"confusion_matrix":scored[name]["category_confusion_matrix"]})
        info=thresholds[h]; delta=valid.actual_AQI-valid.origin_AQI if len(valid) else pd.Series(dtype=float)
        for direction,cutoff,mask in (("large_rise",info["large_rise_threshold"],delta>=info["large_rise_threshold"] if info["large_rise_threshold"] is not None else None),("large_fall",info["large_fall_threshold"],delta<=info["large_fall_threshold"] if info["large_fall_threshold"] is not None else None)):
            event=valid.loc[mask] if mask is not None else valid.iloc[0:0]
            usable=len(event)>=info["evaluation_minimum_events"]
            for method,col in method_cols.items():
                err=event[col].to_numpy(dtype=float)-event.actual_AQI.to_numpy(dtype=float) if usable else np.array([])
                event_rows.append({"lead_hour":h,"event":direction,"threshold":cutoff,"event_pairs":len(event),"minimum_event_pairs":info["evaluation_minimum_events"],"metrics_available":usable,"method":method,"MAE":float(np.mean(np.abs(err))) if usable else None,"RMSE":float(np.sqrt(np.mean(err**2))) if usable else None,"mean_signed_error_prediction_minus_actual":float(np.mean(err)) if usable else None})
    return ledger,pd.DataFrame(metrics),pd.DataFrame(category_rows),pd.DataFrame(event_rows),thresholds,skipped,failures

def main():
    p=argparse.ArgumentParser(description=__doc__); p.add_argument("--input",type=Path,default=DATA); p.add_argument("--model-dir",type=Path,default=MODEL_DIR); p.add_argument("--output-dir",type=Path,default=OUT); args=p.parse_args()
    evaluation_files=("prediction_evaluation.csv","metrics_by_lead_hour.csv","rise_fall_metrics.csv","category_metrics.json","summary.json","EXPERIMENT_REPORT.md")
    if any((args.output_dir/name).exists() for name in evaluation_files): raise FileExistsError(f"Refusing to overwrite evaluation outputs in {args.output_dir}")
    data=pd.read_csv(args.input,parse_dates=["timestamp"]); direct=DirectAQIForecaster(args.model_dir); recursive=OneHourAQIPredictor(ROOT/"saved_models"/"aqi_xgboost.json")
    ledger,metrics,cats,events,thresholds,skipped,failures=evaluate(data,direct,recursive)
    args.output_dir.mkdir(parents=True,exist_ok=True)
    ledger_path=args.output_dir/"prediction_evaluation.csv"
    ledger.to_csv(ledger_path,index=False)
    persisted=pd.read_csv(ledger_path)
    for _, metric in metrics.iterrows():
        paired=persisted[(persisted.lead_hour==metric.lead_hour)&(persisted.common_valid==True)]
        if len(paired)!=int(metric.valid_pairs):
            raise AssertionError(f"Saved pair count mismatch at lead {int(metric.lead_hour)}")
        for method,col in (("direct","direct_AQI"),("recursive","recursive_AQI"),("persistence","persistence_AQI")):
            recomputed=_metrics(paired.actual_AQI.to_numpy(dtype=float),paired[col].to_numpy(dtype=float))
            if not (np.isclose(recomputed["mae"],metric[f"{method}_MAE"]) and np.isclose(recomputed["rmse"],metric[f"{method}_RMSE"])):
                raise AssertionError(f"Saved-ledger metric mismatch at lead {int(metric.lead_hour)} for {method}")
    metrics.to_csv(args.output_dir/"metrics_by_lead_hour.csv",index=False); events.to_csv(args.output_dir/"rise_fall_metrics.csv",index=False); cats.to_json(args.output_dir/"category_metrics.json",orient="records",indent=2)
    summary={"evaluation_type":"Previously inspected Q4 2023 descriptive comparison; not an untouched confirmatory test.","origin_convention":"Daily 23:00 origins, target is origin + lead hours; persistence repeats observed origin AQI.","origin_range":{"start":START.isoformat(),"end":END.isoformat()},"attempted_origins":92,"completed_origins":int(ledger.loc[ledger.common_valid,"origin_timestamp"].nunique()),"skipped_origins":len(skipped),"skip_details":skipped,"failure_details":failures,"missing_target_pairs":int((ledger.exclusion_reason=="missing_target_AQI").sum()),"valid_common_pairs":int(ledger.common_valid.sum()),"data_range":{"start":str(pd.to_datetime(data.timestamp).min()),"end":str(pd.to_datetime(data.timestamp).max())},"model_artifact_dir":str(args.model_dir),"recursive_artifact":"saved_models/aqi_xgboost.json","metrics_pairing":"For a given lead, all methods are scored on the identical intersection with observed target, finite predictions, eligible origin and available persistence value.","improvement_definition":"baseline MAE - direct MAE; positive favors direct; percent is absolute improvement divided by baseline MAE (null if baseline MAE is zero).","uncertainty":"95% percentile bootstrap intervals of paired absolute-error differences, resampling forecast origin rows; seed 42, 2000 repetitions.","category_thresholds":{"Good":"<=50","Moderate":"<=100","Poor":"<=150","Very Poor":"<=200","Severe":">200"},"event_thresholds_training_only":thresholds,"large_event_policy":"Per-lead q90 of positive origin-to-target changes and q10 of negative changes, requiring >=30 training examples per direction to define thresholds; event metrics emitted only with >=10 common event pairs.","test_independence_limitation":"Q4 2023 was previously analyzed in recursive reports and cannot be considered an untouched test."}
    (args.output_dir/"summary.json").write_text(json.dumps(summary,indent=2),encoding="utf-8")
    lines=["# Direct 24-hour AQI experiment","","## Methodology","","Twenty-four independent XGBoost regressors use the canonical 22 features at each forecast origin and predict AQI at origin + h for h=1..24. Training targets are purged at 2023-01-01; validation targets are purged at 2023-10-01. Existing recursive inference and origin-AQI persistence are unchanged. Q4 2023 was previously examined and is descriptive only. Missing AQI and gaps are not interpolated; origins need 169 consecutive observed hours.","","Direct, recursive, and persistence metrics use identical valid origin/target pairs at each lead. Positive MAE improvement means direct MAE is lower. AQI category thresholds are Good <=50, Moderate <=100, Poor <=150, Very Poor <=200, Severe >200. Rise/fall cutoffs are lead-specific training-only q90/q10 thresholds; threshold minimum is 30 training events and event metric minimum is 10 scored pairs.","","## Data coverage","",f"- Dataset: {summary['data_range']['start']} to {summary['data_range']['end']}",f"- Attempted Q4 origins: 92; origins with common predictions and targets: {summary['completed_origins']}; skipped: {len(skipped)}; missing target pairs: {summary['missing_target_pairs']}.",f"- Direct model failures: {len([x for x in failures if x['model']=='direct'])}; recursive failures: {len([x for x in failures if x['model']=='recursive'])}.","","## Per-lead metrics","","MAE improvement is persistence/recursive MAE minus direct MAE; percentage divides by the corresponding baseline MAE.","",_markdown_table(metrics),"","## Category agreement","",_markdown_table(cats.pivot(index="lead_hour",columns="method",values="category_agreement").reset_index()),"","## Sudden rises and falls","","See `rise_fall_metrics.csv` and thresholds in `summary.json`. Empty/undefined event metrics indicate insufficient event pairs, not zero error.","","## Limitations and next steps","","This evaluates historical data ending in 2023 and Q4 2023 has already been inspected. These scores are not an independent confirmation and do not establish production readiness. Strict no-imputation history requirements reduce coverage. Twenty-four independent fits can be noisy across adjacent leads. Obtain a newer untouched period before making confirmatory claims; retain the current recursive and persistence methods unless a predeclared lead-wise decision rule supports change.","","## Skipped origins and failures","",json.dumps(skipped,indent=2),"",json.dumps(failures,indent=2),""]
    (args.output_dir/"EXPERIMENT_REPORT.md").write_text("\n".join(lines),encoding="utf-8")
    print(metrics.to_string(index=False)); print(f"Saved evaluation to {args.output_dir}")
if __name__=="__main__": main()









