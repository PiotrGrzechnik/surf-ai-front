import { ForecastHour } from "./forecast";

export type RatingWaveSize = "flat" | "small" | "medium" | "big";
export type RatingQuality = "zero" | "clean" | "fair" | "choppy" | "messy";

export interface RatingRequestBody extends ForecastHour {
  rating: {
    waveSize: RatingWaveSize;
    quality: RatingQuality;
  };
}

export interface SurfRatingDocument extends ForecastHour {
  userId: string;
  rating_waveSize: RatingWaveSize;
  rating_quality: RatingQuality;
  createdAt: string;
  updatedAt: string;
}
