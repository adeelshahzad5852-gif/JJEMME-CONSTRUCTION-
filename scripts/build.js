#!/usr/bin/env node
/* Build: business.json + content.json + src/ templates -> dist/ static HTML.
   Text is baked into the HTML at build time, so it is visible to search engines. */

const fs   = require("fs");
const path = require("path");

const ROOT   = path.resolve(__dirname, "..");
const SRC    = path.join(ROOT, "src");
const DIST   = path.join(ROOT, "dist");
const ASSETS = path.join(ROOT, "assets");

const biz     = JSON.parse(fs.readFileSync(path.join(ROOT, "business.json"), "utf8"));
const content = JSON.parse(fs.readFileSync(path.join(ROOT, "content.json"), "utf8"));

/* ---------- helpers -------------------------------------------------------- */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SIZES = "(max-width: 680px) 100vw, (max-width: 960px) 50vw, 33vw";

const pic = (name, alt, cls = "", loading = "lazy", sizes = SIZES) =>
  `<picture>
      <source type="image/webp" sizes="${sizes}"
        srcset="assets/img/${name}-sm.webp 800w, assets/img/${name}.webp 1600w">
      <source type="image/jpeg" sizes="${sizes}"
        srcset="assets/img/${name}-sm.jpg 800w, assets/img/${name}.jpg 1600w">
      <img src="assets/img/${name}-sm.jpg" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ""} loading="${loading}" decoding="async">
    </picture>`;

const icon = {
  phone:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>`,
  mail:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
  pin:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  check:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  star:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`,
  arrow:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  split:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 7-5 5 5 5M15 7l5 5-5 5"/></svg>`,
  arrowNE:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>`,
  doc:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>`,
  badge:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-2.5 5 2.5-1.5-7"/></svg>`,
};

/* ---------- component builders --------------------------------------------- */
const NAV = [
  { label: "Home",     href: "index.html" },
  { label: "About",    href: "about.html" },
  { label: "Services", href: "services.html",
    sub: content.services.map((s) => ({ label: s.name, href: s.slug + ".html" })) },
  { label: "Projects", href: "projects.html" },
  { label: "Contact",  href: "contact.html" },
];

function navHtml(current) {
  const items = NAV.map((item) => {
    const active = item.href === current ||
      (item.sub && item.sub.some((s) => s.href === current));
    const sub = item.sub
      ? `<ul class="nav__sub">${item.sub.map((s) =>
          `<li><a href="${s.href}">${esc(s.label)}</a></li>`).join("")}</ul>`
      : "";
    return `<li class="nav__item${item.sub ? " nav__item--has-sub" : ""}${active ? " is-active" : ""}">
          <a class="nav__link" href="${item.href}">${esc(item.label)}</a>${sub}
        </li>`;
  }).join("\n        ");
  return `<ul class="nav__list">\n        ${items}\n      </ul>`;
}

function serviceCards() {
  return content.services.map((s, i) => `
      <article class="card reveal" style="transition-delay:${i * 90}ms">
        <a class="card__media" href="${s.slug}.html" aria-label="${esc(s.name)}">
          ${pic(s.img, s.name + " project by " + biz.name)}
          <span class="card__index">${String(i + 1).padStart(2, "0")}</span>
        </a>
        <div class="card__body">
          <h3 class="card__title"><a href="${s.slug}.html">${esc(s.name)}</a></h3>
          <p>${esc(s.blurb)}</p>
          <ul class="tags">${(s.tags || s.points.slice(0, 2)).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <a class="card__more" href="${s.slug}.html">Explore service ${icon.arrowNE}</a>
        </div>
      </article>`).join("\n");
}

function processSteps() {
  return content.process.map((p, i) => `
      <div class="step reveal" style="transition-delay:${i * 80}ms">
        <span class="step__n">${p.n}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
      </div>`).join("\n");
}

