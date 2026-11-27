import { useEffect, useRef, useState } from 'react';
import { readSaved, save } from '../garden/storage';

export type Soundscape = 'quiet' | 'rain' | 'stream';
type AudioGraph = { context: AudioContext; source: AudioBufferSourceNode; high: BiquadFilterNode; low: BiquadFilterNode; gain: GainNode };

export function useGardenSoundscape() {
  const graph = useRef<AudioGraph | null>(null);
  const request = useRef(0);
  const [soundscape, setSoundscape] = useState<Soundscape>('quiet');
  const [volume, setVolume] = useState(() => readSaved('sound-volume', 35, (value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100));
  const [error, setError] = useState('');

  useEffect(() => () => {
    request.current += 1;
    const current = graph.current;
    graph.current = null;
    if (current) { current.source.stop(); void current.context.close(); }
  }, []);

  useEffect(() => {
    save('sound-volume', volume);
    const current = graph.current;
    if (!current) return;
    const level = soundscape === 'quiet' ? 0 : volume / 100 * (soundscape === 'rain' ? .3 : .7);
    current.gain.gain.setTargetAtTime(level, current.context.currentTime, .18);
  }, [volume, soundscape]);

  async function choose(next: Soundscape) {
    const currentRequest = ++request.current;
    setError('');
    if (next === 'quiet') {
      setSoundscape('quiet');
      if (graph.current) {
        graph.current.gain.gain.value = 0;
        try { await graph.current.context.suspend(); } catch { /* Already closed during cleanup. */ }
      }
      return;
    }
    try {
      if (!graph.current) {
        // Synthesised ambience, created only in response to a visitor's action.
        const context = new AudioContext();
        const source = context.createBufferSource();
        const buffer = context.createBuffer(2, context.sampleRate * 4, context.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const samples = buffer.getChannelData(channel);
          for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        }
        source.buffer = buffer;
        source.loop = true;
        const high = context.createBiquadFilter();
        high.type = 'highpass';
        const low = context.createBiquadFilter();
        low.type = 'lowpass';
        const gain = context.createGain();
        gain.gain.value = 0;
        source.connect(high).connect(low).connect(gain).connect(context.destination);
        source.start();
        graph.current = { context, source, high, low, gain };
      }
      const current = graph.current;
      await current.context.resume();
      if (currentRequest !== request.current) return;
      current.high.frequency.setTargetAtTime(next === 'rain' ? 500 : 100, current.context.currentTime, .2);
      current.low.frequency.setTargetAtTime(next === 'rain' ? 6000 : 1300, current.context.currentTime, .2);
      current.low.Q.value = next === 'rain' ? .5 : 1.1;
      current.gain.gain.setTargetAtTime(volume / 100 * (next === 'rain' ? .3 : .7), current.context.currentTime, .18);
      setSoundscape(next);
    } catch {
      if (currentRequest !== request.current) return;
      const current = graph.current;
      graph.current = null;
      if (current) void current.context.close().catch(() => {});
      setError('Sound couldn’t start. Try selecting it again.');
      setSoundscape('quiet');
    }
  }

  return { soundscape, volume, setVolume, choose, error };
}
