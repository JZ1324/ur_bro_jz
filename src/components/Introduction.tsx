import type { ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { PuffyCloud, SparkleCross } from 'trazo-stickers';
import { profile } from '../content/profile';
import { profileData } from '../data/site';
import type { NavigateHandler } from '../hooks/useJourney';
import { GardenDoodles } from './GardenDoodles';

export function Introduction({ onNavigate, children }: { onNavigate: NavigateHandler; children: ReactNode }) {
  return <div className="section-copy introduction">
    <p className="intro-byline sticker-anchor">
      A garden by {profile.name} <span>·</span> <a className="intro-social" href={profileData.instagramUrl} target="_blank" rel="noreferrer">{profile.handle}</a>
      <PuffyCloud className="garden-sticker byline-cloud" color="var(--sage)" rotate={-10} focusable="false" />
    </p>
    <h1 id="opening-title" tabIndex={-1}>
      <span>Hey, I’m</span>{' '}<em><span className="sticker-anchor">JZ.<span className="garden-sticker opening-sticker" aria-hidden="true" /></span></em>
    </h1>
    <p className="intro-copy">{profile.intro}</p>
    <div className="intro-actions"><div className="sticker-anchor">
      <a className="primary-button wander-button" href="#projects" onClick={event => onNavigate(event, 'projects')}>See what I’ve built <ArrowDown size={18} strokeWidth={1.5} aria-hidden="true" /></a>
      <SparkleCross className="garden-sticker link-sparkle" color="var(--color-warm-accent)" rotate={-12} focusable="false" />
    </div>{children}</div>
    <GardenDoodles arrangement="opening" />
  </div>;
}
