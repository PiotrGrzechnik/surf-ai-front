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
              hour12: false,
            })}
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

      <div className="mt-4 flex flex-col divide-y divide-slate-200 text-xs text-slate-600">
        <div className="grid grid-cols-3 gap-4 pb-4">
          <Metric label="Wave Ht" value={`${hour.waveSize.toFixed(1)} m`} emphasis="primary" />
          <Metric label="Period" value={`${hour.wavePeriod.toFixed(1)} s`} emphasis="primary" />
          <Metric label="Wind Wave" value={`${hour.windWaveHeight.toFixed(1)} m`} emphasis="primary" />
        </div>
        <div className="grid grid-cols-2 gap-4 py-4 md:grid-cols-4">
          <Metric label="Swell" value={`${hour.swellWaveHeight.toFixed(1)} m`} />
          <Metric label="Secondary Swell" value={`${hour.secondarySwellWaveHeight.toFixed(1)} m`} />
          <Metric label="Sea Level" value={`${hour.seaLevel.toFixed(2)} m`} />
          <Metric label="Wind Speed" value={`${hour.windSpeed.toFixed(1)} km/h`} />
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4">
          <DirectionMetric label="Wave Dir" direction={hour.waveDirection} />
          <DirectionMetric label="Wind Dir" direction={hour.windDirection} />
          <DirectionMetric label="Swell Dir" direction={hour.swellWaveDirection} />
        </div>
      </div>
    </button>
  );
}

interface MetricProps {
  label: string;
  value: ReactNode;
  emphasis?: "default" | "primary";
}

function Metric({ label, value, emphasis = "default" }: MetricProps) {
  const isPrimary = emphasis === "primary";
  const labelClass = clsx(
    "font-semibold",
    isPrimary ? "text-sm text-sky-600" : "text-xs text-slate-700"
  );
  const valueClass = clsx(
    "flex items-center gap-1",
    isPrimary ? "text-base font-semibold text-sky-700" : "text-xs text-slate-600"
  );

  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{value}</p>
    </div>
  );
}

function DirectionMetric({ label, direction }: { label: string; direction: number }) {
  const normalized = normalizeDegrees(direction);
  const arrowRotation = (normalized + 180) % 360;

  return (
    <div className="flex flex-col items-center gap-2 md:items-start">
      <p className="font-semibold text-slate-700">{label}</p>
      <div className="flex items-center">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          <CompassLabel position="top">N</CompassLabel>
          <CompassLabel position="bottom">S</CompassLabel>
          <CompassLabel position="left">W</CompassLabel>
          <CompassLabel position="right">E</CompassLabel>
          <span
            className="inline-block text-2xl text-surf-green transition-transform leading-none"
            style={{ transform: `rotate(${arrowRotation}deg)` }}
          >
            ↑
          </span>
        </div>
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
  const adjusted = normalizeDegrees(direction + 180);
  const index = Math.round(adjusted / 45) % arrows.length;
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
