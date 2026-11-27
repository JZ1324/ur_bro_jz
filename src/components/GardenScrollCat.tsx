import { useId, useLayoutEffect, useRef } from 'react';
import { clamp, smoothstep } from '../garden/journey';
import { CatMudCoat, CatSlipLines, CatSlipScenery, catSlipFrame, catSlipLayout, slipEndsAt, slipLandsAt } from './GardenCatSlip';
import { GardenCatReactions, GardenCatSongShot, GardenSongBlast } from './GardenCatReactions';
import { GardenCatStories, GardenDaisyCat } from './GardenCatStories';
import { GardenSceneProps } from './GardenSceneProps';
import { createGardenProps } from '../garden/catProps';
import { createCatRunSound } from '../garden/catSounds';
import { pointOnGardenPath, sharedGardenCatPath, sharedGardenStep } from '../garden/sharedGardenCatPath';

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const footprintCount = 6;
type CatGesture = 'reaching' | 'hugging' | 'releasing' | 'offering';

export function GardenScrollCat({ paused, rain }: { paused: boolean; rain: boolean }) {
  const cat = useRef<HTMLDivElement>(null);
  const runSound = useRef<ReturnType<typeof createCatRunSound> | null>(null);
  const effects = useRef<HTMLDivElement>(null);
  const songShot = useRef<SVGSVGElement>(null);
  const resumedJourney = useRef(false);
  const sawSongShot = useRef(false);
  const sceneProps = useRef<HTMLDivElement>(null);
  const propsUpdater = useRef<ReturnType<typeof createGardenProps> | null>(null);
  const muddyPrints = useRef<SVGGElement>(null);
  const pawShape = useId();
  const slip = useRef({ started: null as number | null, kicked: false, muddy: false });
  const mudMarks = useRef<{ x: number; y: number }[]>([]);

  useLayoutEffect(() => {
    const sound = createCatRunSound();
    runSound.current = sound;

    function unlock() {
      void sound.unlock().then(ready => {
        if (ready && runSound.current === sound && !document.hidden &&
            cat.current?.dataset.walking === 'true' && !document.querySelector('dialog[open]')) {
          sound.play();
        }
      });
    }

    function stopWhenHidden() {
      if (document.hidden) sound.stop();
    }

    window.addEventListener('click', unlock, true);
    window.addEventListener('keydown', unlock, true);
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => {
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      document.removeEventListener('visibilitychange', stopWhenHidden);
      runSound.current = null;
      sound.dispose();
    };
  }, []);

  useLayoutEffect(() => {
    const element = cat.current;
    const ground = effects.current;
    const shot = songShot.current;
    const entrance = element?.closest('.garden-app')?.querySelector('.opening-sticker');
    const stamps = muddyPrints.current;
    const trail = stamps?.ownerSVGElement;
    if (!element || !ground || !shot || !entrance || !sceneProps.current || !stamps || !trail) return;

    const garden = entrance.closest('.garden-app')!;
    const projects = garden.querySelector('.section-projects');
    const communityScene = garden.querySelector('.community-scene');
    const communityLane = garden.querySelector('.community-cat-lane');
    const accident = slip.current;
    const updateProps = propsUpdater.current ??= createGardenProps(sceneProps.current);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const prints = [...ground.querySelectorAll<SVGSVGElement>('.scroll-cat-print')];
    let animations: (Animation | undefined)[] = [];
    let nextPrint = 0;
    let lastStep: { x: number; y: number } | undefined;
    let frame = 0;
    let restTimer = 0;
    let washTimer = 0;
    let wakingAt: number | null = null;
    let leftBed = false;
    let bedPosition: { x: number; y: number; size: number } | undefined;
    let disposed = false;
    let lastScroll = window.scrollY;
    let manualScrollUntil = 0;
    let scrollingDown = !paused && !resumedJourney.current &&
      document.documentElement.hasAttribute('data-restore-scroll');
    if (!paused) resumedJourney.current = true;
    let pressedSongButton = false;
    let lastDraw: { x: number; y: number; size: number; at: number } | undefined;
    let finishingCrossing = false;
    let joiningGarden = false;
    type CommunityWalk = { path: ReturnType<typeof sharedGardenCatPath>; start: number; arrive: number; leave: number; flowerSize: number };
    let communityWalk: (CommunityWalk & { progress: number; at: number }) | undefined;
    let activePose: HTMLElement | undefined;

    function resetPose() {
      if (!activePose) return;
      delete activePose.dataset.catAction;
      activePose.style.removeProperty('--cat-reach');
    }

    function clearTrail() {
      for (const animation of animations) animation?.cancel();
      animations = [];
      nextPrint = 0;
      lastStep = undefined;
    }

    function leavePrint(x: number, y: number, scroll: number) {
      const previous = lastStep;
      if (previous && Math.hypot(x - previous.x, y - previous.y) < 23) return;
      lastStep = { x, y };
      if (!previous) return;

      const angle = Math.atan2(x - previous.x, previous.y - y);
      const side = (accident.muddy ? mudMarks.current.length : nextPrint) % 2 === 0 ? -6 : 6;
      const printX = lerp(previous.x, x, .58) + Math.cos(angle) * side;
      const printY = lerp(previous.y, y, .58) + Math.sin(angle) * side;
      if (accident.muddy) {
        const spots = mudMarks.current;
        if (spots.length >= 420) return;
        const bounds = trail.getBoundingClientRect();
        const stampX = printX - bounds.left;
        const stampY = printY - scroll - bounds.top;
        if (spots.some(spot => Math.hypot(stampX - spot.x, stampY - spot.y) < 16)) return;
        spots.push({ x: stampX, y: stampY });
        const mark = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        mark.setAttribute('href', `#${pawShape}`);
        mark.setAttribute('transform', `translate(${stampX} ${stampY}) rotate(${angle * 180 / Math.PI}) scale(1.15) translate(-6 -6)`);
        stamps.append(mark);
        return;
      }

      const print = prints[nextPrint];
      print.style.setProperty('--print-x', `${printX}px`);
      print.style.setProperty('--print-y', `${printY}px`);
      print.style.setProperty('--print-angle', `${angle}rad`);
      animations[nextPrint]?.cancel();
      animations[nextPrint] = print.animate([
        { opacity: .59 }, { opacity: .43, offset: .35 }, { opacity: 0 },
      ], { duration: 1550, easing: 'ease-out' });
      nextPrint = (nextPrint + 1) % prints.length;
    }

    const update = () => {
      frame = 0;
      const scroll = Math.max(0, window.scrollY);
      const home = entrance.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const height = innerHeight;
      const scrollChange = Math.abs(scroll - lastScroll);
      if (scrollChange > .5) scrollingDown = scroll > lastScroll;
      const effectsEnabled = !paused && !motion.matches && !document.querySelector('dialog[open]');
      const layout = projects ? catSlipLayout(projects.getBoundingClientRect().top + scroll, width) : undefined;
      const now = performance.now();
      const targets = [...garden.querySelectorAll<HTMLElement>('[data-cat-stop]')];
      const stops = new Map(targets.map(target => [target.dataset.catStop ?? '', target.getBoundingClientRect()]));
      const jumpLength = clamp(height * .4, 170, 310);
      const t = motion.matches ? 0 : clamp(scroll / jumpLength);
      const travelSize = clamp(width * .038, 29, 48);
      let size = lerp(home.width, travelSize, smoothstep((t - .26) / .53));
      const homeX = home.left + home.width / 2;
      const homeY = home.top + (motion.matches ? 0 : scroll) + home.height / 2;
      const landingX = clamp(homeX + width * .14, travelSize, width - travelSize);
      const landingY = Math.min(height - travelSize, homeY + clamp(height * .27, 115, 230));
      const landingAt = jumpLength * .84;
      const landingFoot = landingY + travelSize * .4 + landingAt;
      const afterTouchdown = Math.max(0, (t - .84) * jumpLength);
      const flight = clamp(t / .84);
      const arc = 4 * flight * (1 - flight);
      let x = lerp(homeX, landingX, smoothstep(flight));
      let y = lerp(homeY, landingY, smoothstep(flight)) - arc * clamp(height * .13, 48, 100) - afterTouchdown;
      let pointing = '';
      let facesLeft = false;
      let hop = 0;
      let poseTarget: HTMLElement | undefined;
      let gesture: CatGesture | undefined;
      let pawReach = 0;
      let openCrossing = false;
      let gardenCrossing: CommunityWalk | undefined;

      if (t === 1) {
        let previous = { at: jumpLength, x: landingX, y: landingY - afterTouchdown, size: travelSize, stop: '' };
        const maxScroll = document.documentElement.scrollHeight - height;
        const napAt = maxScroll - clamp(height * .078, 42, 64);
        for (const target of targets) {
          const stop = target.dataset.catStop ?? '';
          const rect = stops.get(stop);
          if (!rect?.width || !rect.height) continue;
          const hug = stop === 'hug';
          const nap = stop === 'nap';
          const songNote = stop === 'song-note';
          const pose = hug || stop === 'flower';
          const perchSize = hug ? rect.width * .57 : pose || nap ? rect.width : travelSize;
          const radius = perchSize / 2;
          const reach = hug ? rect.height * .55 : pose || nap ? rect.height / 2 : Math.min(rect.height / 2, travelSize);
          const targetY = rect.top + scroll + reach;
          const player = stops.get('music');
          const sharedRow = stop === 'butterfly' && player && player.left - rect.left > width * .28;
          const center = clamp(targetY - height * .54 - (sharedRow ? 28 : 0), 0, stop === 'reef' ? Math.max(0, napAt - 138) : maxScroll);
          const hold = stop === 'butterfly' ? clamp(height * .019, 11, 15)
            : stop === 'reef' ? clamp(height * .055, 25, 42) : height * (pose ? .1 : .08);
          const rightRoom = width - rect.right;
          const leftRoom = rect.left;
          const perchLeft = leftRoom >= travelSize + 6
            || rightRoom < travelSize + 6 && leftRoom >= rightRoom;
          const targetX = songNote ? rect.left - clamp(width * .115, 52, 170)
            : pose || nap ? rect.left + rect.width * (hug ? .29 : .5)
            : perchLeft ? rect.left - radius - 4 : rect.right + radius + 4;
          const perchX = clamp(targetX, radius, width - radius);
          const travelGap = stop === 'music' ? clamp(Math.abs(perchX - previous.x) * .11, 16, 66) : 1;
          const arrival = Math.max(previous.at + (hug ? 145 : pose ? 88 : travelGap), nap ? napAt : center - hold);
          const leave = nap ? maxScroll : Math.max(arrival + (hug ? 155 : pose ? 110 : 0), center + hold);
          if (songNote && effectsEnabled && !sawSongShot.current && scrollingDown &&
              now < manualScrollUntil && lastScroll <= leave && scroll > leave) {
            const stopAt = Math.ceil(clamp(center, arrival, leave));
            lastScroll = Math.min(lastScroll, stopAt - 1);
            window.scrollTo({ top: stopAt, behavior: 'instant' });
            schedule();
            return;
          }
          const stepBack = hug ? Math.min(15, rect.width * .14, perchX - radius) : 0;
          const perchY = (at: number) => clamp(targetY - at, radius, height - radius);
          if (stop === 'flower' && communityScene && scroll >= previous.at && (scroll <= leave || communityWalk)) {
            const path = sharedGardenCatPath(
              { x: previous.x, y: previous.y + previous.at },
              { x: perchX, y: targetY },
              communityScene.getBoundingClientRect(),
              communityLane?.getBoundingClientRect(),
              scroll,
              travelSize,
            );
            const geometry = { path, start: previous.at, arrive: arrival, leave, flowerSize: perchSize };
            if (scroll <= leave) gardenCrossing = geometry;
            else if (communityWalk) Object.assign(communityWalk, geometry);
          }
          if (stop === 'projects' && layout && arrival - previous.at > 5) {
            const room = arrival - previous.at;
            const at = clamp(layout.banana.y - height * .55, previous.at + room * .24, arrival - room * .22);
            const waypoint = { x: layout.banana.x, y: layout.banana.y - at - travelSize * .4 };
            ground.dataset.slipAt = String(at);
            if (effectsEnabled && !accident.kicked && lastScroll < at && scroll >= at && scroll - at < 70 && scrollChange < 150) {
              accident.started = now;
              accident.kicked = true;
            }
            if (scroll < at) {
              const progress = clamp((scroll - previous.at) / (at - previous.at));
              const mix = smoothstep(progress);
              x = lerp(previous.x, waypoint.x, smoothstep(progress / .76));
              y = lerp(previous.y + previous.at, waypoint.y + at, mix) - scroll;
              size = lerp(previous.size, travelSize, mix);
              facesLeft = (waypoint.x < previous.x) !== (scroll < lastScroll);
              break;
            }
            if (scroll < arrival) {
              const progress = clamp((scroll - at) / (arrival - at));
              x = lerp(waypoint.x, perchX, smoothstep(progress / .52));
              // Reach the margin before descending past the Projects heading.
              y = lerp(waypoint.y + at, perchY(arrival) + arrival, smoothstep((progress - .26) / .74)) - scroll;
              size = travelSize;
              facesLeft = (perchX < waypoint.x) !== (scroll < lastScroll);
              break;
            }
          }
          if (scroll < arrival) {
            openCrossing = songNote || stop === 'music' || stop === 'nap' || previous.stop === 'flower';
            const progress = clamp((scroll - previous.at) / (arrival - previous.at));
            const mix = smoothstep(progress);
            if (pose && stop !== 'flower') {
              const takeoff = Math.min(110, arrival - previous.at - (hug ? 82 : 24));
              const flight = clamp(1 - (arrival - scroll) / takeoff);
              hop = Math.sin(flight * Math.PI) * (hug ? 42 : 18);
              if (hug && flight > .25) {
                gesture = 'reaching';
                poseTarget = target;
                pawReach = smoothstep((flight - .25) / .75);
              }
            }
            x = lerp(previous.x, perchX, mix);
            y = lerp(previous.y, perchY(arrival), mix) - hop;
            size = lerp(previous.size, perchSize, pose ? smoothstep((progress - .66) / .34) : smoothstep(progress * 3));
            if (previous.stop === 'flower' && communityScene) {
              const plot = communityScene.getBoundingClientRect();
              if (previous.x > plot.right + travelSize / 2 && perchX < plot.right + travelSize / 2) {
                // Stay beside the plot until the cat has walked past its lower edge.
                const clearance = smoothstep((y - size / 2 - plot.bottom - 4) / (size + 18));
                x = lerp(previous.x, x, clearance);
              }
            }
            facesLeft = (!pose || progress < .82) && ((perchX < previous.x) !== (scroll < lastScroll));
            break;
          }
          x = perchX;
          y = perchY(scroll);
          size = perchSize;
          facesLeft = !pose && !nap && !songNote && !perchLeft;
          if (scroll <= leave) {
            openCrossing = songNote || stop === 'music' || stop === 'nap';
            if (pose && !target.hasAttribute('data-note-open')) {
              poseTarget = target;
              gesture = hug ? 'hugging' : 'offering';
              // The embrace ends with the cats letting go on the last few steps.
              if (hug && scroll > leave - 36) {
                const release = smoothstep((scroll - (leave - 36)) / 36);
                gesture = 'releasing';
                pawReach = 1 - release;
                x -= stepBack * release;
                y -= 9 * Math.sin(release * Math.PI);
              }
            } else {
              pointing = stop;
            }
            break;
          }
          previous = { at: leave, x: x - stepBack, y: perchY(leave), size, stop };
        }
      }

      if (accident.started !== null && (!effectsEnabled || (t < 1 && scrollChange > 150))) accident.started = null;
      const elapsed = accident.started === null ? null : now - accident.started;
      const mishap = elapsed !== null && layout && elapsed < slipEndsAt
        ? catSlipFrame(elapsed, layout, travelSize * .4, height, { x, y: y + scroll }) : undefined;
      if (elapsed !== null && elapsed >= slipLandsAt) accident.muddy = true;
      if (mishap) {
        x = mishap.x;
        y = mishap.y - scroll;
        size = travelSize;
        pointing = '';
        poseTarget = undefined;
        gesture = undefined;
        facesLeft = false;
        schedule();
      } else if (elapsed !== null) {
        accident.started = null;
      }

      const leavingBed = Boolean(bedPosition && element.dataset.pointing === 'nap' && scroll < lastScroll - 1 && scrollChange < 150);
      if (effectsEnabled && t === 1 && leavingBed) {
        leftBed = true;
        wakingAt = now;
      } else if (!effectsEnabled || t < 1 || scrollChange > 150) {
        wakingAt = null;
      }

      if (pointing === 'nap' && scroll > lastScroll + 1) leftBed = false;
      if (pointing === 'nap' && leftBed) {
        pointing = '';
      } else if (pointing === 'nap') {
        bedPosition = { x, y: y + scroll, size };
        wakingAt = null;
      }

      const wakeProgress = wakingAt === null ? 1 : clamp((now - wakingAt) / 480);
      const waking = wakeProgress < 1 && bedPosition !== undefined;
      if (waking && bedPosition) {
        const blend = smoothstep((wakeProgress - .29) / .71);
        x = lerp(bedPosition.x, x, blend);
        const bedY = clamp(bedPosition.y - scroll, bedPosition.size / 2, height - bedPosition.size / 2 - 5);
        y = lerp(bedY, y, blend);
        size = lerp(bedPosition.size, size, blend);
        pointing = '';
        facesLeft = false;
        schedule();
      }

      let gardenWalking = false;
      let finishedGardenWalk = false;
      if (!effectsEnabled || t < 1 || !stops.has('flower')) communityWalk = undefined;
      if (effectsEnabled && gardenCrossing && !communityWalk) {
        const { start, arrive } = gardenCrossing;
        const progress = lastScroll >= start - height && lastScroll < start ? 0
          : lastScroll > gardenCrossing.leave && lastScroll <= gardenCrossing.leave + height ? 1
            : smoothstep((scroll - start) / (arrive - start));
        communityWalk = { ...gardenCrossing, progress, at: now };
      }

      if (communityWalk && !mishap && !waking) {
        const walk = communityWalk;
        if (gardenCrossing) Object.assign(walk, gardenCrossing);
        const goal = smoothstep((scroll - walk.start) / (walk.arrive - walk.start));
        const remaining = Math.abs(goal - walk.progress) * walk.path.length;
        const step = sharedGardenStep(now - walk.at, remaining) / Math.max(1, walk.path.length);
        const before = pointOnGardenPath(walk.path, walk.progress * walk.path.length);
        const next = walk.progress + clamp(goal - walk.progress, -step, step);
        const moving = Math.abs(next - walk.progress) > .0001;
        walk.progress = next;
        walk.at = now;
        if (!gardenCrossing && next === goal) {
          communityWalk = undefined;
          finishedGardenWalk = true;
        } else {
          const position = pointOnGardenPath(walk.path, next * walk.path.length);
          x = position.x;
          y = position.y - scroll;
          size = lerp(travelSize, walk.flowerSize, smoothstep(1 - (1 - next) * walk.path.length / 34));
          if (next < 1 || !gardenCrossing) {
            gardenWalking = moving;
            facesLeft = Math.abs(position.x - before.x) < .04 ? element.dataset.facing === 'left' : position.x < before.x;
            pointing = '';
            gesture = undefined;
            poseTarget = undefined;
          }
          if (next !== goal) schedule();
        }
      }

      if (effectsEnabled && t === 1 && !gardenCrossing && !mishap && !waking && lastDraw && (finishedGardenWalk || joiningGarden)) {
        let targetX = x;
        let targetY = y + scroll;
        const plot = communityScene?.getBoundingClientRect();
        if (plot && lastDraw.x > plot.right + travelSize / 2 && targetX < plot.right + travelSize / 2) {
          const clearAt = plot.bottom + scroll + lastDraw.size / 2 + 5;
          if (lastDraw.y < clearAt && targetY >= clearAt) {
            targetX = lastDraw.x;
            targetY = clearAt;
          }
        }
        const distance = Math.hypot(targetX - lastDraw.x, targetY - lastDraw.y);
        const step = sharedGardenStep(now - lastDraw.at, distance);
        joiningGarden = distance > step || targetX !== x || targetY !== y + scroll;
        if (joiningGarden) {
          const advance = Math.min(1, step / distance);
          x = lerp(lastDraw.x, targetX, advance);
          y = lerp(lastDraw.y, targetY, advance) - scroll;
          size = lerp(lastDraw.size, size, advance);
          if (Math.abs(x - lastDraw.x) > .04) facesLeft = x < lastDraw.x;
          gardenWalking = true;
          pointing = '';
          gesture = undefined;
          poseTarget = undefined;
          schedule();
        }
      } else {
        joiningGarden = false;
      }

      let catchingUp = false;
      if (effectsEnabled && lastDraw && (openCrossing || finishingCrossing) && !communityWalk && !joiningGarden && !mishap && !waking && !gesture && t === 1 && scrollChange < 150) {
        const step = .92 * clamp(now - lastDraw.at, 12, 40);
        if (Math.abs(x - lastDraw.x) > step) {
          x = lastDraw.x + clamp(x - lastDraw.x, -step, step);
          pointing = '';
          catchingUp = true;
          schedule();
        }
      }
      finishingCrossing = catchingUp;
      lastDraw = { x, y: y + scroll, size, at: now };

      if (pointing === 'sprinkler' && effectsEnabled && accident.muddy && !washTimer) {
        washTimer = window.setTimeout(() => {
          accident.muddy = false;
          washTimer = 0;
          schedule();
        }, 920);
      }

      const photos = rain && effectsEnabled ? stops.get('photos') : undefined;
      const planting = photos ? stops.get('plant') : undefined;
      const umbrella = Boolean(photos && planting && photos.top <= height * .39 && planting.top > height * .62);
      const props = updateProps({ stops, cat: { x, y: y + scroll, size, facesLeft }, scroll, width, height, now, pointing, effects: effectsEnabled, rain, umbrella });
      if (props.animating) schedule();

      const nextPose = paused ? undefined : poseTarget;
      if (activePose !== nextPose) resetPose();
      activePose = nextPose;
      if (activePose && gesture) {
        activePose.dataset.catAction = gesture;
        activePose.style.setProperty('--cat-reach', String(pawReach));
      }

      const impact = Math.sin(Math.PI * clamp((t - .84) / .16));
      element.style.setProperty('--cat-x', `${x - size / 2}px`);
      element.style.setProperty('--cat-y', `${y - size / 2}px`);
      element.style.setProperty('--cat-size', `${size}px`);
      element.style.setProperty('--cat-tilt', `${mishap?.tilt ?? 12 * (1 - flight) - arc * 14 - hop * .24}deg`);
      element.style.setProperty('--cat-stretch', String(mishap?.stretch ?? 1 + arc * .09 - impact * .18));
      element.style.setProperty('--cat-wide', String(mishap ? 1 + (1 - mishap.stretch) * .33 : 1 - arc * .04 + impact * .13));
      const stride = mishap && elapsed !== null ? elapsed / 24 : gardenWalking ? now / 39 : catchingUp ? now / 53 : scroll / 10;
      element.style.setProperty('--cat-stride', String(Math.sin(stride)));
      element.style.setProperty('--cat-reach', String(pawReach));
      element.dataset.docked = String(t === 0);
      element.dataset.phase = mishap?.phase ?? (t === 0 ? 'docked' : t < .84 ? 'jumping' : t < 1 ? 'landing'
        : gesture ?? (hop > 2 ? 'hopping' : pointing ? 'pointing' : 'walking'));
      element.dataset.muddy = String(accident.muddy && !motion.matches);
      element.dataset.umbrella = String(umbrella && !mishap);
      element.dataset.daisyAway = String(props.flowerAway);
      element.dataset.butterflyChase = String(props.chasing);
      element.dataset.waking = String(waking);
      element.dataset.gardenWalking = String(gardenWalking);
      if (pointing !== 'song-note') pressedSongButton = false;
      if (!effectsEnabled) {
        shot.removeAttribute('data-firing');
      } else if (pointing === 'song-note' && scrollingDown && !pressedSongButton) {
        pressedSongButton = true;
        sawSongShot.current = true;
        if (shot.hasAttribute('data-firing')) {
          shot.removeAttribute('data-firing');
          // Flush the reset before starting a new shot on a quick return.
          shot.getBoundingClientRect();
        }
        shot.setAttribute('data-firing', '');
      }
      element.dataset.pointing = pointing;
      element.dataset.facing = facesLeft ? 'left' : 'right';
      element.dataset.ready = 'true';

      // Move the temporary effects with the page while the cat animates.
      ground.style.setProperty('--ground-scroll', `${scroll}px`);
      if (layout) {
        const peel = mishap?.peel ?? (accident.kicked ? layout.tossed : layout.banana);
        ground.dataset.slip = mishap?.phase ?? (accident.kicked ? 'spent' : 'waiting');
        ground.style.setProperty('--banana-x', `${peel.x}px`);
        ground.style.setProperty('--banana-y', `${peel.y}px`);
        ground.style.setProperty('--banana-tilt', `${mishap?.peel.tilt ?? (accident.kicked ? 328 : -13)}deg`);
        ground.style.setProperty('--puddle-x', `${layout.puddle.x}px`);
        ground.style.setProperty('--puddle-y', `${layout.puddle.y}px`);
      }
      if (effectsEnabled && (scrollChange || ground.dataset.landed === 'true')) {
        ground.style.setProperty('--impact-x', `${landingX}px`);
        ground.style.setProperty('--impact-y', `${landingFoot}px`);
      }
      if (!effectsEnabled || scroll < landingAt) {
        ground.dataset.landed = 'false';
      } else if (lastScroll < landingAt && scroll <= jumpLength + 45) {
        ground.dataset.landed = 'true';
      }

      if (!effectsEnabled || t < 1 || scrollChange > 150) {
        if (lastStep || animations.length) clearTrail();
      } else if (mishap || waking || props.chasing || pointing || poseTarget || hop > 2) {
        lastStep = undefined;
      } else if (gardenWalking || scrollChange > .5) {
        leavePrint(x, y + size * .4 + scroll, scroll);
      }

      if (t < 1 || !effectsEnabled || mishap || waking || props.chasing || pointing || poseTarget || hop > 2) {
        stopWalking();
      } else if (catchingUp || gardenWalking || scrollChange > .5) {
        element.dataset.walking = 'true';
        if (!document.hidden) runSound.current?.play();
        window.clearTimeout(restTimer);
        restTimer = window.setTimeout(() => { element.dataset.walking = 'false'; }, 120);
      }
      lastScroll = scroll;
    };

    function stopWalking() {
      if (element) element.dataset.walking = 'false';
      runSound.current?.stop();
    }

    function schedule() {
      if (!disposed && !frame) frame = requestAnimationFrame(update);
    }

    function markManualScroll(event: Event) {
      if (event instanceof KeyboardEvent &&
          !['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) return;
      manualScrollUntil = performance.now() + 1400;
    }

    function finishSongShot(event: Event) {
      if (event instanceof AnimationEvent && event.animationName === 'song-blast-cloud') {
        shot?.removeAttribute('data-firing');
      }
    }

    garden.addEventListener('animationend', finishSongShot);
    update();
    const observer = new ResizeObserver(schedule);
    observer.observe(garden);
    observer.observe(entrance);
    const insertions = new MutationObserver(schedule);
    insertions.observe(garden, { childList: true, subtree: true });
    const opening = entrance.closest('.section-opening');
    if (opening) observer.observe(opening);
    window.addEventListener('wheel', markManualScroll, { passive: true, capture: true });
    window.addEventListener('touchmove', markManualScroll, { passive: true, capture: true });
    window.addEventListener('keydown', markManualScroll);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    motion.addEventListener('change', schedule);
    void document.fonts.ready.then(schedule);
    return () => {
      disposed = true;
      observer.disconnect();
      insertions.disconnect();
      garden.removeEventListener('animationend', finishSongShot);
      shot.removeAttribute('data-firing');
      cancelAnimationFrame(frame);
      window.clearTimeout(restTimer);
      stopWalking();
      window.clearTimeout(washTimer);
      accident.started = null;
      clearTrail();
      resetPose();
      ground.dataset.landed = 'false';
      window.removeEventListener('wheel', markManualScroll, true);
      window.removeEventListener('touchmove', markManualScroll, true);
      window.removeEventListener('keydown', markManualScroll);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
    };
  }, [paused, rain, pawShape]);

  return <>
    <GardenSceneProps layer={sceneProps} />
    <GardenSongBlast />
    <svg className="scroll-cat-muddy-trail" data-paused={paused} aria-hidden="true" focusable="false">
      <defs><g id={pawShape}>
        <path d="M3.1 8.6c0-1.4 1.2-2.9 2.8-3 1.5-.1 3 1.5 3 2.9 0 1.3-1.2 1.7-2.8 1.7-1.8.1-3-.3-3-1.6Z" />
        <ellipse cx="2.9" cy="5" rx="1" ry="1.3" transform="rotate(-22 2.9 5)" />
        <ellipse cx="5.7" cy="3.3" rx="1.1" ry="1.4" />
        <ellipse cx="8.6" cy="4.5" rx="1" ry="1.3" transform="rotate(22 8.6 4.5)" />
      </g></defs>
      <g ref={muddyPrints} className="scroll-cat-muddy-prints" />
    </svg>
    <div ref={effects} className="scroll-cat-ground" data-paused={paused} aria-hidden="true">
      <CatSlipScenery />
      {Array.from({ length: footprintCount }, (_, index) => (
        <svg key={index} className="scroll-cat-print" viewBox="0 0 12 12" fill="currentColor" focusable="false">
          <use href={`#${pawShape}`} />
        </svg>
      ))}
      <div className="scroll-cat-impact">
        <svg className="scroll-cat-crack" viewBox="0 0 68 26" fill="none" focusable="false">
          <path d="m3 14 13-3 6 3 9-5 7 4 9-2 7 4 11-2M22 14l-5 6-8 2m29-9 4 6 9 2m-20-12-4-4-6-1m26 7 8-4 5 1" />
        </svg>
        <div className="scroll-cat-dust">
          {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
        </div>
      </div>
    </div>
    <div ref={cat} className="scroll-cat" data-paused={paused} aria-hidden="true">
      <CatSlipLines />
      <GardenCatReactions />
      <div className="scroll-cat-body">
        <span className="scroll-cat-paw" />
        <span className="scroll-cat-paw" />
        <GardenDaisyCat />
        <CatMudCoat />
        <GardenCatSongShot layer={songShot} />
      </div>
      <GardenCatStories />
    </div>
  </>;
}
