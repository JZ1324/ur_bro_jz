import { test, expect, type Page } from '@playwright/test';

// The cat uses DOM geometry. Keep software WebGL from throttling the cat tests.
function disableWebGL() {
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (kind: string, ...options: unknown[]) {
    if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
    return Reflect.apply(getContext, this, [kind, ...options]);
  } as typeof getContext;
}

async function enterGarden(page: Page) {
  const entrance = page.getByRole('dialog', { name: 'JZ’s garden' });
  await entrance.getByRole('button', { name: 'Enter' }).click();
  await expect(entrance).toHaveCount(0);
}

test('home renders and site menu supports keyboard dismissal', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const optionalRequests: string[] = [];
  page.on('request', request => { if (/\/components\/(OceanGarden|PlantStudio|GameDialog)\.tsx/.test(request.url())) optionalRequests.push(request.url()); });
  await page.goto('/');
  await enterGarden(page);
  await expect(page).toHaveTitle('JZ’s garden');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open site menu', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Explore', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open site menu', exact: true })).toBeFocused();
  expect(optionalRequests).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('home.png') });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('refresh restores scroll position before revealing the page', async ({ page }) => {
  await page.addInitScript(disableWebGL);
  await page.addInitScript(() => {
    if ((performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type !== 'reload') return;
    function sample() {
      const root = document.getElementById('root');
      if (!root?.firstElementChild || getComputedStyle(root).opacity === '0') {
        requestAnimationFrame(sample);
      } else {
        root.dataset.firstVisibleScroll = String(window.scrollY);
      }
    }
    requestAnimationFrame(sample);
  });
  const scrollY = () => page.evaluate(() => window.scrollY);

  for (const destination of ['/?view=local#memories', '/?view=local']) {
    await page.goto(destination);
    await enterGarden(page);
    if (destination.endsWith('#memories')) await expect(page.locator('#memories h2')).toBeInViewport();
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#memories h2').scrollIntoViewIfNeeded();
    await expect.poll(scrollY).toBeGreaterThan(0);
    const previous = await scrollY();
    await page.reload();
    await enterGarden(page);
    const saved = Number(await page.locator('html').getAttribute('data-restore-scroll'));
    expect(Math.abs(saved - previous)).toBeLessThan(20);
    await expect.poll(async () => {
      const first = await page.locator('#root').getAttribute('data-first-visible-scroll');
      return first === null ? Infinity : Math.abs(Number(first) - saved);
    }).toBeLessThan(12);
    await expect.poll(async () => Math.abs(await scrollY() - saved)).toBeLessThan(12);
  }
});

test('the daisy cat hops off the title, visits both poses, and returns on reverse scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(disableWebGL);
  await page.addInitScript(() => localStorage.setItem('garden:mood', 'rain'));
  await page.goto('/');
  await enterGarden(page);
  const cat = page.locator('.scroll-cat');
  const ground = page.locator('.scroll-cat-ground');
  const props = page.locator('.garden-scene-props');
  await expect(cat.locator('.scroll-cat-art')).toHaveCount(1);
  await expect(page.locator('.opening-sticker svg')).toHaveCount(0);

  const position = (selector: string) => page.locator(selector).evaluate(element => {
    const { left, top, width } = element.getBoundingClientRect();
    return { x: Math.round(left), y: Math.round(top), width: Math.round(width) };
  });
  const catPosition = () => position('.scroll-cat');
  const dockPosition = () => position('.opening-sticker');
  await page.evaluate(() => document.fonts.ready);
  const home = await dockPosition();
  await expect(cat).toHaveAttribute('data-phase', 'docked');
  await expect.poll(catPosition).toEqual(home);
  for (const prop of ['knight', 'butterfly', 'camera', 'sprinkler', 'leaf']) {
    await expect(props.locator('[data-cat-prop="' + prop + '"]')).toHaveAttribute('data-placed', '');
  }

  const scrollTo = (top: number) => page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), top);
  const jumpLength = await page.evaluate(() => Math.max(170, Math.min(310, innerHeight * .4)));
  await scrollTo(jumpLength * .2);
  await expect(cat).toHaveAttribute('data-phase', 'jumping');
  await expect.poll(async () => (await catPosition()).y).toBeLessThan(home.y);
  const takeoff = await catPosition();
  expect(takeoff.width).toBe(home.width);

  await scrollTo(jumpLength * .92);
  await expect(cat).toHaveAttribute('data-phase', 'landing');
  await expect.poll(async () => (await catPosition()).width).toBeLessThan(home.width);
  await expect.poll(async () => (await catPosition()).y).toBeGreaterThan(home.y);
  await expect(ground.locator('.scroll-cat-crack')).toBeVisible();
  await expect(ground.locator('.scroll-cat-dust span').first()).toHaveCSS('animation-name', 'cat-dust');
  await expect.poll(() => ground.locator('.scroll-cat-impact').evaluate(element => {
    const crack = element.getBoundingClientRect();
    const guide = document.querySelector('.scroll-cat')!.getBoundingClientRect();
    return Math.abs(crack.top + crack.height / 2 - guide.bottom) < 9;
  })).toBe(true);

  await scrollTo(jumpLength + 8);
  await expect(cat).toHaveAttribute('data-phase', 'walking');
  await scrollTo(jumpLength + 44);
  const print = ground.locator('.scroll-cat-print').first();
  await expect(print).toHaveAttribute('style', /--print-y: [\d.]+px/);
  const printY = await print.evaluate(element => element.getBoundingClientRect().top);
  await scrollTo(jumpLength + 76);
  await expect.poll(() => print.evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(printY - 30);

  const hug = page.locator('[data-cat-stop="hug"]');
  const embrace = hug.locator('.garden-hug-embrace');
  const flower = page.locator('[data-cat-stop="flower"]');
  const hugAt = await hug.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return scrollY + bounds.top + bounds.height * .55 - innerHeight * .54;
  });
  const hold = await page.evaluate(() => innerHeight * .1);
  const hugArrival = Math.max(hugAt - hold, jumpLength + 145);
  const hugLeave = Math.max(hugAt + hold, hugArrival + 155);
  const waitingCat = hug.locator('.garden-hug-waiting');
  const movingCat = cat.locator('.scroll-cat-body');
  await scrollTo(hugArrival - 24);
  await expect(cat).toHaveAttribute('data-phase', 'reaching');
  await expect(waitingCat).toBeVisible();
  await expect(movingCat).toBeVisible();
  await expect(embrace).toBeHidden();
  await scrollTo(hugArrival + 42);
  await expect(cat).toHaveAttribute('data-phase', 'hugging');
  await expect(embrace).toBeVisible();
  await expect(waitingCat).toBeHidden();
  await expect(movingCat).toBeHidden();
  expect(await embrace.locator('.garden-hug-joined-paw').evaluate(paw => {
    const [motion] = paw.getAnimations();
    motion.pause();
    motion.currentTime = 0;
    const start = getComputedStyle(paw).rotate;
    motion.currentTime = 170;
    return start !== getComputedStyle(paw).rotate;
  })).toBe(true);
  await scrollTo(hugLeave - 16);
  await expect(cat).toHaveAttribute('data-phase', 'releasing');
  await expect(movingCat).toBeVisible();
  await expect(embrace).toBeHidden();

  const reactions = new Map([
    ['projects', 'cat-knight-recoil'], ['butterfly', 'cat-chase-daisy'], ['sprinkler', 'cat-wash-paws'],
    ['music', 'cat-two-step'], ['photos', 'cat-snapshot'], ['plant', 'cat-dig'], ['reef', 'cat-bubble-swat'],
  ]);
  for (const stop of ['projects', 'butterfly', 'music', 'song-note', 'photos', 'plant', 'sprinkler', 'flower', 'reef']) {
    if (stop === 'reef') await page.locator('#ocean').scrollIntoViewIfNeeded();
    const target = page.locator(`[data-cat-stop="${stop}"]`);
    await expect(target).toBeAttached();
    if (stop === 'butterfly') {
      const butterfly = props.locator('[data-cat-prop="butterfly"]');
      await target.evaluate(element => {
        window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - innerHeight * .84, behavior: 'instant' });
      });
      await expect(butterfly).toHaveAttribute('data-flying', '');
      const first = await butterfly.boundingBox();
      await expect.poll(async () => {
        const next = await butterfly.boundingBox();
        return Math.hypot(next!.x - first!.x, next!.y - first!.y);
      }).toBeGreaterThan(13);
      await expect(cat).toHaveAttribute('data-daisy-away', 'false');
    }
    await target.evaluate((element, stop) => {
      const bounds = element.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const catSize = Math.max(29, Math.min(48, width * .038));
      const y = bounds.top + window.scrollY + (stop === 'flower' ? bounds.height / 2 : Math.min(bounds.height / 2, catSize));
      const center = y - innerHeight * .54;
      const reefLimit = document.documentElement.scrollHeight - innerHeight - Math.min(64, Math.max(42, innerHeight * .078)) - 138;
      const player = document.querySelector('[data-cat-stop="music"]')!.getBoundingClientRect();
      const sharedRow = stop === 'butterfly' && player.left - bounds.left > width * .28;
      window.scrollTo({ top: stop === 'reef' ? Math.min(center, reefLimit) : center - (sharedRow ? 28 : 0), behavior: 'instant' });
    }, stop);
    if (stop === 'flower') {
      await expect(cat).toHaveAttribute('data-garden-walking', 'true');
      const walk = await cat.evaluate(element => new Promise<{ crossedScene: boolean; largestStep: number }>(resolve => {
        const scene = document.querySelector('.community-scene')!;
        let previous = element.getBoundingClientRect();
        let largestStep = 0;
        let crossedScene = false;
        const expires = performance.now() + 5000;
        function sample() {
          const current = element.getBoundingClientRect();
          const plot = scene.getBoundingClientRect();
          largestStep = Math.max(largestStep, Math.hypot(current.left - previous.left, current.top - previous.top));
          crossedScene ||= current.right > plot.left && current.left < plot.right && current.bottom > plot.top && current.top < plot.bottom;
          previous = current;
          if (element.getAttribute('data-phase') === 'offering' || performance.now() >= expires) resolve({ crossedScene, largestStep });
          else requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      }));
      expect(walk.crossedScene).toBe(false);
      expect(walk.largestStep).toBeLessThan(41);
      await expect(cat).toHaveAttribute('data-phase', 'offering');
      await expect(flower.locator('svg')).toBeVisible();
      await expect(flower.locator('svg')).toHaveCSS('animation-name', 'garden-cat-offer');
      await expect.poll(catPosition).toEqual(await position('[data-cat-stop="flower"]'));
      continue;
    }
    await expect(cat).toHaveAttribute('data-pointing', stop);
    await expect.poll(() => target.evaluate((element, { reaction, distant }) => {
      const bounds = element.getBoundingClientRect();
      const cat = document.querySelector('.scroll-cat')!;
      const guide = cat.getBoundingClientRect();
      const gap = Math.max(bounds.left - guide.right, guide.left - bounds.right);
      const pose = getComputedStyle(cat.querySelector('.scroll-cat-body')!).animationName;
      const besideNote = guide.right < bounds.left && cat.getAttribute('data-facing') === 'right';
      return (distant ? besideNote : gap >= -2 && gap <= 8) &&
        guide.top < bounds.bottom && guide.bottom > bounds.top && (!reaction || pose === reaction);
    }, { reaction: reactions.get(stop) ?? null, distant: stop === 'song-note' })).toBe(true);

    if (stop === 'butterfly') {
      const butterfly = props.locator('[data-cat-prop="butterfly"]');
      await expect(butterfly).toHaveAttribute('data-carrying', '');
      await expect(cat).toHaveAttribute('data-daisy-away', 'false');
      await expect(butterfly).toHaveAttribute('data-flying', '');
    }

    if (stop === 'song-note') {
      const reaction = cat.locator('.scroll-cat-body .scroll-cat-song-shot');
      await expect(reaction).toBeVisible();
      const paw = cat.locator('.cat-gesture-paw');
      const startTime = () => paw.evaluate(element => element.getAnimations()[0]?.startTime ?? 0);
      await expect(paw).toHaveCSS('animation-name', 'cat-note-press-paw');
      await expect(reaction.locator('.cat-note-plunger')).toHaveCSS('animation-delay', '0.42s');
      const blast = page.locator('.song-blast');
      await expect(blast.locator('.cat-note-drop')).toHaveCSS('animation-delay', '0.685s');
      await expect(blast.locator('.song-blast-cloud')).toHaveCSS('animation-duration', '2.3s');
      await expect(blast.locator('.song-blast-distortion')).toHaveCSS('animation-delay', '1.455s');
      await expect(target.locator('.song-note-copy')).toHaveCSS('animation-delay', '1.455s');
      await expect.poll(startTime).toBeGreaterThan(0);
      const firstShot = await startTime();
      const noteScroll = await page.evaluate(() => scrollY);
      const approachDistance = await page.evaluate(() => innerHeight * .2);
      await scrollTo(noteScroll + approachDistance);
      await expect(cat).not.toHaveAttribute('data-pointing', 'song-note');
      await scrollTo(noteScroll);
      await expect(cat).toHaveAttribute('data-pointing', 'song-note');
      expect(await startTime()).toBe(firstShot);

      await scrollTo(noteScroll - approachDistance);
      await expect(cat).not.toHaveAttribute('data-pointing', 'song-note');
      await scrollTo(noteScroll);
      await expect(reaction).toBeVisible();
      await expect.poll(startTime).toBeGreaterThan(firstShot);
      await expect(target).toBeEnabled();
    }

    if (stop === 'photos') {
      const leaf = props.locator('[data-cat-prop="leaf"]');
      const worldY = () => leaf.evaluate(element => element.getBoundingClientRect().top + scrollY);
      const branchY = await worldY();
      await target.evaluate(element => {
        window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - innerHeight * .39 + 10, behavior: 'instant' });
      });
      await expect(cat).toHaveAttribute('data-umbrella', 'true');
      await expect.poll(worldY).toBeGreaterThan(branchY + 40);
    }
    if (stop === 'plant') await expect(cat).toHaveAttribute('data-umbrella', 'false');
  }

  const bottom = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await scrollTo(bottom);
  await expect(cat).toHaveAttribute('data-pointing', 'nap');
  await expect(cat.locator('.cat-sleeping')).toHaveCSS('opacity', '1');
  await expect(movingCat).toHaveCSS('opacity', '0');
  await scrollTo(bottom - 15);
  await expect(cat).toHaveAttribute('data-waking', 'true');
  await expect(movingCat).toHaveCSS('animation-name', 'cat-wake-stretch');

  await expect(flower.locator('svg')).toBeHidden();
  await scrollTo(hugArrival + 42);
  await expect(cat).toHaveAttribute('data-phase', 'hugging');
  await expect(embrace).toBeVisible();
  await scrollTo(jumpLength * .2);
  await expect(cat).toHaveAttribute('data-phase', 'jumping');
  await expect(embrace).toBeHidden();
  await expect(ground.locator('.scroll-cat-crack')).toBeHidden();
  await expect.poll(catPosition).toEqual(takeoff);
  await scrollTo(0);
  await expect(cat).toHaveAttribute('data-phase', 'docked');
  await expect.poll(catPosition).toEqual(home);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await scrollTo(jumpLength + 120);
  await expect(cat).toHaveAttribute('data-phase', 'docked');
  await expect.poll(catPosition).toEqual(await dockPosition());
  await expect(embrace).toBeVisible();
  await expect(flower.locator('svg')).toBeVisible();
});

