# Japanese Phrase Book App - Audio Generation

This project uses a Python script to convert Japanese phrases from a CSV file into high-quality MP3 audio files using the macOS native Text-to-Speech (TTS) engine.

## Prerequisites

1.  **macOS**: The script uses the built-in `say` command.
2.  **FFmpeg**: Required for converting AIFF files to MP3.
    ```bash
    brew install ffmpeg
    ```
3.  **Python 3**: A virtual environment is recommended.

## Setup

1.  **Install Japanese Voice**:
    Go to **System Settings > Accessibility > Spoken Content > System Voice**. Click "Manage Voices..." and ensure **Kyoko** (Japanese) is downloaded and installed.

2.  **Initialize Virtual Environment**:
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    pip install requests
    ```

## How to Generate Audio

1.  **Update Phrases**: Add your Japanese phrases to `phrases.csv` in the following format:
    ```csv
    Japanese Text,English Translation
    今日はいい天気ですね。,It's nice weather today.
    ```

2.  **Run the Script**:
    ```bash
    .venv/bin/python3 scripts/generate_audio.py
    ```

## Output

-   **`public/audio/*.mp3`**: Generated audio files (IDs are stable MD5 hashes of the Japanese text).
-   **`public/phrases.json`**: A JSON index of all phrases used by the web app.

---

*Note: If you want to use a different voice, you can change the `VOICE_NAME` variable in `scripts/generate_audio.py`.*
