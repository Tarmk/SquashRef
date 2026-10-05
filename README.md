# Squash Referee

A match-support app for squash referees: score a match point by point, keep serve and serve side straight, handle warm-up and break timers, and export a full transcript at the end. Built for refereeing real matches from a phone or tablet at the side of the court.

Live: https://squash-ref.vercel.app

## What it does

- **Match setup** – choose the match format (best of 3 / 5, point-a-rally scoring) and the players
- **Live scoring** – one tap per rally, with serve, serve side and game score tracked for you
- **Warm-up and breaks** – timers for the warm-up and between-game breaks
- **Transcripts** – a per-game and full-match transcript you can print or share
- **Tournaments** – create a tournament, let other referees join it, and keep every match in one place
- **Accounts** – sign in with email and password; matches and tournaments are saved to your dashboard

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, Firebase Auth + Firestore. Deployed on Vercel.

## Running it locally

```bash
npm install
npm run dev
```

Create a Firebase project and put its web config in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firestore rules are in `firestore.rules`. Then open http://localhost:3000.

## Background

I played and refereed squash for years and kept seeing referees score on paper or in a notes app. This started as a tool for myself and grew into something other referees at my club could share a tournament with. A separate, more fully featured version (SquashRef Pro) exists for my school's tournaments.
