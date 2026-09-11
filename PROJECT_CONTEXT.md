# STATUSFLOW GAMING — PROJECT CONTEXT

## 1. Project Identity

Project name: StatusFlow Gaming

GitHub repository:
https://github.com/megaKing-001/statusflow-gaming

Local project directory:
~/statusflow-gaming

StatusFlow Gaming is the gaming/rewards part of the larger StatusFlow platform.

The project is intended to provide games where users can play and earn StatusFlow Points (SFP).

SFP is an internal points/reward currency. Game rewards must be controlled by the server and database, not trusted from the browser.

---

## 2. Relationship With StatusFlow

StatusFlow is the broader platform.

StatusFlow includes features such as:

- WhatsApp Status advertising
- User tasks
- Rewards
- Referrals
- Withdrawals
- VTU-related services
- User accounts
- Advertising services

StatusFlow Gaming is the gaming component of the ecosystem.

The gaming system should eventually integrate with the main StatusFlow user account and SFP wallet.

Do not treat StatusFlow Gaming as an unrelated standalone project unless explicitly instructed.

---

## 3. Current Development Environment

The project is being developed primarily from an Android phone using Termux.

Current local directory:

~/statusflow-gaming

Current Node.js version:

v26.3.1

Current npm version:

12.0.2

Current Next.js version:

16.3.4

The application currently needs Webpack instead of Turbopack on the Android environment.

Development command:

npm run dev -- --webpack

The application has successfully loaded locally.

Typical local URL:

http://localhost:3001

StatusFootball route:

http://localhost:3001/games/statusfootball

The port may change if another process is using the default port.

---

## 4. GitHub Is The Source-Controlled Project

The GitHub repository is the main source-controlled codebase.

Repository:

https://github.com/megaKing-001/statusflow-gaming

Changes should eventually be committed to GitHub so that the project can be recovered and continued from another device or development session.

Do not assume ChatGPT memory is the source of truth for the code.

Do not assume Claude, Gemini, or another AI's previous response is the source of truth.

The actual repository code and database schema are the source of truth.

---

## 5. Development History

The project was originally developed with assistance from Claude.

Later, some project/code reconstruction was generated with Gemini.

The current goal is NOT to blindly rebuild the application.

The goal is to:

1. Preserve useful existing work.
2. Identify what Gemini created.
3. Compare it against the intended StatusFlow Gaming architecture.
4. Find bugs and security problems.
5. Continue the earlier Claude development direction.
6. Avoid replacing working systems unnecessarily.

Before making major architectural changes, inspect the existing code first.

---

## 6. Current Known Project Structure

The repository currently contains areas including:

app/
components/
lib/

Important application routes include:

- /daily
- /games/statuscards
- /games/statuscrash
- /games/statusfootball
- /games/statusquiz
- /games/statuswheel
- /store
- /tournaments

Important components include:

- components/Navbar.tsx
- components/football/PvPMatchmaking.tsx

Important action files include:

- lib/actions/cards.ts
- lib/actions/crash.ts
- lib/actions/daily.ts
- lib/actions/football-pvp.ts
- lib/actions/football.ts
- lib/actions/quiz-submission.ts
- lib/actions/quiz.ts
- lib/actions/store.ts
- lib/actions/tournaments.ts
- lib/actions/wheel.ts

Important game engine files include:

- lib/engine/Registry.ts
- lib/engine/games/StatusCardsEngine.ts
- lib/engine/games/StatusCrashEngine.ts
- lib/engine/games/StatusFootballEngine.ts
- lib/engine/games/StatusQuizEngine.ts
- lib/engine/games/StatusWheelEngine.ts

There is also a SessionManager file under the lib/engine area.

---

## 7. Current Games

The current project contains or is intended to contain several games:

### StatusQuiz

A quiz game where users answer questions and can receive SFP rewards.

### StatusCrash

A crash-style game.

Game outcomes and rewards must be determined securely.

### StatusWheel

A wheel/spin-style reward game.

Spin results and reward payouts must not be trusted from client-side JavaScript.

### StatusCards

A card-based game.

### StatusFootball

A football game that is expected to become one of the major gaming experiences.

StatusFootball is intended to support multiple modes, including:

- Single-player Penalty Shootout
- AI Arena
- PvP
- Realtime matchmaking

The exact final game modes should be determined from the existing implementation and project requirements rather than invented during cleanup.

---

## 8. SFP Wallet Philosophy

SFP means StatusFlow Points.

The wallet is an important part of the gaming system.

The client/browser must NEVER be treated as authoritative for:

- SFP balance
- Reward amount
- Game outcome
- Tournament reward
- Store purchase
- Daily reward eligibility
- Match result
- Payout status

All important financial/reward operations must be validated server-side.

The database ledger should provide a reliable record of balance-changing transactions.

---

## 9. Security Philosophy

StatusFlow Gaming is a rewards platform.

Security is therefore more important than visual polish.

