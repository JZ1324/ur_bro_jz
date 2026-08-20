(function () {
  document.documentElement.classList.add('motion-ready');
  var slug = document.body.dataset.project;

  function on(selector, event, handler) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.addEventListener(event, handler);
    });
  }

  if (slug === 'dripwriter') {
    var line = document.querySelector('[data-typing-line]');
    if (line && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var text = line.textContent;
      line.textContent = '';
      text.split('').forEach(function (character, index) {
        window.setTimeout(function () { line.textContent += character; }, 28 * index);
      });
    }
  }

  if (slug === 'decibal') {
    var dbRange = document.querySelector('[data-db-range]');
    var dbValue = document.querySelector('[data-db-value]');
    var dbOutput = document.querySelector('[data-db-output]');
    var dbStatus = document.querySelector('[data-db-status]');
    var dbMeter = document.querySelector('.db-meter');
    if (dbRange) {
      var updateDb = function () {
        var number = Number(dbRange.value);
        var state = number > 82 ? 'turn it down' : number > 72 ? 'getting bright' : 'comfortable';
        dbValue.textContent = number;
        dbOutput.textContent = number + ' dBFS / ' + state;
        dbStatus.textContent = state;
        dbMeter.style.setProperty('--meter', number + '%');
      };
      dbRange.addEventListener('input', updateDb);
      updateDb();
    }
  }

  if (slug === 'touchytap') {
    var cpsRange = document.querySelector('[data-cps]');
    var cpsValue = document.querySelector('[data-cps-value]');
    if (cpsRange) cpsRange.addEventListener('input', function () { cpsValue.textContent = Number(cpsRange.value).toFixed(1); });
    on('[data-control-mode]', 'click', function (event) {
      var button = event.currentTarget;
      var mode = button.dataset.controlMode;
      document.querySelectorAll('[data-control-mode]').forEach(function (item) { item.classList.toggle('active', item === button); });
      document.querySelectorAll('[data-mode-panel]').forEach(function (panel) { panel.classList.toggle('tt-hidden', panel.dataset.modePanel !== mode); });
      document.querySelector('[data-mode-kicker]').textContent = mode + ' mode';
      document.querySelector('[data-mode-title]').textContent = mode === 'simple' ? 'Click setup' : mode === 'advanced' ? 'Bounded run' : 'Recent stats';
    });
    var runButton = document.querySelector('[data-run]');
    if (runButton) runButton.addEventListener('click', function () {
      var running = runButton.dataset.running === 'true';
      runButton.dataset.running = String(!running);
      runButton.textContent = running ? 'Run  ▶' : 'Stop Ⅱ';
      var state = document.querySelector('.tt-side-state');
      state.innerHTML = running ? '<i></i> ready to start' : '<i class="is-running"></i> running / hotkey to stop';
    });
  }

  if (slug === 'deepworkclock') {
    var clockRange = document.querySelector('[data-clock-range]');
    var clockValue = document.querySelector('[data-clock-value]');
    var clockFace = document.querySelector('.dwc-clock');
    var clockStart = document.querySelector('[data-clock-start]');
    var clockState = document.querySelector('[data-clock-state]');
    if (clockRange) {
      var updateClock = function () {
        var minutes = Number(clockRange.value);
        clockValue.textContent = minutes;
        clockFace.style.setProperty('--clock-angle', (180 + (minutes / 120) * 360) + 'deg');
        clockFace.style.setProperty('--clock-progress', ((minutes / 120) * 100) + '%');
      };
      clockRange.addEventListener('input', updateClock);
      updateClock();
    }
    if (clockStart) clockStart.addEventListener('click', function () {
      var running = clockStart.dataset.running === 'true';
      clockStart.dataset.running = String(!running);
      clockStart.textContent = running ? '▶  Start session' : 'Ⅱ  Pause session';
      clockState.innerHTML = running ? '<i></i> focus ready' : '<i class="is-running"></i> session in progress';
    });
  }

  if (slug === 'hidevault') {
    var vaultToggle = document.querySelector('[data-vault-toggle]');
    var vaultScene = document.querySelector('[data-vault-state]');
    if (vaultToggle) vaultToggle.addEventListener('click', function () {
      var unlocked = vaultScene.dataset.vaultState === 'unlocked';
      vaultScene.dataset.vaultState = unlocked ? 'locked' : 'unlocked';
      vaultToggle.setAttribute('aria-pressed', String(!unlocked));
      vaultToggle.textContent = unlocked ? '⌑  Unlock the demo vault' : '✓  Lock the demo vault';
      document.querySelector('[data-vault-status]').textContent = unlocked ? 'vault locked' : 'vault unlocked';
      document.querySelector('[data-vault-foot]').textContent = unlocked ? 'locked / AES-GCM boundary active' : 'unlocked / local demo state only';
    });
  }

  if (slug === 'spoof') {
    var interfaces = {
      en0: ['Wi-Fi / en0', '192.168.1.34', '8c:85:90:••:••:••', 'UP', 'PRIVATE', 'Wi-Fi addressing is managed by macOS.', 'en0: flags=8863<UP,BROADCAST,SMART,RUNNING>\\n        options=400<CHANNEL_IO>\\n        ether 8c:85:90:••:••:••\\n        inet 192.168.1.34 netmask 0xffffff00\\n        status: active'],
      bridge0: ['Bridge / bridge0', '192.168.64.1', '36:7c:••:••:••:••', 'UP', 'HARDWARE', 'Bridge interface is active.', 'bridge0: flags=8863<UP,BROADCAST,SMART,RUNNING>\\n        ether 36:7c:••:••:••:••\\n        inet 192.168.64.1 netmask 0xffffff00\\n        status: active'],
      en1: ['USB-C / en1', '—', 'ac:de:48:••:••:••', 'DOWN', 'HARDWARE', 'USB-C interface is currently down.', 'en1: flags=8822<BROADCAST,SMART,SIMPLEX,MULTICAST>\\n        ether ac:de:48:••:••:••\\n        status: inactive'],
      lo0: ['Loopback / lo0', '127.0.0.1', '—', 'UP', 'LOCAL', 'Loopback traffic stays on this machine.', 'lo0: flags=8049<UP,LOOPBACK,RUNNING,MULTICAST>\\n        inet 127.0.0.1 netmask 0xff000000\\n        inet6 ::1 prefixlen 128']
    };
    on('[data-interface]', 'click', function (event) {
      var button = event.currentTarget;
      var item = interfaces[button.dataset.interface];
      document.querySelectorAll('[data-interface]').forEach(function (candidate) { candidate.classList.toggle('active', candidate === button); });
      document.querySelector('[data-interface-name]').textContent = item[0];
      document.querySelector('[data-live-address]').textContent = item[1];
      document.querySelector('[data-hardware-address]').textContent = item[2];
      document.querySelector('[data-link]').textContent = item[3] + '  ●';
      document.querySelector('[data-link]').classList.toggle('is-down', item[3] !== 'UP');
      document.querySelector('[data-addressing]').textContent = item[4];
      document.querySelector('[data-raw-output]').textContent = item[6];
      document.querySelector('[data-inspector-status]').innerHTML = '<i></i> ' + item[5];
    });
    var refresh = document.querySelector('[data-refresh]');
    if (refresh) refresh.addEventListener('click', function () {
      refresh.classList.add('is-refreshing');
      window.setTimeout(function () { refresh.classList.remove('is-refreshing'); }, 600);
      document.querySelector('[data-inspector-status]').innerHTML = '<i></i> refreshed just now.';
    });
    var copy = document.querySelector('[data-copy]');
    if (copy) copy.addEventListener('click', function () {
      var text = document.querySelector('[data-raw-output]').textContent;
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
      copy.textContent = '✓  copied';
      window.setTimeout(function () { copy.textContent = '□  copy'; }, 1200);
    });
  }

  if (slug === 'stuable') {
    var schedules = {
      mon: ['MONDAY 03 JUNE', 'Day 4', [['08:30', 'Methods', 'Room 4', 'blue'], ['10:10', 'Biology', 'Lab 2', 'coral'], ['11:20', 'Study block', 'Library', 'yellow'], ['13:00', 'Design studio', 'Room 7', 'blue']]],
      tue: ['TUESDAY 04 JUNE', 'Day 5', [['09:00', 'English', 'Room 2', 'blue'], ['10:20', 'Mathematics', 'Room 4', 'coral'], ['12:10', 'Lunch', 'Courtyard', 'yellow'], ['14:00', 'Physics', 'Lab 1', 'blue']]],
      wed: ['WEDNESDAY 05 JUNE', 'Day 1', [['08:30', 'History', 'Room 3', 'coral'], ['10:10', 'Study block', 'Library', 'yellow'], ['11:20', 'Biology', 'Lab 2', 'blue'], ['13:30', 'Sport', 'Oval', 'green']]],
      thu: ['THURSDAY 06 JUNE', 'Day 2', [['09:00', 'Design studio', 'Room 7', 'blue'], ['10:20', 'Methods', 'Room 4', 'coral'], ['12:10', 'Lunch', 'Courtyard', 'yellow'], ['14:00', 'English', 'Room 2', 'green']]],
      fri: ['FRIDAY 07 JUNE', 'Day 3', [['08:30', 'Mathematics', 'Room 4', 'coral'], ['10:10', 'Physics', 'Lab 1', 'blue'], ['11:20', 'Design studio', 'Room 7', 'yellow'], ['13:00', 'Free block', 'Library', 'green']]]
    };
    var scheduleList = document.querySelector('[data-schedule-list]');
    var renderSchedule = function (schedule) {
      return schedule[2].map(function (item) {
        return '<article class="st-class st-class-' + item[3] + '"><time>' + item[0] + '</time><div><b>' + item[1] + '</b><span>' + item[2] + '</span></div><i></i></article>';
      }).join('');
    };
    on('[data-day]', 'click', function (event) {
      var button = event.currentTarget;
      var schedule = schedules[button.dataset.day];
      document.querySelectorAll('[data-day]').forEach(function (candidate) { candidate.classList.toggle('active', candidate === button); });
      document.querySelector('[data-st-date]').textContent = schedule[0];
      document.querySelector('[data-st-day]').textContent = schedule[1];
      scheduleList.innerHTML = renderSchedule(schedule);
    });
    scheduleList.innerHTML = renderSchedule(schedules.mon);
  }

  function setupAtmosphere(pageSlug, page) {
    var atmosphereMarkup = {
      dripwriter: '<span class="atmo-dw-sun" data-atmosphere-speed="-0.08"></span><span class="atmo-dw-ring" data-atmosphere-speed="0.12"></span><span class="atmo-dw-pencil" data-atmosphere-speed="0.06"></span><span class="atmo-dw-dash atmo-dw-dash-a"></span><span class="atmo-dw-dash atmo-dw-dash-b"></span>',
      decibal: '<span class="atmo-db-halo" data-atmosphere-speed="0.08"></span><span class="atmo-db-arc atmo-db-arc-a" data-atmosphere-speed="-0.1"></span><span class="atmo-db-arc atmo-db-arc-b" data-atmosphere-speed="0.05"></span><span class="atmo-db-bars" data-atmosphere-speed="0.04"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>',
      touchytap: '<span class="atmo-tt-orb" data-atmosphere-speed="-0.09"></span><span class="atmo-tt-grid"></span><span class="atmo-tt-pointer" data-atmosphere-speed="0.12"></span><span class="atmo-tt-corner atmo-tt-corner-a">+</span><span class="atmo-tt-corner atmo-tt-corner-b">+</span>',
      deepworkclock: '<span class="atmo-dwc-sun" data-atmosphere-speed="-0.07"></span><span class="atmo-dwc-orbit atmo-dwc-orbit-a" data-atmosphere-speed="0.1"></span><span class="atmo-dwc-orbit atmo-dwc-orbit-b" data-atmosphere-speed="-0.04"></span><span class="atmo-dwc-tick atmo-dwc-tick-a"></span><span class="atmo-dwc-tick atmo-dwc-tick-b"></span>',
      hidevault: '<span class="atmo-hv-glow" data-atmosphere-speed="-0.08"></span><span class="atmo-hv-grid"></span><span class="atmo-hv-lock" data-atmosphere-speed="0.1">⌑</span><span class="atmo-hv-scan" data-atmosphere-speed="0.04"></span>',
      spoof: '<span class="atmo-sp-radar" data-atmosphere-speed="-0.05"></span><span class="atmo-sp-crosshair" data-atmosphere-speed="0.08"></span><span class="atmo-sp-path" data-atmosphere-speed="0.04"></span><span class="atmo-sp-node atmo-sp-node-a"></span><span class="atmo-sp-node atmo-sp-node-b"></span><span class="atmo-sp-node atmo-sp-node-c"></span>',
      stuable: '<span class="atmo-st-sun" data-atmosphere-speed="-0.08"></span><span class="atmo-st-paper" data-atmosphere-speed="0.06"></span><span class="atmo-st-route" data-atmosphere-speed="0.1"></span><span class="atmo-st-dot atmo-st-dot-a"></span><span class="atmo-st-dot atmo-st-dot-b"></span>'
    }[pageSlug];
    if (!atmosphereMarkup) return [];
    var atmosphere = document.createElement('div');
    atmosphere.className = 'site-atmosphere atmosphere-' + pageSlug;
    atmosphere.setAttribute('aria-hidden', 'true');
    atmosphere.innerHTML = atmosphereMarkup;
    page.appendChild(atmosphere);
    return Array.prototype.slice.call(atmosphere.querySelectorAll('[data-atmosphere-speed]')).map(function (node) {
      return { node: node, speed: Number(node.dataset.atmosphereSpeed) };
    });
  }

  function setupMotion(pageSlug) {
    var root = document.querySelector('#project-site');
    var page = root && root.firstElementChild;
    if (!page) return;

    page.classList.add('motion-page');
    var atmosphereNodes = setupAtmosphere(pageSlug, page);
    page.querySelectorAll('.site-hero-image[data-atmosphere-speed]').forEach(function (node) {
      atmosphereNodes.push({ node: node, speed: Number(node.dataset.atmosphereSpeed) });
    });
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var groups = {
      dripwriter: ['.dw-thesis > div', '.dw-step-grid article', '.dw-detail-card', '.dw-quote'],
      decibal: ['.db-readout-copy', '.db-context-card', '.db-control', '.db-build'],
      touchytap: ['.tt-principle h2', '.tt-features article', '.tt-build'],
      deepworkclock: ['.dwc-thesis > div', '.dwc-timeline-grid article', '.dwc-build'],
      hidevault: ['.hv-thesis > div', '.hv-structure-card', '.hv-build h2'],
      spoof: ['.sp-explain > div', '.sp-answer-list > div', '.sp-build > div'],
      stuable: ['.st-thesis > div', '.st-flow-grid article', '.st-build > div'],
    };
    var revealNodes = [];
    (groups[pageSlug] || []).forEach(function (selector) {
      page.querySelectorAll(selector).forEach(function (node) {
        if (revealNodes.indexOf(node) !== -1) return;
        node.classList.add('motion-reveal');
        node.style.setProperty('--reveal-delay', Math.min(revealNodes.length * 70, 420) + 'ms');
        revealNodes.push(node);
      });
    });

    if (reduced || !('IntersectionObserver' in window)) {
      revealNodes.forEach(function (node) { node.classList.add('is-visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
      revealNodes.forEach(function (node) { revealObserver.observe(node); });
    }

    var progress = document.createElement('span');
    progress.className = 'motion-progress';
    progress.setAttribute('aria-hidden', 'true');
    page.appendChild(progress);

    var parallaxMap = {
      dripwriter: [['.dw-hero-art', 0.045], ['.dw-float-library', -0.09], ['.dw-float-run', 0.12]],
      decibal: [['.db-instrument', 0.035], ['.db-chart', -0.08]],
      touchytap: [['.tt-console', 0.035]],
      deepworkclock: [['.dwc-clock-stage', 0.045], ['.dwc-orbit-label', -0.08]],
      hidevault: [['.hv-vault-scene', 0.035], ['.hv-hero-copy', -0.025]],
      spoof: [['.sp-inspector', 0.025]],
      stuable: [['.st-notebook', 0.04], ['.st-day-rail', -0.035]],
    };
    var parallaxNodes = [];
    (parallaxMap[pageSlug] || []).forEach(function (entry) {
      page.querySelectorAll(entry[0]).forEach(function (node) {
        node.classList.add('motion-parallax');
        parallaxNodes.push({ node: node, speed: entry[1] });
      });
    });

    var timeline = page.querySelector('.dwc-timeline');
    var ticking = false;
    var update = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        var ratio = Math.min(1, Math.max(0, window.scrollY / max));
        page.classList.toggle('is-scrolled', window.scrollY > 24);
        progress.style.setProperty('--progress', (ratio * 100).toFixed(2) + '%');
        page.style.setProperty('--story-progress', (ratio * 100).toFixed(2) + '%');
        page.style.setProperty('--atmo-progress', (ratio * 100).toFixed(2) + '%');
        page.querySelectorAll('.motion-reveal:not(.is-visible)').forEach(function (node) {
          if (node.getBoundingClientRect().top < window.innerHeight * 0.94) node.classList.add('is-visible');
        });
        parallaxNodes.forEach(function (entry) {
          var rect = entry.node.getBoundingClientRect();
          var offset = (window.innerHeight * 0.54 - (rect.top + rect.height * 0.5)) * entry.speed;
          entry.node.style.setProperty('--scroll-y', offset.toFixed(2) + 'px');
        });
        atmosphereNodes.forEach(function (entry) {
          entry.node.style.setProperty('--atmo-y', (window.scrollY * entry.speed).toFixed(2) + 'px');
        });
        page.querySelectorAll('section').forEach(function (section) {
          var rect = section.getBoundingClientRect();
          section.classList.toggle('section-current', rect.top < window.innerHeight * 0.68 && rect.bottom > window.innerHeight * 0.3);
        });
        if (timeline) {
          var timelineRect = timeline.getBoundingClientRect();
          var timelineProgress = Math.min(1, Math.max(0, (window.innerHeight * 0.78 - timelineRect.top) / Math.max(1, timelineRect.height)));
          page.style.setProperty('--timeline-progress', (timelineProgress * 100).toFixed(2) + '%');
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    window.setTimeout(update, 250);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);

    if (pageSlug === 'touchytap' && window.matchMedia('(pointer: fine)').matches) {
      var cursor = document.createElement('span');
      cursor.className = 'tt-cursor-cross';
      cursor.setAttribute('aria-hidden', 'true');
      page.appendChild(cursor);
      page.addEventListener('pointermove', function (event) {
        cursor.style.left = event.clientX + 'px';
        cursor.style.top = event.clientY + 'px';
        cursor.classList.add('is-active');
      });
      page.addEventListener('pointerleave', function () { cursor.classList.remove('is-active'); });
    }
  }

  setupMotion(slug);
})();
