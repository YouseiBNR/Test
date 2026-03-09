import React from 'react';
import { AbsoluteFill, Video, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SubtitleEntry } from '../types';

export type SubtitledVideoProps = {
  subtitles: SubtitleEntry[];
  videoFileName: string;
};

export const SubtitledVideo: React.FC<SubtitledVideoProps> = ({
  subtitles,
  videoFileName,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const activeSubtitle = subtitles.find(
    (s) => currentTimeMs >= s.startMs && currentTimeMs <= s.endMs
  );

  return (
    <AbsoluteFill>
      <Video src={staticFile(videoFileName)} />

      {activeSubtitle && (
        <AbsoluteFill
          style={{ justifyContent: 'flex-end', alignItems: 'center' }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#FFFFFF',
              fontSize: 36,
              fontFamily: '"Noto Sans JP", "Hiragino Sans", sans-serif',
              fontWeight: 700,
              padding: '8px 20px',
              borderRadius: 8,
              marginBottom: 60,
              maxWidth: '85%',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {activeSubtitle.text}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
