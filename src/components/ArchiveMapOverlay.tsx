import { ExternalLink, Folder, GraduationCap, Lock, Music, Sparkles, User, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PixelArchiveMap, type PixelArchiveMapLocation } from './PixelArchiveMap';
import { profileData, type ArchiveSectionId } from '../data/site';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useOverlayFocus } from '../hooks/useOverlayFocus';

type ArchiveMapOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout: () => void;
  onOpenProjects: () => void;
  onOpenJesus: () => void;
  onOpenArchiveSection: (sectionId: ArchiveSectionId) => void;
};

export function ArchiveMapOverlay({
  isOpen,
  onClose,
  onOpenAbout,
  onOpenProjects,
  onOpenJesus,
  onOpenArchiveSection,
}: ArchiveMapOverlayProps) {
  useBodyScrollLock(isOpen);
  const overlayRef = useOverlayFocus(isOpen, onClose);

  const mapLocations: PixelArchiveMapLocation[] = [
    {
      title: 'Locked About',
      body: 'Private context and longer notes.',
      status: 'locked',
      place: 'Private Keep',
      icon: User,
      position: {
        desktop: { x: 20, y: 23 },
        mobile: { x: 21, y: 22 },
      },
      action: onOpenAbout,
    },
    {
      title: 'School',
      body: 'Coursework and study archive.',
      status: 'locked',
      place: 'Study Hills',
      icon: GraduationCap,
      position: {
        desktop: { x: 66, y: 25 },
        mobile: { x: 66, y: 25 },
      },
      action: () => onOpenArchiveSection('school'),
    },
    {
      title: 'Music',
      body: 'Practice, references, and sounds.',
      status: 'locked',
      place: 'Sound Grove',
      icon: Music,
      position: {
        desktop: { x: 14, y: 55 },
        mobile: { x: 23, y: 55 },
      },
      action: () => onOpenArchiveSection('music'),
    },
    {
      title: 'Leadership',
      body: 'Roles, values, and lessons.',
      status: 'locked',
      place: 'Council Peak',
      icon: Users,
      position: {
        desktop: { x: 42, y: 37 },
        mobile: { x: 42, y: 37 },
      },
      action: () => onOpenArchiveSection('leadership'),
    },
    {
      title: 'Projects',
      body: 'Live builds and notes.',
      status: 'public',
      place: 'Build Town',
      icon: Folder,
      position: {
        desktop: { x: 38, y: 76 },
        mobile: { x: 38, y: 76 },
      },
      action: onOpenProjects,
    },
    {
      title: 'Jesus',
      body: 'Why I follow Him.',
      status: 'public',
      place: 'Chapel Garden',
      icon: Sparkles,
      position: {
        desktop: { x: 70, y: 70 },
        mobile: { x: 70, y: 70 },
      },
      action: onOpenJesus,
    },
    {
      title: 'Instagram',
      body: 'Main contact path.',
      status: 'external',
      place: 'North Dock',
      icon: ExternalLink,
      position: {
        desktop: { x: 87, y: 22 },
        mobile: { x: 78, y: 22 },
      },
      href: profileData.instagramUrl,
    },
    {
      title: 'My Dumpy',
      body: 'Second profile link.',
      status: 'external',
      place: 'South Pier',
      icon: ExternalLink,
      position: {
        desktop: { x: 87, y: 81 },
        mobile: { x: 78, y: 81 },
      },
      href: profileData.dumpsUrl,
    },
  ];

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div ref={overlayRef} role="dialog" aria-modal="true" aria-label="Archive map" tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-bg/92 px-4 py-8 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto w-full max-w-5xl rounded-3xl border border-border/60 bg-surface p-4 shadow-2xl shadow-black/35 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-warm-accent">Archive Map</p>
                <h2 className="text-3xl font-bold tracking-tight text-text sm:text-[2.35rem]">Archive Atlas</h2>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted">
                  Use the map to find my projects, personal notes and links.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-accent-soft p-3 text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent/15 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                aria-label="Close archive map"
              >
                <X size={22} />
              </button>
            </div>

            <PixelArchiveMap
              locations={mapLocations}
              onRunAction={handleAction}
              onExternalClick={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
