import clsx from "clsx";
import type { ForecastHour } from "../types/forecast";
import type { RatingQuality, RatingWaveSize } from "../types/rating";

interface ForecastCardProps {
  hour: ForecastHour;
  isSelected: boolean;
  onSelect: (hour: ForecastHour) => void;
  predictedWaveSize?: RatingWaveSize;
  predictedQuality?: RatingQuality;
}

/**
 * Displays a single hour of marine conditions with optional AI predictions.
 */
export function ForecastCard({
  hour,
  isSelected,
  onSelect,
  predictedWaveSize,
  predictedQuality,
}: ForecastCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(hour)}
      className={clsx(
        "w-full rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-surf-teal",
        isSelected ? "border-surf-teal bg-white shadow-lg" : "border-surf-teal/30 bg-surf-light"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-surf-green">
            {new Date(hour.time).toLocaleString(undefined, {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-slate-500">{formatDirection(hour.waveDirection)}</p>
        </div>

        {predictedWaveSize && predictedQuality ? (
          <div className="flex flex-col items-end text-sm font-semibold">
            <span>{renderWaveSizeBadge(predictedWaveSize)}</span>
            <span className="mt-1">{renderQualityBadge(predictedQuality)}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">Select to predict</span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 md:grid-cols-4">
        <Metric label="Wave Ht" value={`${hour.waveSize.toFixed(1)} m`} />
        <Metric label="Period" value={`${hour.wavePeriod.toFixed(1)} s`} />
        <Metric label="Wind Wave" value={`${hour.windWaveHeight.toFixed(1)} m`} />
        <Metric label="Swell" value={`${hour.swellWaveHeight.toFixed(1)} m`} />
        <Metric label="Secondary Swell" value={`${hour.secondarySwellWaveHeight.toFixed(1)} m`} />
        <Metric label="Wind Speed" value={`${hour.windSpeed.toFixed(1)} km/h`} />
        <Metric label="Wind Dir" value={formatDirection(hour.windDirection)} />
        <Metric label="Swell Dir" value={formatDirection(hour.swellWaveDirection)} />
      </div>
    </button>
  );
}

interface MetricProps {
  label: string;
  value: string;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div>
      <p className="font-semibold text-slate-700">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function formatDirection(direction: number): string {
  const normalized = ((direction % 360) + 360) % 360;
  return `${Math.round(normalized)}°`;
}

function renderWaveSizeBadge(waveSize: RatingWaveSize) {
  const symbols: Record<RatingWaveSize, string> = {
    flat: "⚪",
    small: "🟢",
    medium: "🔵",
    big: "🔴",
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surf-teal/10 px-3 py-1 text-xs text-surf-green">
      {symbols[waveSize]} {waveSize}
    </span>
  );
}

function renderQualityBadge(quality: RatingQuality) {
  const symbols: Record<RatingQuality, string> = {
    zero: "⚫",
    clean: "🟢",
    fair: "🔵",
    choppy: "🟡",
    messy: "🔴",
  };
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surf-sand/20 px-3 py-1 text-xs text-surf-green">
      {symbols[quality]} {quality}
    </span>
  );
}
