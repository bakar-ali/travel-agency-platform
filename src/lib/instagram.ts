const INSTAGRAM_BASE =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/";

export function getInstagramUrl(tourTitle?: string): string {
  if (!tourTitle) return INSTAGRAM_BASE;

  const message = encodeURIComponent(
    `Hi! I'm interested in booking the "${tourTitle}" tour. Could you please share availability and details?`
  );

  // Instagram DM deep link (works on mobile; falls back to profile on desktop)
  return `${INSTAGRAM_BASE}?text=${message}`;
}

export function getInquireUrl(tourTitle: string, tourType?: string): string {
  const message = encodeURIComponent(
    `Hello! I'd like to inquire about:\n\nTour: ${tourTitle}${tourType ? `\nType: ${tourType}` : ""}\n\nPlease share dates and pricing. Thank you!`
  );
  return `${INSTAGRAM_BASE}?text=${message}`;
}