function testimonialGrid() {
  // Real reviews are rarely the same length. One long one beside three
  // four-word ones leaves two cards looking empty, so lead with the detailed
  // review and run the short ones underneath, sized to their own content.
  const t = content.testimonials;
  if (!t.length) return "";
  if (t.length === 1) return `<div class="quotes quotes--solo">\n${card(t[0], 0, true)}\n    </div>`;

  const sorted = [...t].sort((a, b) => b.text.length - a.text.length);
  const [lead, ...rest] = sorted;
  const short = rest.every((r) => r.text.length < 120);
  if (!short) return `<div class="quotes quotes--${Math.min(t.length, 3)}">\n${sorted.map((q, i) => card(q, i)).join("\n")}\n    </div>`;

  return `<div class="quotes quotes--lead">\n${card(lead, 0, true)}\n    </div>
    <div class="quotes quotes--${Math.min(rest.length, 3)}" style="margin-top:20px">\n${rest.map((q, i) => card(q, i + 1)).join("\n")}\n    </div>`;
}

function card(t, i, featured) {
  const stars = icon.star.repeat(5);
  return `      <figure class="quote reveal${featured ? " quote--featured" : ""}" style="transition-delay:${i * 80}ms">
        <div class="quote__stars" aria-label="5 out of 5 stars">${stars}<span class="quote__score">5.0</span></div>
        <blockquote class="quote__text">${esc(t.text)}</blockquote>
        <figcaption class="quote__who">
          <span class="quote__name">${esc(t.name)}</span>
          <span class="quote__project">${esc(t.project)}</span>
        </figcaption>
      </figure>`;
}

function testimonialCards(limit) {
  const stars = icon.star.repeat(5);
  return content.testimonials.slice(0, limit || content.testimonials.length).map((t, i) => `
      <figure class="quote reveal" style="transition-delay:${i * 80}ms">
        <div class="quote__stars" aria-label="5 out of 5 stars">${stars}<span class="quote__score">5.0</span></div>
        <blockquote class="quote__text">${esc(t.text)}</blockquote>
        <figcaption class="quote__who">
          <span class="quote__name">${esc(t.name)}</span>
          <span class="quote__project">${esc(t.project)}</span>
        </figcaption>
      </figure>`).join("\n");
}

function faqList() {
  return content.faqs.map((f, i) => `
      <div class="faq__item">
        <button class="faq__q" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
          <span>${esc(f.q)}</span><span class="faq__icon" aria-hidden="true"></span>
        </button>
        <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
          <div><p>${esc(f.a)}</p></div>
        </div>
      </div>`).join("\n");
}

function beforeAfter(label, caption) {
  return `<div class="ba" role="slider" tabindex="0"
          aria-label="${esc(caption)} — drag to compare before and after"
          aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
        <img src="assets/img/ba/${label}-before-sm.jpg" alt="${esc(caption)} before the remodel" loading="lazy" decoding="async">
        <img class="ba__after" src="assets/img/ba/${label}-after-sm.jpg" alt="${esc(caption)} after the remodel" loading="lazy" decoding="async">
        <span class="ba__tag ba__tag--before">Before</span>
        <span class="ba__tag ba__tag--after">After</span>
        <span class="ba__handle"><span class="ba__grip">${icon.split}</span></span>
      </div>`;
}

function galleryItems(list) {
  return list.map((g) => `
        <a class="gallery__item${g.mod ? " gallery__item--" + g.mod : ""}" href="assets/img/${g.img}.jpg">
          ${pic(g.img, g.caption)}
          <span class="gallery__cap">${esc(g.caption)}</span>
        </a>`).join("\n");
}

function areaList() {
  return biz.serviceAreas.map((a) => `<li>${esc(a)}</li>`).join("\n          ");
}

