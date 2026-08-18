const DESTINATION_IMAGES: Record<string, string> = {
  hunza: "https://images.unsplash.com/photo-1597848219624-4562aa7a5787?w=800&q=80",
  skardu: "https://images.unsplash.com/photo-1624555130581-bf576a4c4a8b?w=800&q=80",
  kumrat: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  naran: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  swat: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
  kashmir: "https://images.unsplash.com/photo-1585409671013-3c734e7f5503?w=800&q=80",
  neelum: "https://images.unsplash.com/photo-1585409671013-3c734e7f5503?w=800&q=80",
  arangkel: "https://images.unsplash.com/photo-1585409671013-3c734e7f5503?w=800&q=80",
  "ratti gali": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  shogran: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  sharan: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  baboon: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  fairy: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  meadows: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80";

const GALLERY = [
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
];

export function getTourImage(destination: string, title: string): string {
  const search = `${destination} ${title}`.toLowerCase();
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (search.includes(key)) return url;
  }
  return DEFAULT_IMAGE;
}

export function getTourGallery(destination: string): string[] {
  const primary = getTourImage(destination, "");
  return [primary, ...GALLERY.filter((u) => u !== primary).slice(0, 3)];
}
