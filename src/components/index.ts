export { default as Dashboard } from "./Dashboard";
export type { DashboardProps, ManuscriptItem } from "./Dashboard";

export { default as DocumentEditor } from "./DocumentEditor";
export type { DocumentEditorProps, DocumentSection } from "./DocumentEditor";

export { default as SubmissionDashboard } from "./SubmissionDashboard";
export type {
  SubmissionDashboardProps,
  SubmissionItem,
  SubmissionStatus,
} from "./SubmissionDashboard";

export { default as ReviewResponseInterface } from "./ReviewResponseInterface";
export type {
  ReviewResponseInterfaceProps,
  ReviewerCommentData,
} from "./ReviewResponseInterface";

export { default as LoadingSpinner } from "./ui/LoadingSpinner";
export type { LoadingSpinnerProps } from "./ui/LoadingSpinner";

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonText } from "./ui/Skeleton";
export type { SkeletonProps } from "./ui/Skeleton";

export { default as ErrorBoundary } from "./ui/ErrorBoundary";
export type { ErrorBoundaryProps } from "./ui/ErrorBoundary";

export { SubmissionWizard } from "./submission/SubmissionWizard";
export type { SubmissionWizardProps } from "./submission/SubmissionWizard";
export { SubmissionPanel } from "./submission/SubmissionPanel";
export { ConnectionsManager } from "./submission/ConnectionsManager";
export { ConnectionForm } from "./submission/ConnectionForm";
export { SecurityBriefing } from "./submission/SecurityBriefing";
export { CaptchaSolver } from "./submission/CaptchaSolver";
export { default as SubmissionProgressBar } from "./submission/SubmissionProgressBar";
