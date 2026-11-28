/* Gold and Who Belongs: the gold-field game, the arrivals map, the licence and the price basket. No audio. */
(function () {
  var G = window.GOLD || {};
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Money in pence. 12d = 1s, 20s = £1.
  function lsd(p) {
    var neg = p < 0; p = Math.abs(Math.round(p));
    var L = Math.floor(p / 240), s = Math.floor((p % 240) / 12), d = p % 12, out = [];
    if (L) out.push('£' + L); if (s) out.push(s + 's'); if (d) out.push(d + 'd'); if (!out.length) out.push('nothing');
    return (neg ? 'minus ' : '') + out.join(' ');
  }
  function ozs(o) { // troy ounces and pennyweights (20 dwt = 1 oz)
    var dwt = Math.round(o * 20), oz = Math.floor(dwt / 20); dwt = dwt % 20;
    if (!oz && !dwt) return 'no gold';
    return (oz ? oz + ' oz ' : '') + (dwt ? dwt + ' dwt' : '');
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function tri(a, b) { return a + (b - a) * (Math.random() + Math.random()) / 2; }

  /* ---------------- The gold-field game ---------------- */
  function game() {
    var box = $('#goldgame'); if (!box || box.dataset.ready) return; box.dataset.ready = '1';
    var T = G.turns, P = G.places, FOOD = G.food, start = G.start;
    var st, stage = $('.gg-stage', box), ledger = $('.gg-ledger', box), burst = $('.gg-burst', box);
    function reset() {
      st = { m: 0, money: start.money, place: null, depth: 0, gold: 0, paidLicence: 0, fines: 0, food: 0, tools: start.tools, sold: 0, log: [], months: 0, licencedYear: false, nugget: false };
      st.money -= start.tools;
      $$('.gg-peg', box).forEach(function (g) { g.classList.remove('on'); });
      box.classList.remove('gg-has-claim');
      drawLedger(); pickClaim();
    }
    function drawLedger() {
      ledger.innerHTML = '<div><span>Money</span><strong>' + lsd(st.money) + '</strong></div>' +
        '<div><span>Gold found</span><strong>' + ozs(st.gold) + '</strong></div>' +
        '<div><span>Licences</span><strong>' + lsd(st.paidLicence) + '</strong></div>' +
        '<div><span>Fines</span><strong>' + lsd(st.fines) + '</strong></div>' +
        '<div><span>Food</span><strong>' + lsd(st.food) + '</strong></div>';
    }
    function pickClaim() {
      stage.innerHTML = '<p class="gg-step">Step 1 of 2</p><h4>Peg out your claim</h4><p>Tap a place on the map. The 1854 licence allowed each digger a claim <strong>twelve feet square</strong>. You start with ' + lsd(start.money) + '. You have already paid ' + lsd(start.tools) + ' for a pick, a spade and a tin dish, at the Forest Creek price of 10s each.</p><div class="gg-placelist">' +
        P.map(function (p, i) { return '<button type="button" class="btn alt gg-pick" data-i="' + i + '">' + esc(p.name) + '</button>'; }).join('') + '</div>';
      $$('.gg-pick', stage).forEach(function (b) { b.addEventListener('click', function () { choose(+b.dataset.i); }); });
    }
    $$('.gg-peg', box).forEach(function (g) {
      function go() { if (st && st.place === null) choose(+g.dataset.i); }
      g.addEventListener('click', go); g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    function choose(i) {
      st.place = P[i];
      $$('.gg-peg', box).forEach(function (g) { g.classList.toggle('on', +g.dataset.i === i); });
      box.classList.add('gg-has-claim');
      stage.innerHTML = '<h4>Your claim: ' + esc(st.place.name) + '</h4><p>' + esc(st.place.blurb) + '</p><p class="note">' + esc(st.place.kind === 'deep' ? 'Deep ground: the gold here lies far down. Sinking a shaft pays best, if you reach it.' : 'Shallow ground: the gold is near the surface. The tin dish and the cradle work well here.') + '</p><button type="button" class="btn big gg-go">Start month 1</button>';
      $('.gg-go', stage).addEventListener('click', month);
    }
    function month() {
      var t = T[st.m];
      var fee = st.licencedYear ? 0 : t.fee;
      stage.innerHTML = '<p class="gg-step">Month ' + (st.m + 1) + ' of ' + T.length + '</p><h4>' + esc(t.date) + '</h4>' +
        (t.news ? '<p class="gg-news"><strong>News.</strong> ' + esc(t.news) + '</p>' : '') +
        '<div class="gg-card"><p class="label">The licence</p><p>' + esc(st.licencedYear ? 'You hold a miner’s right for the year. Nothing more to pay.' : t.feeText) + '</p>' +
        (st.licencedYear ? '' : '<fieldset class="choices"><legend>Will you pay?</legend><label><input type="radio" name="gg-lic" value="pay" checked> Pay ' + lsd(fee) + '</label><label><input type="radio" name="gg-lic" value="no"> Dig without one</label></fieldset>') + '</div>' +
        '<div class="gg-card"><p class="label">How will you work this month?</p><div class="gg-methods">' +
        G.methods.map(function (m) { return '<label class="gg-method"><input type="radio" name="gg-meth" value="' + m.id + '"' + (m.id === 'pan' ? ' checked' : '') + '><span><strong>' + esc(m.name) + '</strong><br><small>' + esc(m.text) + '</small></span></label>'; }).join('') +
        '</div>' + (st.depth ? '<p class="note">Your shaft is ' + st.depth + ' feet deep so far.</p>' : '') + '</div>' +
        '<button type="button" class="btn big gg-work">Work the month</button>';
      $('.gg-work', stage).addEventListener('click', function () { work(t, fee); });
    }
    function work(t, fee) {
      var lic = st.licencedYear || !$('input[name=gg-lic][value=no]', stage).checked;
      var meth = ($('input[name=gg-meth]:checked', stage) || {}).value || 'pan';
      var lines = [], found = 0, deep = st.place.kind === 'deep';
      if (lic && fee) { st.money -= fee; st.paidLicence += fee; if (t.year) st.licencedYear = true; lines.push('You paid ' + lsd(fee) + ' for your ' + (t.year ? 'miner’s right' : 'licence') + '.'); }
      // events
      var ev = [];
      if (Math.random() < t.hunt) ev.push('hunt');
      if (Math.random() < 0.25) ev.push('rain');
      if (Math.random() < 0.12) ev.push('rush');
      if (Math.random() < 0.10) ev.push('pick');
      // digging
      var wet = ev.indexOf('rain') >= 0, rush = ev.indexOf('rush') >= 0;
      if (meth === 'pan') {
        found = deep ? tri(0, 0.4) : tri(0, 1.2);
        if (wet) found *= 1.2; if (rush) found *= 1.5;
        lines.push('You washed dirt in your tin dish, a little at a time.');
      } else if (meth === 'cradle') {
        var party = deep ? tri(0, 2.4) : tri(0.8, 5.6); if (wet) party *= 1.3; if (rush) party *= 1.5;
        found = party / 4;
        lines.push('You rocked a cradle with a party of four. The party washed ' + ozs(party) + '. Your share is a quarter.');
      } else {
        var need = deep ? st.place.depth : 20;
        if (wet && st.depth > 0) { lines.push('Rain flooded your shaft. You spent the month bailing water and lost ten feet.'); st.depth = Math.max(0, st.depth - 10); }
        else { st.depth += deep ? 30 : 20; lines.push('You sank your shaft to ' + Math.min(st.depth, need) + ' feet.'); }
        if (st.depth >= need) {
          var r = Math.random();
          if (r < 0.10) { found = rnd(15, 40); st.nugget = true; lines.push('At the bottom you struck a nugget.'); }
          else if (r < 0.60) { found = deep ? rnd(2, 8) : rnd(0.5, 3); lines.push('At the bottom you reached the gold-bearing clay.'); }
          else { found = 0; lines.push('At the bottom there was no gold. Many shafts were like this.'); }
          st.depth = 0;
        }
      }
      if (ev.indexOf('hunt') >= 0) {
        if (lic) lines.push('Licence hunt! Police checked every digger at your gully. You showed your licence.');
        else { var fine = 240 * (5 + Math.floor(Math.random() * 6)); st.money -= fine + fee; st.fines += fine; st.paidLicence += fee; lines.push('Licence hunt! You had no licence. You were taken to the Camp, fined ' + lsd(fine) + ', and made to take out a licence for ' + lsd(fee) + '.'); }
      } else if (!lic && fee) lines.push('No licence hunt came to your claim this month. You saved ' + lsd(fee) + '.');
      if (wet && meth !== 'shaft') lines.push('Heavy rain. Plenty of water for washing.');
      if (rush) lines.push('A rush! News of a rich find nearby brought crowds, and the ground around you paid well.');
      if (ev.indexOf('pick') >= 0) { st.money -= 30; lines.push('Your pick struck hard ground and lost its points. The blacksmith charged 2s 6d to steel it.'); }
      // robbery
      if (found > 0 && Math.random() < 0.10) { var lost = found / 2; found -= lost; lines.push('Thieves! Half the gold you found this month was stolen from your tent: ' + ozs(lost) + '.'); }
      // sell and eat
      var price = t.price; var sale = Math.round(found * price);
      st.gold += found; st.sold += sale; st.money += sale; st.money -= FOOD.total; st.food += FOOD.total; st.months++;
      lines.push('You sold ' + ozs(found) + ' to the gold buyer at ' + lsd(price) + ' an ounce: ' + lsd(sale) + '.');
      lines.push('Food for the month cost ' + lsd(FOOD.total) + '.');
      drawLedger();
      if (found >= 0.25) flash(found);
      st.log.push({ date: t.date, found: found, lines: lines });
      stage.innerHTML = '<p class="gg-step">Month ' + (st.m + 1) + ' of ' + T.length + ' · ' + esc(t.date) + '</p><h4>' + (found > 0 ? 'Gold! ' + ozs(found) : 'No gold this month') + '</h4><ul class="gg-lines">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
        (st.money < 0 ? '<p class="gg-news"><strong>Out of money.</strong> You owe the storekeeper ' + lsd(-st.money) + '.</p>' : '') +
        '<button type="button" class="btn big gg-next">' + (st.m + 1 < T.length && st.money >= 0 ? 'Next month' : 'See how you did') + '</button>';
      $('.gg-next', stage).addEventListener('click', function () { st.m++; if (st.m < T.length && st.money >= 0) month(); else end(); });
    }
    function end() {
      var days = st.months * G.workdays, lo = days * 240, hi = days * 480;
      var best = st.log.slice().sort(function (a, b) { return b.found - a.found; })[0];
      stage.innerHTML = '<p class="gg-step">The end of your time on the diggings</p><h4>' + esc(st.money >= 0 ? 'You finished with ' + lsd(st.money) : 'You finished in debt') + '</h4>' +
        '<table class="gg-sum"><tbody>' +
        '<tr><th>Started with</th><td>' + lsd(start.money) + '</td></tr>' +
        '<tr><th>Gold found</th><td>' + ozs(st.gold) + ', sold for ' + lsd(st.sold) + '</td></tr>' +
        '<tr><th>Tools</th><td>' + lsd(st.tools) + '</td></tr>' +
        '<tr><th>Licences</th><td>' + lsd(st.paidLicence) + '</td></tr>' +
        '<tr><th>Fines</th><td>' + lsd(st.fines) + '</td></tr>' +
        '<tr><th>Food</th><td>' + lsd(st.food) + ' (' + st.months + ' months)</td></tr>' +
        '<tr><th>Money at the end</th><td><strong>' + lsd(st.money) + '</strong></td></tr>' +
        (best && best.found > 0 ? '<tr><th>Best month</th><td>' + esc(best.date) + ': ' + ozs(best.found) + '</td></tr>' : '') +
        '</tbody></table>' +
        '<div class="exhibit"><p class="kick">Ellen Clacy · Forest Creek · late 1852</p><blockquote>' + esc(G.clacyWage) + '</blockquote><p class="src">Source. Mrs Charles Clacy, A Lady’s Visit to the Gold Diggings of Australia in 1852–53 (London, 1853), chapter XI.</p></div>' +
        '<p>If you had worked as a carpenter or a carter for those ' + st.months + ' months instead, at ' + G.workdays + ' working days a month, Clacy’s figure gives between <strong>' + lsd(lo) + '</strong> and <strong>' + lsd(hi) + '</strong>.</p>' +
        '<p class="note">The licence fees, the fines, the prices and the price of gold are real figures from the sources on the <a href="#licence" data-goto2="licence">Licence and prices</a> tab. How much gold you find, and how often things happen, are made up for the game.</p>' +
        '<label class="field" for="gg-reflect">Was it worth it? Who did the licence fee hurt most?</label><textarea id="gg-reflect" data-key="gg-reflect" rows="3"></textarea>' +
        '<p><button type="button" class="btn big gg-again">Play again</button></p>';
      $('.gg-again', stage).addEventListener('click', reset);
      var a = $('[data-goto2]', stage); if (a) a.addEventListener('click', function (e) { e.preventDefault(); var b = document.getElementById('tab-licence'); if (b) b.click(); });
    }
    function flash(oz) {
      burst.innerHTML = '<div class="gg-nug"><svg viewBox="0 0 120 100" aria-hidden="true"><defs><linearGradient id="gn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".45" stop-color="#e3b23c"/><stop offset="1" stop-color="#8a5a12"/></linearGradient></defs><path d="M20 58 C14 40 30 22 50 24 C62 10 88 14 96 32 C112 40 108 66 92 74 C80 90 52 88 40 80 C26 80 18 70 20 58Z" fill="url(#gn)" stroke="#6b430c" stroke-width="3"/><path d="M40 38 C48 32 58 32 64 36" stroke="#fffbe0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/></svg><p>' + (st.nugget && oz >= 15 ? 'A nugget! ' : 'Gold! ') + esc(ozs(oz)) + '</p></div><canvas></canvas>';
      burst.hidden = false; burst.classList.remove('go'); void burst.offsetWidth; burst.classList.add('go');
      var cv = $('canvas', burst), w = cv.width = burst.clientWidth * 2, h = cv.height = burst.clientHeight * 2, cx = cv.getContext('2d');
      var n = reduce ? 0 : Math.min(160, 40 + Math.round(oz * 20)), parts = [];
      for (var i = 0; i < n; i++) parts.push({ x: w / 2, y: h * 0.42, vx: rnd(-9, 9), vy: rnd(-16, -3), r: rnd(3, 9), a: 1, c: ['#f7d774', '#e3b23c', '#fff4b8', '#c8901e'][i % 4] });
      var t0 = performance.now();
      function step(now) {
        var k = (now - t0) / 1000; cx.clearRect(0, 0, w, h);
        parts.forEach(function (p) { p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.a = Math.max(0, 1 - k / 1.8); cx.globalAlpha = p.a; cx.fillStyle = p.c; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.3); cx.fill(); });
        if (k < 1.9) requestAnimationFrame(step); else { burst.hidden = true; }
      }
      requestAnimationFrame(step);
      setTimeout(function () { burst.hidden = true; }, 2200);
    }
    burst.addEventListener('click', function () { burst.hidden = true; });
    reset();
  }

  /* ---------------- The arrivals map ---------------- */
  function arrivals() {
    var box = $('#arrivals'); if (!box || box.dataset.ready || !window.L || !box.offsetParent) return; box.dataset.ready = '1';
    var A = G.arrivals, el = $('.map', box);
    var map = L.map(el, { zoomControl: true, attributionControl: true, scrollWheelZoom: false, worldCopyJump: false, minZoom: 0, maxZoom: 8 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 8, attribution: '© OpenStreetMap contributors' }).addTo(map);
    var narrow = el.clientWidth < 600;
    var HOME = narrow ? [[5, 110], 0] : [[5, 110], 1];
    map.setView(HOME[0], HOME[1], { animate: false });
    var cv = document.createElement('canvas'); cv.className = 'flow-canvas'; el.appendChild(cv);
    var ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1, year = '1854', dots = [], playing = !reduce, last = performance.now();
    var labels = L.layerGroup().addTo(map), walkLine = null, walkers = [];
    function size() { var r = el.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px'; }
    function pts(route) { return route.map(function (ll) { var p = map.latLngToContainerPoint(ll); return [p.x, p.y]; }); }
    function along(P, f) { // position along polyline by fraction (with smoothing via quadratic midpoints)
      var L2 = [], tot = 0; for (var i = 1; i < P.length; i++) { var d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L2.push(d); tot += d; }
      var want = f * tot; for (var j = 0; j < L2.length; j++) { if (want <= L2[j]) { var u = L2[j] ? want / L2[j] : 0; return [P[j][0] + (P[j + 1][0] - P[j][0]) * u, P[j][1] + (P[j + 1][1] - P[j][1]) * u]; } want -= L2[j]; }
      return P[P.length - 1];
    }
    function flows() { return A.flows.filter(function (f) { return f.n[year] && (f.route || f.routes); }); }
    function marks() { return A.flows.filter(function (f) { return f.n[year]; }); }
    function drawLabels() {
      labels.clearLayers();
      flows().forEach(function (f) {
        var n = f.n[year];
        L.circleMarker((f.routes ? f.routes[0] : f.route)[0], { radius: Math.max(4, Math.sqrt(n) / 18), color: f.color, weight: 2, fillColor: f.color, fillOpacity: 0.35 }).bindPopup('<strong>' + esc(f.name) + '</strong><br>' + n.toLocaleString('en-AU') + ' people in Victoria in ' + year + ' were born here.' + (f.note ? '<br><small>' + esc(f.note) + '</small>' : '')).addTo(labels);
      });
      L.circleMarker(A.melbourne, { radius: 7, color: '#4a2e1b', weight: 3, fillColor: '#f7d774', fillOpacity: 1 }).bindTooltip('Port Phillip (Melbourne)', { direction: 'right' }).addTo(labels);
      (A.notes || []).forEach(function (m) { L.circleMarker(m.ll, { radius: 6, color: '#4a2e1b', weight: 2, dashArray: '2 3', fillColor: '#fff', fillOpacity: 0.8 }).bindPopup('<strong>' + esc(m.name) + '</strong><br>' + esc(m.text)).addTo(labels); });
      if (walkLine) { map.removeLayer(walkLine); walkLine = null; }
      if (year === '1857') {
        walkLine = L.polyline(A.robe.route, { color: '#9a3b1d', weight: 3, dashArray: '6 8' }).bindPopup(esc(A.robe.text)).addTo(map);
        A.robe.stops.forEach(function (s, k) { L.circleMarker(s.ll, { radius: 4, color: '#9a3b1d', fillColor: '#fff', fillOpacity: 1, weight: 2 }).bindTooltip(esc(s.name), { direction: 'top', permanent: k === 0 || k === A.robe.stops.length - 1, className: 'robe-tip' }).addTo(labels); });
      }
      $$('.yr', box).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.year === year)); });
      var tot = A.total[year], body = $('.flow-legend tbody', box);
      body.innerHTML = A.flows.filter(function (f) { return f.n[year] || f.showZero; }).map(function (f) {
        var n = f.n[year] || 0; return '<tr><th><span class="sw" style="background:' + f.color + '"></span>' + esc(f.name) + '</th><td>' + (n ? n.toLocaleString('en-AU') : f.zeroText) + '</td><td><span class="bar" style="width:' + (n ? Math.max(1, 100 * n / A.max) : 0) + '%;background:' + f.color + '"></span></td></tr>';
      }).join('') + '<tr class="tot"><th>Everyone counted</th><td>' + tot.toLocaleString('en-AU') + '</td><td>' + esc(A.totalNote[year]) + '</td></tr>';
      $('.flow-src', box).textContent = A.src[year];
    }
    function frame(now) {
      var dt = Math.min(0.1, (now - last) / 1000); last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      var F = flows();
      F.forEach(function (f) {
        var RS = f.routes || [f.route];
        RS.forEach(function (r) { var P = pts(r); ctx.globalAlpha = 0.3; ctx.strokeStyle = f.color; ctx.lineWidth = Math.max(1, Math.sqrt(f.n[year] / RS.length) / 60); ctx.beginPath(); P.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); });
        if (playing) { f.acc = (f.acc || 0) + dt * f.n[year] / A.perDot; while (f.acc >= 1) { f.acc -= 1; dots.push({ f: f, r: RS[Math.floor(Math.random() * RS.length)], t: 0, sp: rnd(RS.length > 1 ? 0.3 : 0.11, RS.length > 1 ? 0.4 : 0.16), j: rnd(-3, 3) }); } }
      });
      ctx.globalAlpha = 1;
      dots = dots.filter(function (d) { return d.t <= 1 && F.indexOf(d.f) >= 0; });
      dots.forEach(function (d) { if (playing) d.t += d.sp * dt; var P = pts(d.r), p = along(P, Math.min(1, d.t)); ctx.fillStyle = d.f.color; ctx.beginPath(); ctx.arc(p[0] + d.j, p[1] + d.j, 2.6, 0, 6.3); ctx.fill(); });
      if (year === '1857') {
        var R = pts(A.robe.route);
        if (playing && Math.random() < dt * 3) walkers.push({ t: 0 });
        walkers = walkers.filter(function (w) { return w.t <= 1; });
        walkers.forEach(function (w) { if (playing) w.t += dt * 0.08; var p = along(R, w.t); ctx.fillStyle = '#9a3b1d'; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 6.3); ctx.fill(); });
      }
      requestAnimationFrame(frame);
    }
    $$('.yr', box).forEach(function (b) { b.addEventListener('click', function () { year = b.dataset.year; dots = []; walkers = []; drawLabels(); if (year === '1857') map.flyTo(narrow ? [-12, 128] : [-12, 128], 2, { duration: 1.2 }); else map.flyTo(HOME[0], HOME[1], { duration: 1.2 }); }); });
    $('.play', box).addEventListener('click', function (e) { playing = !playing; e.target.textContent = playing ? 'Pause' : 'Play'; });
    $('.play', box).textContent = playing ? 'Pause' : 'Play';
    $('.robe-btn', box).addEventListener('click', function () { year = '1857'; drawLabels(); map.flyTo([-37.4, 141.8], narrow ? 6 : 7, { duration: 1.4 }); });
    map.on('resize move zoom', size); size(); drawLabels(); requestAnimationFrame(frame);
    setTimeout(function () { map.invalidateSize(); size(); }, 200);
  }

  /* ---------------- The licence ---------------- */
  function licence() {
    var f = $('#licence-form'); if (!f || f.dataset.ready) return; f.dataset.ready = '1';
    var out = $('#licence-card');
    function v(n) { var e = f.elements[n]; return e ? e.value.trim() : ''; }
    function draw() {
      var kind = v('kind') || '1852', K = (G.licence || {})[kind] || {}; out.dataset.kind = kind;
      $$('[data-fill]', out).forEach(function (e) { var k = e.dataset.fill; var val = k in K ? K[k] : v(k); e.textContent = val || '\u00a0'; e.classList.toggle('blank', !val); });
      try { var d = JSON.parse(localStorage.getItem('gold-licence') || '{}'); ['name', 'no', 'date', 'district', 'period', 'commissioner'].forEach(function (k) { d[k] = v(k); }); d.kind = kind; localStorage.setItem('gold-licence', JSON.stringify(d)); } catch (e) {}
    }
    try { var d = JSON.parse(localStorage.getItem('gold-licence') || '{}'); Object.keys(d).forEach(function (k) { if (f.elements[k]) f.elements[k].value = d[k]; }); } catch (e) {}
    f.addEventListener('input', draw); f.addEventListener('change', draw); draw();
    $$('.print-licence').forEach(function (b) { b.addEventListener('click', function () { document.body.classList.add('printing-licence'); if (b.dataset.blank) document.body.classList.add('blank-licence'); setTimeout(function () { window.print(); }, 60); }); });
    window.addEventListener('afterprint', function () { document.body.classList.remove('printing-licence', 'blank-licence'); });
  }

  /* ---------------- The price basket ---------------- */
  function basket() {
    var b = $('#basket'); if (!b || b.dataset.ready) return; b.dataset.ready = '1';
    var tot = $('.bk-total', b), bar = $('.bk-bar span', b);
    function upd() {
      var p = 0; $$('input[type=checkbox]', b).forEach(function (c) { if (c.checked) p += +c.dataset.p; });
      var oz = 64 * 12; tot.textContent = 'Your basket: ' + lsd(p) + '. One ounce of gold sold for 64s. ' + (p <= oz ? 'You have ' + lsd(oz - p) + ' left from one ounce.' : 'That is more than one ounce of gold, by ' + lsd(p - oz) + '.') + ' A month’s licence in 1852 cost 30s.';
      bar.style.width = Math.min(100, 100 * p / oz) + '%'; bar.parentNode.classList.toggle('over', p > oz);
    }
    b.addEventListener('change', upd); upd();
  }


  /* ---------------- Documents revealed line by line ---------------- */
  function docReveal() {
    $$('.doc-reveal').forEach(function (box) {
      if (box.dataset.ready) return; box.dataset.ready = '1';
      var lines = $$('.doc-line', box), btn = $('.doc-next', box);
      if (!lines.length) return;
      var i = 0;
      function show() {
        lines.forEach(function (el, k) { el.hidden = k > i; });
        if (!btn) return;
        if (i >= lines.length - 1) { btn.hidden = true; }
        else { btn.hidden = false; btn.textContent = i === 0 ? 'Tap to read the next line' : 'Tap to read the next line'; }
      }
      if (reduce) { i = lines.length - 1; show(); return; }
      show();
      if (btn) btn.addEventListener('click', function () { i = Math.min(lines.length - 1, i + 1); show(); });
    });
  }

  window.initGold = function () { game(); arrivals(); licence(); basket(); docReveal(); };
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[role=tab]'); if (t) setTimeout(window.initGold, 60); });
  if (document.readyState !== 'loading') setTimeout(window.initGold, 60); else document.addEventListener('DOMContentLoaded', function () { setTimeout(window.initGold, 60); });
})();
