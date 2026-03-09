import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = path.resolve('./public/input.mp4');

export async function downloadVideo(url: string): Promise<string> {
  console.log(`[Download] Downloading video from: ${url}`);

  if (fs.existsSync(OUTPUT_PATH)) {
    console.log('[Download] Video already exists, skipping download.');
    return OUTPUT_PATH;
  }

  try {
    execSync(
      `yt-dlp -o "${OUTPUT_PATH}" --no-check-certificates "${url}"`,
      { stdio: 'inherit' }
    );
  } catch {
    // Retry with cookies from browser if initial download fails
    console.log('[Download] Initial download failed, retrying with cookies...');
    try {
      execSync(
        `yt-dlp -o "${OUTPUT_PATH}" --cookies-from-browser chrome "${url}"`,
        { stdio: 'inherit' }
      );
    } catch {
      throw new Error(
        'Failed to download video. You may need to manually download the video to public/input.mp4'
      );
    }
  }

  if (!fs.existsSync(OUTPUT_PATH)) {
    throw new Error('Download completed but output file not found.');
  }

  console.log(`[Download] Video saved to: ${OUTPUT_PATH}`);
  return OUTPUT_PATH;
}
