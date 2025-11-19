# OpenAI Key Setup

This project requires an OpenAI API key for itinerary generation.

## Steps
1. Create or retrieve a key at https://platform.openai.com/account/api-keys.
2. Copy the key (never share it publicly).
3. In your local checkout (not in production artifacts), edit `.env.local`:

```
OPENAI_API_KEY=sk-...your real key...
```
4. Restart the dev server: `npm run dev:3001`.
5. Generate an itinerary again.

## Security Practices
- `.env.local` is in `.gitignore`; keep it that way.
- Rotate keys immediately if they were ever committed.
- Use different keys for development and production.
- Do not paste the real key into chat, issues, or logs.

## Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 401 Incorrect API key | Placeholder or revoked key | Replace with active key & restart |
| 500 Missing key error | `OPENAI_API_KEY` not loaded | Confirm `.env.local` exists and restart |
| Slow responses | Model choice or network | Try `OPENAI_MODEL=gpt-4o-mini` or adjust prompt |

## Optional Variables
- `OPENAI_MODEL` (defaults to `gpt-4o-mini`) to change model.

---
If a key was accidentally committed, immediately:
1. Delete it from the repo.
2. Rotate the key on the OpenAI dashboard.
3. Force push removal if necessary (rewrite history) so it isn't in git logs.
