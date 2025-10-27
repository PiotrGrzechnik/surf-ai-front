import { useEffect, useMemo, useState } from "react";
import type { ForecastHour } from "../types/forecast";
import type { RatingQuality, RatingWaveSize, SurfRatingDocument } from "../types/rating";

interface RatingFormProps {
  hour: ForecastHour | null;
  existingRating?: SurfRatingDocument | null;
  onSave: (rating: { waveSize: RatingWaveSize; quality: RatingQuality }) => Promise<void>;
  onDelete?: () => Promise<void>;
  loading?: boolean;
}

const WAVE_SIZE_OPTIONS: RatingWaveSize[] = ["flat", "small", "medium", "big"];
const QUALITY_OPTIONS: RatingQuality[] = ["zero", "clean", "fair", "choppy", "messy"];

/**
 * Dropdown driven form that lets a surfer provide subjective ratings.
 */
export function RatingForm({ hour, existingRating, onSave, onDelete, loading }: RatingFormProps) {
  const [waveSize, setWaveSize] = useState<RatingWaveSize>("small");
  const [quality, setQuality] = useState<RatingQuality>("clean");
  const [error, setError] = useState<string | null>(null);

  const disabled = !hour || loading;

  useEffect(() => {
    if (!existingRating) {
      setWaveSize("small");
      setQuality("clean");
      return;
    }
    setWaveSize(existingRating.rating_waveSize);
    setQuality(existingRating.rating_quality);
  }, [existingRating]);

  useEffect(() => {
    if (waveSize === "flat") {
      setQuality("zero");
    }
  }, [waveSize]);

  const qualityOptions = useMemo(
    () => (waveSize === "flat" ? ["zero"] : QUALITY_OPTIONS),
    [waveSize]
  );

  if (!hour) {
    return (
      <div className="rounded-xl border border-dashed border-surf-teal/40 bg-white p-6 text-center text-sm text-slate-500">
        Select an hour to enable rating.
      </div>
    );
  }

  const formattedTime = new Date(hour.time).toLocaleString(undefined, {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      await onSave({ waveSize, quality });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save rating";
      setError(message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-surf-teal/40 bg-white p-6 shadow-md"
    >
      <h3 className="text-lg font-semibold text-surf-green">Rate {formattedTime}</h3>

      <div className="mt-4 space-y-4 text-sm">
        <label className="block">
          <span className="mb-1 block font-medium text-slate-700">Wave Size</span>
          <select
            className="w-full rounded-lg border border-surf-teal/60 bg-white px-3 py-2"
            value={waveSize}
            onChange={(event) => setWaveSize(event.target.value as RatingWaveSize)}
            disabled={disabled}
          >
            {WAVE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-medium text-slate-700">Surf Quality</span>
          <select
            className="w-full rounded-lg border border-surf-teal/60 bg-white px-3 py-2"
            value={quality}
            onChange={(event) => setQuality(event.target.value as RatingQuality)}
            disabled={disabled || waveSize === "flat"}
          >
            {qualityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="submit"
          className="rounded-lg bg-surf-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-surf-green disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
        >
          {existingRating ? "Update Rating" : "Save Rating"}
        </button>

        {existingRating && onDelete ? (
          <button
            type="button"
            className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            onClick={async () => {
              setError(null);
              try {
                await onDelete();
              } catch (err) {
                const message = err instanceof Error ? err.message : "Unable to delete rating";
                setError(message);
              }
            }}
            disabled={disabled}
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