test('the first button press pauses scrolling before impact and repeats after refresh', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(disableWebGL);
  await page.goto('/');
  await enterGarden(page);
  await page.evaluate(() => document.fonts.ready);

  const garden = page.locator('.garden-app');
  const cat = page.locator('.scroll-cat');
  const scrollY = () => page.evaluate(() => window.scrollY);
  async function goTo(stop: 'music' | 'song-note') {
    await page.locator(`[data-cat-stop="${stop}"]`).evaluate(element => {
      const area = element.getBoundingClientRect();
      const size = Math.max(29, Math.min(48, document.documentElement.clientWidth * .038));
      scrollTo({ top: scrollY + area.top + Math.min(size, area.height / 2) - innerHeight * .54, behavior: 'instant' });
    });
    await expect(cat).toHaveAttribute('data-pointing', stop);
  }

  await goTo('music');
  await page.locator('#memories').evaluate(section => {
    window.dispatchEvent(new Event('touchmove'));
    window.scrollTo({ top: scrollY + section.getBoundingClientRect().top, behavior: 'instant' });
  });
  await expect(cat).toHaveAttribute('data-pointing', 'song-note');
  await expect(garden).toHaveAttribute('data-blast-scroll-paused', '');
  await expect(page.locator('body')).toHaveCSS('overflow-y', 'hidden');
  const cloud = page.locator('.song-blast-cloud');
  await expect(cloud).toHaveCSS('opacity', '0');
  const before = await scrollY();
  await page.keyboard.press('PageDown');
  await page.mouse.wheel(0, 450);
  expect(await scrollY()).toBe(before);
  await expect(cloud).toHaveCSS('opacity', '1');
  await expect(garden).toHaveAttribute('data-blast-scroll-paused', '');
  await expect(garden).not.toHaveAttribute('data-blast-scroll-paused', '');

  await goTo('music');
  await goTo('song-note');
  await expect(cloud).toHaveCSS('opacity', '1');
  await expect(garden).not.toHaveAttribute('data-blast-scroll-paused', '');

  await page.reload();
  await enterGarden(page);
  await expect(garden).toHaveAttribute('data-blast-scroll-paused', '');
});

