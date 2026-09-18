# Catalogue of AI-Generated Web Design Tells

For each tell: what it is, why it happens, and what to do instead. None of these are banned forever — they're banned as *unexamined defaults*. If a real brand reason calls for one, use it deliberately and say why.

---

## Color

**The tell:** Dark navy/near-black background (`#0a0a0f`-ish) with a single purple-to-blue or violet-to-pink gradient accent, used on buttons, blob shapes, and glowing orbs behind the hero. Often paired with "glassmorphism" (frosted-glass translucent cards with a thin white border and heavy blur).

**Why it happens:** This palette dominates SaaS/AI-product marketing sites from ~2022–2025, so it's overrepresented in training data as "looks professional and techy."

**Alternatives:**
- Pull 2–3 colors from something concrete tied to the content: a product photo, a real logo, a location, a material (paper, concrete, film grain), an era (Swiss International Style, 1970s print, early-web).
- Try a *light* background with one saturated, unexpected accent (mustard, brick red, forest green) instead of dark+gradient.
- Try true monochrome (black/white/one gray) with no accent color at all — often reads as more premium than a gradient.
- If a gradient is genuinely right for the brand, make it asymmetric, off-axis, or grainy/textured rather than a smooth diagonal violet-to-blue.
- Avoid the specific glow-behind-a-heading trick (radial gradient blur behind text) unless the whole brand is about neon/cyberpunk.

## Layout

**The tell:** Centered hero (headline, sub-headline, two buttons — one filled, one outline — dead center), followed by a logo strip, then a symmetric 3-column grid of cards, each with a rounded-square icon-in-a-colored-circle, a bold mini-heading, and a sentence of body text. Repeat this card-grid pattern for "features," "testimonials," and "pricing." Section spacing is uniform and generous everywhere.

**Why it happens:** This is the modal structure of component libraries (shadcn/ui, generic Tailwind templates) and marketing-site boilerplate, so it's the path of least resistance.

**Alternatives:**
- Ask whether the content actually has 3 parallel things. If it has 2, 4, 5, or an asymmetric hierarchy (one big thing + several small things), build the layout the content actually has instead of forcing thirds.
- Break symmetry: offset the hero copy to one side with a real screenshot/photo/diagram on the other, rather than a floating abstract illustration.
- Vary rhythm: not every section needs the same padding, alignment, and card treatment. Let one section be full-bleed, one be a tight column, one be a table.
- Replace "icon in colored circle" with something the specific content actually needs: a real screenshot, an annotated diagram, a number, a short quote, a photo.
- For testimonials, avoid the identical circular-headshot + 5-star-row + italic-quote card repeated 3x. Consider a single strong quote large on the page, or a scrolling ticker, or real screenshots of the actual feedback (with permission).

## Typography

**The tell:** Inter, Poppins, or plain system-ui for everything, at a fairly narrow range of weights, with large `rounded-2xl`/`rounded-3xl` corners on every card and button, and consistent generous padding everywhere — the shadcn/Tailwind-default look.

**Why it happens:** These are the defaults of the most common component libraries and are safe, legible, and neutral — which is exactly why they're overused into invisibility.

**Alternatives:**
- Pair a distinctive display face for headlines (a serif with personality, a condensed grotesque, a slab, something with real character) with a plain workhorse font for body text — don't use the same sans for both at every weight.
- Vary corner radius intentionally: sharp corners everywhere is a valid, distinctive choice; so is one consistent smaller radius (4–6px) instead of the default large rounding.
- Let type sizes have real contrast — a huge display headline against small body text reads more confident than a moderate size scale where everything is "pretty big."
- Consider all-caps labels, unusual letter-spacing, or a monospace touch for metadata/labels if it fits the brand — small typographic choices are cheap signals of intentionality.

## Copy

**The tell:** Marketing copy that could be pasted onto any product. Recognizable phrases and patterns:
- "Unlock the power of X" / "Elevate your Y" / "Transform the way you Z" / "Supercharge your W"
- "Seamlessly integrate" / "effortlessly" / "in today's fast-paced world" / "in an ever-changing landscape"
- "Whether you're a [beginner] or a [pro]" false-dichotomy framing
- Em-dash-heavy sentences with a repetitive rhythm ("Not just X — but Y.")
- Emoji used as literal bullet markers (🚀 for growth, ✨ for "magic"/AI, 💡 for ideas, 🎯 for goals) instead of real bullets
- Vague superlatives with no specifics ("blazing fast," "world-class," "next-generation") unsupported by a number, benchmark, or concrete claim
- CTA buttons that always say "Get Started" / "Learn More" / "Try it Free" with no specificity

**Why it happens:** This is the statistical center of marketing writing scraped from thousands of SaaS landing pages.

**Alternatives:**
- Write the headline as if explaining the product to a specific friend who already has context — plain, direct, no throat-clearing.
- Replace vague superlatives with one real, specific, checkable claim: an actual number, a named comparison, a concrete before/after.
- Cut the "whether you're X or Y" construction entirely; just say what it does.
- Use real bullet points (•, –, or numbered) instead of emoji as list markers. If emoji genuinely fit the brand voice, use them sparingly and specifically, not as a default bullet replacement.
- Name the actual feature/benefit instead of a generic action verb for CTAs where possible ("See pricing," "Read the docs," "Watch the 90-second demo") instead of always "Get Started."

## Icons & Imagery

**The tell:** Generic flat-line icons (the same visual family as Heroicons/Lucide/Feather used at default size) each sitting inside a soft-colored rounded-square or circle badge; or abstract 3D-rendered blobs/spheres/shapes with a gradient, floating in the hero with no relation to the actual product; or "diverse team smiling at laptop" stock photography.

**Why it happens:** Cheap, always-available, and inoffensive defaults — again, the safe average.

**Alternatives:**
- Use a real screenshot, real product UI, real data visualization, or a custom illustration with a distinct style, rather than an abstract 3D blob.
- If icons are needed, pick one specific icon set with real personality (not the default Lucide/Heroicons look) and use it consistently, without the colored-circle-badge wrapper on every single one.
- For "team"/"people" imagery, prefer specific real photography over generic stock, or skip photos of people entirely if they're not adding information.

## Micro-interactions & polish

**The tell:** Every card has the exact same `hover:scale-105` + shadow-lift effect; every section fades/slides in on scroll with the same easing; buttons all have the same subtle gradient-shift-on-hover.

**Alternatives:**
- Use restraint: not every element needs a hover animation. A few well-placed, distinctive interactions read as more crafted than uniform micro-animation on everything.
- If using scroll reveals, vary timing/direction/easing so it doesn't read as one global "AOS.js defaults" pass.

---

## Quick self-audit checklist

Before presenting a build or finishing a review, check:

- [ ] Is the palette dark-navy + purple/violet gradient, unless deliberately chosen? → change it
- [ ] Is the hero centered with two stacked buttons and an abstract 3D blob? → reconsider structure
- [ ] Is there a symmetric 3-card grid with icon-in-colored-circle for features/benefits? → reconsider structure
- [ ] Does the font default to Inter/Poppins/system-ui with large rounded corners everywhere? → pick a deliberate pairing and corner treatment
- [ ] Does any copy contain "unlock/elevate/transform/supercharge," "seamlessly," "in today's fast-paced world," "whether you're X or Y," or emoji-as-bullets? → rewrite in plain, specific language
- [ ] Are all icons the same generic line-icon family in colored badges? → replace with real content or a distinctive icon treatment
- [ ] Could this design be reskinned for a completely unrelated product with just a logo/color swap? → that's the strongest signal something needs a real point of view
