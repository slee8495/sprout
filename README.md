# Sprout

A private, lifelong journal for our son Roun (이로운), shared between mom and dad. Inspired by wanting something better than Babyfolio.

## Core concept

- Shared family journal — entries either parent writes are visible to both
- Entries can be backdated (write today about something that happened last month) or created for future dates
- Calendar view is core navigation
- Photos attached to entries, with comments
- All UI in English; journal content often written in Korean
- Built for personal family use first, but architected so it could later become a product for other families

## Key features (brainstormed)

- Milestone tags (first solid food, first steps, first smile, etc.) with a badge/collection view
- Growth tracking (height/weight) with charts
- "On this day" flashback surfacing past entries
- Time-capsule messages that unlock on a future date (e.g. a letter that opens on his 18th birthday)
- Voice memos attached to entries
- Auto-generated yearly photobook/PDF export
- Chatbot Q&A over the journal ("When did Roun first eat solid food?"), answerable by voice

## Stack

Modeled after the `sl_sports` project's chatbot pattern (Vercel AI SDK + Claude tool-calling over Postgres via Drizzle, rather than vector RAG — journal entries are structured enough that direct DB-query tools work well).

- **Next.js + Vercel** — web app / PWA to start; can be wrapped or ported to React Native later without rebuilding the backend
- **Postgres (Vercel Postgres / Neon) + Drizzle** — journal entries, milestones, family/user data, modeled around a `family_id` so multi-family support can be added later without a rewrite
- **Auth.js + shared passphrase** — sign-in by picking a parent name (Dad/Mom) and entering a shared family passphrase, no OAuth or password management
- **Vercel Blob** — photo storage, no separate account needed
- **Vercel AI SDK + Claude** — chatbot with tools that query the DB directly; voice input via Web Speech API (or Whisper) transcribed then sent through the same pipeline

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Status

Core app is built out: shared-passphrase login, calendar-driven journal with photo/voice-memo attachments and comments, milestone badges, growth tracking with charts, "on this day" flashback, time-capsule messages, a yearly photobook print/export view, the Claude-powered Q&A chatbot, and PWA installability. Not yet: real content (still an empty journal), a text search UI on the journal itself, and chatbot awareness of growth/time-capsule data.
