import { Loader2 } from "lucide-react";

const Loading = ({ fullPage = true }: { fullPage?: boolean }) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
        <span className="text-sm font-medium text-primary-700 tracking-wide">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 w-full">
      <Loader2 className="w-6 h-6 animate-spin text-primary-700" />
      <span className="text-sm font-medium text-primary-700">Loading...</span>
    </div>
  );
};

export default Loading;
