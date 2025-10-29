import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseAdminAuth } from "@/lib/firebaseAdmin";
import type { ForecastResponse } from "@/types/forecast";

const MARINE_FORECAST_URL =
  "https://marine-api.open-meteo.com/v1/marine?latitude=39.4635&longitude=-0.3203&hourly=wave_height,wave_direction,wave_period,wind_wave_height,wind_wave_direction,wind_wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,secondary_swell_wave_height,secondary_swell_wave_direction,secondary_swell_wave_period&timezone=UTC";

const WIND_FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=39.4635&longitude=-0.3203&hourly=windspeed_10m,winddirection_10m&timezone=UTC";

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

    const [marineResponse, windResponse] = await Promise.all([
      fetch(MARINE_FORECAST_URL),
      fetch(WIND_FORECAST_URL),
    ]);

    if (!marineResponse.ok || !windResponse.ok) {
      console.error("[forecast] remote fetch failed", {
        marineStatus: marineResponse.status,
        marineStatusText: marineResponse.statusText,
        windStatus: windResponse.status,
        windStatusText: windResponse.statusText,
      });
      return res.status(502).json({ message: "Unable to retrieve forecast data" });
    }

    const marineForecast = await marineResponse.json();
    const windForecast = await windResponse.json();
    const marineHourly = marineForecast.hourly;
    const windHourly = windForecast.hourly;

    if (!Array.isArray(marineHourly?.time)) {
      console.error("[forecast] malformed marine payload");
      return res.status(500).json({ message: "Forecast data is incomplete" });
    }

    const marineTimes = marineHourly.time as string[];
    const windTimes = Array.isArray(windHourly?.time) ? (windHourly.time as string[]) : [];

    const hours = marineTimes.map((time: string, index: number) => {
      const isoTime = time.endsWith("Z") ? time : new Date(`${time}Z`).toISOString();
      const windIndex = windTimes[index] === time ? index : windTimes.indexOf(time);
      const resolvedWindIndex = windIndex >= 0 ? windIndex : index;

      return {
        time: isoTime,
        waveSize: Number(marineHourly.wave_height?.[index] ?? 0),
        wavePeriod: Number(marineHourly.wave_period?.[index] ?? 0),
        waveDirection: Number(marineHourly.wave_direction?.[index] ?? 0),
        windWaveHeight: Number(marineHourly.wind_wave_height?.[index] ?? 0),
        windWavePeriod: Number(marineHourly.wind_wave_period?.[index] ?? 0),
        windWaveDirection: Number(marineHourly.wind_wave_direction?.[index] ?? 0),
        swellWaveHeight: Number(marineHourly.swell_wave_height?.[index] ?? 0),
        swellWavePeriod: Number(marineHourly.swell_wave_period?.[index] ?? 0),
        swellWaveDirection: Number(marineHourly.swell_wave_direction?.[index] ?? 0),
        secondarySwellWaveHeight: Number(marineHourly.secondary_swell_wave_height?.[index] ?? 0),
        secondarySwellWavePeriod: Number(marineHourly.secondary_swell_wave_period?.[index] ?? 0),
        secondarySwellWaveDirection: Number(marineHourly.secondary_swell_wave_direction?.[index] ?? 0),
        windSpeed: Number(
          Array.isArray(windHourly?.windspeed_10m) ? windHourly.windspeed_10m?.[resolvedWindIndex] ?? 0 : 0
        ),
        windDirection: Number(
          Array.isArray(windHourly?.winddirection_10m) ? windHourly.winddirection_10m?.[resolvedWindIndex] ?? 0 : 0
        ),
      };
    });

    if (hours.length === 0) {
      console.error("[forecast] no hourly data returned");
      return res.status(500).json({ message: "Forecast data is incomplete" });
    }

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