The system should follow these principles:

### Server authority

Important game decisions should happen on the server.

### Database authority

Wallet balances and reward transactions should be controlled by trusted server/database logic.

### Idempotency

A user must not be able to receive the same reward twice by repeating the same request.

### Anti-cheat

The system should detect or prevent:

- manipulated requests
- replayed requests
- modified scores
- modified rewards
- fake game results
- fake completion events
- timer manipulation
- duplicate submissions

### Row Level Security

Supabase RLS must protect user-owned data.

Never disable RLS simply to make the application work.

If RLS causes a problem, fix the policies or server-side architecture.

### Least privilege

The browser should only receive permissions/data that it actually needs.

---

## 10. Important Development Rule

Do not trust code simply because it compiles.

A game can compile and look correct while still being insecure.

For every reward-related feature, ask:

1. Who decides the result?
2. Who decides the reward?
3. Can the browser change either?
4. Can the request be repeated?
5. Can the same reward be claimed twice?
6. Can another user's data be accessed?
7. What happens if the database transaction fails?
8. What happens if the user disconnects halfway through?
9. Can the request be replayed later?

---

## 11. Supabase

The project uses Supabase.

The Supabase project used by the broader StatusFlow ecosystem has project reference:

ogzouyydansuttpmmkcg

Supabase credentials must remain in environment variables.

The local project uses:

.env.local

Expected environment variables include:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

Never commit .env.local or expose secret Supabase credentials in source code.

Never paste secret keys into GitHub.

---

## 12. Existing Supabase Client Setup

The project uses:

lib/supabase/client.ts

for browser-side Supabase access.

It also has:

lib/supabase/server.ts

for server-side Supabase access.

The server client uses @supabase/ssr and Next.js cookies.

The server-side client is important for authenticated server actions and protected operations.

---

## 13. Current Next.js Compatibility

The project currently runs on:

Next.js 16.3.4

Because the development environment is Android/ARM64, Turbopack currently causes native-binding problems.

Use:

npm run dev -- --webpack

unless the environment is later changed and Turbopack becomes supported.

Do not change the Next.js version just because an older tutorial or code example uses another version.

Check compatibility before changing major versions.

---

## 14. Existing Setup Fixes

Several missing/broken pieces were fixed while getting the repository running:

- package.json was created
- Supabase server client was created
- app/globals.css was created
- TypeScript @/* path alias was configured
- Navbar import in app/layout.tsx was corrected
- Supabase environment variables were configured locally
- Next.js was updated to 16.3.4
- Webpack was used instead of Turbopack

These fixes should not be casually reverted.

---

## 15. Project Documentation

The repository will contain five main project-memory documents:

1. PROJECT_CONTEXT.md
2. CURRENT_STATUS.md
3. ARCHITECTURE.md
4. DATABASE.md
5. DEVELOPMENT_RULES.md

These documents exist so that future development sessions can understand the project without relying on conversation history.

They should be updated whenever an important architectural decision changes.

---

## 16. What We Are Doing Now

The immediate objective is to document the project correctly before performing a full code audit.

Order:

1. Create the five project documentation files.
2. Commit them to GitHub.
3. Audit Gemini's existing code.
4. Identify bugs and security problems.
5. Compare the implementation with the intended architecture.
6. Fix confirmed problems.
7. Continue StatusFootball and the other games.
8. Integrate the gaming system safely with StatusFlow.

Do not skip directly to large feature development before the audit is complete.

---

## 17. Working Style

The developer is a beginner and primarily works from an Android phone.

Instructions should therefore be:

- simple
- explicit
- sequential
- easy to copy and paste
- clear about where commands should be entered

Prefer complete replacement files over complicated patch instructions when practical.

Do not give many unrelated tasks at once.

When a step is completed, verify it before moving to the next step.

---

## 18. AI Development Rule

Claude, Gemini, ChatGPT, or any other AI may assist with the project.

However:

AI-generated code must be treated as code requiring review.

Do not assume that generated code is secure because it looks professional.

Before accepting important code:

- inspect it
- test it
- verify database interactions
- verify authentication
- verify authorization
- verify wallet operations
- verify idempotency
- verify server authority

The goal is a reliable production system, not merely code that runs.

---

## 19. Long-Term Goal

The long-term goal is for StatusFlow Gaming to become a reliable rewards gaming platform integrated with StatusFlow.

The platform should eventually support:

- multiple games
- SFP rewards
- secure wallet/ledger operations
- tournaments
- PvP
- football gaming
- daily rewards
- a rewards store
- anti-cheat systems
- user accounts
- secure Supabase integration
- scalable game architecture

The system should be designed so additional games can be added without rewriting the entire platform.

---

## 20. Golden Rule

NEVER trust the client with rewards.

The browser can request an action.

The server/database must decide whether that action is valid.

The server/database must determine the reward.

The ledger must record the reward.

The user should only receive SFP after the trusted transaction succeeds.
