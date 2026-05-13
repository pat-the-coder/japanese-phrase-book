# Japanese Phrase Book App

A lightweight, mobile-friendly Progressive Web App (PWA) designed for improving Japanese listening comprehension through randomized phrase playback.

## Features

- **Randomized Playback**: Listen to Japanese phrases in a random order to test your recognition.
- **Background Audio**: Optimized for iPhone, supporting playback while the screen is locked or the app is in the background.
- **Auto-play Mode**: Hands-free study sessions with adjustable delays (1s - 5s).
- **History Tracking**: Review the last 50 phrases played in a convenient history drawer.
- **Offline Support**: Fully functional offline once installed as a PWA.
- **No Cloud Dependencies**: All audio and data are hosted locally within the app.

## Project Structure

- `phrases.csv`: The source of truth for your learning material.
- `scripts/generate_audio.py`: Python script to generate high-quality audio using macOS native TTS.
- `public/audio/`: Generated MP3 files (MD5 hashed names).
- `public/phrases.json`: Data index used by the React application.
- `src/`: React source code (Vite, Lucide-React).

## Setup & Development

### 1. Prerequisites
- **Node.js**: v18 or later.
- **Python**: v3.11 or later.
- **macOS**: Required for the audio generation script (uses native `say` command).
- **FFmpeg**: Required for audio conversion (`brew install ffmpeg`).

### 2. Audio Generation
To add new phrases or regenerate audio:
1. Update `phrases.csv`.
2. Ensure you have a Japanese voice (e.g., "Kyoko") installed in macOS System Settings.
3. Run the generation script:
   ```bash
   .venv/bin/python3 scripts/generate_audio.py
   ```
   *See [README_AUDIO.md](./README_AUDIO.md) for detailed audio setup instructions.*

### 3. Web App Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deployment

The app is designed to be hosted on **GitHub Pages**, **Netlify**, or **Vercel**.

### GitHub Pages Deployment
1. Update `vite.config.js` to include the base path:
   ```javascript
   export default defineConfig({
     base: '/your-repo-name/',
     // ...
   })
   ```
2. Build the project: `npm run build`.
3. Deploy the contents of the `dist` folder to your `gh-pages` branch.

## Technology Stack

- **Frontend**: React 19, Vite 6
- **Styling**: Vanilla CSS (Mobile-first)
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa (Workbox)
- **TTS**: macOS Native `say` + FFmpeg conversion

## License

MIT - For personal use and educational purposes.
