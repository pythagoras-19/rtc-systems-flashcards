# rtc-systems-flashcards

Interactive flashcards for real-time communication systems, generated from the educational content in `flashcards.tex` and rendered as a React + TypeScript web app.

## What this is

This app turns the LaTeX source into active-recall flashcards covering SIP, VoIP, networking, queueing theory, LTE/5G/wireless, RF/MANET, and cybersecurity.

The editable source of truth is `src/data/cards.json`.

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Edit flashcards

Update `src/data/cards.json` to change card content, add cards, or refine prompts and explanations. The `flashcards.tex` file is kept in the repo as source material, but the app reads from the JSON deck.

## Features

- Section selector
- Topic and tag search
- Flip card view
- Previous and next navigation
- Shuffle mode
- Missed-card review mode with localStorage persistence
- Keyboard controls for flip and navigation

## Notes

- The app is built with Vite, React, and TypeScript.
- `src/data/cards.json` is the primary data file used by the UI.