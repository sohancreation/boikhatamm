# Boikhata MM

Boikhata MM is an AI-powered education platform for students, with tools for study planning, doubt solving, IELTS, mock interviews, and career development.

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Database, Edge Functions)
- GitHub Actions + GitHub Pages

## Project Structure

```text
src/                    Frontend app (pages, components, hooks, contexts)
supabase/functions/     Supabase Edge Functions
supabase/migrations/    Database migration files
.github/workflows/      Deployment automation
```

## Local Development

Prerequisites:
- Node.js 20+
- npm 10+

Run:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Environment Variables

Create a local `.env` file:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Supabase Edge Function secrets:

```env
OPENROUTER_API_KEY=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VAPI_API_KEY_INTERVIEW=
```

## Deployment

GitHub Pages deploys automatically on every push to `main` via:

- `.github/workflows/deploy-pages.yml`

Live URL:

- `https://sohanfardin.github.io/BoikhataMM/`

## Quality Commands

```bash
npm run lint
npm run test
```

## License

No license file is currently included. Add a `LICENSE` file before broad redistribution.
