/**
 * Describes the categorical predictions returned from /api/predict.
 */
export interface PredictionPayload {
  predicted: {
    waveSize: "flat" | "small" | "medium" | "big";
    quality: "zero" | "clean" | "fair" | "choppy" | "messy";
  };
  samplesUsed: number;
}
