import { clamp, smoothstep } from './journey';

type Point = { x: number; y: number };
type CatPosition = Point & { size: number; facesLeft: boolean };
type PropName = 'knight' | 'butterfly' | 'leaf' | 'sprinkler' | 'camera';
const daisyChaseDuration = 1440;

const between = (from: Point, to: Point, t: number): Point => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
});

export function createGardenProps(layer: HTMLDivElement) {
  const actors = new Map([...layer.querySelectorAll<SVGSVGElement>('[data-cat-prop]')]
    .map(actor => [actor.dataset.catProp as PropName, actor]));
  let scene = '';
  let began = 0;
  let sprinklerUntil = 0;
  let knightFall: number | undefined;
  let leafBegan: number | undefined;
  let leafPosition: Point | undefined;
  let releasedLeaf: { at: number; from: Point; to: Point } | undefined;
  let butterflyPosition: Point | undefined;
  let butterflyChase: { at: number; from: Point } | undefined;
  let catWasClose = false;
  let butterflyRecall: { at: number; from: Point; flower: boolean } | undefined;
  let flowerCarried = false;
  let cameraPosition: Point | undefined;
  let cameraReturn: { at: number; from: Point } | undefined;

  function place(name: PropName, point: Point | undefined, scroll: number, width: number, turn = 0) {
    const actor = actors.get(name);
    if (!actor) return;
    actor.toggleAttribute('data-placed', Boolean(point));
    if (!point) return;
    actor.style.setProperty('--prop-x', `${point.x}px`);
    actor.style.setProperty('--prop-y', `${point.y - scroll}px`);
    actor.style.setProperty('--prop-size', `${width}px`);
    actor.style.setProperty('--prop-turn', `${turn}deg`);
  }

  return function update(options: {
    stops: Map<string, DOMRect>;
    cat: CatPosition;
    scroll: number;
    width: number;
    height: number;
    now: number;
    pointing: string;
    effects: boolean;
    rain: boolean;
    umbrella: boolean;
  }) {
    const { stops, cat, scroll, width, height, now, pointing, effects, rain, umbrella } = options;
    const nextScene = effects ? pointing : '';
    if (nextScene !== scene) {
      if (scene === 'photos' && cameraPosition && now - began < 840) {
        cameraReturn = { at: now, from: cameraPosition };
      }
      scene = nextScene;
      began = now;
      if (scene === 'projects' && knightFall === undefined) knightFall = now;
      if (scene === 'sprinkler' && now >= sprinklerUntil) sprinklerUntil = now + 1450;
    }
    const age = now - began;
    let animating = false;
    let flowerAway = false;
    let chasing = false;

    function beside(stop: string, offsetX: number, offsetY: number) {
      const rect = stops.get(stop);
      if (!rect) return undefined;
      return {
        x: clamp(rect.left + offsetX, 17, width - 19),
        y: rect.top + scroll + Math.min(36, rect.height / 2) + offsetY,
      };
    }

    const knight = beside('projects', -44, 18);
    const fall = knightFall === undefined ? 0 : smoothstep((now - knightFall - 480) / 320);
    place('knight', knight, scroll, 28, 81 * fall);
    const knightActor = actors.get('knight');
    knightActor?.toggleAttribute('data-tipping', effects && fall > .2 && fall < .98);
    animating ||= effects && knightFall !== undefined && now - knightFall < 800;

    const butterfly = beside('butterfly', -4, -29);
    if (butterfly) {
      const visible = butterfly.y >= scroll - 65 && butterfly.y <= scroll + height + 65;
      const fluttering = effects && visible;
      const orbit = now / 2600 * Math.PI * 2;
      const idle = {
        x: butterfly.x + 29 * Math.sin(orbit),
        y: butterfly.y - 17 + 17 * Math.cos(orbit) + 4 * Math.sin(orbit * 3),
      };
      idle.x = clamp(idle.x, 16, width - 16);
      const hand = { x: cat.x + cat.size * .08, y: cat.y + cat.size * .2 };
      const far = { x: clamp(butterfly.x + 37, 17, width - 19), y: butterfly.y - 37 };
      const distance = Math.hypot(cat.x - butterfly.x, cat.y - butterfly.y);
      const close = fluttering && (scene === 'butterfly' || distance < 76);
      if (close && !catWasClose && !butterflyChase && !butterflyRecall) {
        butterflyChase = { at: now, from: butterflyPosition ?? idle };
      }
      catWasClose = close;

      if (!effects) {
        butterflyChase = undefined;
        butterflyRecall = undefined;
      } else if (butterflyChase && distance > 165 && butterflyPosition) {
        butterflyRecall = { at: now, from: butterflyPosition, flower: flowerCarried };
        butterflyChase = undefined;
      }

      let point = effects ? idle : butterfly;
      if (butterflyRecall) {
        const recover = clamp((now - butterflyRecall.at) / 470);
        if (butterflyRecall.flower && recover < .44) {
          point = between(butterflyRecall.from, hand, smoothstep(recover / .44));
          flowerAway = true;
        } else {
          const from = butterflyRecall.flower ? hand : butterflyRecall.from;
          point = between(from, idle, smoothstep(butterflyRecall.flower ? (recover - .44) / .56 : recover));
        }
        if (recover === 1) butterflyRecall = undefined;
        else animating ||= effects;
      } else if (butterflyChase) {
        const p = clamp((now - butterflyChase.at) / daisyChaseDuration);
        if (p < .22) point = between(butterflyChase.from, hand, smoothstep(p / .22));
        else if (p < .52) point = between(hand, far, smoothstep((p - .22) / .30));
        else if (p < .85) point = between(far, hand, smoothstep((p - .52) / .33));
        else point = between(hand, idle, smoothstep((p - .85) / .15));
        flowerAway = p >= .22 && p < .85;
        chasing = p < 1 && (!pointing || pointing === 'butterfly');
        if (p === 1) butterflyChase = undefined;
        else animating = true;
      }
      butterflyPosition = point;
      flowerCarried = flowerAway;
      place('butterfly', point, scroll, 29, fluttering ? Math.cos(orbit) * 13 : 0);
      actors.get('butterfly')?.toggleAttribute('data-carrying', flowerAway);
      actors.get('butterfly')?.toggleAttribute('data-flying', fluttering || Boolean(butterflyChase || butterflyRecall));
      animating ||= fluttering;
    }

    const sprinklerSize = clamp(width * .046, 54, 64);
    const sprinkler = beside('sprinkler', -61, 24);
    if (sprinkler) sprinkler.x = Math.max(sprinklerSize / 2, sprinkler.x);
    place('sprinkler', sprinkler, scroll, sprinklerSize);
    const watering = effects && now < sprinklerUntil;
    actors.get('sprinkler')?.toggleAttribute('data-watering', watering);
    animating ||= watering;

    const camera = beside('photos', -24, 22);
    if (camera) {
      const p = clamp(age / 840);
      const take = scene === 'photos' && p < 1;
      const hand = { x: cat.x + (cat.facesLeft ? -.2 : .2) * cat.size, y: cat.y - cat.size * .22 };
      const lifted = take ? smoothstep(Math.min(p / .33, (1 - p) / .31)) : 0;
      if (cameraReturn) {
        const progress = clamp((now - cameraReturn.at) / 325);
        cameraPosition = between(cameraReturn.from, camera, smoothstep(progress));
        if (progress === 1) cameraReturn = undefined;
        else animating ||= effects;
      } else {
        cameraPosition = between(camera, hand, lifted);
      }
      place('camera', cameraPosition, scroll, 27, -7 * lifted);
      actors.get('camera')?.toggleAttribute('data-flash', take && p >= .44 && p < .66);
      animating ||= take;
    }

    const branchLeaf = rain ? beside('photos', 3, -75) : undefined;
    if (branchLeaf) {
      let turn = -18;
      if (umbrella && leafBegan === undefined && !releasedLeaf) leafBegan = now;
      if (umbrella && leafBegan !== undefined && !releasedLeaf) {
        const p = clamp((now - leafBegan) / 650);
        leafPosition = between(branchLeaf, { x: cat.x, y: cat.y - cat.size * .57 }, smoothstep(p));
        turn *= 1 - p;
        animating ||= p < 1;
      } else if (effects && leafPosition && !releasedLeaf) {
        const to = { x: clamp(leafPosition.x - 24, 21, width - 22), y: cat.y + cat.size * .36 };
        releasedLeaf = { at: now, from: leafPosition, to };
      }
      if (releasedLeaf) {
        const p = clamp((now - releasedLeaf.at) / 580);
        leafPosition = between(releasedLeaf.from, releasedLeaf.to, smoothstep(p));
        turn = 32 * p;
        animating ||= p < 1;
      }
      const opened = leafBegan === undefined ? 0 : smoothstep((now - leafBegan) / 650);
      place('leaf', leafPosition ?? branchLeaf, scroll, 36 + 12 * opened, turn);
    } else {
      leafBegan = undefined;
      leafPosition = undefined;
      releasedLeaf = undefined;
      place('leaf', undefined, scroll, 36);
    }

    return { animating, flowerAway, chasing };
  };
}
