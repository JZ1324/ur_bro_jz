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
  const sound = createCatSound(runSoundUrl, { loop: true, peak: .9 });
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  function play() {
    sound.play();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(sound.stop, 300);
  }

  function stop() {
    clearTimeout(idleTimer);
    sound.stop();
  }

  function dispose() {
    clearTimeout(idleTimer);
    sound.dispose();
  }

  return { unlock: sound.unlock, play, stop, dispose };
}

const fadeTimeConstant = .008;

function createCatSound(url: string | undefined, { peak, loop = false }: { peak: number; loop?: boolean }) {
  let context: AudioContext | undefined;
  let buffer: AudioBuffer | undefined;
  let preparation: Promise<void> | undefined;
  let playing: { source: AudioBufferSourceNode; gain?: GainNode; startedAt: number } | undefined;
  let offset = 0;
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
    if (loop && playing) return;
    stop();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    const startedAt = context.currentTime;
    const gain = loop ? context.createGain() : undefined;
    if (gain) {
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(1, startedAt, fadeTimeConstant);
      source.connect(gain).connect(context.destination);
    } else {
      source.connect(context.destination);
    }
    source.onended = () => {
      source.disconnect();
      gain?.disconnect();
      if (playing?.source === source) playing = undefined;
    };
    playing = { source, gain, startedAt };
    source.start(startedAt, offset);
  }

  function stop() {
    if (!playing) return;
    const { source, gain, startedAt } = playing;
    playing = undefined;
    if (gain && context && buffer) {
      const now = context.currentTime;
      // Resume the loop from this point when scrolling picks up again.
      offset = (offset + now - startedAt) % buffer.duration;
      if (context.state === 'running') {
        gain.gain.setTargetAtTime(0, now, fadeTimeConstant);
        source.stop(now + fadeTimeConstant * 5);
        return;
      }
    }
    source.stop();
  }

  function dispose() {
    controller.abort();
    stop();
    if (context) void context.close().catch(() => {});
  }

  return { unlock, play, stop, dispose };
}
