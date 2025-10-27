import Head from "next/head";
import { FormEvent, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { AccessDenied } from "../components/AccessDenied";
import { ForecastCard } from "../components/ForecastCard";
import { PredictionPanel } from "../components/PredictionPanel";
import { RatingForm } from "../components/RatingForm";
import { useAuth } from "../context/AuthContext";
import type { ForecastHour, ForecastResponse } from "../types/forecast";
import type { PredictionPayload } from "../types/prediction";
import type { RatingQuality, RatingWaveSize, SurfRatingDocument } from "../types/rating";

const API_BASE = "";

export default function HomePage() {
  const { user, token, allowed, loading, error, loginWithGoogle, loginWithEmail, registerWithEmail, logout, resetError } =
    useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const isAuthed = Boolean(user && token && allowed);

  const forecastKey = isAuthed ? [`${API_BASE}/api/forecast`, token] : null;
  const ratingKey = isAuthed ? [`${API_BASE}/api/rating`, token] : null;

  const fetcher = async ([url, authToken]: [string, string]) => {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? "Request failed");
    }
    return response.json();
  };

  const {
    data: forecastData,
    isLoading: forecastLoading,
    error: forecastError,
  } = useSWR<ForecastResponse>(forecastKey, fetcher, {
    revalidateOnFocus: false,
  });

  const {
    data: ratingsData,
    isLoading: ratingsLoading,
    mutate: mutateRatings,
  } = useSWR<SurfRatingDocument[]>(ratingKey, fetcher, {
    revalidateOnFocus: false,
  });

  const [selectedHour, setSelectedHour] = useState<ForecastHour | null>(null);
  const [prediction, setPrediction] = useState<PredictionPayload | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    if (forecastData?.hours?.length && !selectedHour) {
      setSelectedHour(forecastData.hours[0]);
    }
  }, [forecastData, selectedHour]);

  const existingRating = useMemo(() => {
    if (!selectedHour || !ratingsData) {
      return null;
    }
    return ratingsData.find((entry) => entry.time === selectedHour.time) ?? null;
  }, [ratingsData, selectedHour]);

  const handlePrediction = async (hour: ForecastHour | null) => {
    if (!hour || !token) {
      return;
    }
    setPredictionError(null);
    setPredictionLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(hour).forEach(([key, value]) => {
        if (typeof value === "number" || typeof value === "string") {
          params.set(key, String(value));
        }
      });
      const response = await fetch(`${API_BASE}/api/predict?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Unable to fetch prediction");
      }
      const data: PredictionPayload = await response.json();
      setPrediction(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch prediction";
      setPredictionError(message);
      setPrediction(null);
    } finally {
      setPredictionLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHour) {
      handlePrediction(selectedHour);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHour, token]);

  const handleSaveRating = async (rating: { waveSize: RatingWaveSize; quality: RatingQuality }) => {
    if (!selectedHour || !token) {
      throw new Error("No hour selected or missing token");
    }
    const method = existingRating ? "PUT" : "POST";
    const response = await fetch(`${API_BASE}/api/rating`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...selectedHour,
        rating: rating,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? "Unable to save rating");
    }
    await mutateRatings();
    await handlePrediction(selectedHour);
  };

  const handleDeleteRating = async () => {
    if (!selectedHour || !token) {
      return;
    }
    const response = await fetch(`${API_BASE}/api/rating?time=${encodeURIComponent(selectedHour.time)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok && response.status !== 404) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message ?? "Unable to delete rating");
    }
    await mutateRatings();
    await handlePrediction(selectedHour);
  };

  const handleSubmitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      return;
    }
    if (authMode === "login") {
      await loginWithEmail(email, password);
    } else {
      await registerWithEmail(email, password);
    }
    setEmail("");
    setPassword("");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surf-light">
        <p className="text-sm text-slate-600">Loading authentication...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surf-light">
        <AccessDenied
          onRetry={() => {
            resetError();
            logout();
          }}
        />
      </main>
    );
  }

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surf-light p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-surf-green">Surf Forecast AI Predictor</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with an approved Gmail address to start forecasting Playa de las Arenas.
          </p>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="mt-6 w-full rounded-lg bg-surf-teal py-2 text-sm font-semibold text-white transition hover:bg-surf-green"
          >
            Continue with Google
          </button>

          <div className="mt-6 border-t border-surf-teal/20 pt-6">
            <div className="flex items-center justify-between text-xs uppercase text-slate-500">
              <span>{authMode === "login" ? "Or sign in with email" : "Create an account"}</span>
              <button
                type="button"
                className="font-semibold text-surf-teal hover:underline"
                onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
              >
                {authMode === "login" ? "Need an account?" : "Already have an account?"}
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmitEmail}>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-surf-teal/40 px-3 py-2"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  className="w-full rounded-lg border border-surf-teal/40 px-3 py-2"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-lg border border-surf-teal/50 bg-white py-2 text-sm font-semibold text-surf-green transition hover:bg-surf-teal/10"
              >
                {authMode === "login" ? "Sign In" : "Register"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Surf Forecast AI Predictor</title>
      </Head>
      <main className="min-h-screen bg-surf-light pb-16">
        <header className="bg-gradient-to-r from-surf-green to-surf-teal py-10 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Surf Forecast AI Predictor</h1>
              <p className="text-sm text-white/80">
                Playa de las Arenas, Valencia · Personalized AI surf quality predictions.
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{user?.email}</p>
              <button
                type="button"
                onClick={logout}
                className="mt-2 rounded-lg border border-white/60 px-3 py-1 text-xs font-semibold transition hover:bg-white hover:text-surf-green"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <section className="mx-auto mt-10 grid max-w-6xl gap-8 px-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-surf-green">24-Hour Marine Forecast</h2>
            {forecastLoading ? (
              <p className="text-sm text-slate-500">Loading forecast...</p>
            ) : forecastError ? (
              <p className="text-sm text-red-600">
                {forecastError instanceof Error ? forecastError.message : "Unable to load forecast."}
              </p>
            ) : forecastData ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {forecastData.hours.map((hour) => (
                  <ForecastCard
                    key={hour.time}
                    hour={hour}
                    isSelected={selectedHour?.time === hour.time}
                    onSelect={(selected) => setSelectedHour(selected)}
                    predictedQuality={selectedHour?.time === hour.time ? prediction?.predicted.quality : undefined}
                    predictedWaveSize={selectedHour?.time === hour.time ? prediction?.predicted.waveSize : undefined}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No forecast data available.</p>
            )}
          </div>

          <div className="space-y-4">
            <RatingForm
              hour={selectedHour}
              existingRating={existingRating}
              onSave={async (rating) => handleSaveRating(rating)}
              onDelete={existingRating ? handleDeleteRating : undefined}
              loading={ratingsLoading}
            />
            <PredictionPanel
              hour={selectedHour}
              prediction={prediction}
              loading={predictionLoading}
              onRefresh={() => handlePrediction(selectedHour)}
            />
            {predictionError ? (
              <p className="text-xs text-red-600">Prediction error: {predictionError}</p>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
