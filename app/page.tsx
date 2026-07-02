"use client";

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Stars background */}
      <div className="absolute inset-0 z-0">
        <Starfield />
      </div>

      {/* The crawl */}
      <div className="absolute inset-0 z-10 flex items-end justify-center">
        <div className="crawl-wrapper">
          <div className="crawl-content text-center">
            <p className="text-[#FFD700] crawl-title mb-12">DLG BOOKCLUB</p>
            <p className="text-[#FFD700] crawl-subtitle mb-16">Episode I</p>
            <p className="text-[#FFD700] crawl-subtitle mb-24">THE LIBRARY AWAKENS</p>

            <p className="mb-6">
              A long time ago, in a library far, far away...
            </p>

            <p className="mb-6">
              The <span className="text-[#FFD700]">DLG Bookclub</span> was formed. A brave circle of
              readers armed with tea, strong opinions about character arcs, and a
              complete inability to agree on a single book per month.
            </p>

            <p className="mb-6">
              After much deliberation (and several heated debates about whether
              &ldquo;rereading counts&rdquo;), the council decided: it was time for a
              digital fortress. A sacred space where books are suggested, polls are
              voted upon, and meetings are — theoretically — scheduled.
            </p>

            <p className="mb-6">
              But the builders were wise. They knew that haste leads to broken
              links and dangling JOIN clauses. So they declared:
            </p>

            <p className="mb-12 text-2xl font-bold tracking-wider text-[#FFD700]">
              &ldquo;This site is under construction.&rdquo;
            </p>

            <p className="mb-6">
              Fear not, loyal reader. The magic links are flowing. The database
              tables are normalized. The auth middleware stands guard against
              unauthenticated scoundrels.
            </p>

            <p className="mb-6">
              Soon, you shall suggest books. You shall vote in polls. You shall
              argue about whether &ldquo;It was a dark and stormy night&rdquo; is a
              valid opening line.
            </p>

            <p className="mb-6">
              But for now...
            </p>

            <p className="mb-24 text-3xl font-bold tracking-widest text-[#FFD700]">
              THE SITE IS UNDER CONSTRUCTION
            </p>

            <p className="text-sm opacity-60">
              For DLG Bookclub members, log in above. For everyone else,
              may the Force be with you. Always. 📚✨
            </p>
          </div>
        </div>
      </div>

      {/* Overlay gradient at top of crawl */}
      <div className="absolute inset-x-0 top-0 z-20 h-[60vh] bg-gradient-to-b from-black via-black to-transparent pointer-events-none" />

      {/* Bottom copyright bar */}
      <div className="absolute bottom-4 left-0 right-0 z-30 text-center text-xs text-zinc-600">
        DLG Bookclub &mdash; 2026 &mdash; A long time ago in a library far, far away
      </div>

      <style jsx>{`
        .crawl-wrapper {
          transform-origin: 50% 100%;
          transform: perspective(400px) rotateX(18deg);
          height: 200vh;
          animation: scrollUp 35s linear infinite;
        }

        .crawl-content {
          font-family: "Courier New", Courier, monospace;
          color: #FFD700;
          font-size: 1.4rem;
          line-height: 2.2rem;
          max-width: 700px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .crawl-title {
          font-size: 4rem;
          font-weight: 900;
          letter-spacing: 0.3em;
        }

        .crawl-subtitle {
          font-size: 2rem;
          letter-spacing: 0.25em;
        }

        @keyframes scrollUp {
          0% {
            transform: perspective(400px) rotateX(18deg) translateY(60%);
          }
          100% {
            transform: perspective(400px) rotateX(18deg) translateY(-200%);
          }
        }
      `}</style>
    </div>
  );
}

function Starfield() {
  const stars = Array.from({ length: 200 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 1,
  }));

  return (
    <div className="absolute inset-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size + "px",
            height: star.size + "px",
            animationDelay: star.delay + "s",
            animationDuration: star.duration + "s",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-twinkle {
          animation: twinkle infinite;
        }
      `}</style>
    </div>
  );
}
