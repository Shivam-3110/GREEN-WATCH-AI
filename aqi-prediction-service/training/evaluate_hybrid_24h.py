"""Validation selection and descriptive four-way comparison for hybrid AQI forecasts."""
from __future__ import annotations
import argparse,json,sys
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error,mean_squared_error
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"src")); sys.path.insert(0,str(ROOT/"training"))
from aqi_prediction_service.direct_inference import DirectAQIForecaster,validate_direct_history,HORIZONS
from aqi_prediction_service.feature_engineering import FEATURE_NAMES, create_feature_frame
from aqi_prediction_service.hybrid_forecast import HybridAQIForecaster
from aqi_prediction_service.one_hour_inference import OneHourAQIPredictor
from aqi_prediction_service.recursive_forecast import forecast_24h
from direct_horizon_common import TRAIN_CUTOFF,VALIDATION_END,validate_hourly

DATA=ROOT/"data"/"lucknow_hourly.csv"; MODEL_DIR=ROOT/"saved_models"/"direct_horizons"; OUT=ROOT/"reports"/"hybrid_24h_experiment"
VAL_START=pd.Timestamp("2023-01-01 23:00"); VAL_END=pd.Timestamp("2023-09-29 23:00")
TEST_START=pd.Timestamp("2023-10-01 23:00"); TEST_END=pd.Timestamp("2023-12-31 23:00")
METHODS=("recursive","direct","hybrid","persistence")
CATEGORY_BOUNDS=(50,100,150,200)

def aqi_category(x):
    return "Good" if x<=50 else "Moderate" if x<=100 else "Poor" if x<=150 else "Very Poor" if x<=200 else "Severe"
def _metric(y,p):
    if not len(y):return {"mae":None,"rmse":None}
    return {"mae":float(mean_absolute_error(y,p)),"rmse":float(np.sqrt(mean_squared_error(y,p)))}
def _ranges(history):
    """Get per-lead AQI-change cutoffs using train-only valid target pairs."""
    features=create_feature_frame(history,include_target=False)
    feature_ok=np.isfinite(features[FEATURE_NAMES].to_numpy(dtype=float)).all(axis=1)
    results={}
    times=history.timestamp
    indexed=history.set_index("timestamp").AQI
    for h in HORIZONS:
        target_times=times+pd.Timedelta(hours=h)
        target=indexed.reindex(pd.DatetimeIndex(target_times)).to_numpy(dtype=float)
        train_mask=(times<TRAIN_CUTOFF)&(target_times<TRAIN_CUTOFF)&feature_ok&np.isfinite(target)
        delta=target[train_mask]-features.loc[train_mask,"current_aqi"].to_numpy(dtype=float)
        rises=delta[delta>0]; falls=delta[delta<0]
        results[h]={"rise_threshold":float(np.quantile(rises,.90)) if len(rises)>=30 else None,"fall_threshold":float(np.quantile(falls,.10)) if len(falls)>=30 else None,"rise_training_events":int(len(rises)),"fall_training_events":int(len(falls)),"threshold_quantiles":{"rise":.90,"fall":.10},"minimum_training_events":30,"minimum_evaluation_pairs":10}
    return results