test('the banana trips the cat once and leaves mud prints fixed to the page', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(disableWebGL);
  await page.goto('/');
  await enterGarden(page);
  await page.evaluate(() => document.fonts.ready);
  const ground = page.locator('.scroll-cat-ground');
  const cat = page.locator('.scroll-cat');
  const scrollTo = (top: number) => page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), top);
  const renderedScroll = () => ground.evaluate(element => parseFloat((element as HTMLElement).style.getPropertyValue('--ground-scroll')));
  const afterHug = await page.locator('[data-cat-stop="hug"]').evaluate(element => {
    const bounds = element.getBoundingClientRect();
    const center = scrollY + bounds.top + bounds.height * .55 - innerHeight * .54;
    const arrival = Math.max(center - innerHeight * .1, Math.max(170, Math.min(310, innerHeight * .4)) + 145);
    return Math.max(center + innerHeight * .1, arrival + 155) + 2;
  });
  await scrollTo(afterHug);
  await expect(ground).toHaveAttribute('data-slip-at', /\d/);
  const tripAt = Number(await ground.getAttribute('data-slip-at'));
  await scrollTo(tripAt - 8);
  await expect.poll(renderedScroll).toBe(Math.round(tripAt - 8));
  await expect(ground).toHaveAttribute('data-slip', 'waiting');

  const banana = ground.locator('.scroll-cat-banana');
  const before = await banana.boundingBox();
  const flight = await ground.evaluate((element, y) => new Promise<{ phases: string[]; height: number }>(resolve => {
    const phases: string[] = [];
    let height = 0;
    const observer = new MutationObserver(() => {
      const phase = element.getAttribute('data-slip') ?? '';
      if (phases.at(-1) !== phase) phases.push(phase);
      if (phase === 'airborne') {
        const cat = document.querySelector('.scroll-cat')!.getBoundingClientRect();
        const puddle = element.querySelector('.scroll-cat-puddle')!.getBoundingClientRect();
        height = Math.max(height, puddle.top + puddle.height / 2 - cat.bottom);
      }
      if (phase === 'spent') {
        observer.disconnect();
        window.clearTimeout(timeout);
        resolve({ phases, height });
      }
    });
    const timeout = window.setTimeout(() => { observer.disconnect(); resolve({ phases, height }); }, 8000);
    observer.observe(element, { attributes: true, attributeFilter: ['data-slip'] });
    window.scrollTo({ top: Math.ceil(y) + 1, behavior: 'instant' });
  }), tripAt);
  expect(flight.phases).toEqual(['slipping', 'airborne', 'stuck', 'climbing', 'spent']);
  expect(flight.height).toBeGreaterThan(100);
  await expect(cat.locator('.scroll-cat-mud-coat')).toBeVisible();
  expect((await banana.boundingBox())!.x - before!.x).toBeGreaterThan(60);

  const afterProjects = await page.locator('[data-cat-stop="projects"]').evaluate(element => {
    const box = element.getBoundingClientRect();
    return scrollY + box.top + Math.min(box.height / 2, 36) - innerHeight * .46 + 50;
  });
  for (const offset of [0, 38, 76]) {
    await scrollTo(afterProjects + offset);
    await expect.poll(renderedScroll).toBe(Math.round(afterProjects + offset));
  }
  const firstPrint = page.locator('.scroll-cat-muddy-prints use').first();
  await expect(firstPrint).toBeAttached();
  const stamp = await firstPrint.getAttribute('transform');
  const drift = await firstPrint.evaluate(mark => {
    const documentY = () => mark.getBoundingClientRect().top + scrollY;
    const start = scrollY;
    const before = documentY();
    window.scrollTo({ top: start - 50, behavior: 'instant' });
    const up = documentY();
    window.scrollTo({ top: start + 50, behavior: 'instant' });
    const down = documentY();
    window.scrollTo({ top: start, behavior: 'instant' });
    return Math.max(Math.abs(up - before), Math.abs(down - before));
  });
  expect(drift).toBeLessThan(1);
  await scrollTo(tripAt - 8);
  await expect(ground).toHaveAttribute('data-slip', 'spent');
  await expect(firstPrint).toHaveAttribute('transform', stamp!);
  await expect.poll(() => cat.evaluate(element => {
    const body = element.getBoundingClientRect();
    const puddle = document.querySelector('.scroll-cat-puddle')!.getBoundingClientRect();
    return body.right < puddle.left;
  })).toBe(true);

  await page.locator('[data-cat-stop="sprinkler"]').evaluate(element => {
    const area = element.getBoundingClientRect();
    window.scrollTo({ top: area.top + scrollY + Math.min(36, area.height / 2) - innerHeight * .54, behavior: 'instant' });
  });
  await expect(cat).toHaveAttribute('data-pointing', 'sprinkler');
  await expect(cat).toHaveAttribute('data-muddy', 'false');
  await expect(firstPrint).toHaveAttribute('transform', stamp!);
});

