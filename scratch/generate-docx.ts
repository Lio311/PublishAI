import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  TableLayoutType,
} from "docx";
import * as fs from "fs";

const BRAND_COLOR = "4F46E5";
const HEADER_BG = "EEF2FF";
const LIGHT_GRAY = "F8FAFC";
const WHITE = "FFFFFF";

function headerCell(text: string, width?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: WHITE, font: "Calibri" })],
        spacing: { before: 60, after: 60 },
        alignment: AlignmentType.LEFT,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: BRAND_COLOR },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function cell(text: string, opts?: { bold?: boolean; bg?: string }): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 20,
            bold: opts?.bold ?? false,
            font: "Calibri",
          }),
        ],
        spacing: { before: 40, after: 40 },
      }),
    ],
    shading: opts?.bg ? { type: ShadingType.SOLID, color: opts.bg } : undefined,
  });
}

function makeTable(headers: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
    rows: [
      new TableRow({ children: headers.map((h) => headerCell(h)), tableHeader: true }),
      ...rows.map(
        (r, i) =>
          new TableRow({
            children: r.map((c, ci) =>
              cell(c, { bold: ci === 0, bg: i % 2 === 0 ? LIGHT_GRAY : WHITE })
            ),
          })
      ),
    ],
  });
}

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 300, after: 120 },
  });
}

function para(text: string, opts?: { bold?: boolean; italic?: boolean; spacing?: number }) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: 22,
        bold: opts?.bold,
        italics: opts?.italic,
        font: "Calibri",
      }),
    ],
    spacing: { after: opts?.spacing ?? 120 },
  });
}

function bulletPara(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Calibri" })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function emptyLine() {
  return new Paragraph({ children: [], spacing: { after: 100 } });
}

