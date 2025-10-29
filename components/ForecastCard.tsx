import clsx from "clsx";
import type { ReactNode } from "react";
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
          <p className="flex items-center gap-2 text-xs text-slate-500">
            {renderInlineDirection(hour.waveDirection)}
          </p>
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

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Wave Ht" value={`${hour.waveSize.toFixed(1)} m`} />
        <Metric label="Period" value={`${hour.wavePeriod.toFixed(1)} s`} />
        <Metric label="Wind Wave" value={`${hour.windWaveHeight.toFixed(1)} m`} />
        <Metric label="Swell" value={`${hour.swellWaveHeight.toFixed(1)} m`} />
        <Metric label="Secondary Swell" value={`${hour.secondarySwellWaveHeight.toFixed(1)} m`} />
        <Metric label="Wind Speed" value={`${hour.windSpeed.toFixed(1)} km/h`} />
        <DirectionMetric label="Wave Dir" direction={hour.waveDirection} />
        <DirectionMetric label="Wind Dir" direction={hour.windDirection} />
        <DirectionMetric label="Swell Dir" direction={hour.swellWaveDirection} />
      </div>
    </button>
  );
}

interface MetricProps {
  label: string;
  value: ReactNode;
}

function Metric({ label, value }: MetricProps) {
  return (
    <div>
      <p className="font-semibold text-slate-700">{label}</p>
      <p className="flex items-center gap-1">{value}</p>
    </div>
  );
}

function DirectionMetric({ label, direction }: { label: string; direction: number }) {
  const normalized = normalizeDegrees(direction);

  return (
    <div>
      <p className="font-semibold text-slate-700">{label}</p>
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          <CompassLabel position="top">N</CompassLabel>
          <CompassLabel position="bottom">S</CompassLabel>
          <CompassLabel position="left">W</CompassLabel>
          <CompassLabel position="right">E</CompassLabel>
          <span
            className="inline-block text-lg text-surf-green transition-transform"
            style={{ transform: `rotate(${normalized}deg)` }}
          >
            ↑
          </span>
        </div>
        <span className="text-sm text-slate-600">{Math.round(normalized)}°</span>
      </div>
    </div>
  );
}

function CompassLabel({ position, children }: { position: "top" | "bottom" | "left" | "right"; children: ReactNode }) {
  const base = "absolute text-[10px] font-medium text-slate-400";
  const positionClass =
    position === "top"
      ? "top-1 left-1/2 -translate-x-1/2"
      : position === "bottom"
      ? "bottom-1 left-1/2 -translate-x-1/2"
      : position === "left"
      ? "left-1 top-1/2 -translate-y-1/2"
      : "right-1 top-1/2 -translate-y-1/2";

  return <span className={`${base} ${positionClass}`}>{children}</span>;
}

function renderInlineDirection(direction: number): ReactNode {
  const normalized = normalizeDegrees(direction);
  return (
    <>
      <span className="text-sm">{inlineArrow(normalized)}</span>
      <span>{`${Math.round(normalized)}°`}</span>
    </>
  );
}

function inlineArrow(direction: number): string {
  const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  const index = Math.round(direction / 45) % arrows.length;
  return arrows[index];
}

function normalizeDegrees(value: number): number {
  return Number.isFinite(value) ? ((value % 360) + 360) % 360 : 0;
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
