---
name: de-ai-ify-web
description: Use this skill whenever building or reviewing a website, landing page, portfolio, or web UI — to strip out the generic "made by AI" look and copy. Trigger it any time the user asks for a website/landing page/portfolio, asks to "make it look less AI-generated" or "less templated," asks for a design review or critique of an existing site, or is iterating on visual polish for a web project. Covers layout clichés (centered hero + 3-card grid), color clichés (purple/violet gradients, glassmorphism), typography defaults (Inter/system-ui everywhere, oversized rounded corners), copy clichés ("Unlock the power of...", "Transform the way you...", emoji bullet lists), and icon/illustration clichés (generic line icons in colored blobs). Use this alongside frontend-design for technical styling constraints — this skill is about recognizing and eliminating the specific tells that make a site read as AI-generated, not general design taste.
---

# De-AI-ify Web Design

A checklist-and-diagnosis skill for making websites stop looking like every other Claude/ChatGPT/v0-generated site. The goal isn't "add polish" in the abstract — it's recognizing the *specific, recognizable tells* of AI-generated web design and actively avoiding or removing them.

Use this skill both **generatively** (building a new site — bake in a real point of view from the start) and **diagnostically** (reviewing an existing site or screenshot — name what's making it read as generic).

## Why this matters

LLMs trained on scraped web/design content converge on the statistical average of "professional-looking website." That average has become extremely recognizable — to the point that people can spot an AI-built site in under a second. The fix is not "try harder to be pretty," it's **deliberately breaking from the average** in specific, describable ways. Genuinely good design has a point of view; the AI-flavored look has none.

Read `references/tells.md` for the full annotated list of clichés before generating or critiquing a design — it's the core reference for this skill. The summary below is enough for quick use; go to the reference file when you need specifics or examples.

## The core diagnostic questions

Before shipping any web design, ask:

1. **Could this hero section be for literally any SaaS product if you swapped the headline?** If yes, it's generic. Real products have a specific claim, a specific number, a specific screenshot of the actual thing — not an abstract illustration of "productivity."
2. **Is the color story "dark navy background + one violet/purple/indigo gradient accent"?** This is by far the single most common AI tell in 2024–2026 output. If the palette wasn't a deliberate choice tied to a brand, don't default to it.
3. **Is everything centered, in a 3-column card grid, with a rounded-corner icon-in-a-colored-circle above each card?** This is the second most common tell. Real layouts have asymmetry, varied rhythm, and content-appropriate structure — not a template into which any content could be poured.
4. **Does the copy contain any of: "Unlock/Elevate/Transform/Supercharge," "the power of," "seamlessly," "in today's fast-paced world," "whether you're X or Y," an em-dash-heavy rhythm, or emoji used as bullet markers (🚀 ✨ 💡)?** Rewrite it in a specific, plain voice.
5. **Would a designer who works on this specific niche (not "websites in general") recognize this as belonging to it?** A fintech dashboard, a synth-punk band page, and a children's museum site should not share a visual language. If your draft could be reskinned for any of them, start over on the concept, not just the colors.

If you catch yourself defaulting to any of the patterns in `references/tells.md` without a specific reason tied to the actual brand/content, stop and pick something else.

## Workflow

### When building a new site
1. **Establish a point of view before touching layout.** In one or two sentences, state: who is this for, what's the one thing it needs to communicate, and what visual world does this brand live in (not "modern and clean" — that's not a point of view; try "brutalist zine energy" or "quiet, paper-like, editorial" or "loud maximalist retro-future"). Read `references/tells.md` §Copy and §Color/Layout for what to actively avoid while doing this.
2. **Pick a font pairing that isn't Inter/Poppins/system-ui by default.** See `references/tells.md` §Typography for alternatives and pairing logic.
3. **Pick a palette that isn't dark-navy-plus-violet-gradient**, unless the brief genuinely calls for it. See `references/tells.md` §Color.
4. **Break the 3-card centered-grid reflex.** Real information often isn't naturally three symmetric things. See `references/tells.md` §Layout for asymmetric/editorial alternatives.
5. **Write copy like a human describing a real thing**, not a marketing template. See `references/tells.md` §Copy — read it before drafting any headline or CTA.
6. **Before presenting, run the artifact/mockup back through the checklist in `references/tells.md` §Quick self-audit checklist.**

### When reviewing/critiquing an existing site
1. Go through each section of `references/tells.md` and flag concrete instances (quote or point to the specific element — "the hero gradient," "the emoji bullets in the features section") rather than giving vague feedback like "make it feel more premium."
2. For each flagged element, give a specific, actionable alternative — not just "avoid this."
3. Prioritize fixes: copy clichés and the color/layout template are usually the highest-impact, lowest-effort fixes; typography and micro-interactions are secondary.

## Reference files

- `references/tells.md` — the full annotated catalogue of AI-generated web design tells (color, layout, typography, copy, icons/imagery) with concrete alternatives for each. **Read this before generating or reviewing any web design** — it's the substance of this skill; the sections above are just the index.
