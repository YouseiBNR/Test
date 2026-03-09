import { execSync } from 'child_process';
import path from 'path';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { SubtitleEntry, VideoMetadata } from '../types';

const OUTPUT_PATH = path.resolve('./out/translated.mp4');

function getVideoMetadata(videoPath: string): VideoMetadata {
  const durationStr = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`
  )
    .toString()
    .trim();

  const widthStr = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "${videoPath}"`
  )
    .toString()
    .trim();

  const heightStr = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "${videoPath}"`
  )
    .toString()
    .trim();

  const fpsStr = execSync(
    `ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "${videoPath}"`
  )
    .toString()
    .trim();

  // r_frame_rate returns as fraction like "30/1"
  const [fpsNum, fpsDen] = fpsStr.split('/').map(Number);
  const fps = Math.round(fpsNum / fpsDen);

  return {
    width: parseInt(widthStr, 10),
    height: parseInt(heightStr, 10),
    fps,
    durationInSeconds: parseFloat(durationStr),
  };
}

export async function renderVideo(
  subtitles: SubtitleEntry[],
  videoPath: string
): Promise<string> {
  console.log('[Render] Getting video metadata...');
  const metadata = getVideoMetadata(videoPath);
  console.log(
    `[Render] Video: ${metadata.width}x${metadata.height} @ ${metadata.fps}fps, ${metadata.durationInSeconds.toFixed(1)}s`
  );

  const durationInFrames = Math.ceil(metadata.durationInSeconds * metadata.fps);

  console.log('[Render] Bundling Remotion project...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve('./src/index.tsx'),
  });

  const inputProps = {
    subtitles,
    videoFileName: 'input.mp4',
  };

  console.log('[Render] Selecting composition...');
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'SubtitledVideo',
    inputProps,
  });

  // Override with actual video metadata
  composition.width = metadata.width;
  composition.height = metadata.height;
  composition.fps = metadata.fps;
  composition.durationInFrames = durationInFrames;

  console.log(`[Render] Rendering ${durationInFrames} frames...`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: OUTPUT_PATH,
    inputProps,
  });

  console.log(`[Render] Output saved to: ${OUTPUT_PATH}`);
  return OUTPUT_PATH;
}
