import impactSoundUrl from './fahhh.mp3?url';

const runSoundUrl = import.meta.glob<string>('./huss-huss-huss.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})['./huss-huss-huss.mp3'];

// “Fahhh - Sound Effect for Meme Edits” by HighQualitySFX.
// https://www.youtube.com/watch?v=nh49oWrwFhM
export function createCartoonBlastSound() {
  return createCatSound(impactSoundUrl, { peak: .98 });
}

// “Huss Huss Huss Sound Effect (No Music)” — https://www.youtube.com/watch?v=Cy-uv_uBJkk
export function createCatRunSound() {
  return createCatSound(runSoundUrl, { peak: .9, finishBeforeReplay: true });
}

const fadeTimeConstant = .008;

function createCatSound(
  url: string | undefined,
  { peak, finishBeforeReplay = false }: { peak: number; finishBeforeReplay?: boolean },
) {
  let context: AudioContext | undefined;
  let buffer: AudioBuffer | undefined;
  let preparation: Promise<void> | undefined;
  let playing: { source: AudioBufferSourceNode; gain?: GainNode } | undefined;
  const controller = new AbortController();

  async function unlock() {
    if (!url) return false;
    try {
      context ??= new AudioContext();
      const audio = context;
      preparation ??= fetch(url, { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw new Error('Cat sound could not load.');
          return response.arrayBuffer();
        })
        .then(bytes => audio.decodeAudioData(bytes))
        .then(decoded => {
          const channels = Array.from({ length: decoded.numberOfChannels }, (_, channel) => decoded.getChannelData(channel));
          let max = 0;
          for (const samples of channels) {
            for (const sample of samples) max = Math.max(max, Math.abs(sample));
          }
          if (max > 0) {
            const level = peak / max;
            for (const samples of channels) {
              for (let i = 0; i < samples.length; i++) samples[i] *= level;
            }
          }
          buffer = decoded;
        })
        .catch(() => { preparation = undefined; });

      if (audio.state !== 'running') await audio.resume();
      await preparation;
      return audio.state === 'running' && Boolean(buffer);
    } catch {
      return false;
    }
  }

  function play() {
    if (!context || context.state !== 'running' || !buffer) return;
    if (finishBeforeReplay && playing) return;
    stop();
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = finishBeforeReplay ? context.createGain() : undefined;
    if (gain) {
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(1, context.currentTime, fadeTimeConstant);
      source.connect(gain).connect(context.destination);
    } else {
      source.connect(context.destination);
    }
    source.onended = () => {
      source.disconnect();
      gain?.disconnect();
      if (playing?.source === source) playing = undefined;
    };
    playing = { source, gain };
    source.start();
  }

  function stop() {
    if (!playing) return;
    const { source, gain } = playing;
    playing = undefined;
    if (gain && context?.state === 'running') {
      const now = context.currentTime;
      gain.gain.setTargetAtTime(0, now, fadeTimeConstant);
      source.stop(now + fadeTimeConstant * 5);
    } else {
      source.stop();
    }
  }

  function dispose() {
    controller.abort();
    stop();
    if (context) void context.close().catch(() => {});
  }

  return { unlock, play, stop, dispose };
}