test('large wheel bursts are capped and reduced motion keeps native wheel input', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await enterGarden(page);
  const garden = page.locator('.garden-app');
  const wheel = (deltaY: number, ctrlKey = false) => garden.evaluate(async (element, options) => {
    const start = window.scrollY;
    const prevented = Array.from({ length: 6 }, () => (
      !element.dispatchEvent(new WheelEvent('wheel', { ...options, bubbles: true, cancelable: true }))
    )).every(Boolean);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { prevented, distance: window.scrollY - start };
  }, { deltaY, ctrlKey });
  const burst = await wheel(1500);
  expect(burst.prevented).toBe(true);
  expect(burst.distance).toBeLessThanOrEqual(40);
  const getScroll = () => page.evaluate(() => window.scrollY);
  await expect.poll(getScroll).toBeGreaterThan(50);
  expect(await getScroll()).toBeLessThanOrEqual(135);
  expect((await wheel(1500, true)).prevented).toBe(false);
  expect((await wheel(-1500)).prevented).toBe(true);
  await expect.poll(getScroll).toBeLessThan(30);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect((await wheel(1500)).prevented).toBe(false);
});

test('the sealed note gives the cat and puzzle hints after two rejected guesses', async ({ page }) => {
  await page.route('**/api/test-secret-name', async route => {
    const { name, puzzleStage, puzzleAnswer } = route.request().postDataJSON();
    if (name === 'service unavailable') {
      await route.fulfill({ status: 503, json: { error: 'unavailable' } });
      return;
    }
    await route.fulfill({ json: { matched: puzzleStage === 'fragment' && puzzleAnswer === 'test fragment answer' } });
  });

  await page.goto('/');
  await enterGarden(page);
  await page.getByRole('button', { name: 'Open classified name puzzle' }).click();
  const dialog = page.getByRole('dialog', { name: 'Classified name puzzle' });
  const key = dialog.getByLabel('Key:');
  const open = dialog.getByRole('button', { name: 'Open', exact: true });
  const catGuide = dialog.getByText('Psst… press Sealed note to start.');
  await key.fill('first wrong key');
  await open.click();
  await expect(dialog.getByText('Not it.')).toBeVisible();
  await expect(catGuide).toHaveCount(0);

  await key.fill('service unavailable');
  await open.click();
  await expect(dialog.getByText('This sealed entry is not connected right now.')).toBeVisible();
  await expect(catGuide).toHaveCount(0);
  await key.fill('second wrong key');
  await open.click();
  await expect(catGuide).toBeVisible();

  await dialog.getByRole('button', { name: 'Start sealed note puzzle' }).click();
  await expect(dialog.getByText('Puzzle 1', { exact: true })).toBeVisible();
  await expect(catGuide).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Return to sealed note input' }).locator('.sealed-note-perched')).toBeVisible();

  const answer = dialog.getByRole('textbox', { name: 'Puzzle answer' });
  const submit = dialog.getByRole('button', { name: 'Continue' });
  const hint = dialog.getByText('A little hint');
  await answer.focus();
  await expect(answer).toHaveCSS('outline-style', 'none');
  await expect(dialog.locator('.sealed-note-field:focus-within')).toHaveCSS('outline-style', 'solid');
  await answer.fill('first guess');
  await submit.click();
  await expect(dialog.getByText('That is not the fragment payload.')).toBeVisible();
  await expect(hint).toHaveCount(0);
  await answer.fill('second guess');
  await submit.click();
  await expect(hint).toBeVisible();
  await expect(dialog.getByText('The downloaded image has more to it than its pixels.')).toBeVisible();
  await answer.fill('test fragment answer');
  await submit.click();
  await expect(dialog.getByText('Puzzle 2', { exact: true })).toBeVisible();
  await expect(hint).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Reset' }).click();
  await expect(key).toBeEmpty();
  await expect(catGuide).toHaveCount(0);
  await expect(dialog.locator('.sealed-note-perched')).toHaveCount(0);
});

