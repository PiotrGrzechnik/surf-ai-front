import type { ForecastHour } from "../types/forecast";
import type { PredictionPayload } from "../types/prediction";

interface PredictionPanelProps {
  hour: ForecastHour | null;
  prediction: PredictionPayload | null;
  loading?: boolean;
  onRefresh: () => void;
}

/**
 * Displays the AI-driven predictions for the selected hour.
 */
export function PredictionPanel({ hour, prediction, loading, onRefresh }: PredictionPanelProps) {
  if (!hour) {
    return (
      <div className="rounded-xl border border-dashed border-surf-teal/40 bg-white p-6 text-center text-sm text-slate-500">
        Pick an hour to generate a prediction.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surf-teal/40 bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-surf-green">AI Prediction</h3>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-surf-teal/50 px-3 py-1 text-xs font-semibold text-surf-green transition hover:bg-surf-teal/10 disabled:opacity-40"
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Forecasting {new Date(hour.time).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" })}
      </p>

      {prediction ? (
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase text-slate-500">Predicted Wave Size</p>
            <p className="text-lg font-semibold text-surf-green">{prediction.predicted.waveSize}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Predicted Quality</p>
            <p className="text-lg font-semibold text-surf-green">{prediction.predicted.quality}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Training Samples Used</p>
            <p className="text-lg font-semibold text-surf-green">{prediction.samplesUsed}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          {loading ? "Calculating prediction..." : "No prediction yet. Train the model by submitting ratings."}
        </p>
      )}
    </div>
  );
}