def _forecast_period(data,direct,recursive,origins, *, selection=None):
    indexed=data.set_index("timestamp").AQI; rows=[]; skipped=[]; failures=[]
    hybrid=HybridAQIForecaster(selection,recursive_predictor=recursive,direct_forecaster=direct) if selection is not None else None
    for origin in origins:
        target_times=pd.date_range(origin+pd.Timedelta(hours=1),periods=24,freq="h")
        absent=target_times.difference(pd.DatetimeIndex(data.timestamp))
        if len(absent):
            reason="incomplete_target_timestamp_window"; skipped.append({"origin":origin.isoformat(),"reason":reason,"missing_timestamps":len(absent)})
            for h,t in enumerate(target_times,start=1): rows.append(_empty_row(origin,t,h,reason))
            continue
        origin_aqi=indexed.get(origin,np.nan)
        if pd.isna(origin_aqi):
            reason="missing_AQI_at_origin"; skipped.append({"origin":origin.isoformat(),"reason":reason})
            for h,t in enumerate(target_times,start=1): rows.append(_empty_row(origin,t,h,reason))
            continue
        history=data.loc[data.timestamp<=origin,["timestamp","AQI"]].copy()
        try: validate_direct_history(history)
        except Exception as exc:
            reason="insufficient_or_missing_history"; skipped.append({"origin":origin.isoformat(),"reason":reason,"detail":str(exc)})
            for h,t in enumerate(target_times,start=1): rows.append(_empty_row(origin,t,h,reason))
            continue
        try:
            direct_frame=direct.forecast(history,origin)
            rec_frame=forecast_24h(history,origin,recursive)
            hyb_frame=hybrid.combine(direct_frame,rec_frame,origin) if hybrid else None
            frames={"direct":direct_frame,"recursive":rec_frame}
            if hyb_frame is not None: frames["hybrid"]=hyb_frame
            for name,frame in frames.items():
                if len(frame)!=24 or frame.horizon.tolist()!=list(HORIZONS) or not frame.timestamp.equals(pd.Series(target_times)):
                    raise ValueError(f"{name} output shape/timestamp mismatch")
        except Exception as exc:
            reason="forecast_inference_error"; failures.append({"origin":origin.isoformat(),"error_type":type(exc).__name__,"error":str(exc)})
            skipped.append({"origin":origin.isoformat(),"reason":reason,"detail":str(exc)})
            for h,t in enumerate(target_times,start=1): rows.append(_empty_row(origin,t,h,reason))
            continue
        direct_vals=direct_frame.predicted_AQI.to_numpy(dtype=float); rec_vals=rec_frame.predicted_AQI.to_numpy(dtype=float)
        hybrid_vals=hyb_frame.predicted_AQI.to_numpy(dtype=float) if hyb_frame is not None else np.full(24,np.nan)
        actual=indexed.reindex(target_times).to_numpy(dtype=float)
        for i,h in enumerate(HORIZONS):
            a=actual[i]; predictions={"direct":direct_vals[i],"recursive":rec_vals[i],"persistence":float(origin_aqi),"hybrid":hybrid_vals[i] if hyb_frame is not None else np.nan}
            valid=bool(np.isfinite(a) and np.isfinite(predictions["direct"]) and np.isfinite(predictions["recursive"]) and np.isfinite(predictions["persistence"]) and (hyb_frame is None or np.isfinite(predictions["hybrid"])))
            rows.append({"origin_timestamp":origin,"target_timestamp":target_times[i],"lead_hour":h,"actual_AQI":float(a) if np.isfinite(a) else np.nan,"origin_AQI":float(origin_aqi),"recursive_AQI":predictions["recursive"],"direct_AQI":predictions["direct"],"hybrid_AQI":predictions["hybrid"],"persistence_AQI":predictions["persistence"],"common_valid":bool(valid),"exclusion_reason":"" if valid else "missing_target_AQI" if not np.isfinite(a) else "non_finite_prediction"})
    return pd.DataFrame(rows),skipped,failures

def _empty_row(origin,target,h,reason):
    return {"origin_timestamp":origin,"target_timestamp":target,"lead_hour":h,"actual_AQI":np.nan,"origin_AQI":np.nan,"recursive_AQI":np.nan,"direct_AQI":np.nan,"hybrid_AQI":np.nan,"persistence_AQI":np.nan,"common_valid":False,"exclusion_reason":reason}

def select_by_validation(data,direct,recursive):
    origins=pd.date_range(VAL_START,VAL_END,freq="24h")
    ledger,skipped,failures=_forecast_period(data,direct,recursive,origins)
    selections={}; rows=[]
    for h in HORIZONS:
        part=ledger[(ledger.lead_hour==h)&ledger.common_valid]
        y=part.actual_AQI.to_numpy(dtype=float)
        dm=_metric(y,part.direct_AQI.to_numpy(dtype=float)); rm=_metric(y,part.recursive_AQI.to_numpy(dtype=float))
        family="direct" if dm["mae"] is not None and dm["mae"]<rm["mae"] else "recursive"
        selections[h]=family
        rows.append({"lead_hour":h,"valid_pairs":len(part),"direct_MAE":dm["mae"],"direct_RMSE":dm["rmse"],"recursive_MAE":rm["mae"],"recursive_RMSE":rm["rmse"],"selected_family":family,"selection_rule":"lower validation MAE; ties or unavailable metrics select recursive"})
    return selections,ledger,pd.DataFrame(rows),skipped,failures

