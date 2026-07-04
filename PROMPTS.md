# Prompts to use with ChatGPT

## 1. Get research-backed feedback on Ledger

Copy-paste everything between the lines into ChatGPT (use a model with web browsing for real research):

---
You are a skeptical enterprise SaaS investor and construction-tech analyst. I am building **Ledger** — a system of record for informal field decisions in construction.

What it does: a superintendent speaks a decision into their phone ("we agreed onsite to center the lobby lights on the soffit"), AI structures it into a record (title, decision, why, location, cost impact, schedule impact), the people who must approve get an email with a unique link containing one-tap Approve/Decline buttons with read receipts, and the decision becomes a permanent, searchable, immutable record with attached photo/PDF evidence and a causality graph (this decision was caused by X, led to Y).

What it deliberately is NOT: RFIs, submittals, schedules, punch lists, daily reports, document management, or project management. It does one thing: makes verbal field decisions traceable, acknowledged, and impossible to lose. Approvers never install anything or log in — one email, two buttons. Pricing thesis: ~$49/month per recorder (supers/PMs), approvers free and unlimited.

Please research and answer:
1. Who are the closest existing competitors or substitutes (research actual products — including Procore Correspondence, Fieldwire, construction daily-log apps, and any "decision log" tools), and specifically how does each fail to solve the verbal-field-decision problem?
2. What does published litigation/claims data say about the cost and frequency of construction disputes caused by undocumented verbal changes? Cite sources.
3. What is the realistic total market of US GCs and specialty subcontractors in the 10–200 employee band, and what do they currently pay for field software?
4. Poke holes: what are the 5 strongest objections a construction company owner would raise before paying for this, and what evidence would overcome each?
5. What legal weight does an emailed one-tap acknowledgement with read receipt actually carry in US construction disputes? Research e-signature law (ESIGN/UETA) and any relevant case law on email acknowledgements.
6. Based on all of the above, give me: a verdict (build/kill/pivot), the single riskiest assumption, and the cheapest experiment to test it in 30 days.

Be blunt. Do not flatter. Cite sources for every factual claim.
---

## 2. Get hosting guidance from ChatGPT

---
I have a Next.js 14 (App Router) web app called Ledger. Important constraints:
- It stores all data in a local JSON file (`data/decisiongraph.json`) and uploaded files in `data/uploads/` — so it needs a host with a PERSISTENT DISK, not a serverless platform (Vercel/Netlify serverless would lose the data on every restart).
- It has API routes (server-side), so it can't be a static export.
- It sends email via the Resend API using an environment variable RESEND_API_KEY.
- I want: HTTPS, a custom domain later, ~$0–10/month, and the simplest possible deploy from a GitHub repo (repo: am160895/Folor-Inc., the app is at the repo root).

Walk me through, step by step with screenshots described: deploying this on Railway (or Render if better), attaching a persistent volume mounted at /app/data, setting environment variables, and pointing a custom domain. Also tell me exactly what I'd have to change in the app later if I outgrow the JSON file (e.g. moving to Postgres) — but do not have me change any code today.
---
