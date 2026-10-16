// Everything the generated SVGs show. Edit here, then run `node scripts/build.mjs`.
//
// Icon specs:
//   'Animated/<file>'  → Icons/Animated (the original animated icon set)
//   'Logos/<file>'     → Icons/Logos (static brand logos, .svg or .png)
//   'lucide:<name>'    → a Lucide line icon from scripts/lucide.json, drawn in neon
// `mono: true` renders a dark single-colour logo in off-white so it stays visible on the dark cards.
// `recolor: { from: to }` swaps individual colours instead (e.g. a dark wordmark next to a coloured mark).

export const site = {
  name: 'Samiullah Akram',
  role: 'Full-Stack Developer',
  location: 'Lahore, Pakistan',
  email: 'samiullah.akram.3009@gmail.com',
  portfolio: 'https://samiullah-portfolio-orpin.vercel.app',
  availability: 'Available for remote & freelance work',
  intro: [
    { text: "Hi! I'm " },
    { text: 'Samiullah', strong: true },
    {
      text: ', a Full-Stack Developer who designs, builds and ships production web apps: AI-powered SaaS, real-time systems and payment-ready platforms with React, Next.js, TypeScript, Node.js and PostgreSQL.',
    },
  ],
  now: { role: 'Full-Stack Developer', company: 'JayTech Elite Firm', product: 'SmokeScreen V2' },
  stats: [
    { value: '13', label: ['Projects', 'built'] },
    { value: '2', suffix: '+', label: ['Years of', 'experience'] },
    { value: '4', label: ['AI products', 'shipped'] },
  ],
}

