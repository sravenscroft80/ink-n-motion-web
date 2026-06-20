# Ink-N-Motion

Premium web app that turns tattoo photos into AI-generated comic-book-style stills. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and structured for **Vercel** deployment.

## Quick start

### 1. Add your API keys locally

1. Copy the example env file:

   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and add your keys:

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `REPLICATE_API_TOKEN` | Yes (for generation) | From [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) |
   | `BLOB_READ_WRITE_TOKEN` | Yes (for uploads) | From Vercel → Storage → Blob, or `vercel env pull` |
   | `REPLICATE_MODEL` | No | Defaults to `stability-ai/sdxl` (SDXL img2img) |
   | `STRIPE_SECRET_KEY` | No | Stripe test secret key — checkout runs in mock mode without it |
   | `STRIPE_PRICE_ID` | No | Stripe Price ID for credit packs |
   | `NEXT_PUBLIC_APP_URL` | No | Your production URL (e.g. `https://your-app.vercel.app`) |

   **Important:** Never commit `.env.local`. The Replicate token stays server-side only.

### 2. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- New visitors start with **3 free credits** (stored in an HTTP-only cookie).
- Upload a tattoo photo, pick a style pack, and click **Generate**.
- Without `REPLICATE_API_TOKEN`, generation returns a clear error (keys are never sent to the browser).

### 3. Deploy to Vercel

1. Push this folder to a **GitHub** repository.
2. Go to [vercel.com/new](https://vercel.com/new) and **Import** your repo.
3. Vercel auto-detects Next.js — no extra build settings needed.
4. In **Project Settings → Environment Variables**, add:
   - `REPLICATE_API_TOKEN`
   - `BLOB_READ_WRITE_TOKEN` (auto-added if you connect a Blob store)
   - `REPLICATE_MODEL` (optional)
   - `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` (optional)
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
5. Click **Deploy**.

The `/api/generate` route is configured for Vercel serverless (`maxDuration: 60` in `vercel.json`).

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── upload/route.ts      # Vercel Blob image upload
│   │   ├── generate/route.ts    # Replicate SDXL img2img (server-only)
│   │   ├── credits/route.ts     # Credit balance
│   │   └── checkout/            # Stripe checkout (stub + real)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/                  # UI sections
└── lib/
    ├── credits.ts               # Cookie-based credit system
    ├── replicate.ts             # Replicate API client
    ├── stripe.ts                # Stripe checkout helper
    └── style-packs.ts           # Classic Comic, Manga, Noir prompts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | ESLint |

## License

Private — Ink-N-Motion v1
