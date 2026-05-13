import os
import csv
import json
import subprocess
import hashlib
from pathlib import Path

# Configuration
PHRASES_CSV = "phrases.csv"
OUTPUT_DIR = Path("public/audio")
PHRASES_JSON = Path("public/phrases.json")

# macOS Japanese Voice (Kyoko is usually best, but Otoya is also good)
# On Mac command line, use "say -v '?'" to list available voices
VOICE_NAME = "Otoya (Enhanced)"

def generate_audio(text, output_file):
    aiff_file = output_file.with_suffix(".aiff")
    
    try:
        # 1. Generate AIFF using macOS 'say' command
        say_cmd = [
            "say",
            "-v", VOICE_NAME,
            "-o", str(aiff_file),
            text
        ]
        subprocess.run(say_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 2. Convert to MP3 using ffmpeg
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", str(aiff_file),
            "-codec:a", "libmp3lame",
            "-qscale:a", "2",
            str(output_file)
        ]
        subprocess.run(ffmpeg_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Cleanup temporary AIFF
        if aiff_file.exists():
            aiff_file.unlink()
            
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error generating audio for: {text} - {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    phrases = []
    if not os.path.exists(PHRASES_CSV):
        print(f"Error: {PHRASES_CSV} not found.")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(PHRASES_CSV, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if len(row) < 2:
                continue
            jp_text, en_text = row[0].strip(), row[1].strip()
            
            # Generate a stable ID based on Japanese text
            phrase_id = hashlib.md5(jp_text.encode()).hexdigest()[:8]
            audio_filename = f"{phrase_id}.mp3"
            audio_path = OUTPUT_DIR / audio_filename
            
            if audio_path.exists():
                print(f"[{i+1}] Skipping existing: {jp_text}")
            else:
                print(f"[{i+1}] Generating audio: {jp_text}")
                success = generate_audio(jp_text, audio_path)
                if not success:
                    continue
            
            phrases.append({
                "id": phrase_id,
                "jp": jp_text,
                "en": en_text,
                "audio": audio_filename
            })

    with open(PHRASES_JSON, "w", encoding="utf-8") as f:
        json.dump(phrases, f, ensure_ascii=False, indent=2)
    
    # --- Cleanup Orphans ---
    valid_ids = {p["audio"] for p in phrases}
    orphans_removed = 0
    for file in OUTPUT_DIR.glob("*.mp3"):
        if file.name not in valid_ids:
            print(f"Cleaning up orphan: {file.name}")
            file.unlink()
            orphans_removed += 1

    print(f"\nDone! Generated {len(phrases)} phrases in {PHRASES_JSON}")
    if orphans_removed > 0:
        print(f"Removed {orphans_removed} orphan audio files.")

if __name__ == "__main__":
    main()
