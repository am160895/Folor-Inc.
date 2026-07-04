# Hosting Ledger online

## The one thing to know first
Ledger keeps its database in a **file** (`data/decisiongraph.json`) and uploads in `data/uploads/`.
That is perfect for running locally, but it means the popular "serverless" hosts (**Vercel, Netlify**)
will **lose your data** whenever they recycle the server — fine for a demo link, wrong for real use.

## Recommended: Railway (~$5/mo) or Render
1. Push this code to GitHub (already done: github.com/am160895/Folor-Inc.).
2. Go to railway.app → Login with GitHub → New Project → "Deploy from GitHub repo" → pick the repo.
3. Railway auto-detects Next.js. Set Build: `npm run build`, Start: `npm start`.
4. Add a **Volume** (Storage tab) mounted at `/app/data` — this is what makes your decisions permanent.
5. Variables tab → add `RESEND_API_KEY` (and `EMAIL_FROM`, `APP_URL=https://your-app.up.railway.app`).
6. Deploy. You get an https URL immediately; add a custom domain in Settings whenever you like.

## Demo-only alternative: Vercel (free)
Exactly the 5 steps on the poster: push to GitHub → vercel.com sign-up with GitHub →
Add New Project → import repo → Deploy. Works, gives you `ledger-xxx.vercel.app` —
but treat it as a **demo** (data resets; don't record real decisions there).

## iPhone / Android "app"
Ledger is a PWA. Once hosted at an https URL, open it in Safari on iPhone →
Share → **Add to Home Screen** → it installs with the Ledger icon, full screen,
no browser bars. That's the right move now; a real App Store app (Capacitor wrapper)
only makes sense after the product is validated.
