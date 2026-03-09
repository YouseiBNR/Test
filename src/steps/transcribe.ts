import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from '@remotion/install-whisper-cpp';
import type { Caption } from '@remotion/captions';

const WHISPER_PATH = path.resolve('./whisper.cpp');
const AUDIO_PATH = path.resolve('./tmp/audio.wav');
const WHISPER_VERSION = '1.5.5';
const MODEL = 'medium';

export interface CaptionGroup {
  text: string;
  startMs: number;
  endMs: number;
}

function groupCaptions(captions: Caption[], maxGapMs = 500, maxWords = 10): CaptionGroup[] {
  if (captions.length === 0) return [];

  const groups: CaptionGroup[] = [];
  let currentGroup: Caption[] = [captions[0]];

  for (let i = 1; i < captions.length; i++) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = captions[i];
    const gap = curr.startMs - prev.endMs;
    const wordCount = currentGroup.length;

    if (gap > maxGapMs || wordCount >= maxWords) {
      groups.push({
        text: currentGroup.map((c) => c.text).join(' ').trim(),
        startMs: currentGroup[0].startMs,
        endMs: currentGroup[currentGroup.length - 1].endMs,
      });
      currentGroup = [curr];
    } else {
      currentGroup.push(curr);
    }
  }

  if (currentGroup.length > 0) {
    groups.push({
      text: currentGroup.map((c) => c.text).join(' ').trim(),
      startMs: currentGroup[0].startMs,
      endMs: currentGroup[currentGroup.length - 1].endMs,
    });
  }

  return groups;
}

export async function transcribeVideo(videoPath: string): Promise<CaptionGroup[]> {
  console.log('[Transcribe] Setting up whisper.cpp...');

  // Install whisper.cpp (idempotent)
  await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });

  // Download model (idempotent)
  console.log(`[Transcribe] Downloading ${MODEL} model...`);
  await downloadWhisperModel({ model: MODEL, folder: WHISPER_PATH });

  // Extract audio to WAV (16kHz mono as required by whisper.cpp)
  console.log('[Transcribe] Extracting audio...');
  fs.mkdirSync(path.dirname(AUDIO_PATH), { recursive: true });
  execSync(
    `ffmpeg -i "${videoPath}" -ar 16000 -ac 1 -f wav "${AUDIO_PATH}" -y`,
    { stdio: 'inherit' }
  );

  // Transcribe
  console.log('[Transcribe] Running transcription...');
  const result = await transcribe({
    inputPath: AUDIO_PATH,
    whisperPath: WHISPER_PATH,
    model: MODEL,
    tokenLevelTimestamps: true,
  });

  const { captions } = toCaptions({ whisperCppOutput: result });
  console.log(`[Transcribe] Got ${captions.length} word-level captions.`);

  // Group into phrase-level segments
  const groups = groupCaptions(captions);
  console.log(`[Transcribe] Grouped into ${groups.length} subtitle segments.`);

  // Save intermediate output
  fs.writeFileSync(
    path.resolve('./tmp/transcription.json'),
    JSON.stringify(groups, null, 2)
  );

  return groups;
}
