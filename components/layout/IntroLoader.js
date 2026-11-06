import { STORE_NAME, STORE_SHORT_TAGLINE } from "@/lib/config";
import { CROWN_PATH, D_PATH, INNER_LOZENGE, OUTER_LOZENGE, PIPS } from "@/components/ui/Logo";
import IntroController from "./IntroController";

/*
 * One-time branded introduction.
 * Policy: shown once per browser (localStorage "dd:intro:v1"; bump the version to replay it after a
 * rebrand), only on a full page load, never on client-side navigation, and never with
 * prefers-reduced-motion.
 *  - An inline script in <head> decides before first paint by setting html[data-intro="play"], so the
 *    overlay never flashes for returning visitors.
 *  - The page renders underneath immediately; the overlay is purely visual and lifts away after
 *    ~2.6 s. A CSS animation removes it even if JavaScript fails, so it can never get stuck.
 *  - Storage access is wrapped in try/catch (private mode, blocked storage → simply skip the intro).
 */
export const INTRO_SCRIPT = `(function(){try{var k="dd:intro:v1";if(!localStorage.getItem(k)&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("data-intro","play");localStorage.setItem(k,String(Date.now()));}}catch(e){}})();`;

const EASE = "cubic-bezier(.22,.61,.36,1)";

const CSS = `
#brand-intro{display:none}
html[data-intro="play"] #brand-intro{display:flex;animation:di-out .6s ${EASE} 2.55s forwards}
@keyframes di-out{to{opacity:0;visibility:hidden;transform:translateY(-2%)}}
#brand-intro .di-stage{animation:di-lift .6s ${EASE} 2.55s forwards}
@keyframes di-lift{to{transform:scale(1.04);opacity:0}}
#brand-intro .di-halo{animation:di-fade 1.4s ease .2s both}
#brand-intro .di-crest{transform-box:fill-box;transform-origin:50% 58%;animation:di-settle 1.05s ${EASE} .05s both}
@keyframes di-settle{from{transform:rotate(-45deg) scale(.82);opacity:0}to{transform:none;opacity:1}}
#brand-intro .di-frame{stroke-dasharray:160;stroke-dashoffset:160;animation:di-draw 1s ${EASE} .1s forwards}
#brand-intro .di-frame.inner{animation-delay:.28s}
@keyframes di-draw{to{stroke-dashoffset:0}}
#brand-intro .di-crown{transform-box:fill-box;transform-origin:50% 100%;animation:di-crown .6s ${EASE} .7s both}
@keyframes di-crown{from{opacity:0;transform:translateY(-5px) scale(.9)}to{opacity:1;transform:none}}
#brand-intro .di-mono{transform-box:fill-box;transform-origin:center;animation:di-pop .7s ${EASE} .6s both}
#brand-intro .di-pip{transform-box:fill-box;transform-origin:center;animation:di-pop .35s cubic-bezier(.34,1.56,.64,1) both}
@keyframes di-pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
#brand-intro .di-char{display:inline-block;animation:di-rise .7s ${EASE} both}
@keyframes di-rise{from{opacity:0;transform:translateY(.45em);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
#brand-intro .di-sheen{background:linear-gradient(100deg,transparent 35%,#f6e7bf 48%,#fff8e6 50%,#f6e7bf 52%,transparent 65%) 130% 0/250% 100% no-repeat;-webkit-background-clip:text;background-clip:text;color:transparent;animation:di-sheen 1.1s ease-in-out 1.55s both}
@keyframes di-sheen{from{background-position:130% 0}to{background-position:-30% 0}}
#brand-intro .di-tag{animation:di-fade .7s ease 1.45s both}
#brand-intro .di-rule{transform-origin:center;animation:di-rule .9s ${EASE} 1.35s both}
@keyframes di-rule{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes di-fade{from{opacity:0}to{opacity:1}}
`;

export default function IntroLoader() {
  const letters = [...STORE_NAME.toUpperCase()];
  return (
    <>
      <style>{CSS}</style>
      <div
        id="brand-intro"
        aria-hidden="true"
        className="fixed inset-0 z-[100] items-center justify-center overflow-hidden bg-olive-950 text-cream-50"
        style={{ backgroundImage: "radial-gradient(ellipse at center, var(--olive-800) 0%, var(--olive-950) 70%)" }}
      >
        <div className="di-halo pointer-events-none absolute top-1/2 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/15" />
        <div className="di-halo pointer-events-none absolute top-1/2 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/10" />
        <div className="di-stage relative flex flex-col items-center px-4 text-center">
          <svg width="104" height="120" viewBox="0 0 64 74" className="overflow-visible">
            <defs>
              <linearGradient id="di-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f3e2b0" />
                <stop offset=".5" stopColor="#c9a35f" />
                <stop offset="1" stopColor="#9b7438" />
              </linearGradient>
            </defs>
            <g className="di-crest">
              <g fill="none" stroke="url(#di-gold)">
                <path className="di-frame" d={OUTER_LOZENGE} strokeWidth="1.4" />
                <path className="di-frame inner" d={INNER_LOZENGE} strokeWidth=".6" />
              </g>
              <g fill="url(#di-gold)">
                <g className="di-crown">
                  <path d={CROWN_PATH} />
                  <rect x="23" y="10.6" width="18" height="1.8" rx=".4" />
                  <circle cx="21" cy="3" r="1.1" />
                  <circle cx="32" cy="1.4" r="1.2" />
                  <circle cx="43" cy="3" r="1.1" />
                </g>
                <g className="di-mono">
                  <path d={D_PATH} fillRule="evenodd" />
                  <path d={D_PATH} fillRule="evenodd" transform="matrix(-1 0 0 1 64 0)" />
                </g>
                {PIPS.map(([x, y], i) => (
                  <circle key={x} className="di-pip" cx={x} cy={y} r="1.4" style={{ animationDelay: `${0.95 + i * 0.12}s` }} />
                ))}
              </g>
            </g>
          </svg>

          <p className="font-display relative mt-7 text-[2rem] leading-none tracking-[0.3em] sm:text-5xl">
            <span className="relative">
              {letters.map((ch, i) =>
                ch === " " ? (
                  <span key={i} className="di-char mr-[0.4em] ml-[0.1em] inline-block h-[0.22em] w-[0.22em] rotate-45 bg-gold align-middle" style={{ animationDelay: `${0.75 + i * 0.05}s` }} />
                ) : (
                  <span key={i} className="di-char" style={{ animationDelay: `${0.75 + i * 0.05}s` }}>
                    {ch}
                  </span>
                ),
              )}
              <span className="di-sheen pointer-events-none absolute inset-0 whitespace-nowrap">
                {letters.map((ch, i) => (ch === " " ? <span key={i} className="mr-[0.4em] ml-[0.1em] inline-block h-[0.22em] w-[0.22em]" /> : ch))}
              </span>
            </span>
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="di-rule block h-px w-10 bg-gradient-to-r from-transparent to-gold sm:w-16" />
            <p className="di-tag text-[0.6rem] tracking-[0.42em] text-gold-soft uppercase sm:text-[0.66rem]">{STORE_SHORT_TAGLINE}</p>
            <span className="di-rule block h-px w-10 bg-gradient-to-l from-transparent to-gold sm:w-16" />
          </div>
        </div>
      </div>
      <IntroController />
    </>
  );
}
