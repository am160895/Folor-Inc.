# Folor DecisionGraph

**We make every important project decision traceable, acknowledged, and impossible to lose.**

DecisionGraph captures important project decisions and shows **who decided, why, when, and what evidence supports it**. It is deliberately *not* a project-management suite — no RFIs, submittals, schedules, punch lists, daily reports, or file folders. It does exactly one thing: it protects companies from losing critical decisions.

> Darren and the architect agree onsite to center the lights on the soffit. No RFI, no submittal, no cost or schedule impact — but still an important decision. DecisionGraph captures it in 15 seconds.

## What's inside

A premium, dark, Linear/Vercel-grade prototype built around three core areas:

1. **Capture Bar** — record a decision by Speak, Type, or Upload evidence. An AI draft turns a plain-language note into a structured record (title, people, location, reason, cost/schedule impact) ready to record.
2. **Decision Feed** — a calm chronological feed of captured decisions. Each card shows the decision, who made it, who was present, date/time, location, status, impact, and evidence count.
3. **Decision Details** — the full record with an **Explain this decision** AI panel (why / who / when / evidence / cost / schedule / confidence).

Plus:

- **Search** — natural-language questions ("Show decisions with no cost impact", "Show decisions involving the architect") that return decision cards, never files.
- **Graph** — one selected decision at the center, connected to its people, reason, evidence, cost/schedule impact, acknowledgement, and related decisions (React Flow).
- **Digest** — a daily summary with Confirm all / Review / Send digest.
- **Settings** — workspace, default visibility, notifications, and capture/AI preferences.

## What's real (v2)

- **Built-in database** (`data/decisiongraph.json`, created automatically — no install, nothing to compile) stores decisions, people, projects, approvals, notifications, and evidence permanently. Back it up by copying that one file.
- **People** — add teammates with a role, email, and/or mobile number, and how they want to be notified.
- **Approvals by email / text** — recording a decision sends each chosen approver a unique link; the link opens a one-tap **Approve / Decline** page and their response updates the decision's status (Pending → Acknowledged / Declined). Without provider credentials the app runs in **demo mode**: messages are logged in the DB and approval links are shown in the decision details so the flow is fully testable. To send for real, create `decisiongraph/.env.local`:

  ```
  RESEND_API_KEY=re_...            # email (resend.com)
  EMAIL_FROM="Folor <decisions@yourdomain.com>"
  TWILIO_ACCOUNT_SID=AC...         # text messages (twilio.com)
  TWILIO_AUTH_TOKEN=...
  TWILIO_FROM=+1555...
  APP_URL=https://your-host        # optional, for links in messages
  ```

- **Real voice capture** — the Speak button uses the browser's speech-to-text (Chrome/Edge).
- **Projects** — create projects from the sidebar switcher or during capture; filter everything by project.
- **Mobile version** — responsive layout with a bottom tab bar; the approval page is designed phone-first.
- Ships with **one example decision** only — everything else starts empty. Add your own people and projects.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a custom dark, purple-accented theme
- **shadcn/ui**-style primitives (Button, Dialog, Badge, Input)
- **Framer Motion** for motion
- **Lucide** icons
- **React Flow** for the decision graph

All data is mocked in `src/lib/data.ts` — no backend required.

## Run it

```bash
cd decisiongraph
npm install
npm run dev
# open http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## Project structure

```
src/
  app/
    layout.tsx          # fonts + metadata
    page.tsx            # renders <AppShell/>
    globals.css         # dark theme + ambient glow
  components/
    AppShell.tsx        # view switching, details drawer, capture modal
    Sidebar.tsx         # Decisions · Search · Graph · Digest · Settings
    CaptureBar.tsx      # Speak / Type / Upload
    CaptureModal.tsx    # input → AI draft → recorded
    DecisionCard.tsx    # feed card
    DecisionDetails.tsx # slide-over record + "Explain this decision"
    DecisionFlow.tsx    # React Flow graph
    shared.tsx          # avatars, status/impact pills, evidence icons
    views/              # DecisionsView, SearchView, GraphView, DigestView, SettingsView
  lib/
    data.ts             # types, seed decisions, mock search + draft "AI"
    utils.ts            # cn()
```
