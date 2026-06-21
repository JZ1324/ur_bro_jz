import { useMemo, useState, type CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

export type PixelArchiveMapStatus = 'locked' | 'public' | 'external';

type PixelArchiveMapPoint = {
  x: number;
  y: number;
};

export type PixelArchiveMapLocation = {
  title: string;
  body: string;
  status: PixelArchiveMapStatus;
  place: string;
  icon: LucideIcon;
  position: {
    desktop: PixelArchiveMapPoint;
    mobile: PixelArchiveMapPoint;
  };
  action?: () => void;
  href?: string;
};

type PixelArchiveMapProps = {
  locations: PixelArchiveMapLocation[];
  onRunAction: (action: () => void) => void;
  onExternalClick: () => void;
};

const statusLabels: Record<PixelArchiveMapStatus, string> = {
  locked: 'locked',
  public: 'public',
  external: 'external',
};

const routePaths = [
  'M 20 22 C 30 27 36 33 42 36 S 55 29 66 25',
  'M 14 54 C 24 61 31 70 38 76',
  'M 38 76 C 50 71 59 70 70 70',
  'M 66 25 C 75 20 81 19 87 22',
  'M 70 70 C 76 76 82 79 87 80',
  'M 42 36 C 43 49 41 65 38 76',
  'M 20 22 C 14 33 13 44 14 54',
  'M 42 36 C 54 47 62 60 70 70',
];

type MarkerStyle = CSSProperties & {
  '--map-x': string;
  '--map-y': string;
  '--map-mobile-x': string;
  '--map-mobile-y': string;
};

export function PixelArchiveMap({ locations, onRunAction, onExternalClick }: PixelArchiveMapProps) {
  const defaultLocation = useMemo(
    () => locations.find((location) => location.title === 'Projects') ?? locations[0],
    [locations],
  );
  const [selectedTitle, setSelectedTitle] = useState(defaultLocation?.title ?? '');
  const selectedLocation = locations.find((location) => location.title === selectedTitle) ?? defaultLocation;

  const selectLocation = (location: PixelArchiveMapLocation) => {
    setSelectedTitle(location.title);
  };
  const selectedCard = selectedLocation && (
    <>
      <div className="pixel-archive-selected-heading">
        <p className="pixel-archive-selected-kicker">{statusLabels[selectedLocation.status]}</p>
        <h3>{selectedLocation.title}</h3>
        <p className="pixel-archive-selected-place">{selectedLocation.place}</p>
      </div>
      <p className="pixel-archive-selected-body">{selectedLocation.body}</p>
    </>
  );

  return (
    <section className="pixel-archive-atlas-shell" aria-label="Archive Atlas destinations">
      <div className="pixel-archive-map-key-row">
        {Object.entries(statusLabels).map(([status, label]) => (
          <span key={status} className="pixel-archive-map-key" data-status={status}>
            <span className="pixel-archive-map-key-dot" aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      <div className="pixel-archive-world" aria-label="Interactive Archive Atlas">
        <img
          src="/archive-map/archive-atlas-rpg.png"
          alt=""
          aria-hidden="true"
          className="pixel-archive-atlas-image"
          draggable={false}
        />
        <div className="pixel-archive-water-shimmer" aria-hidden="true" />
        <div className="pixel-archive-fog" aria-hidden="true" />
        <div className="pixel-archive-noise" aria-hidden="true" />

        <svg
          className="pixel-archive-routes"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {routePaths.map((path) => (
            <path key={path} d={path} />
          ))}
        </svg>

        <div className="pixel-archive-compass" aria-hidden="true">
          <span>N</span>
          <span>A-08</span>
        </div>

        <ul className="pixel-archive-location-list" role="list">
          {locations.map((location) => {
            const Icon = location.icon;
            const isSelected = selectedLocation?.title === location.title;
            const markerStyle: MarkerStyle = {
              '--map-x': `${location.position.desktop.x}%`,
              '--map-y': `${location.position.desktop.y}%`,
              '--map-mobile-x': `${location.position.mobile.x}%`,
              '--map-mobile-y': `${location.position.mobile.y}%`,
            };
            const label = `${location.title}. ${location.body} ${statusLabels[location.status]}.`;
            const content = (
              <>
                <span className="pixel-archive-marker-beacon" aria-hidden="true">
                  <Icon size={15} strokeWidth={2.5} />
                </span>
                <span className="pixel-archive-marker-copy">
                  <span className="pixel-archive-marker-title">{location.title}</span>
                  <span className="pixel-archive-marker-place">{location.place}</span>
                </span>
              </>
            );

            return (
              <li key={location.title} className="pixel-archive-location" style={markerStyle}>
                {location.href ? (
                  <a
                    href={location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => selectLocation(location)}
                    onFocus={() => selectLocation(location)}
                    onClick={() => {
                      selectLocation(location);
                      onExternalClick();
                    }}
                    className="pixel-archive-marker"
                    data-status={location.status}
                    data-selected={isSelected ? 'true' : 'false'}
                    aria-label={label}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    type="button"
                    onMouseEnter={() => selectLocation(location)}
                    onFocus={() => selectLocation(location)}
                    onClick={() => {
                      selectLocation(location);
                      if (location.action) onRunAction(location.action);
                    }}
                    className="pixel-archive-marker"
                    data-status={location.status}
                    data-selected={isSelected ? 'true' : 'false'}
                    aria-label={label}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {selectedCard && (
        <aside className="pixel-archive-selected-card pixel-archive-selected-card--dock" aria-live="polite">
          {selectedCard}
        </aside>
      )}
    </section>
  );
}
