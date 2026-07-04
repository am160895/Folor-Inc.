# Ledger — Startup Strategy & Scrutiny
*Every decision. Recorded. Every decision. Protected.*

This is the founder-level pressure test of Ledger, written to be argued with.

---

## Part 1 — Brutal critique (the 30 questions)

**1. What exactly is the painful problem?**
Not "losing decisions" in the abstract. The pain is the **$40k dispute six months later** where the GC swears the architect approved the change onsite and there is nothing in writing. Verbal field decisions are the largest class of construction commitments with zero paper trail. The pain is felt at dispute time, but incurred at decision time. That gap — pain deferred from the moment of action — is the core product challenge.

**2. Who is the first buyer?**
The **owner/principal of a 10–200 person GC or specialty contractor** (exactly Folor's profile). Not enterprise procurement. They've personally eaten a five-figure loss from an undocumented decision and will pay from the operating budget, not an IT budget.

**3. Who is the daily user?**
The **superintendent or PM walking the site**. If they don't use it, the product is dead. Everyone else (architect, client) is a *responder* — they only ever tap Approve/Decline in an email. That asymmetry is the design: one trained user per project, everyone else needs zero training.

**4. What event triggers usage?**
A conversation ends with agreement: "OK, center them on the soffit." The trigger is verbal agreement on anything that changes cost, scope, schedule, or appearance. Secondary trigger: the *fear* right after — "I should get that in writing."

**5. Why adopt over email / Teams / Procore / memory?**
- Email: no acknowledgement, no structure, unfindable in 6 months, gets "sorry, missed this."
- Teams/WhatsApp: worse — informal, deletable, disorganized, not evidence-grade.
- Procore: a decision *could* be an RFI, but supers won't file an RFI for "no-cost" field decisions — 10 minutes of forms for a 10-second agreement. That's precisely the gap Ledger lives in.
- Memory: the incumbent, and the reason disputes exist.
Ledger wins if capture ≤ 30 seconds and the record is *stronger evidence* than any of the above (timestamped, acknowledged, read-receipted, immutable).

**6. Smallest sellable product?**
Capture (voice→structured) + email approval with read receipt + permanent searchable record. That's it. One project, one super, one architect. Everything else is optional.

**7. Daily habit?**
End-of-walk ritual: 2–5 decisions spoken into the phone before getting in the truck. Plus the digest ("3 decisions awaiting the architect") as the morning pull.

**8. Killer feature?**
**The acknowledged decision record**: "Sent 9:42 · Seen 9:51 · Approved 9:53 by A. Rivera (Architect)." No other tool produces this artifact for verbal field decisions. The graph, the AI, the search — all supporting cast.

**9. Top 10 reasons this fails**
1. Supers don't capture (habit never forms).
2. Architects refuse to click Approve (fear of liability).
3. It's seen as a "gotcha machine" and poisons relationships.
4. Champion leaves the company; usage dies.
5. Free substitute "good enough": a WhatsApp group + screenshots.
6. Procore ships a "field decisions" checkbox feature.
7. Sold as legal protection, judged as one, and a court gives the record no weight.
8. Single-project pilots never expand; revenue stalls at $99/mo.
9. AI mis-structures a decision, trust evaporates after one bad record.
10. Founder-led sales doesn't scale; construction sells through relationships and trade shows, which is slow and expensive.

**10. Top 10 adoption barriers**
Gloves/sun/noise on site · "another app" fatigue · architects' reluctance to sign anything informal · subs with flip phones · spotty connectivity · company owners not wanting internal decisions discoverable · IT/security review at bigger GCs · integration expectations (Procore/Autodesk) · pricing skepticism · nobody wants to be the one whose mistakes are now permanently recorded.

**11. Legal / liability issues**
- A Ledger record may be **discoverable** in litigation — cuts both ways (protects you and can convict you). Be honest: the pitch is "the truth, recorded," not "win every dispute."
- An emailed ✓ is **not a contract change order**. Ledger must say so on the approval page (fine print, done) or GCs will misuse it in place of formal change orders.
- Data ownership and retention on subscription lapse must be explicit: the customer owns the record and can export the JSON at any time (already possible — one file).
- Read receipts: an unopened email is *not* notice. The "Seen" state matters legally; we track it.

**12. When AI records something incorrectly?**
The AI only ever produces a **draft the human confirms**. Nothing enters the record without the recorder reviewing an editable form (already built). The approver is the second check — they read the actual text before signing. AI errors surface *before* acknowledgement, which is the whole point of the approval loop. Never auto-record.

**13. If nobody records decisions?**
Then no value, no renewal. Mitigations: (a) the digest creates visible absence — "0 decisions this week" is a nudge to the owner; (b) make capture the path of least resistance vs. sending the same info by text; (c) the killer moment is the *first dispute won* — after that, the owner mandates it. Sell the mandate, not the app.

**14. How can capture be nearly frictionless?**
Voice-first (built), auto-structuring (built), team defaults (built), AI cleanup (built). Next: capture by **forwarding an email** to record@ledger, and native mobile with offline queue. The ceiling: 15 seconds from tap to recorded.

**15. Manual vs automatic?**
Automatic: structuring, people-matching, notifications, read receipts, team building, project assignment defaults. Manual, always: the decision text confirmation, who must approve, and the Approve/Decline click. Judgment stays human; clerical work is machine.

**16. Is the graph actually useful?**
Honest answer: **search + timeline + the acknowledgement record are the product; the graph is the demo.** The graph earns its place only as causality ("caused by X → led to Y") — that chain is genuinely explanatory in disputes ("this $12k change traces back to the owner's lobby decision"). Keep it one-decision-centered, never a hairball. It also sells: it makes the invisible web of field decisions *visible* to an owner in one screen.

**17. What should the UI remove to avoid looking like Procore?**
No modules, no folders, no forms with 20 fields, no dashboards of KPIs, no gantt, no document register. One feed, one capture bar, one detail view. (Current UI holds this line — keep holding it.)

**18. What should the product never become?**
Project management. The moment Ledger has tasks, statuses, or schedules, it is a worse Procore and dies. Ledger is a **system of record**, not a system of work.

**19. Why wouldn't Procore/Autodesk copy this?**
They can — the defense is positioning, not patents. Procore's DNA is formal process (RFIs, submittals); "informal decisions" is culturally anti-Procore, and their sale is top-down enterprise, not super-led. They'd bolt it on as a feature nobody finds. The real answer: **move fast, own the category name ("decision record"), and accumulate the dataset** before they care.

**20. What moat can be built?**
The **decision corpus**: years of structured, acknowledged decisions per company become their institutional memory — switching means abandoning the archive that is the whole point. Plus the cross-party network (see 22) and evidence-grade trust (immutability, receipts) that takes years to earn.

**21. What unique dataset does Ledger create?**
The only structured dataset of **informal field decisions**: who decides what, with whom, at what cost band, how fast approvers respond, which decision types precede disputes. No one — not Procore — has this. Long-term: risk scoring, insurance partnerships, benchmarking ("architect response time: 2.1 days vs. 9 hr industry median").

**22. Network effects?**
Every decision invites outside parties (architects, clients, subs) via email. Each approver experiences the product with zero friction. The architect who's tapped ✓ forty times asks their *other* GCs "why don't you use this?" Cross-company invitations are the growth loop — approvals are the viral surface.

**23. Expansion beyond construction?**
Any field where verbal decisions carry money and blame and lack paperwork: property management, film production, events, facilities, healthcare ops, field services, agencies (client sign-offs). "Client approved the scope change on the call" is universal. Construction is the wedge because pain is highest and stakes are concrete.

**24. Pricing?**
Per **recorder** seat (supers/PMs), not per viewer/approver — approvers must be free and unlimited or the network effect dies. ~$49/recorder/month, unlimited projects/decisions/approvers. Team plan $199/mo for 5 recorders. Enterprise: SSO, retention policies, export APIs, ~$10k+/yr. Never per-project pricing (kills the habit between projects).

**25. Market category?**
**Decision Records.** ("The decision record" the way DocuSign owns "the envelope.") Category line: *system of record for field decisions.*

**26. One-sentence pitch?**
"Ledger turns the decisions your team makes out loud into signed, searchable records — in 15 seconds."

**27. Homepage?**
Headline: **"That decision you made onsite? Prove it."** Sub: "Ledger captures field decisions by voice, gets them acknowledged with one tap, and keeps them forever." One looping 20-second capture-to-approval demo. One CTA.

**28. First demo?**
Live, 60 seconds: speak a messy decision → AI structures it → tap architect "Must approve" → record → open the email on a phone → tap ✓ → watch the feed flip to Acknowledged with Seen/Approved times. Then search: "who approved the lobby lights?" Nothing else.

**29. What makes a large enterprise pay?**
Risk, not productivity: fewer disputes, faster claims resolution, audit trail for insurers and counsel. CFO math: one avoided $50k dispute pays for a decade. Enterprise checklist: SSO, immutable export, retention controls, SOC 2.

**30. What makes a field super actually use it?**
It must be *faster than the text message they'd otherwise send*, work with one thumb in sunlight, talk instead of type, and — critically — **protect the super personally** ("when it goes sideways, it's not your word against theirs"). Sell it as armor for the field, not surveillance from the office.

---

## Part 2 — Refined thesis

**Thesis:** Every industry runs on informal decisions that carry formal consequences. Ledger is the system of record for those decisions — captured in seconds by voice, acknowledged with one tap by the people who matter, provable forever.

- **ICP:** 10–200 person GCs and specialty subs; buyer = owner/principal; user = superintendent/PM.
- **Wedge:** verbal field decisions with an architect/client — highest pain, cleanest story, no incumbent.
- **Daily workflow:** end-of-walk voice capture (2–5/day) → approvers tap ✓ from email → morning digest shows anything unacknowledged.
- **MVP (all built):** voice capture → AI draft → per-person see/approve → email with one-tap ✓/✗ + read receipt → immutable record → search → causality graph → daily digest.
- **Delete/resist list:** tasks, statuses, schedules, folders, chat, comments-threads, dashboards, integrations before PMF, native app before web habit proves out.
- **Moat:** decision corpus + cross-party network + evidence-grade trust. Move fast on the category name.
- **GTM:** founder-led: 10 design partners from Folor's own network → case study ("the dispute we won with Ledger") → construction podcasts/associations → approver-driven viral loop.
- **Pricing:** $49/recorder/mo, approvers free forever, enterprise tier for risk/compliance features.
- **Biggest risk to manage first:** capture habit. Instrument it: decisions/super/week is the only metric that matters until it's ≥5.

## Part 3 — UX principles (standing orders)

1. Capture in ≤15s or don't ship it.
2. Approvers never log in, never install, never learn. One email, two buttons.
3. One trained user per project, max.
4. The record is sacred: immutable once acknowledged, exportable always.
5. Big targets, plain words, voice-first — built for gloves and sunlight.
6. The graph explains; it never decorates.
7. Never look like project management.
