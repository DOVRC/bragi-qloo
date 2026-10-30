"use client";

import Image from "next/image";
import { useState } from "react";

const links = [
  { href: "#discover", label: "Discover" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#about", label: "About Bragi" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20 border-b border-white/10 bg-bragi-ink/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3">
          <Image
            src="/brand/LogoHorizontal.png"
            alt="Bragi"
            width={140}
            height={36}
            className="h-8 w-auto object-contain sm:h-9"
            priority
          />
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-bragi-mist/75 transition hover:text-bragi-mist"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#discover"
            className="rounded-full bg-bragi-mist px-4 py-2 text-sm font-semibold text-bragi-ink transition hover:bg-white"
          >
            Start discovering
          </a>
        </nav>

        <button
          type="button"
          className="rounded-md border border-bragi-mist/30 px-3 py-2 text-sm text-bragi-mist md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-white/10 px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block py-2 text-bragi-mist/85"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#discover"
                className="mt-1 inline-block rounded-full bg-bragi-mist px-4 py-2 text-sm font-semibold text-bragi-ink"
                onClick={() => setOpen(false)}
              >
                Start discovering
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
