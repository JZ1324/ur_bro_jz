import { Music2, Pause, Play } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProfileTrack, ProfileTrackSource } from '../data/site';

type MiniMusicPlayerProps = {
  track: ProfileTrack;
};

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
};

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

function chooseSource(sources: ProfileTrackSource[]) {
  const connection = getConnection();
  const sortedSources = [...sources].sort((a, b) => b.bitrateKbps - a.bitrateKbps);
  const high = sortedSources.find((source) => source.quality === 'high') ?? sortedSources[0];
  const medium = sortedSources.find((source) => source.quality === 'medium') ?? high;
  const low = sortedSources.find((source) => source.quality === 'low') ?? medium;

  if (connection?.saveData) return low;
  if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return low;
  if (connection?.effectiveType === '3g') return medium;

  return high;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

export function MiniMusicPlayer({ track }: MiniMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedSource = useMemo(() => chooseSource(track.sources), [track.sources]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasAudioError, setHasAudioError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasAudioError(false);
    audio.load();
  }, [selectedSource.src]);

  if (!selectedSource) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || hasAudioError) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setHasAudioError(true);
      }
      return;
    }

    audio.pause();
  };

  return (
    <div className="relative z-10 mt-3 min-h-[6.75rem] w-full max-w-[14.5rem] overflow-hidden rounded-2xl border border-accent/20 bg-white/[0.055] p-2.5 shadow-2xl shadow-black/20 ring-1 ring-white/[0.05] backdrop-blur-xl">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasAudioError(true)}
      >
        <source src={selectedSource.src} type={selectedSource.type} />
      </audio>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(201,211,176,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />

      <div className="relative grid grid-cols-[2.8rem_minmax(0,1fr)_2.35rem] items-center gap-2.5">
        <img
          src={track.artworkSrc}
          alt={`${track.title} cover`}
          className="h-[2.8rem] w-[2.8rem] rounded-xl border border-white/10 object-cover opacity-90 shadow-lg shadow-black/20"
        />

        <div className="min-w-0 flex-1">
          <div className="flex h-3.5 items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-warm-accent/90">
            <Music2 size={10} className="shrink-0" />
            <span className="inline-block min-w-[5.9rem]">Now playing</span>
            <span
              className={`h-1 w-1 rounded-full bg-warm-accent transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-35'}`}
              aria-hidden="true"
            />
          </div>
          <p className="mt-0.5 truncate text-[13px] font-bold leading-tight text-text">{track.title}</p>
          <p className="truncate text-[11px] font-medium leading-tight text-muted">{track.artist}</p>
        </div>

        <button
          type="button"
          onClick={togglePlayback}
          disabled={hasAudioError}
          className="flex h-[2.35rem] w-[2.35rem] shrink-0 items-center justify-center rounded-full bg-accent text-bg shadow-lg shadow-accent/10 transition-all hover:bg-accent-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="translate-x-px" />}
        </button>
      </div>

      <div className="relative mt-2.5">
        <div className="h-1 overflow-hidden rounded-full bg-accent-soft">
          <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1 grid grid-cols-3 items-center text-[9px] font-semibold text-subtle">
          <span className="text-left">{formatTime(currentTime)}</span>
          <span className="text-center">{selectedSource.bitrateKbps} kbps</span>
          <span className="text-right">{formatTime(duration)}</span>
        </div>
      </div>

      {hasAudioError && (
        <p className="relative mt-2 text-[10px] font-semibold text-warm-accent">
          Upload the licensed audio files to Supabase Storage to enable playback.
        </p>
      )}
    </div>
  );
}