def compare(data,direct,recursive,selections,origins,thresholds):
    ledger,skipped,failures=_forecast_period(data,direct,recursive,origins,selection=selections)
    metrics=[]; categories=[]; pooled=[]; events=[]
    for h in HORIZONS:
        p=ledger[ledger.lead_hour==h]; v=p[p.common_valid]; y=v.actual_AQI.to_numpy(dtype=float)
        row={"lead_hour":h,"attempted_origins":len(origins),"completed_forecast_origins":int(p.loc[p.recursive_AQI.notna()&p.direct_AQI.notna(),"origin_timestamp"].nunique()),"valid_pairs":len(v),"missing_target_pairs":int((p.exclusion_reason=="missing_target_AQI").sum())}
        for method in METHODS:
            col=f"{method}_AQI"; pred=v[col].to_numpy(dtype=float); m=_metric(y,pred)
            row[f"{method}_MAE"]=m["mae"]; row[f"{method}_RMSE"]=m["rmse"]
            categories.append({"lead_hour":h,"method":method,"valid_pairs":len(v),"category_agreement":float(np.mean([aqi_category(a)==aqi_category(q) for a,q in zip(y,pred)])) if len(v) else None})
        for baseline in ("recursive","direct","persistence"):
            b=row[f"{baseline}_MAE"]; hmae=row["hybrid_MAE"]
            row[f"hybrid_MAE_improvement_vs_{baseline}"]=float(b-hmae) if b is not None and hmae is not None else None
            row[f"hybrid_MAE_improvement_pct_vs_{baseline}"]=float(100*(b-hmae)/b) if b not in (None,0) and hmae is not None else None
        metrics.append(row)
        # event metrics use training-only cutoffs and only common four-method targets
        info=thresholds[h]; delta=v.actual_AQI-v.origin_AQI if len(v) else pd.Series(dtype=float)
        for event,cutoff,mask in (("large_rise",info["rise_threshold"],delta>=info["rise_threshold"] if info["rise_threshold"] is not None else None),("large_fall",info["fall_threshold"],delta<=info["fall_threshold"] if info["fall_threshold"] is not None else None)):
            ev=v.loc[mask] if mask is not None else v.iloc[:0]; enough=len(ev)>=info["minimum_evaluation_pairs"]
            for method in METHODS:
                err=ev[f"{method}_AQI"].to_numpy(dtype=float)-ev.actual_AQI.to_numpy(dtype=float) if enough else np.array([])
                events.append({"lead_hour":h,"event":event,"threshold":cutoff,"pairs":len(ev),"method":method,"metrics_available":enough,"MAE":float(np.mean(np.abs(err))) if enough else None,"RMSE":float(np.sqrt(np.mean(err**2))) if enough else None,"mean_signed_error":float(np.mean(err)) if enough else None})
    metric_df=pd.DataFrame(metrics)
    for horizon in (1,6,12,24):
        pooled_rows=ledger[(ledger.lead_hour<=horizon)&ledger.common_valid]
        y=pooled_rows.actual_AQI.to_numpy(dtype=float)
        for method in METHODS:
            m=_metric(y,pooled_rows[f"{method}_AQI"].to_numpy(dtype=float))
            pooled.append({"pooled_through_lead_hour":horizon,"included_leads":f"1..{horizon}","valid_pairs":len(pooled_rows),"method":method,"MAE":m["mae"],"RMSE":m["rmse"]})
    return ledger,metric_df,pd.DataFrame(categories),pd.DataFrame(pooled),pd.DataFrame(events),skipped,failures

