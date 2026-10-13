# J.E.M.M.E Construction — client demo site

Static HTML/CSS/JS. Phoenix, AZ general contractor: kitchens, bathrooms,
whole-home remodeling and landscaping, with plumbing, drywall, paint, flooring
and tile all in house.

## Build

```
node scripts/build.js            # business.json + content.json + src/ -> dist/
```

`dist/` is the deploy output. `vercel.json` already points at it, so a Vercel
import needs no configuration.

## What a client swap touches

- `business.json` — name, phone, email, city, hours, review count, service areas
- `content.json`  — services, process steps, reviews, FAQs

Text is baked into the HTML at build time, not injected at runtime, so search
engines can read it.

## Photos

`scripts/prep_client_images.py` drops the client's own photos into the template
slots. Their Google Business profile ran to 77 photos, mostly demolition and
in-progress shots; seven were strong enough to use (finished kitchens and
hardscape) and the rest stay stock. The hero stays stock — none of theirs is
landscape.

## Known state

- Review count and the four reviews are real, taken from their Google listing.
  All four were written in Spanish; the site shows Google's translations.
- No years-in-business or projects-completed figures anywhere. Those were
  dummy numbers in the template and are not known for this client — do not put
  a number back without asking them.
- Contact form shows a confirmation and sends nothing. Needs Formspree or
  similar before a real customer uses it.
- `"noindex": true` in `business.json`. Leave it on while this is a demo; turn
  it off only once the client has bought and it is on their own domain.
