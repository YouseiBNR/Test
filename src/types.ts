export interface SubtitleEntry {
  text: string;
  startMs: number;
  endMs: number;
}

export interface VideoMetadata {
  width: number;
  height: number;
  fps: number;
  durationInSeconds: number;
}