async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // ==================== TITLE PAGE ====================
          new Paragraph({ children: [], spacing: { after: 600 } }),
          new Paragraph({
            children: [
              new TextRun({
                text: "PublishAI",
                size: 56,
                bold: true,
                color: BRAND_COLOR,
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Third-Party Materials Inventory & Pricing Model",
                size: 32,
                color: "64748B",
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Prepared for: ", size: 24, color: "64748B", font: "Calibri" }),
              new TextRun({ text: "Moran", size: 24, bold: true, font: "Calibri" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Date: September 24, 2026",
                size: 24,
                color: "64748B",
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Version: 1.1  |  Confidential",
                size: 24,
                color: "64748B",
                font: "Calibri",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),

          // ==================== PART 1 ====================
          heading("Part 1: Complete Third-Party Materials Inventory", HeadingLevel.HEADING_1),

          // --- 1. AI Models ---
          heading("1. AI Models & APIs (Paid Services)", HeadingLevel.HEADING_2),
          para(
            "PublishAI uses a multi-model topology across three leading AI providers. Different models are selected for different tasks based on their strengths."
          ),
          makeTable(
            ["Provider", "Model", "Usage in PublishAI", "Pricing"],
            [
              [
                "Anthropic",
                "claude-3-7-sonnet-20250219",
                "Primary model: academic writing, peer review simulation, response to reviewers, literature synthesis, debate (Reviewer 2)",
                "Per-token",
              ],
              [
                "Anthropic",
                "claude-3-5-haiku-20241022",
                "Fast text manipulations, figure legend improvement",
                "Per-token",
              ],
              [
                "Anthropic",
                "claude-3-5-sonnet-20240620\n(and 20241022)",
                "Code generation, data analysis script generation",
                "Per-token",
              ],
              [
                "Anthropic",
                "claude-3-opus-20240229",
                "Available for complex agent reasoning tasks",
                "Per-token",
              ],
              [
                "OpenAI",
                "gpt-4o",
                "Abstract generation, methodology verification (Vision), statistical data extraction from charts, debate (Reviewer 1)",
                "Per-token",
              ],
              [
                "OpenAI",
                "gpt-4o-mini",
                "Fast telemetry: extracting user feedback and learning rules",
                "Per-token",
              ],
              [
                "OpenAI",
                "o1-preview",
                "Area Chair meta-reviewer: advanced reasoning & decision synthesis",
                "Per-token",
              ],
              [
                "Google",
                "gemini-1.5-pro-latest",
                "Debate (Reviewer 3): novelty & synergies discovery",
                "Per-token",
              ],
            ]
          ),
          emptyLine(),
          para(
            "Key architectural differentiator: Three different AI providers run concurrently for the debate/review simulation, with an OpenAI reasoning model synthesizing the results.",
            { bold: true, italic: true }
          ),

          // --- 2. Academic APIs ---
          heading("2. External Academic APIs (Free / Open Access)", HeadingLevel.HEADING_2),
          makeTable(
            ["API", "Endpoint", "Purpose", "Cost"],
            [
              [
                "PubMed / NCBI E-Utilities",
                "eutils.ncbi.nlm.nih.gov/entrez/eutils",
                "Biomedical literature search & article metadata retrieval",
                "Free (API key recommended)",
              ],
              [
                "Crossref",
                "api.crossref.org",
                "DOI-based citation metadata, journal metadata registry",
                "Free (polite pool)",
              ],
              [
                "Semantic Scholar",
                "api.semanticscholar.org/graph/v1",
                "Paper search, citation graph data, abstracts",
                "Free (API key for rate limits)",
              ],
              [
                "arXiv",
                "export.arxiv.org/api",
                "Preprint search across physics, CS, math, biology",
                "Free",
              ],
            ]
          ),
          emptyLine(),

          // --- 2b. Data & Datasets ---
          heading("2b. Data & Datasets", HeadingLevel.HEADING_3),
          para("PublishAI does NOT train on, import, copy, or store any third-party static datasets (e.g., proprietary article databases, Kaggle data dumps, etc.). All academic literature and metadata are accessed dynamically and transiently in real-time via the approved Open Access APIs listed above. Therefore, there are no external dataset licensing dependencies.", { italic: true }),
          emptyLine(),

          // --- 3. Cloud Infrastructure ---
          heading("3. Cloud Infrastructure & Services (Paid)", HeadingLevel.HEADING_2),
          makeTable(
            ["Service", "Provider", "Purpose", "Pricing Model"],
            [
              [
                "Neon Serverless Postgres",
                "Neon",
                "Primary database (PostgreSQL), serverless scaling, branching",
                "Free tier + pay-per-compute",
              ],
              [
                "Vercel",
                "Vercel",
                "Hosting, deployment, serverless functions (Next.js)",
                "Free tier + pay-per-use",
              ],
              [
                "Vercel Blob",
                "Vercel",
                "File storage for uploaded manuscripts & data files",
                "Pay-per-storage/bandwidth",
              ],
              [
                "Upstash Redis",
                "Upstash",
                "Rate limiting (sliding window), serverless Redis",
                "Free tier + pay-per-request",
              ],
              [
                "E2B Code Interpreter",
                "E2B",
                "Sandboxed Python execution for statistical verification",
                "Pay-per-sandbox-minute",
              ],
              [
                "Inngest",
                "Inngest",
                "Background job orchestration, event-driven workflows, cron",
                "Free tier + pay-per-run",
              ],
              [
                "Hugging Face Spaces",
                "Hugging Face",
                "Deploy reproducible research agents as MCP servers",
                "Free tier + paid compute",
              ],
              [
                "SMTP Provider",
                "Configurable",
                "Production email delivery (configurable host)",
                "Depends on provider",
              ],
            ]
          ),

          // --- 4. Auth Providers ---
          heading("4. Authentication Providers (Free)", HeadingLevel.HEADING_2),
          para("All powered by NextAuth.js v5 with Drizzle Adapter for database-backed sessions."),
          makeTable(
            ["Provider", "Method", "Purpose"],
            [
              ["Google OAuth 2.0", "OAuth", "Primary user login (university accounts)"],
              ["GitHub OAuth", "OAuth", "Developer/researcher login"],
              ["Credentials", "Username/Password", "Fallback/admin access"],
            ]
          ),

          // --- 5. Submission Adapters ---
          heading("5. Submission Platform Adapters (Target Systems)", HeadingLevel.HEADING_2),
          makeTable(
            ["Platform", "Adapter Type", "Protocol"],
            [
              ["Open Journal Systems (OJS)", "REST API adapter + MCP Server", "OJS REST API v3"],
              ["Editorial Manager", "RPA (Browser Automation)", "Generic UI Navigator"],
              ["WordPress", "REST API adapter + MCP Server", "WordPress REST API"],
              ["Email-based Journals", "SMTP adapter", "Email with attachments"],
              ["ScholarOne", "Planned / In Development", "RPA / API"],
              ["eJournalPress", "Planned / In Development", "RPA / API"],
            ]
          ),
          emptyLine(),
          para("Note on Editorial Manager: As most Editorial Manager instances do not expose a public REST API for submissions, this integration relies on an RPA (Robotic Process Automation) browser-automation pathway rather than a standard API connection. Integrations for ScholarOne and eJournalPress are currently on the near-term product roadmap.", { italic: true }),
          emptyLine(),

          // --- 6. Open-Source Libraries ---
          heading("6. Open-Source Libraries & Frameworks", HeadingLevel.HEADING_2),

          para("Core Framework", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["Next.js", "16.3.5", "MIT", "Full-stack React framework (App Router)"],
              ["React", "19.2.8", "MIT", "UI component library"],
              ["React DOM", "19.2.8", "MIT", "DOM rendering"],
              ["TypeScript", "^5", "Apache-2.0", "Type-safe development"],
            ]
          ),
          emptyLine(),

          para("AI & Agent Orchestration", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["Vercel AI SDK (ai)", "^7.0.106", "Apache-2.0", "Unified AI model interface, streaming, structured output"],
              ["@ai-sdk/openai", "^4.0.70", "Apache-2.0", "OpenAI provider for Vercel AI SDK"],
              ["@ai-sdk/anthropic", "^4.0.57", "Apache-2.0", "Anthropic provider for Vercel AI SDK"],
              ["@ai-sdk/google", "^4.0.76", "Apache-2.0", "Google AI provider for Vercel AI SDK"],
              ["@anthropic-ai/sdk", "^0.125.0", "MIT", "Direct Anthropic API client (streaming)"],
              ["@modelcontextprotocol/sdk", "^1.30.0", "MIT", "MCP server implementation for tool-use agents"],
              ["@huggingface/hub", "^2.17.3", "MIT", "HuggingFace API: repo creation, commits, Space deployment"],
            ]
          ),
          emptyLine(),

          para("Database & ORM", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["Drizzle ORM", "^0.45.2", "Apache-2.0", "Type-safe SQL ORM for PostgreSQL"],
              ["Drizzle Kit", "^0.31.10", "Apache-2.0", "Schema migrations & introspection"],
              ["@neondatabase/serverless", "^1.1.0", "MIT", "Neon serverless PostgreSQL driver"],
              ["@auth/drizzle-adapter", "^1.11.3", "ISC", "NextAuth Drizzle database adapter"],
            ]
          ),
          emptyLine(),

          para("Document Processing", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["pdf-parse", "^1.1.1", "MIT", "PDF text extraction from uploaded manuscripts"],
              ["mammoth", "^1.12.3", "BSD-2", "DOCX-to-HTML conversion for manuscript import"],
              ["docx", "^9.7.1", "MIT", "Programmatic DOCX generation for manuscript export"],
            ]
          ),
          emptyLine(),

          para("Rich Text Editor", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["@tiptap/react", "^3.31.3", "MIT", "Rich text editor for manuscript editing"],
              ["@tiptap/starter-kit", "^3.31.3", "MIT", "Core Tiptap extensions"],
              ["@tiptap/pm", "^3.31.3", "MIT", "ProseMirror integration for Tiptap"],
              ["@monaco-editor/react", "^4.7.0", "MIT", "Code editor for Python/analysis scripts"],
            ]
          ),
          emptyLine(),

          para("UI & Visualization", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["Tailwind CSS", "^4", "MIT", "Utility-first CSS framework"],
              ["Framer Motion", "^13.3.0", "MIT", "Animation library for UI transitions"],
              ["Lucide React", "^1.46.0", "ISC", "Icon library"],
              ["Recharts", "^3.10.1", "MIT", "Charts for admin dashboard, journal analytics"],
              ["react-force-graph-2d", "^1.29.1", "MIT", "Knowledge graph visualization"],
              ["Sonner", "^2.0.8", "MIT", "Toast notification library"],
            ]
          ),
          emptyLine(),

          para("Payments", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["Stripe", "^22.6.2", "MIT", "Server-side payment processing"],
              ["@stripe/stripe-js", "^9.16.0", "MIT", "Client-side Stripe integration"],
            ]
          ),
          emptyLine(),

          para("Backend Services", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["next-auth", "^5.0.0-beta.32", "ISC", "Authentication framework"],
              ["next-intl", "^4.14.5", "MIT", "Internationalization (Hebrew + English)"],
              ["inngest", "^4.20.0", "Apache-2.0", "Event-driven background job orchestration"],
              ["@upstash/ratelimit", "^2.1.0", "MIT", "API rate limiting"],
              ["@upstash/redis", "^1.38.4", "MIT", "Serverless Redis client"],
              ["@vercel/blob", "^2.8.0", "Apache-2.0", "File storage (manuscripts, data files)"],
              ["Nodemailer", "^8.0.11", "MIT", "Email delivery"],
              ["Zod", "^4.6.5", "MIT", "Schema validation for AI structured output"],
              ["dotenv", "^17.4.2", "BSD-2", "Environment variable management"],
            ]
          ),
          emptyLine(),

          para("Testing & Dev Tools", { bold: true }),
          makeTable(
            ["Library", "Version", "License", "Purpose"],
            [
              ["Jest", "^30.5.1", "MIT", "Unit testing framework"],
              ["@testing-library/react", "^16.3.3", "MIT", "React component testing"],
              ["@testing-library/jest-dom", "^7.0.1", "MIT", "DOM matchers for Jest"],
              ["Playwright", "^1.63.0", "Apache-2.0", "End-to-end browser testing"],
              ["ts-jest", "^29.4.12", "MIT", "TypeScript Jest transformer"],
              ["tsx", "^4.23.13", "MIT", "TypeScript execution (scripts, seeds)"],
              ["ESLint", "^9", "MIT", "Code linting"],
            ]
          ),

          // --- 7. Proprietary Components ---
          heading("7. Proprietary Components (Built In-House)", HeadingLevel.HEADING_2),
          makeTable(
            ["Component", "Description"],
            [
              [
                "Multi-Agent Orchestrator",
                "9-stage pipeline: Clarification > Planning > Knowledge > Scientific Review > Academic Writing > Execution > QA > Verification > Compilation",
              ],
              [
                "Multi-Model Debate System",
                "Parallel 3-reviewer debate (GPT-4o + Claude + Gemini) with Area Chair meta-synthesis using o1-preview",
              ],
              [
                "RLHF Learning Service",
                "Extracts actionable rules from user feedback and reviewer outcomes for prompt improvement",
              ],
              [
                "Integrity Scanner",
                "Heuristic plagiarism and AI-detection screening for manuscript verification",
              ],
              [
                "Cover Letter Agent",
                "Automated journal-specific cover letter generation",
              ],
              [
                "Rebuttal Agent",
                "Generates point-by-point response strategies to reviewer comments",
              ],
              [
                "Citation Formatter",
                "Multi-style citation formatting: APA, MLA, Chicago, Harvard, BibTeX",
              ],
              [
                "Knowledge Graph Builder",
                "Entity extraction and graph-based logical consistency checking",
              ],
              [
                "Vision AI Figure Analysis",
                "Chart/figure verification against manuscript claims using multimodal AI",
              ],
              [
                "A/B Testing Framework",
                "Prompt strategy allocation and outcome tracking for continuous improvement",
              ],
            ]
          ),

          // --- 8. Summary ---
          heading("8. Summary Statistics", HeadingLevel.HEADING_2),
          makeTable(
            ["Category", "Count"],
            [
              ["AI Models (unique)", "8 (across 3 providers)"],
              ["External Academic APIs", "4 (PubMed, Crossref, Semantic Scholar, arXiv)"],
              ["Cloud Services", "7 (Neon, Vercel, Upstash, E2B, Inngest, HuggingFace, SMTP)"],
              ["Open-Source Libraries", "35+"],
              ["MCP Servers", "3 (Literature, OJS, WordPress)"],
              ["Submission Adapters", "4 (OJS, Editorial Manager, WordPress, Email)"],
              ["Authentication Providers", "3 (Google, GitHub, Credentials)"],
            ]
          ),

          // ==================== PART 2 ====================
          new Paragraph({ children: [], spacing: { after: 200 } }),
          heading("Part 2: Tiered Pricing Model Proposal", HeadingLevel.HEADING_1),

          heading("Pricing Philosophy", HeadingLevel.HEADING_2),
          bulletPara("Universities have varying budgets and needs"),
          bulletPara("Individual researchers need affordable access"),
          bulletPara("Volume discounts incentivize institutional adoption"),
          bulletPara("AI costs scale with usage (tokens, sandbox minutes)"),

          // --- Tier 1 ---
          heading("Tier 1: Researcher (Individual) — $29/month", HeadingLevel.HEADING_2),
          makeTable(
            ["Feature", "Details"],
            [
              ["Price", "$29/month or $290/year (save ~17%)"],
              ["Target", "PhD students, postdocs, independent researchers"],
              ["Users", "1 user"],
              ["Papers", "Up to 5 papers/month"],
              ["AI Models", "Standard models (Claude Sonnet, GPT-4o)"],
              ["Debate Rounds", "1 round (3 reviewers) per paper"],
              ["Literature Search", "PubMed + Crossref + arXiv"],
              ["Export", "DOCX + PDF"],
              ["Submission Adapters", "Email only"],
              ["Storage", "1 GB"],
              ["Support", "Community + email (48h response)"],
            ]
          ),

          // --- Tier 2 ---
          heading("Tier 2: Lab (Small Team) — $149/month", HeadingLevel.HEADING_2),
          makeTable(
            ["Feature", "Details"],
            [
              ["Price", "$149/month or $1,490/year (save ~17%)"],
              ["Target", "Research labs, small departments"],
              ["Users", "Up to 10 users"],
              ["Papers", "Up to 25 papers/month"],
              ["AI Models", "All models including reasoning (o1)"],
              ["Debate Rounds", "Up to 3 rounds per paper"],
              ["Literature Search", "All sources + Semantic Scholar"],
              ["Export", "DOCX + PDF + LaTeX"],
              ["Submission Adapters", "All (OJS, Editorial Manager, WordPress, Email)"],
              ["Code Sandbox", "E2B statistical verification"],
              ["Vision AI", "Figure analysis & legend improvement"],
              ["Storage", "10 GB"],
              ["RLHF Learning", "Per-user and per-journal preference learning"],
              ["Support", "Priority email (24h) + onboarding call"],
            ]
          ),

          // --- Tier 3 ---
          heading("Tier 3: Department — $499/month", HeadingLevel.HEADING_2),
          makeTable(
            ["Feature", "Details"],
            [
              ["Price", "$499/month or $4,990/year (save ~17%)"],
              ["Target", "University departments, research centers"],
              ["Users", "Up to 50 users"],
              ["Papers", "Up to 100 papers/month"],
              ["AI Models", "All models, priority queue"],
              ["Debate Rounds", "Unlimited rounds"],
              ["All Tier 2 Features", "Included"],
              ["Admin Dashboard", "Usage analytics, cost tracking per user"],
              ["A/B Testing", "Prompt strategy testing per journal"],
              ["Knowledge Graph", "Cross-paper entity & citation graph"],
              ["HuggingFace Agents", "Deploy reproducible research agents"],
              ["Integrity Scanning", "Plagiarism & AI detection"],
              ["API Access", "REST API for integration"],
              ["Storage", "50 GB"],
              ["Support", "Dedicated account manager + Slack channel"],
            ]
          ),

          // --- Tier 4 ---
          heading("Tier 4: University (Enterprise) — Custom Pricing", HeadingLevel.HEADING_2),
          para("Starting from $2,000/month", { bold: true }),
          makeTable(
            ["Feature", "Details"],
            [
              ["Target", "University-wide deployment, consortia"],
              ["Users", "Unlimited"],
              ["Papers", "Unlimited"],
              ["All Tier 3 Features", "Included"],
              ["SSO/SAML", "Institutional single sign-on"],
              ["Custom Branding", "White-label option"],
              ["On-Premise Option", "Self-hosted deployment available"],
              ["Custom Integrations", "Tailored adapters, LMS integration"],
              ["Data Residency", "Choose data region (EU/US/IL)"],
              ["Fine-Tuning", "Custom model fine-tuning on university publications"],
              ["Compliance", "GDPR, FERPA documentation"],
              ["SLA", "99.9% uptime guarantee"],
              ["Support", "24/7 + dedicated success manager + quarterly reviews"],
            ]
          ),

          // --- Add-Ons ---
          heading("Add-On Pricing", HeadingLevel.HEADING_2),
          makeTable(
            ["Add-On", "Price", "Description"],
            [
              ["Extra Papers Pack", "$5/paper", "Beyond tier limit"],
              ["Extra Storage", "$2/GB/month", "Beyond tier limit"],
              ["Priority Processing", "$10/paper", "Skip queue, faster processing"],
              ["Custom Journal Profile", "$50/profile", "One-time setup of journal-specific rules"],
              ["Training Workshop", "$500/session", "2-hour live training for lab/department"],
            ]
          ),

          // --- Unit Economics ---
          heading("Estimated Unit Economics (Per Paper)", HeadingLevel.HEADING_2),
          makeTable(
            ["Cost Component", "Estimated Cost"],
            [
              ["AI Tokens (all stages)", "$0.80 - $2.50"],
              ["E2B Sandbox", "$0.10 - $0.30"],
              ["Infrastructure (DB, hosting)", "$0.05 - $0.10"],
              ["Total COGS per paper", "$0.95 - $2.90"],
              ["Researcher tier revenue per paper", "~$5.80"],
              ["Gross margin", "~50% - 84%"],
            ]
          ),

          // --- Academic Discounts ---
          heading("Academic & Student Discounts", HeadingLevel.HEADING_2),
          makeTable(
            ["Discount", "Eligibility", "Details"],
            [
              ["50% off Researcher tier", "Active students (.edu / .ac.il email)", "$14.50/month"],
              ["Pilot Program", "New universities (first 3 months)", "Free Tier 3 trial"],
              ["Non-Profit", "Non-profit research institutions", "30% off all tiers"],
            ]
          ),

          emptyLine(),
          para(
            "Recommended Launch Strategy: Start with Tier 1 and Tier 2 as the initial offering. Offer a free 14-day trial (no credit card required) for any tier. Use the pilot program to onboard 2-3 Israeli universities and gather feedback before rolling out Tier 3/4.",
            { bold: true, italic: true }
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = "/Users/liorzafrir/.gemini/antigravity/brain/898ca407-1e3f-4508-955c-d9431cc1418f/PublishAI_Third_Party_Materials_and_Pricing.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log(`DOCX generated: ${outputPath}`);
}

main().catch(console.error);
