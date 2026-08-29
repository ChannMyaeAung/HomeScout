"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function FirstVisitModal() {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">⚠️ Demo Notice</DialogTitle>
          <DialogDescription className="text-sm">
            This demo is no longer functional as my AWS Free Tier credits have
            expired. The backend services are unavailable, but you can watch a
            full demo on my portfolio. I will reactivate the demo once I have
            the necessary resources. Thank you for your understanding!
          </DialogDescription>
          <DialogDescription className="text-sm mt-2">
            I appreciate your patience and support!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="default"
            onClick={() => {
              window.open(
                "https://www.chanmyaeaung.com/projects/home-scout",
                "_blank",
                "noopener,noreferrer",
              );
              handleClose();
            }}
            className="w-full sm:w-auto"
          >
            Watch Portfolio Demo
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
