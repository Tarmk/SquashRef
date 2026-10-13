# Squash Referee

[![CI](https://github.com/Tarmk/SquashRef/actions/workflows/ci.yml/badge.svg)](https://github.com/Tarmk/SquashRef/actions/workflows/ci.yml)
![Next.js 15](https://img.shields.io/badge/Next.js-15-black)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A match-support app for squash referees: score a match rally by rally, keep the server and serving side straight, run the warm-up and between-game timers, and print a full transcript at the end. It is built for refereeing real matches from a phone or tablet at the side of the court.

**Live:** https://squash-ref.vercel.app

<table>
  <tr>
    <td><img src="docs/scoring.png" alt="Scoring screen: game score, who is serving and from which side, one button per player" width="250"></td>
    <td><img src="docs/handout.png" alt="After a hand-out the new server chooses a side" width="250"></td>
    <td><img src="docs/game-complete.png" alt="Game complete: winner, match score and the 60-second break timer" width="250"></td>
  </tr>
  <tr>
    <td align="center">One tap per rally</td>
    <td align="center">Hand-out: new server picks a side</td>
    <td align="center">Game over, break timer</td>
  </tr>
</table>

## What it does

- **Live scoring.** One tap per rally. The app tracks the score, who serves, and which side they serve from: the server switches sides while they keep winning, and after a hand-out the new server picks a side.
- **Let / stroke / no let.** Decisions are logged in the transcript. A stroke counts as a rally won, so it can cause a hand-out or end a game like any other rally.
- **Warm-up and breaks.** A 5-minute warm-up timer (with the side switch at 2:30) and the 60-second break between games.
- **Transcripts.** Every rally of every game, with server, side and decisions, printable per game or for the whole match.
- **Accounts.** Sign in with email and password and matches save to your dashboard; without an account everything works in guest mode.
- **Tournaments.** Create a round-robin or Monrad tournament, add players, see the schedule, and share a join link with a QR code. (Players joining through the link is not connected to the database yet.)

Scoring follows point-a-rally to 11, win by two, best of 3 or 5 games. This app also ends a game at 15 after 10-10 to keep club matches on time; change `POINT_CAP` in [`src/lib/scoring.ts`](src/lib/scoring.ts) to `Infinity` for the PSA/WSF rule.

## How it is built

Next.js (App Router), React 19, TypeScript, Tailwind CSS, Firebase Auth and Firestore, deployed on Vercel.

- [`src/lib/scoring.ts`](src/lib/scoring.ts): the rules as pure functions (`playRally`, `isGameWon`, ...). The scoring screen calls these instead of re-implementing the rules inline.
- [`src/lib/schedule.ts`](src/lib/schedule.ts): round-robin schedules with the circle method (nobody plays twice in one round, byes for odd numbers) and the first Monrad round.
- [`hooks/useMatchPersistence.ts`](hooks/useMatchPersistence.ts): saves a signed-in referee's match to Firestore every 30 seconds and after every game, and marks it complete once.
- [`firestore.rules`](firestore.rules): users can only create and change their own matches and tournaments.

## Running it locally

```bash
npm install
npm run dev        # http://localhost:3000
```

Without Firebase config the app runs in guest mode. To save matches, create a Firebase project with Email/Password sign-in and Firestore, then put its web config in `.env.local` (`cp .env.example .env.local`):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Deploy the security rules with `firebase deploy --only firestore:rules` (or paste `firestore.rules` into the Firebase console).

## Checks

```bash
npm run lint
npm run typecheck
npm test           # Vitest: scoring rules, schedules, error messages
npm run build
```

CI runs all four on every push.

## Background

I played and refereed squash for years and kept seeing referees score on paper or in a notes app. This started as a tool for myself and grew into something other referees at my club could use. A separate, more fully featured version (SquashRef Pro) exists for my school's tournaments.

## License

MIT, see [LICENSE](LICENSE).
