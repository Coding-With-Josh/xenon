import type { FlowStage, FlowStageProgress } from "@/lib/flows/types";
import { HookStage } from "./hook-stage";
import { NotesStage } from "./notes-stage";
import { MicroCheckStage } from "./micro-check-stage";
import { QuizStage } from "./quiz-stage";
import { RemediationStage } from "./remediation-stage";
import { MasteryStage } from "./mastery-stage";
import { ErrorState } from "@/components/ui/error-state";

type StageRendererProps = {
  stage: FlowStage;
  subsectionIndex: number;
  subsections: { name: string; id: string }[];
  progress: FlowStageProgress[];
  sessionId: number;
  subject: string;
  topic: string;
  onAdvance: () => void;
  onRetry: () => void;
  onSkip: () => void;
  onExit: () => void;
  error: string | null;
  loading: boolean;
};

export function FlowStageRenderer(props: StageRendererProps) {
  const { stage, error, loading, subsectionIndex } = props;

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={props.onRetry}
        onSkip={loading ? undefined : props.onSkip}
        onExit={props.onExit}
        loading={loading}
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-muted animate-pulse rounded-xl h-8 w-3/4" />
        <div className="bg-muted animate-pulse rounded-xl h-4 w-1/2" />
        <div className="bg-muted animate-pulse rounded-xl h-32 w-full" />
      </div>
    );
  }

  switch (stage) {
    case "hook":
      return <HookStage {...props} />;
    case "notes":
      return <NotesStage {...props} />;
    case "microcheck":
      return <MicroCheckStage {...props} />;
    case "quiz":
      return <QuizStage {...props} />;
    case "remediation":
      return <RemediationStage {...props} />;
    case "mastery":
      return <MasteryStage {...props} />;
    default:
      return <p className="text-muted-foreground text-sm">Unknown stage</p>;
  }
}
