# Japanese Random Phrase Listening App — Updated Specification

## Goal

Create a lightweight mobile-friendly app for improving Japanese listening comprehension and grammar recognition through randomized phrase playback.

Primary priorities:

1. Extremely easy to develop and maintain
2. Reliable mobile usage
3. Background playback support on iPhone
4. Fast iteration on phrase content
5. No paid APIs or cloud dependencies
6. Minimal friction during study sessions

---

# Final Recommended Architecture

## Recommended Platform

### Progressive Web App (PWA)

A web app that:

- runs in browser
- works on desktop and mobile
- can be installed to home screen
- behaves similarly to a native app
- avoids App Store deployment complexity

Recommended hosting:

- GitHub Pages
- Netlify
- Vercel

---

# Updated Audio Recommendation

## IMPORTANT ARCHITECTURE DECISION

Initial recommendation used browser Text-to-Speech (TTS).

However, after evaluating iPhone background playback limitations:

## Recommended Final Approach

Use:

- pre-generated MP3 audio files
- standard browser audio playback

instead of:

- live browser speech synthesis

---

# Why MP3 Playback Is Better

## Major Advantage

Reliable background playback on iPhone.

This enables:

- listening while walking
- playback with screen locked
- AirPods controls
- Bluetooth headset controls
- lock screen media controls

Browser speech synthesis is unreliable when:
- screen locks
- app backgrounds
- phone sleeps

Real audio playback behaves much more like:
- Spotify
- Podcasts
- language learning apps

---

# Recommended Technology Stack

## Frontend

### Recommended

- React
- Vite

Reasons:
- fast setup
- easy state management
- mobile-friendly
- huge ecosystem
- simple deployment

---

# Audio Strategy

## Recommended Playback Method

Use HTML audio playback.

### Example

```javascript
const audio = new Audio("/audio/001.mp3");
audio.play();
```

This provides much better compatibility with:
- iPhone
- lock screen playback
- background playback

---

# Audio Generation Strategy

## Goal

Generate Japanese phrase audio locally without paid APIs.

---

# Recommended Tool: Piper TTS

Piper TTS:
https://github.com/rhasspy/piper

Advantages:

- offline
- free
- local generation
- no API cost
- scriptable
- reasonably high quality
- fast generation

---

# Suggested Audio Workflow

## Source Phrase File

Example CSV:

```csv
jp,en
今日は忙しいです。,I'm busy today.
どこに行きますか？,Where are you going?
```

---

## Generation Pipeline

```text
phrases.csv
↓
audio generation script
↓
audio/*.mp3
↓
phrases.json
```

---

# Suggested Phrase Data Structure

## JSON Format

```json
[
  {
    "id": 1,
    "jp": "今日は忙しいです。",
    "en": "I'm busy today.",
    "audio": "001.mp3"
  },
  {
    "id": 2,
    "jp": "どこに行きますか？",
    "en": "Where are you going?",
    "audio": "002.mp3"
  }
]
```

---

# Core User Experience

## Main Study Screen

Large centered Japanese phrase display.

### Example Layout

```text
今日は忙しいです。

[ Show English ]

I'm busy today.

[ Pause ]
[ Replay ]
[ Next Random ]
[ History ]
```

---

# Core Features

## 1. Random Phrase Playback

The app should:

- randomly select a phrase
- play Japanese audio
- optionally wait before next phrase
- continue automatically

---

## 2. Background Playback Support

The app should continue playback when:

- phone locks
- app backgrounds
- screen turns off

This is a major reason for using MP3 playback instead of browser TTS.

---

## 3. Phrase History (High Priority)

Problem:
User may want to inspect a phrase after the next phrase already started.

### Solution

Maintain a history buffer of recently played phrases.

### Requirements

- keep last 10–50 phrases
- tapping history item:
  - replays audio
  - shows Japanese
  - shows English
- newest entries at top

---

## 4. Replay Controls

### Required Controls

- Pause
- Resume
- Replay current phrase
- Replay previous phrase
- Next random phrase

---

## 5. Adjustable Timing

User-configurable delay between phrases.

### Suggested Defaults

- 2 seconds
- 3 seconds
- 5 seconds

---

# Randomization Logic

## Requirements

- avoid immediate repeats
- reasonably uniform distribution

### Suggested Logic

Maintain:

- recently played queue
- exclude last N phrases from selection

Example:

```javascript
excludeLast = 5;
```

---

# Mobile Requirements

## iPhone Support

Target:
- Safari
- Chrome
- installed PWA mode

### Important Notes

Playback should begin after:
- a user tap
- a "Start Session" button

This improves autoplay compatibility.

---

# Offline Support

## Goal

App should work without internet after initial load.

### Requirements

- cache app assets
- cache phrase JSON
- cache audio files

### Technology

- service worker
- standard PWA manifest

---

# UI Design Principles

## Priorities

- large readable Japanese text
- minimal distractions
- one-handed phone usage
- fast replay access
- easy history review

---

# Suggested Layout

## Top Section

Current Japanese phrase

## Middle Section

English translation

## Bottom Controls

- pause
- replay
- next
- settings

## Side/Bottom Drawer

History list

---

# Suggested File Structure

```text
project/
├── public/
│   ├── phrases.json
│   ├── manifest.json
│   └── audio/
│       ├── 001.mp3
│       ├── 002.mp3
│       └── 003.mp3
├── src/
│   ├── components/
│   ├── hooks/
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

# Example Internal Data Model

```javascript
{
  id: 42,
  jp: "今日は忙しいです。",
  en: "I'm busy today.",
  audio: "042.mp3",
  tags: ["daily", "jlpt-n5"],
  difficulty: 2
}
```

---

# Suggested Development Order

## Phase 1 — MVP

Build:

- random phrase selection
- MP3 playback
- Japanese text display
- English text display
- replay button
- history buffer

---

## Phase 2 — Better Mobile UX

Add:

- PWA install support
- offline support
- background playback improvements
- lock screen compatibility
- playback timing controls

---

## Phase 3 — Learning Features

Add:

- hidden translation mode
- spaced repetition
- difficulty tracking
- furigana
- phrase categories

---

# Optional Future Features

## 1. Furigana Support

Example:

```text
今日(きょう)は忙(いそが)しいです。
```

---

## 2. Hidden Translation Mode

Hide English until tapped.

Useful for active listening practice.

---

## 3. Repeat Difficult Phrases

Buttons:

- Easy
- Hard
- Repeat Again

---

## 4. Playback Speed Control

Options:
- 0.75x
- 0.9x
- 1.0x

---

## 5. Category Filters

Examples:
- Travel
- Casual conversation
- Grammar patterns
- JLPT levels

---

## 6. Search

Search by:
- Japanese text
- English translation

---

## 7. Import Existing Learning Material

Potential future integrations:
- Anki decks
- subtitle files
- CSV exports

---

# Non-Goals (Initial Version)

Avoid building:

- user accounts
- cloud sync
- backend APIs
- AI generation
- social features
- paid TTS services
- native iOS app

These add complexity without improving the core learning experience.

---

# Final Recommendation

The recommended final architecture is:

## Frontend

- React
- Vite
- PWA

## Audio

- pre-generated MP3 files

## Audio Generation

- Piper TTS locally

## Data Storage

- local JSON files

## Hosting

- GitHub Pages

This approach provides:

- reliable iPhone playback
- background audio support
- offline usage
- no API costs
- easy deployment
- minimal maintenance
- fast development

while remaining much simpler than building a native iOS app.
