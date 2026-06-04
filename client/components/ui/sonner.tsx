"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" style={{ color: "#111827" }} />,
        info: <InfoIcon className="size-4" style={{ color: "#3b82f6" }} />,
        warning: <TriangleAlertIcon className="size-4" style={{ color: "#eab308" }} />,
        error: <OctagonXIcon className="size-4" style={{ color: "#ef4444" }} />,
        loading: <Loader2Icon className="size-4 animate-spin" style={{ color: "#111827" }} />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
