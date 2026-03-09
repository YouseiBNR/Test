import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { SubtitledVideo } from './components/SubtitledVideo';
import type { SubtitleEntry } from './types';

const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SubtitledVideo"
      component={SubtitledVideo}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={30 * 30}
      defaultProps={{
        subtitles: [] as SubtitleEntry[],
        videoFileName: 'input.mp4',
      }}
    />
  );
};

registerRoot(RemotionRoot);
