# Evergreen demo reports

Snapshots of real Analyze results for marketing. Pages live at `/demo/<slug>` and do **not** expire (unlike `/share/<token>` which lasts 30 days).

## URLs (after deploy)

| Slug | URL |
|------|-----|
| Flagship (T1+T2) | `/demo/flagship-writing` |
| Task 2 Band 5.5 | `/demo/task2-band-55` |
| Task 2 Band 7.5 | `/demo/task2-band-75` |
| Task 1 Academic | `/demo/task1-academic` |

Use `/demo/flagship-writing` in Telegram / ads as the main demo link.

## How to refresh with a new real analysis

1. Sign in on the environment that uses your production (or local) database.
2. Run **Analyze** for Task 1 and/or Task 2 until you see “Saved to your history.”
3. Open **History**, copy the check id from the report URL (`/history/<id>`), or create a Share link and use its token.
4. Export into git:

```bash
# by History check id
npm run demo:export -- --slug task2-band-75 --t2 <checkId>

# Task 1 + Task 2 together
npm run demo:export -- --slug flagship-writing --t1 <t1Id> --t2 <t2Id>

# from a share token (must be valid + same AUTH_SECRET / DB)
npm run demo:export -- --slug flagship-writing --token <shareToken>
```

5. Update titles in `content/demo/catalog.json` if needed, then commit `content/demo/*.json` and deploy.

Guest “one free demo check” is unchanged — samples are read-only proof; `/?app=1` is still try-it-yourself.
