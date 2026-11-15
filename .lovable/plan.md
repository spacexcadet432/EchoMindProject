
# EchoMind — Premium Landing Page

A typography-driven, editorial landing page for a structured between-sessions reflection tool. Warm-neutral palette, single slate-teal accent, no stock imagery.

## Design foundation
- **Palette:** bg `#F5F3EE`, surface `#FAFAF7`, surface-2 `#EDEBE4`, border `#D9D6CE`, text `#1C1A17` / `#6B6760` / muted `#A09D97`, accent `#3D5A6C` (hover `#2E4455`), accent-subtle `#EBF0F3`. Accent appears **only** on interactive elements.
- **Type:** Cormorant Garamond (display), Instrument Serif (headings), DM Sans (body/UI), JetBrains Mono (timestamps/labels). Loaded via Google Fonts.
- **Spacing:** 4px base. Generous section gaps (64–96px). 1px hairline borders, no shadows on layout chrome.
- **Motion:** 120–150ms ease on hovers; subtle fade + 4px Y on section reveal. One ambient breathing gradient in hero.

## Page structure

**1. Navbar** — fixed top, transparent on bg, 1px bottom border, no shadow.
- Left: "EchoMind" wordmark (DM Sans 15px semibold, tight tracking)
- Right: ghost link "For Therapists" + secondary outline button "Sign In"

**2. Hero** (full viewport, asymmetric 60/40)
- Left: tiny uppercase eyelet label ("A reflection tool · Invite only"), serif headline *"Clarity before your next session."* (Cormorant, ~64px), subtext in DM Sans on `text-secondary`, primary button **"Request Early Access"**, fine-print "Built with therapists. No open access."
- Right: ambient visual — soft animated radial gradient orb in accent-subtle/warm tones with slow breathing scale + drift. Pure CSS/SVG, no people, no illustration clichés.

**3. Problem block** — 3 columns separated by 1px vertical borders. Short editorial pull-statements in serif (e.g., insights lost between sessions, 2am realizations forgotten, therapist time spent re-orienting). Small DM Sans caption beneath each.

**4. How it works** — inverted section on `text-primary` background, light text. Three numbered steps (large Cormorant numerals at 0.15 opacity behind concise step text). Horizontal flow, no icons.

**5. Therapist strip** — single horizontal card on surface-2, radius 8px. Left: "Designed with clinicians, not against them." + brief paragraph. Right: ghost link "For Therapists →".

**6. Trust block** — two short pull-quotes, attributed minimally (initials + role). No carousel, no logos.

**7. Final CTA** — centered, calm. Serif line "Ready to use the time better?" + single primary button.

**8. Footer** — single-line minimal: wordmark left, links right (Privacy · Terms · For Therapists · Contact). 1px top border.

## Interactions & polish
- Buttons: 6px radius (no pills). Primary lifts 1px on hover with subtle accent shadow. Secondary fills to surface-2.
- Focus rings: 2px accent, 2px offset.
- Section reveal on scroll (Framer Motion), staggered, very restrained.
- Fully responsive: hero stacks on mobile with ambient visual reduced; problem block becomes vertical with horizontal hairlines; no hamburger needed (just the two right-side links collapse to compact).

## Out of scope (future)
Auth, dashboard, reflection interface, therapist panel, archive — defined in the uploaded spec but not part of this build.
