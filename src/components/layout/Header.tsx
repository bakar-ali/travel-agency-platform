import Link from "next/link";
import { MapPin, Mountain } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Mountain className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-lg font-bold leading-tight text-stone-900">
              Memorable Days
            </span>
            <span className="block text-xs font-medium text-brand-600">
              Tourism Pakistan
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 transition hover:text-brand-600"
          >
            Tours
          </Link>
        </nav>

        <Link href="/" className="btn-primary hidden text-sm sm:inline-flex">
          <MapPin className="h-4 w-4" />
          Explore Tours
        </Link>
      </div>
    </header>
  );
}
