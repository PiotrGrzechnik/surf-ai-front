interface AccessDeniedProps {
  onRetry: () => void;
}

/**
 * Renders a friendly message when the signed-in Gmail address is not whitelisted.
 */
export function AccessDenied({ onRetry }: AccessDeniedProps) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
      <h2 className="text-2xl font-semibold text-red-600">Access Denied</h2>
      <p className="mt-3 text-sm text-slate-600">
        Your Gmail account is not authorized for Surf Forecast AI Predictor. If you think this is a mistake,
        contact the administrator and ask them to add your address to the ALLOWED_GMAILS environment variable.
      </p>
      <button
        type="button"
        className="mt-6 rounded-lg bg-surf-teal px-4 py-2 text-sm font-semibold text-white transition hover:bg-surf-green"
        onClick={onRetry}
      >
        Try a different account
      </button>
    </div>
  );
}
