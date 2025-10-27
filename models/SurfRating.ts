import { Document, Model, Schema, model, models } from "mongoose";

/**
 * Describes a single user-submitted surf rating coupled with raw conditions.
 */
export interface ISurfRating extends Document {
  userId: string;
  time: string;
  waveSize: number;
  wavePeriod: number;
  waveDirection: number;
  windWaveHeight: number;
  windWavePeriod: number;
  windWaveDirection: number;
  swellWaveHeight: number;
  swellWavePeriod: number;
  swellWaveDirection: number;
  secondarySwellWaveHeight: number;
  secondarySwellWavePeriod: number;
  secondarySwellWaveDirection: number;
  windSpeed: number;
  windDirection: number;
  rating_waveSize: "flat" | "small" | "medium" | "big";
  rating_quality: "zero" | "clean" | "fair" | "choppy" | "messy";
  createdAt: Date;
  updatedAt: Date;
}

const surfRatingSchema = new Schema<ISurfRating>(
  {
    userId: { type: String, required: true, index: true },
    time: { type: String, required: true },
    waveSize: { type: Number, required: true },
    wavePeriod: { type: Number, required: true },
    waveDirection: { type: Number, required: true },
    windWaveHeight: { type: Number, required: true },
    windWavePeriod: { type: Number, required: true },
    windWaveDirection: { type: Number, required: true },
    swellWaveHeight: { type: Number, required: true },
    swellWavePeriod: { type: Number, required: true },
    swellWaveDirection: { type: Number, required: true },
    secondarySwellWaveHeight: { type: Number, required: true },
    secondarySwellWavePeriod: { type: Number, required: true },
    secondarySwellWaveDirection: { type: Number, required: true },
    windSpeed: { type: Number, required: true },
    windDirection: { type: Number, required: true },
    rating_waveSize: {
      type: String,
      required: true,
      enum: ["flat", "small", "medium", "big"],
    },
    rating_quality: {
      type: String,
      required: true,
      enum: ["zero", "clean", "fair", "choppy", "messy"],
    },
  },
  {
    timestamps: true,
    collection: "surf_ratings",
  }
);

surfRatingSchema.index({ userId: 1, time: 1 }, { unique: true });

export const SurfRating: Model<ISurfRating> =
  models.SurfRating ?? model<ISurfRating>("SurfRating", surfRatingSchema);
