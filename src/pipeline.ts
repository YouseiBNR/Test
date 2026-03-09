import { downloadVideo } from './steps/download';
import { transcribeVideo } from './steps/transcribe';
import { translateCaptions } from './steps/translate';
import { renderVideo } from './steps/render';

const DEFAULT_URL = 'https://www.instagram.com/reel/DVnTzDvDQcY/';

async function main() {
  const url = process.argv[2] || DEFAULT_URL;
  console.log('=== Auto Translate Video Pipeline ===');
  console.log(`URL: ${url}\n`);

  // Stage 1: Download
  const videoPath = await downloadVideo(url);

  // Stage 2: Transcribe
  const captions = await transcribeVideo(videoPath);

  // Stage 3: Translate to Japanese
  const subtitles = await translateCaptions(captions);

  // Stage 4: Render with subtitles
  const outputPath = await renderVideo(subtitles, videoPath);

  console.log('\n=== Pipeline Complete ===');
  console.log(`Output: ${outputPath}`);
}

main().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
