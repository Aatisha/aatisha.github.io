# Aatisha Cyrill: portfolio redesign plan

**Goal:** a polished, interactive, minimal portfolio at the quality level of [Andrea da Silva](https://adasilv2.framer.website/), [Elaine Yu](https://www.elaineyu.design/) and [Bryan Garage](https://bryangarage.dev/). It should have personality, storytelling, a mascot with real behavior, and a fast path for recruiters. It is not a traditional grid of case studies plus an about page.

**Status:** there are three working versions, all kept:

| Version | Folder | State |
|---|---|---|
| **v3 · Summer receipts** | [`v3-summer-receipts/`](./v3-summer-receipts/) | **Current direction.** v1's design system, mascot and interactions, with the "always summer" ideas done in v1's style (§10). |
| **v1 · Bring receipts** | [`v1-receipts/`](./v1-receipts/) | Frozen. This is the approved base, left untouched (§1–§8). |
| **v2 · Always summer** | [`v2-summer/`](./v2-summer/) | Explored, not chosen. Aatisha found it "too kiddish" (§9). |

The round-1 explorations are archived in [`archive/`](./archive/). Research notes are in [RESEARCH.md](./RESEARCH.md).

Run from the repo root with `python3 -m http.server 5173`, then open <http://127.0.0.1:5173/redesign/> (the hub), <http://127.0.0.1:5173/redesign/v3-summer-receipts/>, <http://127.0.0.1:5173/redesign/v1-receipts/> or <http://127.0.0.1:5173/redesign/v2-summer/>. Assets load from `../../src/assets`, so the server has to run from the repo root.

---

## 1. v1 concept: "Aatisha, bring receipts."

A researcher's instinct is *show me the evidence*. The site turns that into the whole world:

- **The hero is a receipt printer.** Press the green button to print a receipt: *The Basics*, *Research* (60+ voices heard), *Impact* (−65% report time, ~6 hrs/week saved) or *Off the Clock*. Turn the selector dial (drag it, click it, scroll over it or use the arrow keys) to choose which receipt prints next. Tear it off, drag it around, and print again. After all four, the roll ends with a **Grand Total** receipt on pink end-of-roll paper: stamp it **VERIFIED** to reveal *Say hello* / *Résumé*, then the printer is out of paper. **Press and hold** the button to load a fresh roll.
- **Every project is a folder of evidence.** Hover a folder and the real screens fan out. Click it to open a story sheet laid out as *question → what I heard → insight → what I made → receipts*.
- **Her process is shown, not described.** The "How I work" section is a sticky, scroll-scrubbed affinity map. Real quotes from her studies start scattered, cluster into *Findability / Trust & control / Time*, then become three insight cards.
- **Tish, the mascot, grows up with you.** Tish is a pixel caterpillar who perches on things, naps, reacts, and tracks what you've discovered. After enough exploring, Tish forms a cocoon and emerges as a butterfly (her existing brand motif) in the contact section.

### How it maps to the reference sites

| Quality in the references | Where it lives in this build |
|---|---|
| One cohesive world with tactile props (Andrea's stickers, Elaine's boarding pass) | Receipt printer, torn receipts, folders, polaroid, postcards, bookshelf |
| A mascot with behavior (Bryan's napping capybara, Elaine's walking self) | Tish: perch system, wandering, napping, speech bubbles, metamorphosis |
| Bold, human bio with inline logos (Bryan) | Hero bio with UW–Madison, Amazon × Shopbop and Alex chips that preview on hover |
| Live personal details (Bryan's clock) | Local time, "Currently" and "Voices heard" meta row, "Open to roles" status |
| ⌘K "Jump to" plus "Ask" (Bryan) | ⌘K with projects, jump-to, actions, and "Ask Aatisha" answers inline |
| Recruiter mode (Elaine) | A one-click, printable résumé overlay |
| Gantt-style timeline (Bryan) | The Journey section, with project bars that open stories |
| Folders that fan out on hover (Andrea) | The Work section |

## 2. Site structure (a single page)

1. **Hero:** bio, meta row, printer, and Tish's first line ("Press the green button").
2. **Marquee:** partners and contexts.
3. **01 Work:** four folders (MyWorker.AI, MINDS@UW, Amazon × Shopbop, Trader Joe's + Rover), plus Sustain Dane and SSEC as compact links.
4. **02 How I work:** a pinned affinity map (340vh of scroll): Listen → Cluster → Decide.
5. **03 Journey:** a timeline from 2023 to now, with engineering years as a prelude chip and a dashed "Your team?" bar.
6. **04 Lab & notes:** a bento of an AR card, the plant monitor, a code-typing card, Medium posts and an image tile.
7. **05 Off the clock:** a draggable polaroid, a bio with inline images, video postcards (SF, NY, Seattle), and a bookshelf.
8. **06 Say hello:** a dark footer with email copy, links, a closing line and a signature.
9. **Overlays:** story sheet, ⌘K, Recruiter mode, toast, cursor pill, hero preview card.

## 3. Design system

- **Type:** Geist (UI and headlines), Instrument Serif italic (the emotional word in each headline), Geist Mono (labels, receipts, LCD), Mrs Saint Delafield (signature only).
- **Color:** paper `#F5F4F0`, ink `#141413`, butterfly mint `#12A06E` / `#3FD39C`. Each project has its own tint (lavender, rose, peach, mint).
- **Motion:** spring and expo-out easing. Every animation is triggered by the visitor (scroll, hover, click); nothing loops for its own sake except the gentle status dots. Lenis smooth scroll. Everything respects `prefers-reduced-motion`.
- **Layout:** max width 1320px, generous whitespace, and one surprise per screen.

## 4. v1 prototype stack (`v1-receipts/`)

A dependency-free static build (Lenis from a CDN), so it runs anywhere:

| File | Role |
|---|---|
| `index.html` | Semantic skeleton for all sections and overlays |
| `styles.css` | The full design system, components, responsive rules (1080 / 900 / 760), reduced motion, print |
| `data.js` | **All content**: projects, story fields, journey lanes, affinity notes, lab, books, Ask Q&A |
| `tish.js` | Procedural pixel-sprite mascot, with perches, jumps, naps, speech and metamorphosis |
| `app.js` | Every interaction: printer, folders, story sheet, affinity scrub, timeline, bento, about, ⌘K, recruiter mode |

Verified in headless Chrome at 1440×900, 1440×800, 1280×800 (reduced motion), 952×595 and 390×844, with no console errors.

## 5. Production plan

| Phase | Work | Output |
|---|---|---|
| **1. Content pass** (Aatisha) | Replace the placeholders listed in §6, rewrite the Ask answers in her own voice, confirm every number | An updated `data.js` |
| **2. Port to Astro** | `npm create astro@latest`. Move `data.js` into typed content collections, make sections into components, and keep the vanilla JS as islands | Same site, better structure |
| **3. Assets** | Convert screens to AVIF/WebP with `<Image>`, compress postcard videos under 1.5 MB, subset fonts | LCP < 2s on 4G |
| **4. Tish upgrade** (optional) | Rebuild Tish in Rive with the same state machine (cat → cocoon → butterfly, perch, nap, react) | A smoother mascot at a smaller file size |
| **5. Story pages** | Give each story sheet its own URL (`/work/myworker`) using View Transitions, so links are shareable | Deep links and SEO |
| **6. Test** | Run a five-person usability test of the portfolio (2 recruiters, 2 designers, 1 engineer), an axe audit and Lighthouse CI | The findings, published as a mini-story |
| **7. Launch** | GitHub Actions → Pages, keep the CNAME, and post a short screen recording on LinkedIn | Live at aatishacyrill.com |

## 6. Placeholders and assumptions to confirm

- **Education dates:** UW–Madison Information School, shown as 2023–2025. Confirm the degree name and dates.
- **Engineering years:** described as "2018–2023 engineering projects" (Angular, Spring Boot, PHP, IoT). Add real roles if you want them.
- **Ask Aatisha answers** (in `data.js → ask`): drafted for you. Rewrite them in your own voice.
- **Numbers:** MINDS support-request reduction is labelled as *projected* (−50%\*). MyWorker's ~6 hrs/week is an *estimate*. Both are marked that way on the site.
- **Testimonials:** none were available, so there's no testimonial section. Two or three quotes from teammates or managers would add a lot.
- **Location:** not shown. The clock shows the visitor's local time. Switch it to your city if you like.
- **Book notes:** the shelf currently shows titles on hover. A one-line lesson per book would make it more personal.

## 7. Success metrics

- A recruiter can reach the résumé in under 10 seconds (Recruiter mode in the nav).
- The first interaction (print) happens within 20 seconds.
- 40% or more of visitors reach Say hello, and Tish becomes a butterfly for engaged visitors.
- In testing, people can say what makes Aatisha different in one sentence.

## 8. Risks

| Risk | Mitigation |
|---|---|
| The printer reads as a gimmick | Receipts carry real numbers, and each one points into the page |
| The mascot gets annoying | Tish speaks only on discoveries, can be put to sleep, and stays quiet in Recruiter mode |
| Scroll-pinned sections feel slow | Only one pinned section. The nav, ⌘K and Recruiter mode skip everything. |
| Short screens | The printer rig scales down below 940px of height, and stacked layouts reserve room for receipts |

---

## 9. v2: "It's always summer here." (explored, not chosen)

> **Feedback:** "earlier was much better… this looks very kiddish." v1's mascot, interactions and modern look were missing. The ideas below were rebuilt in v1's style as v3 (§10). v2 is kept for reference only.

> "I am a summer person… always summer on my portfolio." (from Aatisha's chat with her friend)

v2 is warm, grainy, cute and calm. The whole site sits on sunlit water. v1's work content, story sheets, ⌘K and Recruiter mode carry over, restyled.

### How each idea from the chat was built

| Idea from the chat | What's in v2 |
|---|---|
| Sparkling "diamond" ocean water with some green trees (Italy) | A live WebGL water shader (`sea.js`) with ripples, caustics, twinkling sun glints and a soft light that follows the mouse. Procedural leafy sprigs sway in from the edges and show through the letters. |
| A white rectangle on top with padding, and big text that shows the water through it | The page is a white **frame** floating on the sea. "Aatisha / Cyrill" is **cut out** of the frame (`mix-blend-mode: screen`), so the water and leaves shimmer *through* the letters. |
| A seahorse or sea dragon in the butterfly's spot, saying "click me to go here/there" | **Kai the seahorse** sits in the nav where the butterfly was. His eyes follow the cursor, he blinks and puffs bubbles, and his fin flutters. Click him for a "Where to?" menu (Work · Who's Aatisha? · Treasure hint · Say hello · Résumé). He welcomes you, remembers returning visitors, and cheers when you find a shell. |
| Case studies: one big card, small cards below, click and it swoops in, "the div stays the same", one step deeper | **One story at a time.** The big card keeps its place: clicking a small card flies its image up into the big card (FLIP) while the tint morphs. It also supports ←/→, dots and swipe. "Open the story" goes one step deeper into the story sheet. |
| Treasure hunt: seashells hidden around the site open quotes she's collected, with an illustration | **Six treasures** are tucked into the hero, the work card, the prints, the end of a story, the postcard and the shore. Each opens a quote card with its own illustration, then flies into the **beach bucket** in the nav, which counts them. When all five shells are found, a **message in a bottle** washes ashore at the bottom. Progress is saved in `localStorage`, and Kai gives hints. |
| About: a Kodak-style card; click it and her photo appears with text below; polaroids with lace borders; short, not a cluttered playground | **Summer, on film.** A yellow-and-red "summer prints" envelope (Kodak-*inspired*, with no trademark) opens into a stack of her real photos with lace edges. Each print *develops* from sepia the first time you see it, and you can drag the top print away to reveal the next one. The caption and a line about her change with each print. It ends with a short bio and a "beach bag" of five books. |
| Cute, grainy, summery | A film-grain overlay, handwritten accents (Caveat), a ribbon marquee, and a postcard contact section ("Wish you were here") with a stamp and postmark that flips over. |

### Structure (a single page)

1. **Hero:** the cut-out name on the water, "product designer & ux researcher", a short intro, the meta row (local time · currently · water 26°C & sparkly · open to roles), and CTAs.
2. **Ribbon:** a marquee of projects and partners.
3. **01 Work:** one big card with a deck of small cards, plus "Also:" links. Each opens the story sheet.
4. **02 Off the clock:** the envelope, prints, bio and beach bag.
5. **03 Say hello:** a postcard with email copy and links.
6. **Shore:** the footer on the water, where the bottle arrives.
7. **Overlays:** treasure quote card, beach bucket, story sheet, ⌘K (stories · Ask Aatisha · treasure hints · actions), Recruiter mode, toast.

### v2 stack (`v2-summer/`)

| File | Role |
|---|---|
| `index.html` | Skeleton for the frame, sections, treasures and overlays |
| `styles.css` | Summer tokens, cut-out hero, deck and switcher, envelope and prints, postcard, treasures, overlays, responsive (1080 / 720), reduced motion, print |
| `data.js` | v1 content plus `DATA.summer`: treasures and quotes, prints, beach reads, Kai lines, and an optional `oceanVideo` |
| `sea.js` | WebGL water shader (CSS gradient fallback) plus procedural foliage |
| `kai.js` | The seahorse SVG, eye tracking, reactions and speech-bubble API |
| `app.js` | Every interaction: work switcher, story sheet, envelope and prints, postcard, treasure hunt and bucket, Kai, ⌘K, Recruiter mode |

Verified in headless Chrome at 1440×900, 1440×800, 1280×720 (reduced motion) and 390×844 (touch). Checked there: the full hunt (5 shells, then the bottle, then the final note, still 6/6 after a reload), swipe, drag-to-toss, the postcard flip, and zero console errors.

### Blend constraint

The cut-out hero only works while `.hero-cut` blends with the fixed `.sea` canvas behind it. Don't add `z-index`, `transform`, `opacity`, `filter`, `isolation` or `will-change` to `body`, `main`, `.frame` or `.hero`, because any of these creates a new stacking context and the water stops showing through the letters.

---

## 10. v3: "Summer receipts" (current)

**Principle:** v1 stays the base. Its type (Geist and Instrument Serif), its warm `#F5F4F0` paper, the mint accent, the tactile props, the receipt printer, ⌘K, Recruiter mode and Tish all remain. Summer is added *around* the content, not painted over it. No handwritten fonts, no cartoon SVGs. Every new object is either photographic or a crisp pixel sprite in the same family as Tish.

### How each idea from the chat was built (v3)

| Idea from the chat | What's in v3 |
|---|---|
| Sparkling diamond water with green trees | v2's WebGL sea (`sea.js`) now sits behind the whole page. Leafy sprigs come in from the side margins only and sway. A `#seaRing` canvas copies the sea into the top and bottom margins, so content never shows scrolling under the frame. |
| A white rectangle on top with padding, big text showing the water through it | The page is a rounded **frame** inset by `--gap`. The first screen is a knockout **"Aatisha / Cyrill"** in Geist 600. The letters lift toward the cursor and parallax on scroll. v1's hero (with its printer) follows directly after, adding "Forecast: Always summer". |
| A seahorse or sea dragon saying "click me to go here/there" | **Tish becomes a pixel seahorse** in the same pixel-art style and mint palette as v1's Tish, so the brand carries over. She still perches on sections and reacts to v1's discoveries. Her menu now offers "Where to?" (Work, Process, Journey, About her, Say hi), a hint, and a nap. **She grows a leafy frond for every treasure and becomes a leafy sea dragon at 6/6**, when she starts following the cursor. The nav mark and favicon grow with her. |
| One big card, small cards below, "the div stays the same", one step deeper | **One story at a time.** v1's big folder sits on the table. Pick a small folder (or swipe, use ← → or the arrows) and the big folder *sinks, changes tint and rises* with the new papers. It keeps its place. "Open the story" goes one step deeper into v1's story sheet. |
| Treasure hunt: shells that open quotes with an illustration | **Six pixel treasures:** a scallop (intro), a starfish (work), sea glass (process, once the board settles), a conch (at the end of a story), a sand dollar (about) and a bottle (contact, after 5). Each opens a quote card on moving water. The treasure then flies into the nav counter. Progress is saved in `localStorage` under `aatisha-v3-treasures`, and hints are available from Tish, ⌘K and the panel. |
| About: a Kodak-style card that opens to photos, lace borders, short | **Summer prints.** A yellow-and-red envelope (Kodak-*inspired*, no logo) opens into a stack of her photos with scalloped edges. Each print develops from sepia the first time. Drag, ← → or tap to toss through them, while an italic caption line changes with each print. It's followed by v1's bio and bookshelf. |
| Summer, but grown-up | Contact sits on the water with white type and a sun-yellow accent: "It's always summer here." The footer reads "No cookies, just sunshine". |

### v3 stack (`v3-summer-receipts/`)

| File | Role |
|---|---|
| `index.html` | v1 structure plus the intro knockout, the work stage and minis, the envelope, treasures, the treasure modal and the shells panel |
| `styles.css` | v1 CSS (with root, nav and contact edits), plus the appended **"v3 · SUMMER EDITION"** block: frame, intro, treasures, stage, darkroom, overlays, responsive rules (1080 / 760) and reduced motion |
| `app.js` | v1 logic plus the intro, work stage, story conch, process `.settled`, envelope and prints, treasure hunt, and ⌘K additions. Exposes `window.App` |
| `tish.js` | Pixel seahorse engine (spine mask, fronds, blink, bubbles, perches, menu, `grow`) plus `window.Pixel` treasure sprites |
| `sea.js` | Water shader, `ring()` for the top and bottom bands, viewport-sized foliage |
| `data.js` | v1 content plus `DATA.summer` (treasures, quotes, hints, prints, `oceanVideo`) |

Verified in headless Chrome at 1440×900, 1440×800, 1280×720 (reduced motion) and 390×844 (touch). Checked there: the full hunt (5 treasures, then the bottle, then the final note, then the grown sea dragon, still 6/6 after a reload), swipe, drag-to-toss, the envelope, ⌘K, and zero console errors.

**Blend constraint (same as v2):** don't give `html`, `body`, `.frame`, `main` or `.intro` anything that creates a stacking context (`z-index` with position, `transform`, `opacity`, `filter`, `isolation`, `will-change`). If you do, the name stops showing the water.

### Needs Aatisha's input (v3)

- **Quotes:** only the Christina Koch line is yours. The others in `DATA.summer.treasures` are placeholders. The bottle note is written in your voice, so please rewrite it.
- **Ocean video:** set `DATA.summer.oceanVideo` to a muted sparkle loop (under about 4 MB) to replace the shader. The ring copies video too.
- **Mascot:** Tish is a seahorse that becomes a leafy sea dragon at 6/6. Tell me if you'd rather she start as a sea dragon.
- **Prints:** six photos with guessed captions (`summer.prints`). Swap in real summer photos and captions.
- The v1 assumptions in §6 still apply.

### Next steps

- Tint the water by time of day (golden hour in the evening, moonlit at night).
- Add an optional wave sound, off by default.
- Productionize per §5: a Next.js or Astro port, real case-study pages behind the story sheet, and analytics on treasure completion.

---

### Archive (round 1, rejected)

| File | Idea |
|---|---|
| [archive/a-horizon.html](./archive/a-horizon.html) | A dawn-to-night scroll story |
| [archive/b-field-notes.html](./archive/b-field-notes.html) | A FigJam-like canvas |
| [archive/c-ask-pip.html](./archive/c-ask-pip.html) | A conversational UI |
