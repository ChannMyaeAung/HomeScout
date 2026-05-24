import { AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface ErrorComponentProps {
  message?: string;
  fullPage?: boolean;
  onRetry?: () => void;
}

const ErrorComponent = ({
  message = "Something went wrong. Please try again.",
  fullPage = true,
  onRetry,
}: ErrorComponentProps) => {
  const body = (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Something went wrong
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-1"
        >
          Try Again
        </Button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {body}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16 w-full">
      {body}
    </div>
  );
};

export default ErrorComponent;