test('the mushroom opens Hidden Garden beside the koi control', async ({ page }) => {
  await page.goto('/');
  await enterGarden(page);
  await page.getByRole('button', { name: 'Call the koi to the surface' }).click({ trial: true });
  await page.getByRole('button', { name: 'Explore the curious mushroom' }).click();
  const game = page.getByRole('dialog', { name: 'Hidden Garden adventure' });
  await expect(game.getByRole('button', { name: 'Start playing' })).toBeEnabled();
  await game.getByRole('button', { name: 'Start playing' }).click();
  await expect(game.getByRole('button', { name: 'Pause adventure' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(game.getByRole('button', { name: 'Keep wandering' })).toBeFocused();
  await game.getByRole('button', { name: 'Return to website' }).click();
  await expect(game).toHaveCount(0);
});

test('project navigation reaches the inline chessboard and preserves its position', async ({ page }) => {
  await page.goto('/');
  await enterGarden(page);
  await page.getByRole('link', { name: 'See what I’ve built' }).click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.locator('#projects-title')).toBeInViewport();
  await page.getByRole('button', { name: 'Play chess' }).click();
  const pawn = page.locator('[data-chess-square="e2"]');
  const destination = page.locator('[data-chess-square="e4"]');
  const undo = page.getByRole('button', { name: 'Undo move' });
  const projectLayout = () => page.evaluate(() => ({
    scroll: window.scrollY,
    list: document.querySelector('.project-list')!.getBoundingClientRect().toJSON(),
    board: document.querySelector('.garden-canvas')!.getBoundingClientRect().toJSON(),
    nextSection: document.querySelector('#school')!.getBoundingClientRect().top,
  }));
  const squaresInSameRank = () => page.evaluate(() => {
    const top = (square: string) => Number.parseFloat(document.querySelector<HTMLElement>(`[data-chess-square="${square}"]`)!.style.top);
    return Math.abs(top('a1') - top('h1'));
  });
  async function expectOverheadAfterAction() {
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    expect(await squaresInSameRank()).toBeLessThan(1);
  }

  await expect(pawn).toBeFocused();
  await expect.poll(squaresInSameRank).toBeGreaterThan(5);
  await page.keyboard.press('Enter');
  await expect.poll(squaresInSameRank).toBeLessThan(1);

  await page.keyboard.press('Enter');
  await expect(pawn).toHaveAttribute('aria-pressed', 'false');
  await expectOverheadAfterAction();
  await page.getByRole('button', { name: 'Focus board' }).evaluate(button => button.click());
  await expectOverheadAfterAction();
  await expect(pawn).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(pawn).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => window.scrollBy({ top: 40, behavior: 'instant' }));
  await expect.poll(squaresInSameRank).toBeGreaterThan(5);
  await expect(pawn).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(destination).toBeFocused();
  await expect(undo).toBeHidden();
  const beforeMove = await projectLayout();
  await page.keyboard.press('Enter');
  await expect(destination).toHaveAttribute('aria-label', /ivory pawn/i);
  await expect(undo).toBeVisible();
  await expect.poll(squaresInSameRank).toBeLessThan(1);
  await expectOverheadAfterAction();
  expect(await projectLayout()).toEqual(beforeMove);

  await page.evaluate(() => window.scrollBy({ top: 40, behavior: 'instant' }));
  await expect.poll(squaresInSameRank).toBeGreaterThan(5);

  await page.locator('#memories').scrollIntoViewIfNeeded();
  await expect(page.getByRole('grid', { name: 'Movable chessboard' })).toBeHidden();
  await page.locator('#projects').scrollIntoViewIfNeeded();
  await expect(page.getByRole('grid', { name: 'Movable chessboard' })).toBeVisible();
  await expect(destination).toHaveAttribute('aria-label', /ivory pawn/i);
});

test('planting saves to the API and remains editable after reload', async ({ page }) => {
  await page.goto('/#contact');
  await enterGarden(page);
  const plantButton = page.getByRole('button', { name: 'Plant something', exact: true }).first();
  await expect(plantButton).toBeEnabled();
  await plantButton.click();
  const studio = page.getByRole('dialog', { name: /Pick a plant/ });
  await expect(studio).toBeVisible();
  await page.locator('#plant-author').fill('Garden Friend');
  await page.locator('#plant-note').fill('Have a lovely day');
  await studio.getByRole('button', { name: 'Plant in the garden', exact: true }).click();
  await expect(studio).toHaveCount(0);
  await page.reload();
  await enterGarden(page);
  await expect(page.locator('.plant-collection')).toContainText('Have a lovely day');
  await page.locator('.plant-collection summary').click();
  await page.locator('.plant-collection button').first().click();
  const editor = page.getByRole('dialog', { name: /Edit your planting/ });
  await expect(editor).toBeVisible();
  await expect(page.locator('#plant-note')).toHaveValue('Have a lovely day');
  await page.keyboard.press('Escape');
  await expect(editor).toHaveCount(0);
});

test('ocean catch survives reload and chest restores keyboard focus', async ({ page }) => {
  await page.goto('/#ocean');
  await enterGarden(page);
  await page.getByRole('button', { name: 'Open ocean chest', exact: true }).click();
  const chest = page.getByRole('dialog', { name: 'Ocean chest', exact: true });
  await expect(chest).toBeVisible();
  await chest.getByRole('button', { name: /Open.*case/i }).last().click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('garden:ocean:v1') ?? '{}').opened)).toBe(1);
  await expect(page.locator('.ocean-reveal-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ocean-reveal-dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(chest).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Open ocean chest', exact: true })).toBeFocused();
  await page.reload();
  await enterGarden(page);
  await page.locator('#ocean').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /Open my fish, 1 of/ }).click();
  await expect(page.getByRole('tabpanel', { name: /Collection/ }).getByRole('button', { name: /1 collected/ })).toHaveCount(1);
});
