"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const links = [
  { href: "#discover", label: "Discover" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#about", label: "About" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`sticky top-0 z-30 transition duration-200 ease-out ${
        solid
          ? "border-b border-bragi-ink/10 bg-bragi-cream/95 text-bragi-navy shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent text-bragi-mist"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3">
          <Image
            src="/brand/LogoHorizontal.png"
            alt="Bragi"
            width={148}
            height={40}
            className={`h-8 w-auto object-contain transition duration-200 sm:h-9 ${
              solid ? "" : "brightness-0 invert"
            }`}
            priority
          />
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm transition duration-200 ease-out ${
                solid
                  ? "text-bragi-navy/70 hover:text-bragi-navy"
                  : "text-bragi-mist/80 hover:text-bragi-cream"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#discover"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-200 ease-out ${
              solid
                ? "bg-bragi-accent text-white hover:bg-bragi-accent/90"
                : "bg-bragi-cream text-bragi-ink hover:bg-white"
            }`}
          >
            Find my matches
          </a>
        </nav>

        <button
          type="button"
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-medium md:hidden ${
            solid
              ? "border-bragi-ink/15 text-bragi-navy"
              : "border-bragi-mist/35 text-bragi-mist"
          }`}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-bragi-ink/10 bg-bragi-cream px-4 py-3 text-bragi-navy md:hidden"
          aria-label="Mobile"
        >
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-xl px-3 py-3 text-base transition hover:bg-bragi-paper"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#discover"
                className="mt-2 inline-flex min-h-11 items-center rounded-full bg-bragi-accent px-5 text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                Find my matches
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
