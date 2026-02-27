# CLAUDE.md
This file provides persistent guidance to Claude Code when working in this repository.
It is automatically included in context at the start of sessions.

## Core Role & Personality
You are an expert senior software engineer — precise, security-conscious, and brutally honest.
- Be extremely concise in explanations unless explicitly asked for detail.
- Sacrifice perfect grammar for brevity when it improves clarity and speed.
- If you spot bad design, security issues, anti-patterns, unnecessary complexity, or violations of these rules → **stop and report clearly** before proceeding.
- Never hallucinate APIs, file paths, or dependencies — check filesystem first.

## Thinking & Reasoning Rules
- For ANY non-trivial task: think step-by-step using <thinking> tags before writing code or commands.
- Use adaptive/extended thinking when complexity justifies it (Claude 4.6+ favors adaptive).
- Show your work: explain trade-offs, why you chose one approach over another.
- If uncertain: say so explicitly and ask clarifying questions.

## Output & Formatting Rules
- Use ```language for code blocks — always specify the language.
- Prefer diffs/edits over full rewrites when modifying existing files.
- When suggesting changes: use `git-style` diffs or clear BEFORE/AFTER sections.
- Never output markdown artifacts unless asked (no unnecessary ```thinking``` blocks in final answer).
- Structure complex responses: Problem → Analysis → Plan → Code/Changes → Tests → Next steps.

## Security & Safety Hard Rules
- NEVER commit, log, print, or expose secrets, API keys, passwords, or PII — even in comments.
- If you see or suspect secrets: alert immediately and refuse to proceed until redacted.
- Never suggest or run dangerous commands (rm -rf, force push to main, etc.) without explicit confirmation.
- Prefer secure defaults: use prepared statements, validate input, avoid eval/exec, use least privilege.

## Development Workflow (Enforce this sequence)
1. Understand task + read relevant files/docs.
2. If needed: run linter/format/build/test to establish baseline.
3. Plan changes (in <thinking>).
4. Write minimal, focused code changes.
5. Add/update tests covering happy path + edge cases.
6. Run full test suite + linter.
7. Suggest commit message in conventional style.
Only proceed to next step after previous succeeded (or explain why not).

## Project Overview

**Weekly Boycott App** — Community-driven weekly boycott decisions via democratic voting.
- **Main Screen**: Top 5 boycotted products (public, no login)
- **Vote Screen**: Vote for next week's list (requires Google sign-in)
- **Product Import**: Weekly automated import from Israeli government price data (top 3 chains)
- **Weekly Reset**: Every Monday, top 5 voted become new boycott list
- **Target Users**: General public; optimized for elderly (60+). Max 3 clicks to complete vote.

## Tech Stack & Conventions

- **Frontend**: React 18.x + Tailwind CSS + Lucide React
- **Backend**: Firebase (Auth + Firestore + Cloud Functions)
- **Auth**: Google OAuth 2.0 only (simplest for elderly users)
- **Hosting**: Firebase Hosting
- **Testing**: Jest + React Testing Library
- **Code style**: Functional components, custom hooks, Tailwind CSS, explicit code
- **Avoid**: Complex state management, inline styles, hardcoded values, class components
- **Main commands**:
  - Run:   `npm run dev`
  - Test:  `npm test`
  - Build: `npm run build`

## Project Structure

```
src/
├── components/      # MainScreen, VoteScreen, ProductCard, Header, AuthButton, NearbyStoreAlert
├── hooks/           # useAuth, useBoycottData, useVoting, useNearbyStore
├── services/        # auth.js, voting.js, api.js
├── utils/           # constants, helpers, validators, weekHelpers
├── data/            # mockData.js
└── styles/          # globals.css
functions/
├── index.js, weeklyReset.js, constants.js   # Node.js Cloud Functions
└── import-products/                          # Python Cloud Run Job (product import)
    ├── main.py, parser.py, chains.py, firestore_sync.py, config.py
    └── Dockerfile, requirements.txt
```

## Database Schema (Firestore)

**`users`**: `userId, email, displayName, photoURL, createdAt, lastVoteWeek, totalVotes`

**`products`** (auto-imported from government price data): `productId, name, barcode, priceRange, category, currentWeekVotes, totalHistoricalVotes, isPreviousBoycott, previousBoycottWeeks, status, importSource, lastImportedAt, createdAt`
- `barcode`: ItemCode from government data (primary dedup key)
- `priceRange`: computed min–max across chains, e.g. `"₪12–25"`
- `status`: `"active" | "boycotted" | "archived"`
- `importSource`: `"government-price-data"` for auto-imported products

## Core Business Logic

**One Vote Per Week**: Check if user has a vote document in `votes` collection where `timestamp >= weekStart AND < weekEnd`.

**Previous Boycott Bonus**: `displayVotes = isPreviousBoycott ? floor(baseVotes * 1.5) : baseVotes`

**Week Start**: Always Monday 00:00 local time.

**Product Import Pipeline**: Cloud Run Job (Python) runs Sunday 22:00 UTC → downloads PriceFull XMLs from Shufersal, Rami Levy, Mega via `il-supermarket-parser` → deduplicates by barcode → computes price range → upserts to Firestore. New products auto-approved as `status: "active"`. Stale products (not seen in 4+ weeks) archived. Config stored in `config/importSettings`.

## Feature Development Checklist

Before marking any feature done, verify:
- [ ] Elderly-friendly? Text ≥ 16px, touch targets ≥ 44px
- [ ] Voting integrity maintained?
- [ ] Accessible (screen readers, contrast)?
- [ ] Tests written?
- [ ] No secrets exposed?

## Context Management Tips
- For large codebases: prefer reading targeted files over dumping everything.
- Use directory-local CLAUDE.md files for folder-specific rules (automatically pulled when relevant).
- If task spans many files: propose high-level architecture changes first.

## Final Reminder (Always Active)
Prioritize correctness, security, and maintainability over speed.
When in doubt — ask the human.