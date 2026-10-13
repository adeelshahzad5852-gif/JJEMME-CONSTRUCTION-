#!/usr/bin/env node
/* Builds three standalone home-page variants into variants-dist/ so the
   design direction can be chosen before the whole site is committed to one. */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT  = path.join(ROOT, "variants-dist");

const biz      = JSON.parse(fs.readFileSync(path.join(ROOT, "business.json"), "utf8"));
const content  = JSON.parse(fs.readFileSync(path.join(ROOT, "content.json"), "utf8"));
const variants = JSON.parse(fs.readFileSync(path.join(ROOT, "variants.json"), "utf8"));

const esc = s => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const SIZES = "(max-width: 680px) 100vw, (max-width: 960px) 50vw, 33vw";
const pic = (name, alt, sizes = SIZES) =>
  `<picture>
        <source type="image/webp" sizes="${sizes}" srcset="assets/img/${name}-sm.webp 800w, assets/img/${name}.webp 1600w">
        <source type="image/jpeg" sizes="${sizes}" srcset="assets/img/${name}-sm.jpg 800w, assets/img/${name}.jpg 1600w">
        <img src="assets/img/${name}-sm.jpg" alt="${esc(alt)}" loading="lazy" decoding="async">
      </picture>`;

const icon = {
  arrow:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>`,
  star:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`,
  split:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 7-5 5 5 5M15 7l5 5-5 5"/></svg>`,
  phone:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>`,
};

const GALLERY = [
  ["home/home-5",      "Open-concept conversion"],
  ["kitchen/kitchen-6","Full kitchen renovation"],
  ["bath/bath-14",     "Primary bathroom remodel"],
  ["kitchen/kitchen-9","Island addition"],
  ["home/home-6",      "Living room renovation"],
  ["bath/bath-15",     "Walk-in shower conversion"],
];

const BA = [
  ["kitchen-3", "Kitchen", "Dated oak kitchen to open modern island. Six weeks."],
  ["bath-2",    "Bathroom", "1980s primary bath to walk-in shower suite. Four weeks."],
];

/* ---------- shared CSS, parameterised by the variant's tokens ---------- */
function css(v) {
  const t = v.tokens;
  return `
:root{
  --accent:${t.accent}; --accent-dark:${t.accentDark}; --accent-soft:${t.accentSoft};
  --on-accent:${t.onAccent};
  --ink:${t.ink}; --ink-2:${t.ink2}; --ink-3:${t.ink3};
  --bg:${t.bg}; --alt:${t.alt}; --line:${t.line}; --deep:${t.deep};
  --r-sm:${t.rSm}; --r:${t.r}; --r-lg:${t.rLg}; --r-pill:${t.rPill};
  --fd:${v.fontDisplay}; --fb:${v.fontBody};
  --wrap:1240px; --gut:24px;
  --sh-sm:0 2px 6px rgba(0,0,0,.05), 0 6px 18px rgba(0,0,0,.04);
  --sh-md:0 6px 18px rgba(0,0,0,.07), 0 18px 44px rgba(0,0,0,.06);
  --sh-lg:0 10px 30px rgba(0,0,0,.09), 0 34px 80px rgba(0,0,0,.10);
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;overflow-x:clip}
body{margin:0;font-family:var(--fb);font-size:16px;line-height:${t.bodyLh};color:var(--ink-2);background:var(--bg);-webkit-font-smoothing:antialiased;overflow-x:clip}
img,picture{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button{font:inherit}

h1,h2,h3,h4{font-family:var(--fd);color:var(--ink);margin:0 0 .5em;text-wrap:balance}
h1{font-weight:${t.h1Weight};text-transform:${t.h1Case};letter-spacing:${t.h1Track};line-height:${t.h1Lh};font-size:clamp(2.35rem,5.2vw,4rem)}
h2{font-weight:${t.h2Weight};text-transform:${t.h2Case};letter-spacing:${t.h2Track};line-height:1.12;font-size:clamp(1.8rem,3.5vw,2.7rem)}
h3{font-weight:${t.h2Weight};letter-spacing:${t.h2Track};line-height:1.2;font-size:clamp(1.15rem,1.9vw,1.45rem)}
h4{font-weight:600;font-size:1.05rem;letter-spacing:-.01em}
p{margin:0 0 1.1em}p:last-child{margin-bottom:0}
em{font-style:normal;color:var(--accent)}

.wrap{width:100%;max-width:var(--wrap);margin-inline:auto;padding-inline:var(--gut)}
.section{padding-block:clamp(66px,9vw,116px)}
.section--alt{background:var(--alt)}
.section--tight{padding-block:clamp(48px,6vw,76px)}

.eyebrow{display:inline-block;font-family:var(--fb);font-size:.76rem;font-weight:600;
  letter-spacing:${t.eyebrowTrack};text-transform:${t.eyebrowCase};color:var(--accent);margin-bottom:18px}
.lede{font-size:1.07rem;color:var(--ink-2);max-width:58ch}
.head{max-width:760px;margin-bottom:clamp(36px,5vw,58px)}
.head--c{margin-inline:auto;text-align:center}
.head h2{margin-bottom:.3em}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;
  padding:15px 28px;font-family:var(--fb);font-size:.97rem;font-weight:600;
  border:1.5px solid transparent;border-radius:var(--r-pill);cursor:pointer;
  transition:transform .2s ease,background .2s ease,color .2s ease,border-color .2s ease}
.btn svg{width:16px;height:16px;transition:transform .22s ease}
.btn:hover{transform:translateY(-2px)}
.btn:hover svg{transform:translate(2px,-2px)}
.btn--p{background:var(--accent);color:var(--on-accent)}
.btn--p:hover{background:var(--accent-dark);color:#fff}
.btn--g{background:transparent;color:var(--ink);border-color:var(--line)}
.btn--g:hover{border-color:var(--accent);color:var(--accent)}
.btn--l{background:#fff;color:var(--ink)}
.btn--ol{background:transparent;color:#fff;border-color:rgba(255,255,255,.42)}
.btn--ol:hover{background:#fff;color:var(--ink);border-color:#fff}
.btns{display:flex;flex-wrap:wrap;gap:13px;margin-top:30px}

/* header */
.hdr{position:sticky;top:0;z-index:70;background:color-mix(in srgb, var(--bg) 93%, transparent);
  backdrop-filter:saturate(170%) blur(13px);-webkit-backdrop-filter:saturate(170%) blur(13px);
  border-bottom:1px solid transparent;transition:box-shadow .25s ease,border-color .25s ease}
.hdr.stuck{box-shadow:var(--sh-sm);border-bottom-color:var(--line)}
.hdr .wrap{display:flex;align-items:center;gap:26px;min-height:80px}
.logo{display:flex;align-items:center;gap:11px;flex:none}
.logo i{width:42px;height:42px;display:grid;place-items:center;background:var(--accent);
  color:var(--on-accent);border-radius:var(--r-sm);font-family:var(--fd);font-weight:700;font-size:1.2rem;font-style:normal}
.logo b{font-family:var(--fd);font-weight:${t.h2Weight};font-size:1.22rem;letter-spacing:${t.h2Track};color:var(--ink);display:block;line-height:1.15}
.logo s{font-family:var(--fb);text-decoration:none;font-size:.67rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3);display:block}
.hnav{margin-left:auto;display:flex;gap:4px}
.hnav a{padding:9px 15px;border-radius:var(--r-pill);font-size:.95rem;font-weight:500;color:var(--ink);transition:all .18s ease}
.hnav a:hover{color:var(--accent);background:var(--accent-soft)}
.hcta{display:flex;align-items:center;gap:15px;flex:none;min-width:0}
.hcta__mini{display:none;padding:12px 18px;gap:7px}
.hcta__mini svg{width:16px;height:16px}
.hphone{text-align:right;line-height:1.25}
.hphone s{text-decoration:none;display:block;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}
.hphone a{font-family:var(--fd);font-weight:${t.h2Weight};font-size:1.1rem;color:var(--ink);letter-spacing:${t.h2Track}}
.hphone a:hover{color:var(--accent)}

/* hero */
.hero{position:relative;overflow:hidden;background:var(--deep)}
.hero__bg{position:absolute;inset:0;background-size:cover;background-position:center}
.hero__veil{position:absolute;inset:0}
.hero__in{position:relative;z-index:2;padding-block:clamp(80px,11vw,136px) clamp(104px,13vw,160px)}
.hero__c{max-width:${v.heroMode === "light" ? "650px" : "690px"}}
.hero h1{margin-bottom:.3em}
.hero__lede{font-size:clamp(1.02rem,1.35vw,1.15rem);max-width:50ch}
.dots{display:flex;gap:8px;margin-top:34px}
.dot{width:9px;height:9px;border-radius:50%;border:0;padding:0;cursor:pointer;transition:all .22s ease}
.dot.on{width:28px;border-radius:999px;background:var(--accent)}

/* trust strip */
.strip{position:relative;z-index:3;margin-top:clamp(-88px,-8vw,-62px)}
.strip__in{background:var(--bg);border-radius:var(--r);box-shadow:var(--sh-lg);display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden}
.strip__i{padding:26px 24px;border-right:1px solid var(--line)}
.strip__i:last-child{border-right:0}
.strip__i b{display:block;font-family:var(--fd);font-weight:${t.h2Weight};font-size:1.04rem;color:var(--ink);letter-spacing:${t.h2Track};line-height:1.35}
.strip__i span{display:block;font-size:.87rem;line-height:1.55;color:var(--ink-3);margin-top:5px}
.strip__i em{display:block;width:26px;height:3px;background:var(--accent);margin-bottom:14px;border-radius:2px}

/* split */
.split{display:grid;grid-template-columns:1fr 1fr;gap:clamp(30px,5vw,68px);align-items:center}
.split__m{position:relative}
.split__m img{width:100%;aspect-ratio:4/3.3;object-fit:cover;border-radius:var(--r)}
.split__b{position:absolute;right:-16px;bottom:-20px;background:var(--accent);color:var(--on-accent);
  padding:22px 26px;border-radius:var(--r);max-width:210px;box-shadow:var(--sh-md)}
.split__b strong{display:block;font-family:var(--fd);font-size:2.5rem;line-height:1;font-weight:700;letter-spacing:-.04em}
.split__b span{display:block;font-size:.84rem;line-height:1.45;margin-top:6px;opacity:.9}

.ticks{list-style:none;margin:0;padding:0;display:grid;gap:13px}
.ticks li{position:relative;padding-left:32px}
.ticks li::before{content:"";position:absolute;left:0;top:.3em;width:20px;height:20px;border-radius:50%;background:var(--accent-soft)}
.ticks li::after{content:"";position:absolute;left:5.5px;top:.62em;width:9px;height:4.5px;
  border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}

/* cards */
.grid{display:grid;gap:26px}
.g2{grid-template-columns:repeat(2,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g4{grid-template-columns:repeat(4,1fr)}
.card{background:var(--bg);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;
  display:flex;flex-direction:column;transition:box-shadow .26s ease,transform .26s ease}
.card:hover{box-shadow:var(--sh-lg);transform:translateY(-4px)}
.card__m{display:block;position:relative;aspect-ratio:4/3;overflow:hidden;background:var(--alt)}
.card__m picture{display:block;width:100%;height:100%}
.card__m img{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.card:hover .card__m img{transform:scale(1.05)}
.card__n{position:absolute;left:14px;top:14px;background:var(--bg);color:var(--accent);
  font-family:var(--fd);font-weight:700;font-size:.82rem;padding:5px 12px;border-radius:var(--r-pill)}
.card__b{padding:24px 24px 28px;flex:1;display:flex;flex-direction:column}
.card__b p{font-size:.95rem}
.tags{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0 0;list-style:none;padding:0}
.tags li{padding:5px 13px;background:var(--alt);border:1px solid var(--line);border-radius:var(--r-pill);
  font-size:.8rem;color:var(--ink-2);white-space:nowrap}
.more{display:inline-flex;align-items:center;gap:7px;margin-top:auto;padding-top:18px;
  font-weight:600;font-size:.93rem;color:var(--accent)}
.more svg{width:15px;height:15px;transition:transform .22s ease}
.card:hover .more svg{transform:translate(3px,-3px)}

/* before/after */
.ba{position:relative;overflow:hidden;user-select:none;aspect-ratio:4/3;background:var(--alt);
  border-radius:var(--r);cursor:ew-resize;touch-action:pan-y}
.ba img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none}
.ba__a{clip-path:inset(0 0 0 50%)}
.ba__h{position:absolute;top:0;bottom:0;left:50%;width:2px;background:#fff;transform:translateX(-50%);pointer-events:none}
.ba__g{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;
  background:#fff;box-shadow:var(--sh-md);display:grid;place-items:center;color:var(--ink)}
.ba__g svg{width:21px;height:21px}
.ba__t{position:absolute;top:14px;z-index:3;font-family:var(--fb);font-size:.73rem;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;padding:5px 13px;border-radius:var(--r-pill);pointer-events:none}
.ba__t--b{left:14px;background:rgba(255,255,255,.94);color:#111}
.ba__t--a{right:14px;background:var(--accent);color:var(--on-accent)}

/* gallery */
.gal{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:clamp(195px,19vw,275px);gap:16px}
.gal a{position:relative;overflow:hidden;border-radius:var(--r);background:var(--alt)}
.gal picture{display:block;width:100%;height:100%}
.gal img{width:100%;height:100%;object-fit:cover;transition:transform .6s ease}
.gal a:hover img{transform:scale(1.06)}
.gal span{position:absolute;inset:auto 0 0 0;padding:40px 18px 16px;
  background:linear-gradient(to top,rgba(10,10,10,.8),transparent);color:#fff;
  font-family:var(--fd);font-weight:${t.h2Weight};font-size:.98rem;letter-spacing:${t.h2Track};
  opacity:0;transform:translateY(8px);transition:opacity .26s ease,transform .26s ease}
.gal a:hover span{opacity:1;transform:none}

/* panel (process) */
.panel{background:var(--deep);color:rgba(255,255,255,.72);border-radius:var(--r-lg);
  padding:clamp(44px,6vw,84px) clamp(26px,5vw,68px)}
.panel h2,.panel h3{color:#fff}
.panel .lede{color:rgba(255,255,255,.66)}
.panel .eyebrow{color:var(--accent)}
.step h3{font-size:1.18rem;margin-bottom:.45em}
.step em{display:grid;place-items:center;width:50px;height:50px;border-radius:50%;
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#fff;
  font-family:var(--fd);font-weight:700;font-size:1rem;font-style:normal;margin-bottom:20px;transition:background .25s ease}
.step:hover em{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.step p{font-size:.94rem}

/* stats */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:26px;text-align:center}
.stat b{display:block;font-family:var(--fd);font-size:clamp(2.2rem,4.2vw,3.2rem);font-weight:700;
  line-height:1;letter-spacing:-.04em;color:var(--accent)}
.stat span{display:block;font-size:.9rem;color:var(--ink-3);margin-top:9px}

/* quotes */
.q{background:var(--bg);border:1px solid var(--line);border-radius:var(--r);padding:30px 28px 26px;
  height:100%;display:flex;flex-direction:column}
.q__s{display:flex;align-items:center;gap:3px;color:var(--accent);margin-bottom:15px}
.q__s svg{width:16px;height:16px}
.q__s b{margin-left:7px;font-size:.9rem;color:var(--ink);font-family:var(--fb)}
.q blockquote{margin:0;flex:1;font-size:.99rem;color:var(--ink-2)}
.q footer{margin-top:20px;padding-top:17px;border-top:1px solid var(--line)}
.q footer b{display:block;font-family:var(--fd);font-weight:${t.h2Weight};font-size:1.04rem;color:var(--ink);letter-spacing:${t.h2Track}}
.q footer span{font-size:.86rem;color:var(--ink-3)}

/* areas */
.areas{display:flex;flex-wrap:wrap;gap:9px;list-style:none;margin:0;padding:0;justify-content:center}
.areas li{padding:8px 18px;background:var(--bg);border:1px solid var(--line);border-radius:var(--r-pill);font-size:.9rem}

/* cta */
.cta{position:relative;overflow:hidden;border-radius:var(--r-lg);background:var(--deep);color:#fff}
.cta__bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.26}
.cta::after{content:"";position:absolute;inset:0;z-index:1;
  background:linear-gradient(92deg,color-mix(in srgb,var(--deep) 94%,transparent) 0%,color-mix(in srgb,var(--deep) 80%,transparent) 50%,color-mix(in srgb,var(--deep) 55%,transparent) 100%)}
.cta__in{position:relative;z-index:2;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;
  gap:28px;padding:clamp(44px,6vw,76px) clamp(26px,5vw,68px)}
.cta h2{color:#fff;margin-bottom:.3em}
.cta p{color:rgba(255,255,255,.76);max-width:46ch;margin:0}

/* footer */
.ftr{background:var(--deep);color:rgba(255,255,255,.6);padding-top:clamp(54px,7vw,84px);font-size:.94rem}
.ftr h4{color:#fff;font-family:var(--fd);font-size:1.04rem;margin-bottom:1.1em;letter-spacing:${t.h2Track}}
.ftr a:hover{color:var(--accent)}
.ftr .logo b{color:#fff}
.ftr .logo s{color:rgba(255,255,255,.45)}
.fgrid{display:grid;grid-template-columns:1.7fr 1fr 1fr 1.3fr;gap:40px;padding-bottom:50px}
.flist{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.fbot{border-top:1px solid rgba(255,255,255,.1);padding:22px 0;display:flex;flex-wrap:wrap;gap:12px;
  justify-content:space-between;font-size:.86rem;color:rgba(255,255,255,.42)}

.reveal{opacity:0;transform:translateY(20px);transition:opacity .65s ease,transform .65s ease}
.reveal.in{opacity:1;transform:none}

@media(max-width:1060px){
  .fgrid{grid-template-columns:1fr 1fr;gap:34px}
  .g4{grid-template-columns:repeat(2,1fr)}
  .strip__in{grid-template-columns:repeat(2,1fr)}
  .strip__i:nth-child(2){border-right:0}
  .strip__i:nth-child(-n+2){border-bottom:1px solid var(--line)}
}
@media(max-width:900px){
  .hnav,.hphone,.hcta__full{display:none}
  .hcta__mini{display:inline-flex}
  .hdr .wrap{min-height:68px;gap:14px}
  .logo i{width:38px;height:38px;font-size:1.08rem}
  .logo b{font-size:1.06rem}
  .split{grid-template-columns:1fr}
  .g3{grid-template-columns:repeat(2,1fr)}
  .gal{grid-template-columns:repeat(2,1fr)}
  .stats{grid-template-columns:repeat(2,1fr);gap:32px}
}
@media(max-width:640px){
  :root{--gut:16px}
  .logo b{font-size:.96rem;max-width:40vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .logo s{font-size:.6rem}
  .g2,.g3,.g4{grid-template-columns:1fr}
  .gal{grid-template-columns:1fr;grid-auto-rows:225px}
  .fgrid{grid-template-columns:1fr}
  .strip__in{grid-template-columns:1fr}
  .strip__i{border-right:0 !important;border-bottom:1px solid var(--line)}
  .strip__i:last-child{border-bottom:0}
  .strip{margin-top:-44px}
  .split__b{position:static;margin-top:16px;max-width:none}
  .cta__in{flex-direction:column;align-items:flex-start}
  .hero__in{padding-block:clamp(56px,13vw,84px) clamp(76px,16vw,110px)}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
  .reveal{opacity:1;transform:none}
}`;
}

/* ---------- hero veil: readable on phones without erasing the photo ---------- */
function heroVeil(v) {
  if (v.heroMode === "light") {
    // cream scrim that stays side-to-side on desktop and keeps the photo visible on phones
    return `
.hero{background:${v.tokens.alt}}
.hero h1,.hero .eyebrow{color:var(--ink)}
.hero h1 em{color:var(--accent)}
.hero__lede{color:var(--ink-2)}
.hero .dot{background:rgba(0,0,0,.18)}
.hero__veil{background:linear-gradient(96deg,
  color-mix(in srgb, ${v.tokens.alt} 96%, transparent) 0%,
  color-mix(in srgb, ${v.tokens.alt} 92%, transparent) 34%,
  color-mix(in srgb, ${v.tokens.alt} 62%, transparent) 56%,
  color-mix(in srgb, ${v.tokens.alt} 12%, transparent) 78%,
  transparent 92%)}
@media(max-width:900px){
  .hero__veil{background:linear-gradient(174deg,
    color-mix(in srgb, ${v.tokens.alt} 93%, transparent) 0%,
    color-mix(in srgb, ${v.tokens.alt} 80%, transparent) 42%,
    color-mix(in srgb, ${v.tokens.alt} 42%, transparent) 72%,
    color-mix(in srgb, ${v.tokens.alt} 16%, transparent) 100%)}
}`;
  }
  return `
.hero h1,.hero .eyebrow{color:#fff}
.hero h1 em{color:var(--accent)}
.hero__lede{color:rgba(255,255,255,.78)}
.hero .dot{background:rgba(255,255,255,.3)}
.hero__veil{background:linear-gradient(96deg,
  color-mix(in srgb, var(--deep) 90%, transparent) 0%,
  color-mix(in srgb, var(--deep) 76%, transparent) 42%,
  color-mix(in srgb, var(--deep) 34%, transparent) 76%,
  color-mix(in srgb, var(--deep) 12%, transparent) 100%)}
@media(max-width:900px){
  .hero__veil{background:linear-gradient(176deg,
    color-mix(in srgb, var(--deep) 82%, transparent) 0%,
    color-mix(in srgb, var(--deep) 66%, transparent) 46%,
    color-mix(in srgb, var(--deep) 40%, transparent) 100%)}
}`;
}

/* ---------- page ---------- */
function page(v, others) {
  const c = v.copy, t = v.tokens;
  const heroBg = n =>
    `image-set(url('assets/img/hero/hero-${n}.webp') type('image/webp'), url('assets/img/hero/hero-${n}.jpg') type('image/jpeg'))`;

  const switcher = `
<div class="vswitch">
  <span>Version</span>
  ${["a","b","c"].map(id => {
    const o = others[id];
    const href = id === "a" ? "index.html" : id + ".html";
    return `<a href="${href}"${id === v.id ? ' class="on" aria-current="page"' : ""}>${id.toUpperCase()} · ${esc(o.name)}</a>`;
  }).join("")}
</div>`;

  const switcherCss = `
.vswitch{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(14px + env(safe-area-inset-bottom,0px));
  z-index:200;display:flex;align-items:center;gap:5px;padding:6px 8px;background:#15171A;
  border-radius:999px;box-shadow:0 8px 28px rgba(0,0,0,.3);font-family:system-ui,sans-serif;max-width:calc(100vw - 24px);overflow-x:auto}
.vswitch span{font-size:.64rem;letter-spacing:.14em;text-transform:uppercase;color:#8A8F98;padding:0 7px;white-space:nowrap}
.vswitch a{font-size:.74rem;font-weight:600;color:#D4D8DF;padding:7px 13px;border-radius:999px;white-space:nowrap}
.vswitch a.on{background:#fff;color:#15171A}
@media(max-width:560px){.vswitch span{display:none}.vswitch a{font-size:.7rem;padding:7px 10px}}`;

  const services = content.services.map((s, i) => `
        <article class="card reveal" style="transition-delay:${i * 90}ms">
          <a class="card__m" href="#"><span class="card__n">0${i + 1}</span>${pic(s.img, s.name)}</a>
          <div class="card__b">
            <h3>${esc(s.name)}</h3>
            <p>${esc(s.blurb)}</p>
            <ul class="tags">${(s.tags || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
            <span class="more">Explore service ${icon.arrow}</span>
          </div>
        </article>`).join("");

  const steps = content.process.map((p, i) => `
          <div class="step reveal" style="transition-delay:${i * 80}ms">
            <em>${p.n}</em><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>
          </div>`).join("");

  const quotes = content.testimonials.slice(0, 3).map((q, i) => `
        <figure class="q reveal" style="transition-delay:${i * 80}ms">
          <div class="q__s">${icon.star.repeat(5)}<b>5.0</b></div>
          <blockquote>${esc(q.text)}</blockquote>
          <footer><b>${esc(q.name)}</b><span>${esc(q.project)}</span></footer>
        </figure>`).join("");

  const ba = BA.map(([label, title, desc], i) => `
        <div class="reveal" style="transition-delay:${i * 100}ms">
          <div class="ba" role="slider" tabindex="0" aria-label="${esc(title)} before and after"
               aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
            <img src="assets/img/ba/${label}-before-sm.jpg" alt="${esc(title)} before" loading="lazy" decoding="async">
            <img class="ba__a" src="assets/img/ba/${label}-after-sm.jpg" alt="${esc(title)} after" loading="lazy" decoding="async">
            <span class="ba__t ba__t--b">Before</span><span class="ba__t ba__t--a">After</span>
            <span class="ba__h"><span class="ba__g">${icon.split}</span></span>
          </div>
          <h3 style="margin-top:22px">${esc(title)}</h3><p>${esc(desc)}</p>
        </div>`).join("");

  const gallery = GALLERY.map(([img, cap]) => `
          <a href="#">${pic(img, cap)}<span>${esc(cap)}</span></a>`).join("");

  const trust = c.trust.map(([b, s]) => `
        <div class="strip__i"><em></em><b>${b}</b><span>${s}</span></div>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(biz.name)} — ${esc(v.name)} (Version ${v.id.toUpperCase()})</title>
<meta name="description" content="${esc(biz.tagline)} in ${esc(biz.city)}, ${esc(biz.state)}.">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${t.deep}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${v.fontsHref}" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='${encodeURIComponent(t.accent)}'/><text x='50' y='72' font-family='Helvetica' font-size='62' font-weight='700' fill='white' text-anchor='middle'>S</text></svg>">
<style>${css(v)}${heroVeil(v)}${switcherCss}</style>
</head>
<body>

<header class="hdr">
  <div class="wrap">
    <a class="logo" href="index.html"><i>S</i><span><b>${esc(biz.name)}</b><s>${esc(biz.city)}, ${esc(biz.state)}</s></span></a>
    <nav class="hnav"><a href="#">Home</a><a href="#">About</a><a href="#">Services</a><a href="#">Projects</a><a href="#">Contact</a></nav>
    <div class="hcta">
      <span class="hphone"><s>Free estimate</s><a href="tel:${biz.phoneRaw}">${esc(biz.phone)}</a></span>
      <a class="btn btn--p hcta__full" href="#contact">${c.cta1}</a>
      <a class="btn btn--p hcta__mini" href="tel:${biz.phoneRaw}" aria-label="Call ${esc(biz.phone)}">${icon.phone}<span>Call</span></a>
    </div>
  </div>
</header>

<main>
<section class="hero">
  <div aria-hidden="true">
    <div class="hero__bg on" style="background-image:${heroBg(1)}"></div>
    <div class="hero__bg" data-bg="${heroBg(2)}" style="opacity:0"></div>
    <div class="hero__bg" data-bg="${heroBg(3)}" style="opacity:0"></div>
    <div class="hero__bg" data-bg="${heroBg(4)}" style="opacity:0"></div>
    <div class="hero__veil"></div>
  </div>
  <div class="wrap hero__in">
    <div class="hero__c">
      <span class="eyebrow">${c.eyebrow}</span>
      <h1>${c.h1}</h1>
      <p class="hero__lede">${esc(c.lede)}</p>
      <div class="btns">
        <a class="btn btn--p" href="#contact">${c.cta1} ${icon.arrow}</a>
        <a class="btn ${v.heroMode === "light" ? "btn--g" : "btn--ol"}" href="#work">${c.cta2}</a>
      </div>
      <div class="dots" role="tablist" aria-label="Hero images">
        ${[0,1,2,3].map(i => `<button class="dot${i===0?" on":""}" role="tab" aria-selected="${i===0}" aria-label="Image ${i+1}"></button>`).join("")}
      </div>
    </div>
  </div>
</section>

<div class="wrap strip"><div class="strip__in">${trust}</div></div>

<section class="section">
  <div class="wrap">
    <div class="split">
      <div class="split__m reveal">${pic("process/process-3", "Crew on a Houston job site", "(max-width:900px) 100vw, 50vw")}
        <div class="split__b"><strong>${biz.yearsInBusiness}</strong><span>Years remodeling ${esc(biz.city)} homes</span></div>
      </div>
      <div class="reveal">
        <span class="eyebrow">${c.aboutEyebrow}</span>
        <h2>${c.aboutH}</h2>
        <p class="lede">${esc(c.aboutLede)}</p>
        <p>${esc(c.aboutP)}</p>
        <ul class="ticks">${c.ticks.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="btns"><a class="btn btn--p" href="#">${c.aboutCta} ${icon.arrow}</a></div>
      </div>
    </div>
  </div>
</section>

<section class="section section--alt">
  <div class="wrap">
    <div class="head head--c">
      <span class="eyebrow">${c.servicesEyebrow}</span>
      <h2>${c.servicesH}</h2>
      <p class="lede" style="margin-inline:auto">${esc(c.servicesLede)}</p>
    </div>
    <div class="grid g3">${services}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="head head--c">
      <span class="eyebrow">${c.baEyebrow}</span>
      <h2>${c.baH}</h2>
      <p class="lede" style="margin-inline:auto">${esc(c.baLede)}</p>
    </div>
    <div class="grid g2">${ba}</div>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap"><div class="panel">
    <div class="head">
      <span class="eyebrow">${c.processEyebrow}</span>
      <h2>${c.processH}</h2>
      <p class="lede">${esc(c.processLede)}</p>
    </div>
    <div class="grid g4">${steps}</div>
  </div></div>
</section>

<section class="section section--tight">
  <div class="wrap"><div class="stats">
    <div class="stat"><b data-c="${biz.yearsInBusiness}">${biz.yearsInBusiness}</b><span>Years in business</span></div>
    <div class="stat"><b data-c="${biz.projectsCompleted}" data-s="+">${biz.projectsCompleted}+</b><span>Projects completed</span></div>
    <div class="stat"><b data-c="${biz.reviewAverage}">${biz.reviewAverage}</b><span>Average review score</span></div>
    <div class="stat"><b data-c="${biz.warrantyYears}" data-s=" yr">${biz.warrantyYears} yr</b><span>Workmanship warranty</span></div>
  </div></div>
</section>

<section class="section section--alt" id="work">
  <div class="wrap">
    <div class="head head--c"><span class="eyebrow">${c.galleryEyebrow}</span><h2>${c.galleryH}</h2></div>
    <div class="gal">${gallery}</div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="head head--c">
      <span class="eyebrow">${c.quotesEyebrow}</span>
      <h2>${biz.reviewAverage} from ${biz.reviewCount} reviews</h2>
    </div>
    <div class="grid g3">${quotes}</div>
  </div>
</section>

<section class="section section--tight">
  <div class="wrap">
    <div class="head head--c"><span class="eyebrow">${c.areasEyebrow}</span><h2>${c.areasH}</h2></div>
    <ul class="areas">${biz.serviceAreas.map(a => `<li>${esc(a)}</li>`).join("")}</ul>
  </div>
</section>

<section class="section section--tight" id="contact">
  <div class="wrap"><div class="cta">
    <div class="cta__bg" style="background-image:${heroBg(3)}"></div>
    <div class="cta__in">
      <div><h2>${c.ctaH}</h2><p>${esc(c.ctaP)}</p></div>
      <div class="btns" style="margin:0">
        <a class="btn btn--l" href="#">${c.ctaBtn} ${icon.arrow}</a>
        <a class="btn btn--ol" href="tel:${biz.phoneRaw}">${esc(biz.phone)}</a>
      </div>
    </div>
  </div></div>
</section>
</main>

<footer class="ftr">
  <div class="wrap">
    <div class="fgrid">
      <div>
        <a class="logo" href="index.html" style="margin-bottom:18px"><i>S</i><span><b>${esc(biz.name)}</b><s>${esc(biz.city)}, ${esc(biz.state)}</s></span></a>
        <p>${esc(biz.licenseLine)} serving ${esc(biz.city)} since ${biz.foundedYear}. Kitchens, bathrooms and whole-home renovations, warrantied in writing.</p>
      </div>
      <div><h4>Services</h4><ul class="flist">${content.services.map(s => `<li><a href="#">${esc(s.name)}</a></li>`).join("")}<li><a href="#">Our Projects</a></li></ul></div>
      <div><h4>Company</h4><ul class="flist"><li><a href="#">About Us</a></li><li><a href="#">All Services</a></li><li><a href="#">Free Estimate</a></li><li><a href="#">FAQs</a></li></ul></div>
      <div><h4>Get In Touch</h4><ul class="flist">
        <li><a href="tel:${biz.phoneRaw}">${esc(biz.phone)}</a></li>
        <li><a href="mailto:${biz.email}">${esc(biz.email)}</a></li>
        <li>${esc(biz.street)}<br>${esc(biz.city)}, ${esc(biz.state)} ${biz.zip}</li>
        <li>${esc(biz.hours)}</li></ul></div>
    </div>
    <div class="fbot"><span>&copy; 2026 ${esc(biz.name)}. All rights reserved.</span><span>${esc(biz.licenseLine)}</span></div>
  </div>
</footer>

${switcher}

<script>
(function(){
  "use strict";
  var hdr=document.querySelector(".hdr");
  var onScroll=function(){hdr.classList.toggle("stuck",window.scrollY>8)};
  onScroll();window.addEventListener("scroll",onScroll,{passive:true});

  // hero slideshow: first frame paints immediately, the rest load after window load
  var slides=[].slice.call(document.querySelectorAll(".hero__bg"));
  var dots=[].slice.call(document.querySelectorAll(".dot"));
  slides.forEach(function(s){s.style.transition="opacity 1.1s ease"});
  function fill(){slides.forEach(function(s){if(s.dataset.bg){s.style.backgroundImage=s.dataset.bg;delete s.dataset.bg}})}
  if(document.readyState==="complete")fill();else window.addEventListener("load",fill);
  var i=0,timer=null;
  function show(n){i=(n+slides.length)%slides.length;
    slides.forEach(function(s,x){s.style.opacity=x===i?"1":"0"});
    dots.forEach(function(d,x){d.classList.toggle("on",x===i);d.setAttribute("aria-selected",String(x===i))})}
  function start(){timer=setInterval(function(){show(i+1)},6000)}
  dots.forEach(function(d,x){d.addEventListener("click",function(){clearInterval(timer);show(x);start()})});
  if(slides.length>1){show(0);start()}

  document.querySelectorAll(".ba").forEach(function(box){
    var after=box.querySelector(".ba__a"),handle=box.querySelector(".ba__h"),drag=false;
    function set(x){var r=box.getBoundingClientRect();var p=Math.max(0,Math.min(100,((x-r.left)/r.width)*100));
      after.style.clipPath="inset(0 0 0 "+p+"%)";handle.style.left=p+"%";box.setAttribute("aria-valuenow",Math.round(p))}
    box.addEventListener("pointerdown",function(e){drag=true;box.setPointerCapture(e.pointerId);set(e.clientX)});
    box.addEventListener("pointermove",function(e){if(drag)set(e.clientX)});
    ["pointerup","pointercancel"].forEach(function(ev){box.addEventListener(ev,function(){drag=false})});
    box.addEventListener("keydown",function(e){
      var cur=parseFloat(box.getAttribute("aria-valuenow")||"50");
      if(e.key==="ArrowLeft")cur-=4;else if(e.key==="ArrowRight")cur+=4;else return;
      e.preventDefault();cur=Math.max(0,Math.min(100,cur));
      after.style.clipPath="inset(0 0 0 "+cur+"%)";handle.style.left=cur+"%";box.setAttribute("aria-valuenow",Math.round(cur))});
  });

  function count(el){var t=parseFloat(el.dataset.c),sfx=el.dataset.s||"",
    dec=(el.dataset.c.split(".")[1]||"").length,st=null;
    function f(ts){if(!st)st=ts;var p=Math.min((ts-st)/1300,1),e=1-Math.pow(1-p,3);
      el.textContent=(t*e).toFixed(dec)+sfx;if(p<1)requestAnimationFrame(f)}
    requestAnimationFrame(f)}
  var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rev=document.querySelectorAll(".reveal"),nums=document.querySelectorAll("[data-c]");
  if(reduced||!("IntersectionObserver" in window)){
    rev.forEach(function(e){e.classList.add("in")});
    nums.forEach(function(e){e.textContent=e.dataset.c+(e.dataset.s||"")});
  }else{
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;
      var e=en.target;if(e.classList.contains("reveal"))e.classList.add("in");
      if(e.dataset.c)count(e);io.unobserve(e)})},{threshold:.12,rootMargin:"0px 0px -30px"});
    rev.forEach(function(e){io.observe(e)});nums.forEach(function(e){io.observe(e)});
  }
})();
</script>
</body>
</html>`;
}

/* ---------- emit ---------- */
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, e.name), d = path.join(to, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const id of ["a", "b", "c"]) {
  const file = id === "a" ? "index.html" : id + ".html";
  fs.writeFileSync(path.join(OUT, file), page(variants[id], variants));
  console.log("  " + file.padEnd(12) + variants[id].name);
}
copyDir(path.join(ROOT, "assets"), path.join(OUT, "assets"));
fs.writeFileSync(path.join(OUT, "robots.txt"), "User-agent: *\nDisallow: /\n");
console.log("Built 3 variants -> variants-dist/");