export const skillCategories = [
  {
    label: 'Languages',
    items: [
      { name: 'JavaScript', icon: 'Animated/javascript-original.svg' },
      { name: 'TypeScript', icon: 'Animated/typescript-original.svg' },
      { name: 'SQL', icon: 'lucide:database' },
    ],
  },
  {
    label: 'Frontend',
    items: [
      { name: 'Next.js', icon: 'Animated/nextjs-original.svg' },
      { name: 'React.js', icon: 'Animated/react-original.svg' },
      { name: 'Redux', icon: 'Animated/redux-original.svg' },
      { name: 'Tailwind CSS', icon: 'Animated/tailwindcss-original.svg' },
      { name: 'Vite', icon: 'Animated/vite.svg' },
      { name: 'HTML5', icon: 'Animated/html5-original.svg' },
      { name: 'CSS3', icon: 'Animated/css3-original.svg' },
      { name: 'React Hook Form', icon: 'Animated/reacthookform.svg' },
      { name: 'React Router', icon: 'Animated/reactrouter-original.svg' },
    ],
  },
  {
    label: 'Backend',
    items: [
      { name: 'Node.js', icon: 'Animated/nodejs-original.svg' },
      { name: 'Express.js', icon: 'Animated/express-original.svg', mono: true },
      { name: 'REST APIs', icon: 'lucide:route' },
      { name: 'GraphQL', icon: 'Logos/graphql.svg' },
      { name: 'Apollo Server', icon: 'Logos/apollo.svg' },
      { name: 'Socket.IO', icon: 'Animated/socketio-original.svg', mono: true },
      { name: 'WebSockets', icon: 'Logos/websocket.svg', mono: true },
      { name: 'WebRTC', icon: 'Animated/logos--webrtc.svg' },
      { name: 'JWT Auth', icon: 'Animated/jwt-icon.svg' },
      { name: 'OAuth', icon: 'Logos/oauth.svg' },
      { name: 'NextAuth.js', icon: 'Logos/nextauth.png' },
      { name: 'bcrypt', icon: 'lucide:key-round' },
      { name: 'Zod', icon: 'Animated/logos--zod.svg' },
      { name: 'Multer', icon: 'lucide:upload' },
      { name: 'EJS', icon: 'Animated/ejs.svg' },
      { name: 'Webhooks', icon: 'lucide:webhook' },
      { name: 'Resend', icon: 'Logos/resend.svg' },
    ],
  },
  {
    label: 'Payments',
    items: [
      { name: 'Stripe', icon: 'Logos/stripe.svg' },
      { name: 'Flutterwave', icon: 'lucide:banknote' },
      { name: 'Squad', icon: 'lucide:credit-card' },
    ],
  },
  {
    label: 'Databases',
    items: [
      { name: 'PostgreSQL', icon: 'Animated/postgresql-original.svg' },
      { name: 'Prisma ORM', icon: 'Animated/prisma-original.svg', mono: true },
      { name: 'pgvector', icon: 'lucide:boxes' },
      { name: 'Supabase', icon: 'Animated/supabase-original.svg' },
      { name: 'Row Level Security', icon: 'lucide:shield-check' },
      { name: 'MongoDB', icon: 'Animated/mongodb-original.svg' },
      { name: 'Mongoose', icon: 'Animated/mongoose-original.svg', recolor: { '#850000': '#e5484d' } },
      { name: 'DynamoDB', icon: 'Animated/dynamodb-original.svg' },
      { name: 'MySQL', icon: 'Animated/mysql-original.svg', recolor: { '#00618A': '#4ea9d8' } },
      { name: 'SQLite', icon: 'Animated/sqlite-original.svg' },
      { name: 'SQL Developer', icon: 'Animated/sqldeveloper-original.svg' },
    ],
  },
  {
    label: 'AI / RAG',
    items: [
      { name: 'Google Gemini', icon: 'Logos/gemini.svg' },
      { name: 'Groq (Llama 3.3)', icon: 'Animated/thesvg-color--groq.svg' },
      { name: 'Hugging Face', icon: 'Animated/logos--hugging-face-icon.svg' },
      { name: 'Claude', icon: 'Animated/logos--claude-icon.svg' },
      { name: 'OpenRouter', icon: 'Logos/openrouter.svg', mono: true },
      { name: 'fal.ai', icon: 'lucide:sparkles' },
      { name: 'MiniMax Voice', icon: 'Logos/minimax.svg', mono: true },
      { name: 'Decart Live AI', icon: 'lucide:video' },
      { name: 'RAG Pipelines', icon: 'lucide:brain' },
      { name: 'Vector Embeddings', icon: 'lucide:binary' },
      { name: 'Prompt Engineering', icon: 'lucide:wand' },
    ],
  },
  {
    label: 'Browser & Media',
    items: [
      { name: 'Web Audio API', icon: 'lucide:audio-waveform' },
      { name: 'WebAssembly', icon: 'Logos/webassembly.svg' },
      { name: 'Web Workers', icon: 'lucide:cpu' },
      { name: 'MediaRecorder', icon: 'lucide:film' },
      { name: 'Canvas API', icon: 'lucide:layers' },
    ],
  },
  {
    label: 'Animation',
    items: [
      { name: 'GSAP', icon: 'Animated/thesvg-color--gsap.svg' },
      { name: 'Framer Motion', icon: 'Logos/framermotion.svg', mono: true },
      { name: 'Lenis', icon: 'lucide:wind' },
    ],
  },
  {
    label: 'Testing',
    items: [
      { name: 'Jest', icon: 'Animated/jest.svg' },
      { name: 'Vitest', icon: 'Logos/vitest.svg' },
      { name: 'Supertest', icon: 'lucide:flask-conical' },
      { name: 'Playwright', icon: 'Logos/playwright.svg' },
    ],
  },
  {
    label: 'Cloud & DevOps',
    items: [
      { name: 'Docker', icon: 'Animated/docker-original.svg' },
      { name: 'Kubernetes', icon: 'Animated/kubernetes-original.svg' },
      { name: 'AWS', icon: 'Animated/devicon--amazonwebservices.svg', recolor: { '#252f3e': '#ededed' } },
      { name: 'AWS EC2', icon: 'Animated/logos--aws-ec2.svg' },
      { name: 'AWS ECS', icon: 'Animated/aws-ecs.svg' },
      { name: 'AWS ECR', icon: 'lucide:container' },
      { name: 'OpenShift', icon: 'Animated/logos--openshift.svg' },
      { name: 'Serverless', icon: 'Animated/serverless.svg' },
      { name: 'Microservices', icon: 'lucide:blocks' },
      { name: 'Nginx', icon: 'Animated/nginx-original.svg' },
      { name: 'GitHub Actions', icon: 'Animated/githubactions-original.svg' },
    ],
  },
  {
    label: 'Deployment',
    items: [
      { name: 'Vercel', icon: 'Animated/vercel.svg', mono: true },
      { name: 'Railway', icon: 'Animated/railway.svg' },
      { name: 'Render', icon: 'Logos/render.svg', mono: true },
      { name: 'Hostinger', icon: 'Logos/hostinger.svg', mono: true },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Git', icon: 'Animated/git-original.svg' },
      { name: 'GitHub', icon: 'Animated/github-original.svg', mono: true },
      { name: 'VS Code', icon: 'Animated/vscode-original.svg' },
      { name: 'Postman', icon: 'Animated/postman.svg' },
      { name: 'Cloudinary', icon: 'Logos/cloudinary.svg' },
      { name: 'Monaco Editor', icon: 'lucide:square-code' },
      { name: 'Recharts', icon: 'lucide:chart-line' },
    ],
  },
  {
    label: 'Design',
    items: [
      { name: 'UI/UX Design', icon: 'lucide:pen-tool' },
      { name: 'Design Systems', icon: 'lucide:component' },
      { name: 'Responsive Design', icon: 'lucide:monitor-smartphone' },
    ],
  },
]

