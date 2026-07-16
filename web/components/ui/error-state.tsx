import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Spinner } from "./spinner";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  onSkip?: () => void;
  onExit?: () => void;
  retryLabel?: string;
  skipLabel?: string;
  loading?: boolean;
};

export function ErrorState({
  message,
  onRetry,
  onSkip,
  onExit,
  retryLabel = "Retry",
  skipLabel = "Skip this stage",
  loading,
}: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-11">
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? <Spinner size={14} /> : retryLabel}
          </button>
        )}
        {onSkip && (
          <button
            onClick={onSkip}
            className="rounded-lg border px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
          >
            {skipLabel}
          </button>
        )}
        {onExit && (
          <button
            onClick={onExit}
            className="rounded-lg border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Exit to dashboard
          </button>
        )}
      </div>
    </div>
  );
}
