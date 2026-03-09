import fs from 'fs';
import path from 'path';
import type { SubtitleEntry } from '../types';
import type { CaptionGroup } from './transcribe';

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';
const DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateText(text: string, langPair = 'en|ja'): Promise<string> {
  const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langPair}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.responseData.translatedText;
}

export async function translateCaptions(groups: CaptionGroup[]): Promise<SubtitleEntry[]> {
  console.log(`[Translate] Translating ${groups.length} segments to Japanese...`);

  const subtitles: SubtitleEntry[] = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    console.log(`[Translate] (${i + 1}/${groups.length}) "${group.text}"`);

    const translatedText = await translateText(group.text);
    console.log(`[Translate]   -> "${translatedText}"`);

    subtitles.push({
      text: translatedText,
      startMs: group.startMs,
      endMs: group.endMs,
    });

    // Rate limiting
    if (i < groups.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Save intermediate output
  fs.writeFileSync(
    path.resolve('./tmp/subtitles.json'),
    JSON.stringify(subtitles, null, 2)
  );

  console.log('[Translate] Translation complete.');
  return subtitles;
}