// How the stack panels are laid out in the README: a single label is a full-width panel,
// a pair is two half-width panels shown side by side.
export const stackLayout = [
  ['Languages', 'Payments'],
  ['Frontend'],
  ['Backend'],
  ['Databases'],
  ['AI / RAG'],
  ['Browser & Media'],
  ['Animation', 'Design'],
  ['Cloud & DevOps'],
  ['Testing', 'Deployment'],
  ['Tools'],
]

// Tag names used on project cards that differ from the skill names above.
export const tagAliases = {
  React: 'React.js',
  Express: 'Express.js',
  Prisma: 'Prisma ORM',
  Groq: 'Groq (Llama 3.3)',
  'Gemini AI': 'Google Gemini',
  JWT: 'JWT Auth',
  'Live AI Video': 'lucide:video',
}

export const headings = [
  { slug: 'about', index: '01', kicker: 'About', title: 'This is me' },
  {
    slug: 'stack',
    index: '02',
    kicker: 'Skills',
    title: 'My Stack',
    aside: '{skillCount} languages, frameworks, services and tools I use to design, build, test and ship.',
  },
  {
    slug: 'projects',
    index: '03',
    kicker: 'Work',
    title: 'Selected Projects',
    aside: "A few products I've designed, built and deployed, from a live AI video SaaS to RAG chatbots and real-time apps.",
  },
  { slug: 'education', index: '04', kicker: 'Learning', title: 'Education' },
  {
    slug: 'activity',
    index: '05',
    kicker: 'Activity',
    title: 'On GitHub',
    aside: 'Commits, streaks and contributions, refreshed automatically.',
  },
]

export const strengths = [
  {
    icon: 'brain',
    title: 'AI & RAG products',
    desc: 'RAG pipelines built from scratch (chunking, embeddings, pgvector search) and LLM features with Gemini, Groq and MiniMax.',
  },
  {
    icon: 'radio',
    title: 'Real-time systems',
    desc: 'WebRTC video, Socket.IO and live AI video streaming with per-second credit billing and clean session recovery.',
  },
  {
    icon: 'credit-card',
    title: 'Payments & SaaS billing',
    desc: 'Stripe, Flutterwave and Squad with signed webhooks, idempotent fulfillment, credits, plans and multi-currency pricing.',
  },
  {
    icon: 'rocket',
    title: 'Design to deployment',
    desc: 'Design systems and responsive UI, then tests (Jest, Vitest, Playwright), CI/CD, Docker and deploys to Vercel, Railway and Hostinger.',
  },
]

