import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseAdminAuth } from "@/lib/firebaseAdmin";
import type { ForecastResponse } from "@/types/forecast";

const FORECAST_URL =
  "https://marine-api.open-meteo.com/v1/marine?latitude=39.4635&longitude=-0.3203&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,secondary_swell_wave_height,secondary_swell_wave_direction,secondary_swell_wave_period,wind_speed_10m,wind_direction_10m";

/**
 * Proxy endpoint that authenticates the caller before retrieving formatted
 * marine forecast data from Open-Meteo.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForecastResponse | { message: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid authorization header" });
    }

    const token = authHeader.split("Bearer ")[1];
    await firebaseAdminAuth.verifyIdToken(token);

    const forecastResponse = await fetch(FORECAST_URL);
    if (!forecastResponse.ok) {
      console.error("[forecast] remote fetch failed", forecastResponse.status, forecastResponse.statusText);
      return res.status(502).json({ message: "Unable to retrieve forecast data" });
    }

    const forecastJson = await forecastResponse.json();
    const hourly = forecastJson.hourly;

    if (!hourly?.time) {
      console.error("[forecast] malformed remote payload");
      return res.status(500).json({ message: "Forecast data is incomplete" });
    }

    const hours = (hourly.time as string[]).map((time: string, index: number) => ({
      time,
      waveSize: Number(hourly.wave_height?.[index] ?? 0),
      wavePeriod: Number(hourly.wave_period?.[index] ?? 0),
      waveDirection: Number(hourly.wave_direction?.[index] ?? 0),
      windWaveHeight: Number(hourly.wind_wave_height?.[index] ?? 0),
      windWavePeriod: Number(hourly.wind_wave_period?.[index] ?? 0),
      windWaveDirection: Number(hourly.wind_wave_direction?.[index] ?? 0),
      swellWaveHeight: Number(hourly.swell_wave_height?.[index] ?? 0),
      swellWavePeriod: Number(hourly.swell_wave_period?.[index] ?? 0),
      swellWaveDirection: Number(hourly.swell_wave_direction?.[index] ?? 0),
      secondarySwellWaveHeight: Number(hourly.secondary_swell_wave_height?.[index] ?? 0),
      secondarySwellWavePeriod: Number(hourly.secondary_swell_wave_period?.[index] ?? 0),
      secondarySwellWaveDirection: Number(hourly.secondary_swell_wave_direction?.[index] ?? 0),
      windSpeed: Number(hourly.wind_speed_10m?.[index] ?? 0),
      windDirection: Number(hourly.wind_direction_10m?.[index] ?? 0),
    }));

    const payload: ForecastResponse = {
      generatedAt: new Date().toISOString(),
      hours,
    };

    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate");
    return res.status(200).json(payload);
  } catch (error) {
    console.error("[forecast] error", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
