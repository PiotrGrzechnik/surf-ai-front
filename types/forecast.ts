/**
 * Represents a single hour of marine forecast data returned from Open-Meteo.
 */
export interface ForecastHour {
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
  seaLevel: number;
}

/**
 * Envelope returned by the /api/forecast endpoint.
 */
export interface ForecastResponse {
  generatedAt: string;
  hours: ForecastHour[];
}