// Project cards. `screen` is a 16:9 WebP in assets/screens. `wide: true` renders the full-width feature card.
export const projects = [
  {
    slug: 'smokescreen',
    title: 'SmokeScreen',
    subtitle: 'Live AI video transformation SaaS',
    eyebrow: 'Client project · JayTech Elite Firm',
    url: 'smokescreenapp.com',
    status: 'V1 LIVE',
    wide: true,
    tags: ['Node.js', 'Express', 'Supabase', 'Live AI Video', 'Flutterwave', 'Google Gemini', 'Jest', 'GitHub Actions'],
    stats: [
      { value: '35+', label: 'Pages designed & built' },
      { value: '16', label: 'Live AI scenes' },
      { value: '3', label: 'AI creative tools' },
      { value: 'USD · NGN', label: 'Two-currency billing' },
    ],
  },
  {
    slug: 'chatspark',
    title: 'ChatSpark AI',
    subtitle: 'RAG-based AI chatbot SaaS',
    eyebrow: 'Flagship · 2026',
    url: 'chatspark-ai-9hwh.vercel.app',
    status: 'LIVE',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'pgvector', 'Groq', 'NextAuth.js'],
  },
  {
    slug: 'codemeet',
    title: 'CodeMeet AI',
    subtitle: 'Real-time technical interview platform',
    eyebrow: 'AI · Real-time · 2026',
    url: 'github.com/Samiullah-2004/codemeet-ai',
    status: 'SOURCE',
    tags: ['Next.js', 'TypeScript', 'WebRTC', 'Socket.IO', 'DynamoDB', 'Gemini AI'],
  },
  {
    slug: 'comptoir',
    title: 'Comptoir',
    subtitle: 'Full-stack restaurant ordering platform',
    eyebrow: 'Full-stack · 2026',
    url: 'comptoir-food.vercel.app',
    status: 'LIVE',
    tags: ['React', 'TypeScript', 'GraphQL', 'PostgreSQL', 'Socket.IO', 'Stripe'],
  },
  {
    slug: 'resumeforge',
    title: 'ResumeForge AI',
    subtitle: 'AI resume tailoring platform',
    eyebrow: 'AI · 2026',
    url: 'resumeforge-puce.vercel.app',
    status: 'LIVE',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'Prisma', 'Groq', 'JWT'],
  },
  {
    slug: 'billmate',
    title: 'BillMate',
    subtitle: 'Freelance invoicing SaaS',
    eyebrow: 'SaaS · 2025',
    url: 'bill-mate-three.vercel.app',
    status: 'LIVE',
    tags: ['React', 'Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'Prisma'],
  },
  {
    slug: 'stowe',
    title: 'Stowe',
    subtitle: 'Full-stack e-commerce store',
    eyebrow: 'E-commerce · 2025',
    url: 'github.com/Samiullah-2004/Stowe',
    status: 'SOURCE',
    tags: ['Node.js', 'Express', 'MongoDB', 'Mongoose', 'JWT', 'Multer'],
  },
]

export const contact = {
  eyebrow: 'Have a project in mind?',
  lines: [[{ text: "Let's build" }], [{ text: 'Something ' }, { text: 'great', neon: true }]],
  note: "Whether it's a full-time remote role, a freelance build or a quick question, my inbox is always open.",
  facts: [
    { label: 'Based in', value: 'Lahore, Pakistan' },
    { label: 'Open to', value: 'Remote roles & freelance' },
  ],
}

// Pill buttons under the hero and in the footer.
export const buttons = [
  { slug: 'email', label: 'Email me', icon: 'lucide:mail', primary: true },
  { slug: 'linkedin', label: 'LinkedIn', icon: 'Logos/linkedin.svg' },
  { slug: 'upwork', label: 'Upwork', icon: 'Logos/upwork.svg' },
  { slug: 'portfolio', label: 'Portfolio', icon: 'lucide:globe' },
]
