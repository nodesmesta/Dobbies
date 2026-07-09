"use client";

import Image from "next/image";

const logos = [
  { name: "AMD", href: "https://www.amd.com", img: "/amd_logo_white.svg" },
  { name: "Fireworks AI", href: "https://fireworks.ai", img: "/fireworks_logo.svg" },
  { name: "LabLab AI", href: "https://lablab.ai", img: "/lablab_logo.svg" },
];

export default function PoweredMarquee() {
  return (
    <section className="relative py-10 overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 bg-surface-0/80 backdrop-blur-md" />

      <div className="relative z-10">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-text-muted mb-6">
          Powered by &amp; Built with
        </p>

        <div className="relative overflow-hidden">
          {/* fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-surface-0 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-surface-0 to-transparent z-10 pointer-events-none" />

          <div className="flex w-max animate-[marquee_20s_linear_infinite]">
            {[0, 1, 2].map((setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center gap-16 px-8">
                {logos.map((logo, i) => (
                  <a
                    key={`${setIndex}-${i}`}
                    href={logo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 shrink-0 opacity-50 hover:opacity-100 grayscale hover:grayscale-0 brightness-200 hover:brightness-100 transition-all duration-300"
                    title={logo.name}
                  >
                    <Image
                      src={logo.img}
                      alt={logo.name}
                      width={28}
                      height={28}
                      className="h-7 w-7 object-contain rounded-sm"
                      unoptimized
                    />
                    <span className="text-sm font-semibold text-text-secondary whitespace-nowrap">
                      {logo.name}
                    </span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  );
}