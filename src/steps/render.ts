import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import type { SubtitleEntry } from '../types';

const OUTPUT_PATH = path.resolve('./out/translated.mp4');
const FONT_PATH = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf';

function generateAssSubtitles(subtitles: SubtitleEntry[]): string {
  const header = `[Script Info]
Title: Auto Translated Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,IPAGothic,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,3,3,0,2,20,20,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const events = subtitles.map((s) => {
    const start = formatAssTime(s.startMs);
    const end = formatAssTime(s.endMs);
    return `Dialogue: 0,${start},${end},Default,,0,0,0,,${s.text}`;
  });

  return header + '\n' + events.join('\n') + '\n';
}

function formatAssTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

export async function renderVideo(
  subtitles: SubtitleEntry[],
  videoPath: string
): Promise<string> {
  console.log('[Render] Generating ASS subtitle file...');

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.mkdirSync(path.resolve('./tmp'), { recursive: true });

  const assPath = path.resolve('./tmp/subtitles.ass');
  const assContent = generateAssSubtitles(subtitles);
  fs.writeFileSync(assPath, assContent);
  console.log(`[Render] ASS file written to: ${assPath}`);

  // Use ffmpeg to burn subtitles onto the video
  console.log('[Render] Rendering video with ffmpeg...');

  const fontDir = path.dirname(FONT_PATH);
  const cmd = [
    'ffmpeg -y',
    `-i "${videoPath}"`,
    `-vf "ass=${assPath}:fontsdir=${fontDir}"`,
    '-c:v libx264 -preset medium -crf 23',
    '-c:a copy',
    `"${OUTPUT_PATH}"`,
  ].join(' ');

  console.log(`[Render] Command: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });

  console.log(`[Render] Output saved to: ${OUTPUT_PATH}`);
  return OUTPUT_PATH;
}