function serviceOptions() {
  return content.services.map((s) =>
    `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("\n              ");
}


/* ---------- curated image sets ------------------------------------------------ */
const GALLERY_HOME = [
  { img: "home/home-5",     caption: "Open-concept conversion" },
  { img: "kitchen/kitchen-6", caption: "Full kitchen renovation" },
  { img: "bath/bath-14",   caption: "Primary bathroom remodel" },
  { img: "kitchen/kitchen-9", caption: "Island addition" },
  { img: "home/home-6",    caption: "Living room renovation" },
  { img: "bath/bath-2",     caption: "Walk-in shower conversion" },
];

const GALLERY_ALL = [
  { img: "kitchen/kitchen-6", caption: "Kitchen — full renovation"},
  { img: "bath/bath-5",    caption: "Bathroom — primary suite" },
  { img: "home/home-5",     caption: "Whole home — open concept" },
  { img: "kitchen/kitchen-1",  caption: "Kitchen — galley remodel" },
  { img: "bath/bath-8",    caption: "Bathroom — guest bath" },
  { img: "home/home-4",     caption: "Whole home — great room" },
  { img: "kitchen/kitchen-9", caption: "Kitchen — island addition"},
  { img: "bath/bath-9",    caption: "Bathroom — tub and tile" },
  { img: "home/home-7",    caption: "Whole home — living space" },
  { img: "kitchen/kitchen-11", caption: "Kitchen — open plan" },
  { img: "bath/bath-11",    caption: "Bathroom — subway tile" },
  { img: "home/home-8",    caption: "Whole home — flooring throughout" },
  { img: "kitchen/kitchen-7", caption: "Kitchen — custom cabinetry" },
  { img: "bath/bath-14",    caption: "Bathroom — double vanity" },
  { img: "home/home-11",    caption: "Whole home — great room" },
];

const GALLERY_KITCHEN = [
  { img: "kitchen/kitchen-6", caption: "Open-plan kitchen"},
  { img: "kitchen/kitchen-9", caption: "Island addition" },
  { img: "kitchen/kitchen-7", caption: "Custom cabinetry" },
  { img: "kitchen/kitchen-8",  caption: "Quartz countertops" },
  { img: "kitchen/kitchen-11", caption: "Full gut renovation" },
  { img: "kitchen/kitchen-1",  caption: "Galley remodel" },
];

const GALLERY_BATH = [
  { img: "bath/bath-5",  caption: "Primary bathroom"},
  { img: "bath/bath-2",   caption: "Walk-in shower" },
  { img: "bath/bath-8",  caption: "Guest bathroom" },
  { img: "bath/bath-9",  caption: "Tub and tile" },
  { img: "bath/bath-11",  caption: "Subway tile bath" },
  { img: "bath/bath-4",  caption: "Freestanding tub" },
];

const GALLERY_WHOLE = [
  { img: "home/home-5",  caption: "Open-concept conversion"},
  { img: "home/home-6", caption: "Living room renovation" },
  { img: "home/home-4",  caption: "Great room and dining" },
  { img: "home/home-7", caption: "Full main floor" },
  { img: "home/home-8", caption: "Flooring throughout" },
  { img: "home/home-11", caption: "Whole-home gut renovation" },
];

/* a hero background: WebP where supported, JPEG everywhere else */
const heroBg = (n) =>
  `image-set(url('assets/img/hero/${n}.webp') type('image/webp'), url('assets/img/hero/${n}.jpg') type('image/jpeg'))`;

/* ---------- JSON-LD --------------------------------------------------------- */
function jsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name: biz.name,
    description: `${biz.tagline} in ${biz.city}, ${biz.state}.`,
    telephone: biz.phone,
    email: biz.email,
    url: `https://${biz.domain}/`,
    // a mobile contractor has no shop address: omit the keys rather than
    // publishing empty strings, which Google flags as incomplete markup
    address: Object.assign(
      { "@type": "PostalAddress", addressLocality: biz.city,
        addressRegion: biz.state, addressCountry: "US" },
      biz.street ? { streetAddress: biz.street } : {},
      biz.zip ? { postalCode: biz.zip } : {}),
    areaServed: biz.serviceAreas.map((a) => ({ "@type": "City", name: a })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: biz.reviewAverage,
      reviewCount: biz.reviewCount,
    },
    makesOffer: content.services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name, description: s.blurb },
    })),
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function faqLd() {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  })}</script>`;
}

/* ---------- token table ------------------------------------------------------ */
function tokens(page) {
  const t = {
    nav:               navHtml(page.file),
    service_cards:     serviceCards(),
    process_steps:     processSteps(),
    testimonials:      testimonialCards(),
    testimonials_3:    testimonialCards(3),
    testimonials_all:  testimonialGrid(),
    address_block:     biz.street
      ? `${esc(biz.street)}<br>${esc(biz.city)}, ${esc(biz.state)} ${esc(biz.zip)}`
      : `${esc(biz.city)}, ${esc(biz.state)}<br>and the surrounding valley`,
    faqs:              faqList(),
    areas:             areaList(),
    service_options:   serviceOptions(),
    json_ld:           jsonLd() + (page.faqLd ? faqLd() : ""),
    year:              String(new Date().getFullYear()),
    icon_arrow_ne:     icon.arrowNE,
    icon_shield:       icon.shield,
    icon_doc:          icon.doc,
    icon_badge:        icon.badge,
    icon_star:         icon.star,
    page_title:        page.title,
    page_desc:         page.desc,
    robots:            biz.noindex ? `<meta name="robots" content="noindex, nofollow">` : "",
    canonical:         biz.noindex ? "" : `<link rel="canonical" href="https://${biz.domain}/${page.file}">`,
    nav_services:      content.services.map((s) =>
                         `<li><a href="${s.slug}.html">${esc(s.name)}</a></li>`).join("\n            "),

    gallery_home:      galleryItems(GALLERY_HOME),
    gallery_all:       galleryItems(GALLERY_ALL),
    gallery_kitchen:   galleryItems(GALLERY_KITCHEN),
    gallery_bath:      galleryItems(GALLERY_BATH),
    gallery_whole:     galleryItems(GALLERY_WHOLE),

    ba_kitchen:        beforeAfter("kitchen-3", "Kitchen remodel"),
    ba_kitchen_2:      beforeAfter("kitchen-4", "Kitchen remodel"),
    ba_bath:           beforeAfter("bath-2",    "Bathroom remodel"),
    ba_bath_2:         beforeAfter("bath-1",    "Bathroom remodel"),
    ba_living:         beforeAfter("living-1",  "Living room renovation"),
    ba_living_2:       beforeAfter("living-6",  "Open-concept conversion"),
    ba_exterior:       beforeAfter("exterior-1","Exterior renovation"),

    img_hero_1:        `assets/img/hero/hero-1.jpg`,
    img_hero_2:        `assets/img/hero/hero-2.jpg`,
    img_hero_3:        `assets/img/hero/hero-3.jpg`,
    img_hero_4:        `assets/img/hero/hero-4.jpg`,
    hero_bg_1:         heroBg("hero-1"),
    hero_bg_2:         heroBg("hero-2"),
    hero_bg_3:         heroBg("hero-3"),
    hero_bg_4:         heroBg("hero-5"),  // hero-4 was a render with dimension callouts

    pic_about:         pic("process/process-3", "Crew on a " + biz.city + " remodeling job site", "", "lazy", "(max-width: 960px) 100vw, 50vw"),
    pic_about_2:       pic("process/process-1", "Cabinet installation in progress"),
    pic_kitchen:       pic("kitchen/kitchen-6", "Finished kitchen remodel"),
    pic_bath:          pic("bath/bath-5", "Finished bathroom remodel"),
    pic_whole:         pic("home/home-5", "Open-concept whole-home renovation"),
    pic_process_1:     pic("process/process-4", "Measuring for a free in-home estimate"),
    pic_process_2:     pic("process/process-6", "Flooring installation in progress"),
  };
  // business.json fields: {{biz.key}}
  for (const [k, v] of Object.entries(biz)) {
    if (Array.isArray(v)) continue;
    t["biz." + k] = esc(v);
  }
  return t;
}

/* ---------- renderer ---------------------------------------------------------- */
function render(tpl, table) {
  let out = tpl;
  // includes first: {{> partial}}
  out = out.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) =>
    fs.readFileSync(path.join(SRC, "partials", name + ".html"), "utf8"));
  // then tokens, repeatedly (partials contain tokens too)
  for (let pass = 0; pass < 3; pass++) {
    out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, key) =>
      Object.prototype.hasOwnProperty.call(table, key) ? table[key] : m);
  }
  return out;
}

/* ---------- page list ---------------------------------------------------------- */
const PAGES = [
  { file: "index.html",                   title: `${biz.name} | ${biz.tagline} in ${biz.city}, ${biz.state}`,
    desc: `${biz.name} builds kitchens, bathrooms and whole-home renovations across ${biz.city}. ${biz.licenseLine}. Free in-home estimates.` },
  { file: "about.html",                   title: `About Us | ${biz.name}`,
    desc: `A ${biz.city} general contractor handling kitchens, bathrooms, whole-home remodeling and landscaping in house. ${biz.languages}.` },
  { file: "services.html",                title: `Remodeling Services | ${biz.name}`,
    desc: `Kitchen, bathroom and whole-home remodeling in ${biz.city}, ${biz.state}. Licensed, insured, and warrantied in writing.` },
  { file: "kitchen-remodeling.html",      title: `Kitchen Remodeling in ${biz.city}, ${biz.state} | ${biz.name}`,
    desc: `Full kitchen renovations in ${biz.city} — cabinetry, countertops, islands and layout changes. Free written estimate.` },
  { file: "bathroom-remodeling.html",     title: `Bathroom Remodeling in ${biz.city}, ${biz.state} | ${biz.name}`,
    desc: `Bathroom remodels in ${biz.city} — walk-in showers, freestanding tubs, custom tile and double vanities.` },
  { file: "whole-home-remodeling.html",   title: `Whole-Home Remodeling in ${biz.city}, ${biz.state} | ${biz.name}`,
    desc: `Open-concept conversions, additions and full gut renovations in ${biz.city}. One crew, one schedule, one contact.` },
  { file: "projects.html",                title: `Our Projects | ${biz.name}`,
    desc: `Recent kitchen, bathroom and whole-home remodels by ${biz.name} in ${biz.city} and surrounding areas.` },
  { file: "contact.html",                 title: `Contact & Free Estimate | ${biz.name}`,
    desc: `Book a free in-home estimate with ${biz.name}. Call ${biz.phone} or send us the details of your project.`, faqLd: true },
];

/* ---------- build --------------------------------------------------------------- */
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name), d = path.join(to, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const layout = fs.readFileSync(path.join(SRC, "layout.html"), "utf8");

for (const page of PAGES) {
  const body  = fs.readFileSync(path.join(SRC, "pages", page.file), "utf8");
  const table = tokens(page);
  table.body  = render(body, table);
  fs.writeFileSync(path.join(DIST, page.file), render(layout, table));
}

copyDir(ASSETS, path.join(DIST, "assets"));

// robots.txt — demo builds stay out of the index
fs.writeFileSync(path.join(DIST, "robots.txt"),
  biz.noindex
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: https://${biz.domain}/sitemap.xml\n`);

if (!biz.noindex) {
  const urls = PAGES.map((p) =>
    `  <url><loc>https://${biz.domain}/${p.file}</loc></url>`).join("\n");
  fs.writeFileSync(path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}

console.log(`Built ${PAGES.length} pages -> dist/`);
PAGES.forEach((p) => console.log("  " + p.file));
