import { Instagram, Phone } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const instagramUrl =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/";

  return (
    <footer className="border-t border-stone-200 bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              Memorable Days Tourism
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-stone-400">
              Licensed tour operator (Gov. License #0303371). Crafting unforgettable
              journeys through Pakistan&apos;s northern valleys since day one.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Tour Catalog
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white">
                  Operations Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white">Contact</h4>
            <div className="mt-3 space-y-2 text-sm">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-white"
              >
                <Instagram className="h-4 w-4" />
                @memorabledays on Instagram
              </a>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Book via Instagram DM
              </p>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-stone-800 pt-6 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} Memorable Days Tourism (SMC-Private) Limited. All
          rights reserved.
        </div>
      </div>
    </footer>
  );
}
