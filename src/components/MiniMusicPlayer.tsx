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

type LyricToken = {
  begin: number;
  end: number;
  text: string;
};

type LyricLine = {
  begin: number;
  end: number;
  text: string;
  part?: string;
  tokens: LyricToken[];
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

function parseTimecode(value: string | null | undefined) {
  if (!value) return 0;

  const v = value.trim();
  // seconds with suffix e.g. "1.234s"
  if (v.endsWith('s')) {
    const num = Number(v.slice(0, -1));
    return Number.isFinite(num) ? num : 0;
  }

  // colon-delimited time: "hh:mm:ss(.ms)" or "mm:ss(.ms)"
  if (v.includes(':')) {
    const parts = v.split(':').map((p) => p.trim());
    // parse from right to left
    const last = parseFloat(parts[parts.length - 1]) || 0;
    const second = parts.length > 1 ? parseInt(parts[parts.length - 2], 10) || 0 : 0;
    const third = parts.length > 2 ? parseInt(parts[parts.length - 3], 10) || 0 : 0;
    return third * 3600 + second * 60 + last;
  }

  // plain number of seconds
  const plain = Number(v);
  return Number.isFinite(plain) ? plain : 0;
}

function parseLyrics(raw: string): LyricLine[] {
  const trimmed = raw.trim();

  if (!trimmed) return [];

  if (trimmed.startsWith('<')) {
    const xml = new DOMParser().parseFromString(trimmed, 'application/xml');
    const parserError = xml.querySelector('parsererror');
    if (parserError) return [];

    const paragraphNodes = Array.from(xml.getElementsByTagName('p'));
    const parsed = paragraphNodes
      .map((paragraph): LyricLine | null => {
        const begin = parseTimecode(paragraph.getAttribute('begin'));
        const end = parseTimecode(paragraph.getAttribute('end'));
        const part = paragraph.parentElement?.getAttribute('itunes:song-part') ?? undefined;
        const spanNodes = Array.from(paragraph.getElementsByTagName('span'));

        // build tokens and normalise them
        let tokens: LyricToken[] = spanNodes
          .map((span) => ({
            begin: parseTimecode(span.getAttribute('begin')),
            end: parseTimecode(span.getAttribute('end')),
            text: (span.textContent ?? '').replace(/\s+/g, ' ').trim(),
          }))
          .filter((t) => t.text.length > 0 && Number.isFinite(t.begin));

        // sort by begin time and remove exact duplicates (same begin + text)
        tokens = tokens
          .sort((a, b) => a.begin - b.begin)
          .filter((t, idx, arr) => {
            const prev = arr[idx - 1];
            return !(prev && prev.begin === t.begin && prev.text === t.text);
          });

        // fill token end times: use explicit end, else next token begin, else paragraph end, else small fallback
        for (let ti = 0; ti < tokens.length; ti += 1) {
          const token = tokens[ti];
          if (!Number.isFinite(token.end) || token.end <= token.begin) {
            const next = tokens[ti + 1];
            if (next && Number.isFinite(next.begin)) token.end = next.begin;
            else if (Number.isFinite(end) && end > token.begin) token.end = end;
            else token.end = token.begin + 0.25; // fallback duration
          }
        }

        const text = tokens.length > 0
          ? tokens.map((token) => token.text).join(' ')
          : (paragraph.textContent ?? '').replace(/\s+/g, ' ').trim();

        if (!text) return null;

        const lineEnd = tokens.length > 0 ? tokens[tokens.length - 1].end : (end || begin);

        return {
          begin,
          end: lineEnd || begin,
          text,
          part,
          tokens,
        } satisfies LyricLine;
      })
      .filter((line): line is LyricLine => line !== null);

    return parsed.sort((a, b) => a.begin - b.begin);
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const timeTagRe = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const parsed: LyricLine[] = [];

  for (const line of lines) {
    let match: RegExpExecArray | null;
    const tags: number[] = [];

    while ((match = timeTagRe.exec(line)) !== null) {
      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const ms = match[3] ? Number((match[3] + '000').slice(0, 3)) : 0;
      tags.push(minutes * 60 + seconds + ms / 1000);
    }

    const text = line.replace(timeTagRe, '').trim();
    for (const begin of tags) {
      parsed.push({
        begin,
        end: begin,
        text,
        tokens: [{ begin, end: begin, text }],
      });
    }
  }

  return parsed.sort((a, b) => a.begin - b.begin);
}

function getActiveTokenIndex(line: LyricLine, time: number) {
  if (line.tokens.length === 0) return -1;

  const EPS = 0.05;
  for (let i = 0; i < line.tokens.length; i += 1) {
    const t = line.tokens[i];
    const next = line.tokens[i + 1];
    const tokenEnd = Number.isFinite(t.end) && t.end > t.begin
      ? t.end
      : next && Number.isFinite(next.begin)
        ? next.begin
        : line.end || t.begin + 0.25;

    if (time + EPS >= t.begin && time < tokenEnd - EPS) return i;
  }

  return Math.max(0, line.tokens.length - 1);
}

export function MiniMusicPlayer({ track }: MiniMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectedSource = useMemo(() => chooseSource(track.sources), [track.sources]);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRequestTimeRef = useRef<number | null>(null);
  const seekRequestTimeRef = useRef<number | null>(null);
  const targetSeekTimeRef = useRef<number | null>(null);
  const [playbackLatency, setPlaybackLatency] = useState(0); // seconds
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasAudioError, setHasAudioError] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [currentTokenProgress, setCurrentTokenProgress] = useState(0);
  const lyricRefs = useRef<Array<HTMLDivElement | null>>([]);
  const visibleLineWrapperRef = useRef<HTMLDivElement | null>(null);
  const visibleLineInnerRef = useRef<HTMLSpanElement | null>(null);
  const marqueeRafRef = useRef<number | null>(null);
  const tokenRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const currentTranslateRef = useRef(0);
  const currentTimeRef = useRef(0);
  const seekValueRef = useRef(0);
  const isSeekingRef = useRef(false);
  const playbackLatencyRef = useRef(0);
  const currentTokenIndexRef = useRef(0);
  const currentTokenProgressRef = useRef(0);

  useEffect(() => {
    currentTimeRef.current = currentTime;
    seekValueRef.current = seekValue;
    isSeekingRef.current = isSeeking;
    playbackLatencyRef.current = playbackLatency;
    currentTokenIndexRef.current = currentTokenIndex;
    currentTokenProgressRef.current = currentTokenProgress;
  }, [currentTime, seekValue, isSeeking, playbackLatency, currentTokenIndex, currentTokenProgress]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasAudioError(false);
    audio.load();
  }, [selectedSource.src]);

  useEffect(() => {
    if (!track.lyrics) {
      setLyrics([]);
      setCurrentLyricIndex(0);
      setCurrentTokenIndex(0);
      setCurrentTokenProgress(0);
      return;
    }

    (async () => {
      let raw = track.lyrics as string;
      try {
        if (/^https?:\/\//.test(raw)) {
          const res = await fetch(raw);
          if (res.ok) raw = await res.text();
        }
      } catch {
        // ignore fetch errors and fall back to raw value
      }

      const parsed = parseLyrics(raw);
      setLyrics(parsed);
      setCurrentLyricIndex(0);
      setCurrentTokenIndex(0);
      setCurrentTokenProgress(0);
    })();
  }, [track.lyrics]);

  useEffect(() => {
    const time = isSeeking ? seekValue : currentTime;
    if (lyrics.length === 0) return;

    // apply latency compensation so highlighting matches perceived audio
    const effectiveTime = time + playbackLatency;

    let i = lyrics.length - 1;
    while (i >= 0 && effectiveTime < lyrics[i].begin) i -= 1;
    const nextLyricIndex = Math.max(0, i);
    setCurrentLyricIndex(nextLyricIndex);

    const activeLine = lyrics[nextLyricIndex];
    if (activeLine) {
      const nextTokenIndex = getActiveTokenIndex(activeLine, effectiveTime);
      setCurrentTokenIndex(nextTokenIndex);

      const currentToken = activeLine.tokens[nextTokenIndex];
      if (currentToken) {
        const nextProgress = (effectiveTime - currentToken.begin) / Math.max(0.001, currentToken.end - currentToken.begin);
        setCurrentTokenProgress(Math.min(1, Math.max(0, nextProgress)));
      } else {
        setCurrentTokenProgress(0);
      }
    }
  }, [currentTime, isSeeking, seekValue, lyrics, playbackLatency]);

  // Use requestAnimationFrame while playing for smoother token highlighting
  useEffect(() => {
    let raf = 0;
    const audio = audioRef.current;

    function loop() {
      const a = audioRef.current;
      if (a) {
        // direct read to avoid waiting on timeupdate events
        setCurrentTime(a.currentTime);
      }
      raf = requestAnimationFrame(loop);
    }

    if (isPlaying && audio) {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isPlaying]);

  // Measure seek latency: when we requested a seek, wait until currentTime reflects it
  useEffect(() => {
    try {
      if (seekRequestTimeRef.current == null || targetSeekTimeRef.current == null) return;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const target = targetSeekTimeRef.current;
      if (Math.abs(currentTime - target) < 0.15) {
        const measured = (now - seekRequestTimeRef.current) / 1000;
        const clamped = Math.max(0, Math.min(1, measured));
        setPlaybackLatency((prev) => (prev ? prev * 0.6 + clamped * 0.4 : clamped));
        seekRequestTimeRef.current = null;
        targetSeekTimeRef.current = null;
      }
    } catch {
      // ignore measurement errors
    }
  }, [currentTime]);

  // Auto-scroll (marquee) the active lyric line when it's wider than the container
  type VisibleLyric = { line: LyricLine; index: number };
  const visibleLyrics = useMemo<VisibleLyric[]>(() => {
    if (lyrics.length === 0) return [];

    const effectiveTime = (isSeeking ? seekValue : currentTime) + playbackLatency;
    const idx = Math.min(Math.max(0, currentLyricIndex), lyrics.length - 1);
    const line = lyrics[idx];
    // only show the line if it's within 2s before start or has started
    if (effectiveTime + 0.0001 < line.begin - 2) return [];
    return [{ line, index: idx }];
  }, [currentLyricIndex, lyrics, isSeeking, seekValue, currentTime, playbackLatency]);

  // Auto-scroll follow loop: smoothly follow active token using syllable timing
  useEffect(() => {
    const wrapper = visibleLineWrapperRef.current;
    const innerEl = visibleLineInnerRef.current;
    if (!wrapper || !innerEl) return;
    if (!isPlaying) return;

    if (marqueeRafRef.current) {
      cancelAnimationFrame(marqueeRafRef.current);
      marqueeRafRef.current = null;
    }

    let lastTs: number | null = null;

    function step(ts: number) {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(50, ts - lastTs) / 1000; // seconds
      lastTs = ts;

      const wrapperW = wrapper.clientWidth;
      const innerW = innerEl.scrollWidth;
      if (innerW <= wrapperW) {
        currentTranslateRef.current = 0;
        innerEl.style.transform = 'translateX(0)';
        marqueeRafRef.current = requestAnimationFrame(step);
        return;
      }

      const tokenIndex = currentTokenIndexRef.current;
      const tokenEl = tokenRefs.current[tokenIndex] || null;
      const nextEl = tokenRefs.current[tokenIndex + 1] || null;
      const effectiveTime = (isSeekingRef.current ? seekValueRef.current : currentTimeRef.current) + playbackLatencyRef.current;
      const currentLine = visibleLyrics[0]?.line;
      const currentToken = currentLine?.tokens[tokenIndex];
      const tokenProgress = currentToken && Number.isFinite(currentToken.end) && currentToken.end > currentToken.begin
        ? Math.min(1, Math.max(0, (effectiveTime - currentToken.begin) / (currentToken.end - currentToken.begin)))
        : 0;

      let targetX = 0;
      if (tokenEl) {
        const fillCenterX = tokenEl.offsetLeft + tokenEl.offsetWidth * Math.min(1, Math.max(0, currentTokenProgressRef.current));
        let center = fillCenterX - wrapperW / 2;

        if (nextEl) {
          const nextLeft = nextEl.offsetLeft;
          const delta = tokenEl ? nextLeft - tokenEl.offsetLeft : 0;
          if (currentToken && tokenEl) {
            center += delta * tokenProgress * 0.35;
          }
        }

        targetX = Math.max(0, center);
      }

      const maxTranslate = Math.max(0, innerW - wrapperW);
      targetX = Math.min(targetX, maxTranslate);

      const followSpeed = 7; // higher = snappier follow while playing
      const cur = currentTranslateRef.current;
      const alpha = 1 - Math.exp(-followSpeed * dt);
      const next = cur + (targetX - cur) * alpha;
      currentTranslateRef.current = next;
      innerEl.style.transition = '';
      innerEl.style.transform = `translateX(${-next}px)`;

      marqueeRafRef.current = requestAnimationFrame(step);
    }

    marqueeRafRef.current = requestAnimationFrame(step);

    return () => {
      if (marqueeRafRef.current) cancelAnimationFrame(marqueeRafRef.current);
      marqueeRafRef.current = null;
      innerEl.style.transition = '';
    };
  }, [currentLyricIndex, visibleLyrics.length, isPlaying]);

  useEffect(() => {
    // scroll active lyric into view inside the lyric container
    const el = lyricRefs.current[currentLyricIndex];
    if (el && typeof el.scrollIntoView === 'function') {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        el.scrollIntoView();
      }
    }
  }, [currentLyricIndex]);

  if (!selectedSource) return null;

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || hasAudioError) return;

    if (audio.paused) {
      try {
        // record when we requested play so we can measure startup latency
        playRequestTimeRef.current = typeof performance !== 'undefined' ? performance.now() : null;
        await audio.play();
      } catch {
        setHasAudioError(true);
      }
      return;
    }

    audio.pause();
  };

  const commitSeek = (value?: number) => {
    const audio = audioRef.current;
    const nextValue = typeof value === 'number' ? value : seekValue;
    if (audio && Number.isFinite(nextValue)) {
      audio.currentTime = nextValue;
    }
    setSeekValue(nextValue);
    setIsSeeking(false);
  };

  return (
    <div className="relative z-10 mt-3 min-h-[6.25rem] w-full max-w-[13rem] overflow-hidden rounded-2xl border border-accent/20 bg-white/[0.055] p-2.5 shadow-2xl shadow-black/20 ring-1 ring-white/[0.05] backdrop-blur-xl">
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onSeeked={() => setIsSeeking(false)}
        onPlay={() => {
          setIsPlaying(true);
          // if we recorded a play request, compute latency
          try {
            const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
            if (playRequestTimeRef.current != null) {
              const measured = (now - playRequestTimeRef.current) / 1000; // seconds
              // clamp to reasonable range
              const clamped = Math.max(0, Math.min(1, measured));
              setPlaybackLatency((prev) => {
                // smooth the latency estimate
                if (!prev) return clamped;
                return prev * 0.6 + clamped * 0.4;
              });
              playRequestTimeRef.current = null;
            }
          } catch {
            // ignore
          }
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setHasAudioError(true)}
      >
        <source src={selectedSource.src} type={selectedSource.type} />
      </audio>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(201,211,176,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_42%)]" />

      <div className="relative grid grid-cols-[2.45rem_minmax(0,1fr)_2.2rem] items-center gap-2.25">
        <img
          src={track.artworkSrc}
          alt={`${track.title} cover`}
          className="h-[2.45rem] w-[2.45rem] rounded-xl border border-white/10 object-cover opacity-90 shadow-lg shadow-black/20"
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
          className="flex h-[2.2rem] w-[2.2rem] shrink-0 items-center justify-center rounded-full bg-accent text-bg shadow-lg shadow-accent/10 transition-all hover:bg-accent-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        >
          {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="translate-x-px" />}
        </button>
      </div>

      <div className="relative mt-2.5">
        <div className="flex items-center gap-2">
          <input
            aria-label={`Seek ${track.title}`}
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={isSeeking ? seekValue : currentTime}
            onChange={(e) => {
              const v = Number(e.currentTarget.value);
              setSeekValue(v);
              setIsSeeking(true);
            }}
            onPointerUp={(e) => {
              const v = Number(e.currentTarget.value);
              commitSeek(v);
            }}
            onMouseUp={() => {
              // record seek request time to measure seek application latency
              seekRequestTimeRef.current = typeof performance !== 'undefined' ? performance.now() : null;
              targetSeekTimeRef.current = seekValue;
              commitSeek();
            }}
            onTouchEnd={() => {
              commitSeek();
            }}
            onKeyUp={(e) => {
              if (
                e.key.startsWith('Arrow')
                || e.key === 'Home'
                || e.key === 'End'
                || e.key === 'PageUp'
                || e.key === 'PageDown'
              ) {
                const v = Number(e.currentTarget.value);
                commitSeek(v);
              }
            }}
            onBlur={() => {
              if (isSeeking) commitSeek();
            }}
            disabled={!duration}
            className="mini-range w-full"
            style={{
              background: `linear-gradient(90deg, rgba(201,211,176,1) ${progress}%, rgba(255,255,255,0.06) ${progress}%)`,
            }}
          />
        </div>
        <style>{`\n          .mini-range {\n            -webkit-appearance: none;\n            appearance: none;\n            height: 6px;\n            border-radius: 9999px;\n            outline: none;\n            background-clip: padding-box;\n          }\n          .mini-range::-webkit-slider-runnable-track {\n            height: 6px;\n            border-radius: 9999px;\n            background: transparent;\n          }\n          .mini-range::-webkit-slider-thumb {\n            -webkit-appearance: none;\n            width: 14px;\n            height: 14px;\n            border-radius: 50%;\n            background: #c9d3b0;\n            border: 3px solid rgba(0,0,0,0.25);\n            margin-top: -4px;\n            box-shadow: 0 4px 10px rgba(0,0,0,0.45);\n          }\n          .mini-range::-moz-range-track {\n            height: 6px;\n            border-radius: 9999px;\n            background: transparent;\n          }\n          .mini-range::-moz-range-thumb {\n            width: 14px;\n            height: 14px;\n            border-radius: 50%;\n            background: #c9d3b0;\n            border: 3px solid rgba(0,0,0,0.25);\n            box-shadow: 0 4px 10px rgba(0,0,0,0.45);\n          }\n        `}</style>

        <div className="mt-1 grid grid-cols-3 items-center text-[9px] font-semibold text-subtle">
          <span className="text-left">{formatTime(isSeeking ? seekValue : currentTime)}</span>
          <span className="text-center">{selectedSource.bitrateKbps} kbps</span>
          <span className="text-right">{formatTime(duration)}</span>
        </div>

        {lyrics.length > 0 && (
          <div className="mt-1.5 text-[10px] leading-tight text-text">
            <div className="flex flex-col gap-0.5 overflow-hidden">
              {visibleLyrics.map(({ line, index }) => {
                const isActive = index === currentLyricIndex;
                const activeTokenIndex = isActive ? currentTokenIndex : -1;
                const activeProgress = isActive ? Math.round(currentTokenProgress * 100) : 0;
                return (
                  <div
                    key={`${line.begin}-${index}`}
                    ref={(el: HTMLDivElement | null) => {
                      lyricRefs.current[index] = el;
                    }}
                    className={`w-full px-1 py-0.5 ${isActive ? 'text-accent font-semibold' : 'text-muted'}`}
                    aria-hidden={!isActive}
                  >
                    {line.tokens.length > 0 ? (
                      <div ref={visibleLineWrapperRef} className="w-full overflow-hidden">
                        <span
                          ref={visibleLineInnerRef}
                          className="inline-block whitespace-nowrap"
                        >
                          {line.tokens.map((token, tokenIndex) => (
                            <span
                              key={`${token.begin}-${tokenIndex}`}
                              ref={(el) => {
                                tokenRefs.current[tokenIndex] = el;
                              }}
                              className={
                                tokenIndex < activeTokenIndex
                                  ? 'text-accent/90'
                                  : tokenIndex === activeTokenIndex
                                    ? 'text-transparent'
                                    : 'text-muted/45'
                              }
                              style={tokenIndex === activeTokenIndex ? {
                                backgroundImage: `linear-gradient(90deg, rgb(201 211 176) 0%, rgb(201 211 176) ${activeProgress}%, rgb(142 146 127 / 0.45) ${activeProgress}%, rgb(142 146 127 / 0.45) 100%)`,
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                              } : undefined}
                            >
                              {token.text}
                              {' '}
                            </span>
                          ))}
                        </span>
                      </div>
                    ) : (
                      <div ref={visibleLineWrapperRef} className="w-full overflow-hidden">
                        <span ref={visibleLineInnerRef} className="inline-block whitespace-nowrap">{line.text}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {hasAudioError && (
        <p className="relative mt-2 text-[10px] font-semibold text-warm-accent">
          Upload the licensed audio files to Supabase Storage to enable playback.
        </p>
      )}
    </div>
  );
}
