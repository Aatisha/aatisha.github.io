# Research: how top product designers build portfolios (2024–2026)

> This file summarizes desk research done for the redesign. Links go to primary sources where possible. Claims I couldn't verify are marked.

## TL;DR: the X factor

The portfolios people remember are **not case-study grids**. Each is built around **one organizing idea** that shows taste on its own: a manifesto, a working OS, a toy car you drive, a site that squashes when you resize it. Underneath the idea you find **small, well-made details**, a **playground of live prototypes**, and **writing** that shows how the person thinks.

AI-lab hiring language has moved toward **prototyping in code, "native-to-AI" patterns, judgment, and shipping**. The best portfolio for Aatisha therefore **works as a prototype itself** and **tells a story about how she thinks**, while always keeping a **fast path to the evidence**.

---

## 1. Reference sites (verified)

| Person / site | Role | Signature idea |
|---|---|---|
| **Rauno Freiberg**, [rauno.me](https://rauno.me) | Staff Design Engineer, Vercel (ex-The Browser Company) | The home page is a manifesto ("Make it fast. Make it beautiful… Make it soulful."). A [/craft](https://rauno.me/craft) log of interaction experiments, plus [Web Interface Guidelines](https://interfaces.rauno.me) and [Devouring Details](https://devouringdetails.com). |
| **Emil Kowalski**, emilkowal.ski | Design engineer at Linear (ex-Vercel) | Writing with interactive demos. Made Sonner and Vaul. Teaches [animations.dev](https://animations.dev). |
| **Paco Coursey**, [paco.me](https://paco.me) | Linear (built Vercel’s design system) | Very plain text with a personal "Now" section. Made [cmdk](https://cmdk.paco.me), the ⌘K menu component. |
| **Brian Lovin**, [brianlovin.com](https://brianlovin.com) | AI products at Notion | The site is a personal OS: App Dissection, Stack, AMA, Listening, `llms.txt`, open source. |
| **Ryo Lu**, [os.ryo.lu](https://os.ryo.lu) | Head of Design, Cursor (ex-Notion, Stripe) | **ryOS**, a retro desktop in the browser with about 27 apps and an AI assistant. [Open source](https://github.com/ryokun6/ryos). |
| **Jordan Singer**, [ibuildmyideas.com](https://ibuildmyideas.com) | Diagram (acq. by Figma), now Mainframe | "I build my ideas": a list of shipped experiments instead of case studies. |
| **Jenny Wen**, [jennywen.ca](https://jennywen.ca) | Design lead for Claude and Cowork at Anthropic (ex-Figma) | A plain feed of shipped work, talks and PRs. Stories about shipping to learn instead of polished case studies. |
| **Karina Nguyen**, [karinanguyen.com](https://karinanguyen.com) | Ex-OpenAI (Canvas, Tasks), early Anthropic | Mixes research, design and prototypes, the same combination Aatisha has. |
| **Jhey Tompkins**, [jhey.dev](https://www.jhey.dev) | Ex-Google Chrome DevRel, Vercel | CSS demos that make you ask "how did you do that?" |
| **Josh W. Comeau**, joshwcomeau.com | Educator | Whimsy: short sound effects tied to specific actions ([write-up](https://www.joshwcomeau.com/blog/whimsical-animations/)). |
| **Lynn Fisher**, lynnandtonic.com | — | Redesigns the site every year. The 2025 version squashes and stretches when you resize the window ([case study](https://lynnandtonic.com/thoughts/entries/case-study-2025-refresh/)). |
| **Bruno Simon**, bruno-simon.com | Creative developer | Drive a toy car through a 3D world with physics (Three.js WebGPU + Rapier). [Open source](https://github.com/brunosimon/folio-2025). |
| **Henry Heffernan**, henryheffernan.com | Engineer | A 3D computer whose screen runs a working OS. |
| **Adrian Zumbrunnen**, azumbrunnen.me | — | Turned his whole site into a chatbot, then wrote ["My chatbot is dead"](https://uxdesign.cc/my-chatbot-is-dead-8e6784fca05) about why it became a gimmick. **Read this before building a mascot or chat feature.** |

*Couldn't verify: "Mariana Castilho", "Joe Alterio", "Karina Sirqueira". Samuel Kraft’s current employer is also unconfirmed.*

## 2. Recurring patterns

1. **One organizing metaphor, carried all the way through** (OS, game world, manifesto, a joke about resizing). The concept is the first thing that shows taste.
2. **Small details are the proof**: focus states, easing, keyboard support, tabular numbers.
3. **A playground or lab** of live prototypes instead of static screenshots.
4. **Writing as the backbone**: essays, TILs, AMAs.
5. **Useful things given away** (Sonner, cmdk, guidelines). Showing up in other people’s products is strong social proof.
6. **Restraint plus one surprise**: mostly quiet, with one moment that makes people ask "how?"
7. **Sound and touch-like feedback**, used sparingly and only in response to the visitor.
8. **Personality through "Now" and taste lists** (music, books, stack).
9. **Process over polish**: PRs, prototypes, launches.
10. **AI-native touches**: `llms.txt`, an assistant inside the site.

## 3. What hiring managers say they want

- **Anthropic, Product Designer (Core Apps):** "staying close to the models, prototyping rapidly, and being comfortable with ambiguity". They want people to "invent patterns that feel native to AI", be "comfortable in code, design, prototypes", and have "a portfolio demonstrating user-centered design thinking and polished UI craftsmanship" ([posting](https://jobs.accel.com/companies/anthropic/jobs/91313470-product-designer-core-apps)).
- **Anthropic, Prompt & Eval Design:** "Prompts spec out what Claude does. Evals measure whether it did." Also: "reads transcripts, not only scores" ([Greenhouse](https://job-boards.greenhouse.io/anthropic/jobs/5411318008)). **This is a natural fit for a UX researcher.**
- **Jenny Wen (Anthropic):** "the design process is dead". What still matters is craft, judgment and shipping ([Lenny’s Podcast](https://www.lennysnewsletter.com/p/the-design-process-is-dead)).
- **OpenAI (Design Systems / GenUI):** "sophisticated aesthetic judgment" that is made "explicit, teachable", then tested through prototypes and evals ([posting](https://jobs.ashbyhq.com/openai/7c1cd1ec-47a9-4d15-8eb9-2f44272db796/application); quote taken from a search summary).
- **Linear (Karri Saarinen):** "taste comes from the craft". Linear uses paid work trials (secondary summary).
- **Vercel:** prototype in code what Figma can’t express, and build for everyone ([blog](https://vercel.com/blog/design-engineering-at-vercel)).
- **Figma recruiter:** reviewers spend "minutes, or even seconds". A common mistake is "overcomplicating animations on their landing page" ([Figma blog](https://www.figma.com/blog/product-design-portfolio-tips-from-a-figma-recruiter/)).

**Tension to design for:** a non-traditional site still needs a 30-second path to the evidence, such as a ⌘K index, a "tidy up" view, or a "just show me everything" option.

## 4. Stack notes (2025–2026)

| Tool | Use it for |
|---|---|
| **Astro** | A mostly static, content-heavy site with interactive islands. Very little JS. Built-in View Transitions. Good fit for GitHub Pages. |
| **Next.js** | Choose it if the site becomes an app (for example a real LLM-backed chat). |
| **GSAP + ScrollTrigger** | Scroll storytelling and text splitting. **All plugins free since April 2025** ([CSS-Tricks](https://css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/)). |
| **Motion (motion.dev)** | Springs, layout and shared-element animation inside React islands. |
| **Lenis** | Smooth scrolling that keeps native scroll. Only use it if the narrative needs it, and disable it for reduced motion. |
| **Rive** | **The best fit for the mascot.** State machines let it react to gaze, hover and scroll, and files are tiny ([docs](https://rive.app/docs/editor/state-machine/state-machine)). |
| **Three.js / R3F** | At most one 3D moment, not the whole site. |
| **View Transitions API** | Morphing a thumbnail into a story. Same-document transitions are Baseline; cross-document ones work in Chrome and Safari. |
| **CSS scroll-driven animations** | Scroll-linked effects with no JS. Wrap them in `@supports`. |
| **use-sound** | Optional sound. Keep it off by default and behind a toggle. |

## 5. Anti-patterns

- **Scroll-jacking** hurts control and task success ([NN/g](https://www.nngroup.com/articles/scrolljacking-101/)). Change what happens on scroll, never how scrolling itself behaves.
- **Loaders or 3D in front of the content.** Show content first and add enhancements progressively.
- **Ignoring `prefers-reduced-motion`.** Pause looping animations when they’re offscreen.
- **Mascots or chatbots with no purpose.** It should guide or react, and visitors must be able to skip it.
- **Evidence hidden behind the gimmick.**
- **Accessibility gaps:** keyboard, focus, semantics, contrast, captions.
- **Performance regressions:** font layout shift, heavy scroll listeners, oversized video.
