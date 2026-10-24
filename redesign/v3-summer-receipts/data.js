/* v3 · Summer receipts. Project content is shared with v1 (taken from Aatisha's case studies in src/**).
   The `summer` block at the bottom is new. Items marked TODO need her confirmation. */
window.IMG = '../../src/assets/images/';

(() => {
const I = window.IMG;

window.DATA = {
  email: 'hello@aatishacyrill.com',
  resume: '../../src/assets/resume/Aatisha_Cyrill_UX.pdf',
  links: {
    linkedin: 'https://www.linkedin.com/in/aatisha-cyrill/',
    medium: 'https://medium.com/@cyrillaatisha',
    github: 'https://github.com/Aatisha',
  },

  projects: [
    {
      id: 'myworker',
      title: 'MyWorker.AI',
      kicker: 'Conversational AI · 2025',
      line: 'Alex, an AI sales teammate that knows when to ask before it acts.',
      metric: ['~6 hrs', 'saved per founder, weekly'],
      tint: '#E9E5FB', tintDeep: '#D6CFF7', ink: '#3B2F86',
      papers: [I + 'myworkerai/lead1.png', I + 'myworkerai/dont-know.png', I + 'myworkerai/myworkerai-hero.png'],
      meta: { Role: 'Product Designer, Research Lead', Timeline: 'Jun – Sep 2025 · 12 weeks', Team: '5 designers', Tools: 'Figma, Figma Make, Google Veo, UX Pilot, Claude, ChatGPT' },
      question: 'How do you design an AI assistant that feels genuinely helpful and human-aware while it automates the repetitive parts of sales?',
      heard: [
        ['They don’t have time for a tour.', 'Founders, usability round 1'],
        ['Users needed more control over the email template to build trust.', 'Usability round 2'],
        ['Along with leads, founders need company size, roles and industry to match their ICP.', 'Usability round 2'],
      ],
      insight: 'Founders want AI to handle the mechanics and amplify their authenticity, not replace their personal touch.',
      moves: [
        ['Killed our own demo video', 'Every founder skipped it, every time. We pivoted to letting them experience the value directly.'],
        ['Designed for trust', 'Citations and confidence on every claim, editable email drafts, and a clear “AI may be inaccurate” boundary.'],
        ['Made the AI measurable', 'Three dashboards covering conversation depth, trust signals (thumbs-up, edit rate, latency) and business outcomes.'],
      ],
      outcome: [['~6 hrs', 'saved per founder each week (est.)'], ['12', 'founders in research and testing'], ['SF Tech Week', 'MVP presented at Big Design Energy']],
      next: 'Longitudinal testing of trust. Does the “approachable” first impression hold after week four?',
      gallery: [I + 'myworkerai/citation-confidence.png', I + 'myworkerai/lead-generation.png'],
      caseStudy: 'https://aatishacyrill.com/myworker.ai/',
    },
    {
      id: 'minds',
      title: 'MINDS@UW',
      kicker: 'Research repository · 2024',
      line: 'A 32,000-item academic repository that researchers can finally find their way around.',
      metric: ['65%', 'faster report generation'],
      tint: '#F7E4E6', tintDeep: '#EFCDD1', ink: '#8A1C2B',
      papers: [I + 'minds/analytics-overview.png', I + 'minds/collections-final-design.png', I + 'minds/minds-banner.png'],
      meta: { Role: 'UX Researcher, Designer & Writer', Timeline: 'Mar – Sep 2024', Team: 'Librarians, engineers, data analysts', Tools: 'Figma, FigJam, BrowserStack a11y' },
      question: 'Why do researchers across the UW system feel lost inside their own university’s repository?',
      heard: [
        ['Navigation is “a guessing game.”', 'Researcher interview'],
        ['Closed collections caused confusion. Access had to go through a library loan that nobody communicated.', 'Access barriers'],
        ['The platform looked like a Madison-only tool.', 'Identity issues'],
      ],
      insight: 'MINDS was designed around administrators, which left the everyday researchers who use it struggling.',
      moves: [
        ['Clear paths for top tasks', '“Make a Deposit” and “Browse Communities” became first-class calls to action.'],
        ['An analytics dashboard', 'Built with data analysts and engineers to show each campus’s contributions and impact.'],
        ['Accessible by default', 'A design system with high-contrast type, tested with colour-blindness simulations.'],
      ],
      outcome: [['65%', 'less time to generate reports'], ['−50%', 'support requests (projected)'], ['3,000+', 'researchers served']],
      next: 'Measure the real drop in support tickets after launch and validate the dashboard with campus admins.',
      gallery: [I + 'minds/Dashboard-GeographicalReach-Hi-Fi.png', I + 'minds/homepage-final-design.png'],
      caseStudy: 'https://aatishacyrill.com/minds/',
    },
    {
      id: 'shopbop',
      title: 'Amazon × Shopbop',
      kicker: 'Social discovery · 2024',
      line: '“This or that?” A pairwise game that learns your style without a quiz.',
      metric: ['1 tap', 'per style decision'],
      tint: '#FCE7DE', tintDeep: '#F7D2C1', ink: '#9A3412',
      papers: [I + 'amazon-shopbop/AddedToBag.png', I + 'amazon-shopbop/shopbop-trending.png', I + 'amazon-shopbop/solution2.png'],
      meta: { Role: 'UX Designer & Front-end Developer', Timeline: 'Sep – Dec 2024', Team: '4 · Amazon–Shopbop partnership', Tools: 'Figma, AWS Personalize, Miro' },
      question: 'How can a fashion catalogue make people want to engage with it, instead of just scrolling past?',
      heard: [
        ['I’m not great at styling outfits, so it would help to see what’s trending and get recommendations.', 'Student interview'],
        ['The platform needs to be simple and visually appealing to keep my interest.', 'Student interview'],
        ['We want to engage our customers with the constantly changing fashion industry.', 'Shopbop stakeholder'],
      ],
      insight: 'Choosing between two things is easy. Describing your taste is hard. So let people compare.',
      moves: [
        ['Pairwise ranking', 'Two looks, one tap. Each choice trains ML-powered recommendations.'],
        ['Trending leaderboards', 'Social validation: see what everyone else is picking this week.'],
        ['Built it too', 'I wrote the front end and owned the product backlog with the Agile team.'],
      ],
      outcome: [['3', 'core features taken to prototype'], ['4', 'person cross-functional team'], ['2', 'industry stakeholder interviews']],
      next: 'A/B test pairwise onboarding against a classic style quiz on completion and retention.',
      gallery: [I + 'amazon-shopbop/solution3.png', I + 'amazon-shopbop/shopbop-ranking.png'],
      caseStudy: 'https://aatishacyrill.com/amazon-shopbop/',
    },
    {
      id: 'research',
      title: 'Trader Joe’s + Rover',
      kicker: 'Field research · 2023–24',
      line: 'Two studies, one lesson: people want to trust the path in front of them.',
      metric: ['64%', 'wanted to check stock first'],
      tint: '#DFF3E9', tintDeep: '#C7EAD8', ink: '#0F6B4A',
      papers: [I + 'rover/rover-homepage.png', I + 'trader-joes/affinity-mapping.jpg', I + 'trader-joes/contextual-inquiry.png'],
      meta: { Role: 'UX Researcher', Timeline: 'Oct 2023 – Dec 2024', Team: '3 (Trader Joe’s) · solo (Rover)', Tools: 'Qualtrics, Miro, FigJam, Google Forms' },
      question: 'How do you improve a store that refuses to do e-commerce? And why does booking a pet sitter take seven minutes?',
      heard: [
        ['Sometimes it’s hard to find what I’m looking for.', 'Trader Joe’s shopper'],
        ['I searched for sitters with cat experience, but still scrolled through profiles with no mention of cats.', 'Rover, participant A'],
        ['I follow a lot of recipes and struggle to find all the ingredients in-store.', 'Trader Joe’s shopper'],
      ],
      insight: 'Keep Trader Joe’s offline-first and its “treasure hunt” intact. Just help people find the treasure.',
      moves: [
        ['Mixed methods', '9 interviews, 6 contextual inquiries in the aisles and a 25+ person survey (TJ). Moderated sessions using SEQ, time-on-task and error rate (Rover).'],
        ['Find-in-store & recipe-to-list', 'Recommendations that improve the store visit without adding e-commerce.'],
        ['Species-specific filters & upfront pricing', 'Rover fixes ranked by severity, backed by participant quotes.'],
      ],
      outcome: [['64%', 'wanted a stock check before visiting'], ['40%', 'struggled with in-store navigation'], ['5–7 min', 'on a task expected to take 1–2 (Rover)']],
      next: 'Prototype Find In-Store with store managers and pilot “What’s New” with analytics.',
      gallery: [I + 'trader-joes/affinity-diagram-session.png', I + 'rover/solution1.png'],
      caseStudy: 'https://aatishacyrill.com/trader-joes/',
    },
  ],

  more: [
    { title: 'Sustain Dane', kicker: 'Behaviour design · 2024', line: 'Turning climate concern into small, social wins.', img: I + 'sustainable-ux/hero-mockup.png', href: 'https://aatishacyrill.com/sustainable-ux/' },
    { title: 'SSEC Products', kicker: 'Climate data · 2024', line: 'Near real-time polar satellite data, finally browsable.', img: I + 'ssec-products/homepage-screen.png', href: 'https://aatishacyrill.com/ssec-products/' },
  ],

  // Timeline in fractional years. The UW–Madison dates are a TODO for Aatisha to confirm.
  journey: {
    start: 2023.6, end: 2027.25, now: 2026.73,
    lanes: [
      [{ t: 'UW–Madison', s: 'Graduate studies · Information School', a: 2023.67, b: 2025.0, kind: 'edu' }],
      [{ t: 'Trader Joe’s', s: 'UX research study', a: 2023.75, b: 2023.98, id: 'research' },
       { t: 'MINDS@UW', s: 'UX researcher & designer', a: 2024.17, b: 2024.7, id: 'minds' },
       { t: 'Rover', s: 'Usability study', a: 2024.75, b: 2024.98, id: 'research' },
       { t: 'MyWorker.AI', s: 'Product designer, research lead', a: 2025.42, b: 2025.72, id: 'myworker' },
       { t: 'Your team?', s: 'Open to product design roles', a: 2026.73, b: 2027.25, kind: 'next' }],
      [{ t: 'Sustain Dane', s: 'Mobile app design', a: 2024.0, b: 2024.4 },
       { t: 'Amazon × Shopbop', s: 'UX designer & front-end dev', a: 2024.67, b: 2024.98, id: 'shopbop' }],
      [{ t: 'SSEC', s: 'UI/UX design intern', a: 2024.58, b: 2024.7 }],
    ],
  },

  // Real quotes and insights, grouped the way an affinity map would group them
  affinity: {
    clusters: [
      { name: 'Findability', insight: 'If people can’t find it, it might as well not exist.' },
      { name: 'Trust & control', insight: 'Trust is built when AI feels human-aware, not manipulative.' },
      { name: 'Time', insight: 'Time is the scarcest resource. Every screen has to earn it.' },
    ],
    notes: [
      ['Navigation is “a guessing game.”', 'MINDS@UW', 0, '#FFE9A8'],
      ['Hard to find what I’m looking for.', 'Trader Joe’s', 0, '#FFE9A8'],
      ['Still scrolled past sitters with no mention of cats.', 'Rover', 0, '#FFE9A8'],
      ['40% struggled with in-store navigation.', 'Survey', 0, '#FFE9A8'],
      ['Needed more control over the email template.', 'MyWorker.AI', 1, '#FFD4DD'],
      ['Lack of cost transparency.', 'Rover', 1, '#FFD4DD'],
      ['AI should amplify, not replace, my personal touch.', 'Founders', 1, '#FFD4DD'],
      ['We don’t have time for a tour.', 'MyWorker.AI', 2, '#CFE6FF'],
      ['Don’t make me read long copy.', 'MyWorker.AI', 2, '#CFE6FF'],
      ['Simple and visual, or I lose interest.', 'Shopbop', 2, '#CFE6FF'],
      ['5–7 minutes on a 1–2 minute task.', 'Rover', 2, '#CFE6FF'],
    ],
  },

  lab: [
    { title: 'AR networking card', meta: 'WebAR · experiment', body: 'A business card that comes alive when you point a phone at it.', href: 'https://mywebar.com/p/Project_0_uxjef8rr00', kind: 'ar' },
    { title: 'Plant health monitor', meta: 'Arduino · Embedded C · 2018', body: 'My first user was a plant. Soil, temperature and humidity sensors, with LEDs that blink when it’s thirsty.', kind: 'plant' },
    { title: 'Online assessment platform', meta: 'Angular · Spring Boot · 2019', body: 'An in-browser compiler, a chatbot and a forum for coding practice, built solo.', kind: 'code' },
    { title: 'Writing', meta: 'Medium', kind: 'writing', posts: [
      ['Ethics in UX: When does design become manipulation?', 'https://medium.com/design-bootcamp/ethics-in-ux-when-does-design-become-manipulation-3b815d3fba29'],
      ['The Process of Developing Personas', 'https://medium.com/design-bootcamp/the-process-of-developing-personas-7262c10367e6'],
      ['Conducting User Research Interviews', 'https://medium.com/@cyrillaatisha/conducting-user-research-interviews-26d90d808591'],
      ['Unpacking Surveys', 'https://medium.com/@cyrillaatisha/unpacking-surveys-26b727bf278b'],
    ] },
    { title: 'Literati Women', meta: 'Branding · moodboards', body: 'A brand identity exploration for a platform for women writers.', img: I + 'literati-women/moodboard-1.jpg', kind: 'img' },
  ],

  books: [
    ['The God of Small Things', 'the-god-of-small-things.jpg'], ['The Design of Everyday Things', 'don-norman.jpg'],
    ['Eleanor Oliphant Is Completely Fine', 'eleanor-oliphant.jpg'], ['White Nights', 'white-nights.jpg'],
    ['Norwegian Wood', 'norwegian-woods.jpg'], ['The Lonely City', 'the-lonely-city.jpg'],
    ['To Kill a Mockingbird', 'to-kill-a-mockingbird.jpg'], ['Invisible Planets', 'invisible-planets.jpg'],
    ['The Stranger', 'the-stranger.jpg'], ['The Lowland', 'the-lowland.jpg'], ['Less', 'less.jpg'],
    ['Wuthering Heights', 'wuthering-heights.jpg'], ['Roman Stories', 'roman-stories.jpg'],
    ['In Search of Schrödinger’s Cat', 'john-gribbin.jpeg'], ['Things That Can and Cannot Be Said', 'john-cusack.jpg'],
  ],

  // Hand-written answers for ⌘K. Aatisha should rewrite these in her own voice (TODO).
  ask: [
    ['What roles are you looking for?', 'Product design roles, especially where research and AI meet. I do my best work on teams that prototype early and talk to users often.'],
    ['What’s your favourite project?', 'MyWorker.AI. We killed our own demo video after founders skipped it every single time. It was the best lesson in humility I’ve had.'],
    ['How do you use AI in your process?', 'As a sparring partner. Claude and ChatGPT for first-pass synthesis, Figma Make and UX Pilot for fast prototypes, Google Veo for motion. People still make the calls.'],
    ['Can you code?', 'Yes. Angular, Spring Boot, PHP, HTML/CSS/JS, and Arduino in a past life. I built the Shopbop front end myself.'],
  ],
};
/* ---------------- v3 · the summer edition ---------------- */
window.DATA.summer = {
  // Optional: drop a sparkling-water clip here (e.g. 'ocean.mp4') and it replaces the live WebGL sea.
  oceanVideo: null,

  // Treasure hunt: quotes Aatisha has collected. Each treasure grows Tish one leaf.
  // TODO(Aatisha): swap in your own list. Only the Christina Koch quote came from you; the others are placeholders.
  treasures: [
    { id: 'scallop', name: 'scallop shell', hint: 'Look in the sand, right under my name.',
      quote: 'In the midst of winter, I found there was, within me, an invincible summer.',
      by: 'Albert Camus', src: 'Return to Tipasa, 1952', why: 'The whole reason this site is always summer.' },
    { id: 'starfish', name: 'starfish', hint: 'Something’s stuck to the big folder in Work.',
      quote: 'We will always choose Earth, we will always choose each other.',
      by: 'Christina Koch', src: 'Artemis II, 2026', why: 'Said on the way around the Moon. A pretty good design brief, too.' },
    { id: 'seaglass', name: 'piece of sea glass', hint: 'Scroll through How I work until the notes settle.',
      quote: 'Tell me, what is it you plan to do with your one wild and precious life?',
      by: 'Mary Oliver', src: 'The Summer Day, 1990', why: 'I reread this at the start of every summer.' },
    { id: 'conch', name: 'conch shell', hint: 'Open any story and read all the way to the end.',
      quote: 'Another world is not only possible, she is on her way. On a quiet day, I can hear her breathing.',
      by: 'Arundhati Roy', src: 'War Talk, 2003', why: 'Hold a conch to your ear and you hear the sea. Hold this one and you hear hope.' },
    { id: 'sanddollar', name: 'sand dollar', hint: 'Check the end of my bookshelf.',
      quote: 'For whatever we lose (like a you or a me), it’s always ourselves we find in the sea.',
      by: 'E. E. Cummings', src: 'maggie and milly and molly and may, 1958', why: 'Every beach trip, without fail.' },
    { id: 'bottle', name: 'message in a bottle', final: true, hint: 'Something just washed ashore at the very bottom.',
      quote: 'I design with the hope of creating impact, even if just a little. Thank you for finding every treasure. Now come say hi?',
      by: 'Aatisha', src: 'a note to you', why: '' },
  ],

  // About: an envelope of summer prints.
  prints: [
    { src: I + 'hero-image.jpg', cap: 'hi, it’s me', note: 'Product designer, researcher, and a summer person all year round.' },
    { src: I + 'hero-image-sf.jpg', cap: 'golden gate, golden hour', note: 'I walk cities the way I read interviews: slowly, looking for the detail everyone skips.' },
    { src: I + 'about/seattle-thumbnail.png', cap: 'amor fati, seattle', note: 'A rainy city, and somehow I only ever remember the sunny days.' },
    { src: I + 'about/san-francisco-thumbnail.png', cap: 'sunset in SF', note: 'Travel taught me that every place is a story, and every story has a user.' },
    { src: I + 'about/new-york-thumbnail.png', cap: 'collecting moments, NYC', note: 'I collect moments the way I collect quotes. A few are hidden on this page.' },
    { src: I + 'about/palm-springs.png', cap: 'palm springs', note: 'Pastel buildings, palm trees, zero clouds. Basically my mood board.' },
  ],
};
})();