def main():
    parser=argparse.ArgumentParser(description=__doc__); parser.add_argument("--input",type=Path,default=DATA); parser.add_argument("--output-dir",type=Path,default=OUT); parser.add_argument("--model-dir",type=Path,default=MODEL_DIR); args=parser.parse_args()
    if args.output_dir.exists() and any(args.output_dir.iterdir()): raise FileExistsError(f"Refusing to overwrite hybrid experiment outputs: {args.output_dir}")
    data=validate_hourly(pd.read_csv(args.input,parse_dates=["timestamp"]))
    direct=DirectAQIForecaster(args.model_dir); recursive=OneHourAQIPredictor(ROOT/"saved_models"/"aqi_xgboost.json")
    # Predeclare/freeze family selection from Jan-Sep 2023 validation before Q4 scoring.
    selection,validation_ledger,selection_metrics,val_skips,val_failures=select_by_validation(data,direct,recursive)
    args.output_dir.mkdir(parents=True,exist_ok=True)
    recursive_meta=json.loads((ROOT/"saved_models"/"aqi_xgboost_metadata.json").read_text(encoding="utf-8"))
    selection_config={"selection_policy":"per_horizon_validation_mae","selection_rule":"Select lower MAE between direct and recursive on identical valid validation target pairs; ties or no pairs select recursive.","selection_by_horizon":{str(k):v for k,v in selection.items()},"feature_schema":"canonical 22 features; shared feature builder","recursive_model_training_period":recursive_meta.get("training_period"),"recursive_model_validation_period":recursive_meta.get("validation_period"),"direct_model_training_period_by_horizon":{str(h):direct.metadata[h].get("training_period") for h in HORIZONS},"direct_model_validation_period_by_horizon":{str(h):direct.metadata[h].get("validation_period") for h in HORIZONS},"validation_origin_schedule":{"start":VAL_START.isoformat(),"end":VAL_END.isoformat(),"cadence":"daily 23:00"},"validation_target_boundary_strictly_before":VALIDATION_END.isoformat(),"training_target_boundary_strictly_before":TRAIN_CUTOFF.isoformat(),"validation_period_also_used_for_early_stopping":"yes; direct and recursive artifacts used this period during training/model selection, so this hybrid selection validation is not an independent estimate.","final_comparison_period":"Q4 2023, previously inspected; descriptive only.","origin_timestamp_alignment":"target_timestamp = origin_timestamp + lead_hour hours","missing_history_policy":"Require 169 consecutive observed hourly AQI values; no interpolation."}
    (args.output_dir/"model_selection_config.json").write_text(json.dumps(selection_config,indent=2),encoding="utf-8")
    selection_metrics.to_csv(args.output_dir/"validation_selection_metrics.csv",index=False)
    validation_ledger.to_csv(args.output_dir/"validation_selection_predictions.csv",index=False)
    thresholds=_ranges(data)
    q4_origins=pd.date_range(TEST_START,TEST_END,freq="24h")
    ledger,metrics,cats,pooled,events,skipped,failures=compare(data,direct,recursive,selection,q4_origins,thresholds)
    ledger.to_csv(args.output_dir/"prediction_comparison.csv",index=False); metrics.to_csv(args.output_dir/"metrics_by_lead_hour.csv",index=False); cats.to_csv(args.output_dir/"category_agreement_by_lead.csv",index=False); pooled.to_csv(args.output_dir/"pooled_metrics.csv",index=False); events.to_csv(args.output_dir/"rise_fall_metrics.csv",index=False)
    # Verify that each reported per-lead metric is reproducible from the saved common-pair ledger.
    saved=pd.read_csv(args.output_dir/"prediction_comparison.csv")
    for _,r in metrics.iterrows():
        p=saved[(saved.lead_hour==r.lead_hour)&(saved.common_valid==True)]
        if len(p)!=int(r.valid_pairs): raise AssertionError(f"Hybrid common-pair count mismatch at lead {int(r.lead_hour)}")
        for m in METHODS:
            rec=_metric(p.actual_AQI.to_numpy(dtype=float),p[f"{m}_AQI"].to_numpy(dtype=float))
            if not (np.isclose(rec["mae"],r[f"{m}_MAE"]) and np.isclose(rec["rmse"],r[f"{m}_RMSE"])): raise AssertionError(f"Saved ledger metric mismatch: lead {int(r.lead_hour)}, method {m}")
    weighted={m:float((cats.loc[cats.method==m,"category_agreement"]*cats.loc[cats.method==m,"valid_pairs"]).sum()/cats.loc[cats.method==m,"valid_pairs"].sum()) for m in METHODS}
    summary={"model_selection":selection_config,"validation_skipped_origins":len(val_skips),"validation_skip_details":val_skips,"validation_inference_failures":val_failures,"evaluation":"Q4 2023 descriptive comparison; not an untouched confirmatory test.","q4_origins_attempted":len(q4_origins),"q4_origins_with_forecasts":int(ledger.loc[ledger.recursive_AQI.notna()&ledger.direct_AQI.notna(),"origin_timestamp"].nunique()),"q4_skipped_origins":len(skipped),"q4_skip_details":skipped,"q4_inference_failures":failures,"valid_pairs_total":int(ledger.common_valid.sum()),"missing_target_pairs":int((ledger.exclusion_reason=="missing_target_AQI").sum()),"weighted_category_agreement":weighted,"category_thresholds":{"Good":"<=50","Moderate":"<=100","Poor":"<=150","Very Poor":"<=200","Severe":">200"},"event_thresholds_training_only":thresholds,"large_event_definition":"Lead-specific q90 of positive and q10 of negative training origin-to-target AQI changes; threshold requires at least 30 training events; event metrics require at least 10 common evaluation pairs.","history_policy":"No interpolation; 169 consecutive observed readings required.","prediction_alignment":"origin is last observed hour; target = origin + horizon hours; common metric rows require finite predictions and observed actual for all four methods.","limitation":"Historical records end 2023-12-31; Q4 has been examined previously; validation was also used for underlying model early stopping; neither period is an independent untouched confirmation."}
    (args.output_dir/"summary.json").write_text(json.dumps(summary,indent=2),encoding="utf-8")
    def table(df):
        cols=list(df.columns); lines=["| "+" | ".join(cols)+" |","| "+" | ".join(["---"]*len(cols))+" |"]
        for row in df.itertuples(index=False,name=None): lines.append("| "+" | ".join("" if pd.isna(v) else f"{v:.3f}" if isinstance(v,(float,np.floating)) else str(v) for v in row)+" |")
        return "\n".join(lines)
    report=["# Hybrid 24-hour AQI experiment","","## Method and selection","","At each origin, the existing recursive model and all 24 direct models were run. The hybrid then selected one of those two predictions independently per lead. For each lead, selection used the lower validation MAE on common valid pairs; ties or unavailable pairs defaulted to recursive. The mapping was frozen before Q4 evaluation and is recorded in `model_selection_config.json`.","","The base models' fit origins precede 2023-01-01: the recursive model trains from 2017-10-03 18:00 through 2022-12-31 22:00; direct horizon training periods are stored individually in model metadata (lead 1 ends 2022-12-31 22:00; lead 24 ends 2022-12-30 23:00). Base-model validation labels are from 2023-01-01 through September 2023, with horizon-aware target purging before 2023-10-01. Hybrid-family selection forecasts use daily 23:00 origins from 2023-01-01 through 2023-09-29 and target timestamps strictly before 2023-10-01. This interval was also used for early stopping/model selection of the underlying artifacts, so the family-selection scores are not an independent validation estimate.","","## Implementation and tests","","Hybrid inference: `src/aqi_prediction_service/hybrid_forecast.py`; comparison runner: `training/evaluate_hybrid_24h.py`; automated coverage: `tests/test_hybrid_forecast.py`.","","## Q4 2023 descriptive comparison","","Q4 was previously examined and is not an untouched test. Methods are scored on the exact same valid origin/target rows across recursive, direct, hybrid, and persistence. Persistence repeats AQI observed at the origin. MAE/RMSE are reported lead-by-lead; positive hybrid MAE improvement means benchmark MAE minus hybrid MAE.","",table(metrics),"","### Pooled metrics","","Pooled rows include every lead from 1 through the named lead and use the four-way common valid targets.","",table(pooled),"","### Category agreement","","Existing thresholds are Good <=50, Moderate <=100, Poor <=150, Very Poor <=200, Severe >200. Weighted agreements use valid target counts.","",table(pd.DataFrame([{"method":k,"weighted_agreement":v} for k,v in weighted.items()])),"","### Large AQI changes","","Thresholds are training-only per lead: q90 of positive and q10 of negative origin-to-target changes; at least 30 training events to define a threshold and at least 10 common evaluation pairs to report slice metrics. See `rise_fall_metrics.csv`.","","## Coverage and limitations","",f"- Validation origins attempted: {len(pd.date_range(VAL_START,VAL_END,freq='24h'))}; skipped: {len(val_skips)}.",f"- Q4 origins attempted: {len(q4_origins)}; forecasted: {summary['q4_origins_with_forecasts']}; skipped: {len(skipped)}; valid pairs: {summary['valid_pairs_total']}; missing target pairs: {summary['missing_target_pairs']}.","- The dataset ends 2023-12-31. Q4 has prior exposure, and validation also participated in early stopping for the existing models. Obtain newer untouched data for confirmatory assessment.","- No interpolation was used. Origins require 169 consecutive observed readings.","- This experiment does not integrate the hybrid into FastAPI and does not establish production readiness.","","## Skip details","",json.dumps({"validation":val_skips,"q4":skipped,"inference_failures":failures},indent=2),""]
    (args.output_dir/"EXPERIMENT_REPORT.md").write_text("\n".join(report),encoding="utf-8")
    print("Selection:",selection); print(metrics[["lead_hour","valid_pairs","hybrid_MAE","hybrid_RMSE","recursive_MAE","direct_MAE","persistence_MAE"]].to_string(index=False)); print("Pooled:"); print(pooled.to_string(index=False)); print(f"Report: {args.output_dir}")
if __name__=="__main__": main()



