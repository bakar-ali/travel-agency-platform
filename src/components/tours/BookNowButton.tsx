"use client";

import { Instagram } from "lucide-react";
import { getInquireUrl, getInstagramUrl } from "@/lib/instagram";

interface BookNowButtonProps {
  tourTitle: string;
  tourType?: string;
  variant?: "primary" | "accent" | "secondary";
  label?: string;
}

export function BookNowButton({
  tourTitle,
  tourType,
  variant = "primary",
  label = "Book Now",
}: BookNowButtonProps) {
  const url = label === "Inquire"
    ? getInquireUrl(tourTitle, tourType)
    : getInstagramUrl(tourTitle);

  const className =
    variant === "accent"
      ? "btn-accent w-full sm:w-auto"
      : variant === "secondary"
        ? "btn-secondary w-full sm:w-auto"
        : "btn-primary w-full sm:w-auto";

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      <Instagram className="h-4 w-4" />
      {label}
    </a>
  );
}
