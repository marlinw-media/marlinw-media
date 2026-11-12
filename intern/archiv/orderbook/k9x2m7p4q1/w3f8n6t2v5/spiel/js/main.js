/* Pets — Start, Titelbildschirm, Menü */
(function () {
  'use strict';
  var G = window.G, $ = G.$;

  function backToList() { G.persist(true); location.href = '../index.html'; }
  function tryFullscreen() {
    /* Android/Chrome: Vollbild + Querformat; iOS ignoriert das still */
    var el = document.documentElement;
    try {
      var req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req && !document.fullscreenElement && matchMedia('(pointer: coarse)').matches) {
        var p = req.call(el, { navigationUI: 'hide' });
        if (p && p.then) p.then(function () { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); }).catch(function () {});
      }
    } catch (e) {}
  }

  G.openMenu = function () {
    var st = G.data.settings;
    var row = function (k, label) { return '<div class="toggle-row"><span>' + label + '</span><button class="switch ' + (st[k] ? 'on' : '') + '" data-k="' + k + '" aria-label="' + label + '"></button></div>'; };
    G.openModal(
      '<h2>⚙︎ Menü</h2><p class="sub">' + G.esc(G.data.name) + ' · 🦴 ' + G.data.bones + ' Knochen</p>' +
      row('music', '🎵 Musik') + row('sfx', '🔊 Geräusche') + (navigator.vibrate ? row('haptics', '📳 Vibration') : '') +
      '<div class="row"><button class="btn ghost" data-a="rename">✏️ Hund umbenennen</button></div>' +
      '<div class="row"><button class="btn ghost" data-a="back">↩ Bestellliste</button><button class="btn gold" data-a="close">Weiterspielen</button></div>',
      {
        bind: function (c) {
          c.querySelectorAll('.switch').forEach(function (s) {
            s.onclick = function () { var k = s.dataset.k; st[k] = !st[k]; s.classList.toggle('on', st[k]); G.audio.applySettings(); G.persist(); G.sfx('click'); if (k === 'haptics' && st[k]) G.buzz(30); };
          });
          c.querySelector('[data-a=rename]').onclick = function () { askName(false); };
          c.querySelector('[data-a=back]').onclick = backToList;
          c.querySelector('[data-a=close]').onclick = function () { G.sfx('click'); G.closeModal(); };
        }
      });
  };
  function askName(first, done) {
    G.openModal(
      '<h2>' + (first ? '🐶 Dein Hund' : '✏️ Neuer Name') + '</h2><p class="sub">' + (first ? 'Wie soll dein Hund heißen?' : 'Gib deinem Hund einen neuen Namen.') + '</p>' +
      '<input class="name-input" id="name-in" maxlength="14" autocomplete="off" autocapitalize="words" enterkeyhint="done" value="' + G.esc(G.data.name) + '">' +
      '<div class="row"><button class="btn gold" data-ok>' + (first ? 'Los geht\'s 🐾' : 'Speichern') + '</button></div>',
      {
        dismissable: !first,
        bind: function (c) {
          var inp = c.querySelector('#name-in');
          var ok = function () {
            var v = inp.value.trim().replace(/\s+/g, ' ').slice(0, 14);
            if (v) G.data.name = v;
            G.data.seenIntro = true; G.persist(); G.refreshStats();
            inp.blur(); G.sfx('happy'); G.closeModal(); if (done) done();
          };
          c.querySelector('[data-ok]').onclick = ok;
          inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ok(); });
          setTimeout(function () { if (!matchMedia('(pointer: coarse)').matches) inp.select(); }, 300);
        }
      });
  }

  function start() {
    G.audio.unlock();
    G.sfx('happy');
    tryFullscreen();
    var title = $('title');
    var go = function () {
      title.classList.add('out');
      setTimeout(function () { title.hidden = true; }, 650);
      G.ensureQuests();
      G.go('hub', { keep: false }, { cx: G.W / 2, cy: G.H / 2 });
      setTimeout(function () {
        var m = G.mood();
        G.toast('Hallo ' + G.data.name + '! 🐾 ' + (m.key === 'sad' || m.key === 'meh' ? G.data.name + ' ' + m.text + ' – schau mal zu Hause vorbei.' : 'Ab nach draußen!'), 3200);
      }, 1300);
    };
    if (!G.data.seenIntro) askName(true, go); else go();
  }

  /* ---- Knöpfe ---- */
  $('start-btn').addEventListener('click', start);
  $('title-back').addEventListener('click', backToList);
  $('btn-menu').addEventListener('click', function () { G.sfx('click'); G.openMenu(); });
  $('btn-quests').addEventListener('click', function () { G.sfx('click'); G.openQuests(); });
  $('btn-exit').addEventListener('click', function () { G.sfx('click'); if (G.scene && G.scene.onEscape && !G.transition) G.scene.onEscape(); });

  /* ---- Titelbildschirm: Welt läuft im Hintergrund ---- */
  G.decay();
  G.ensureQuests();
  $('bones').textContent = G.data.bones;
  $('tagline').textContent = G.data.seenIntro ? G.data.name + ' wartet schon auf dich! 🐾' : 'Gassi gehen, spielen, kuscheln.';
  ['house-ui'].forEach(function (id) { $(id).hidden = true; });
  G.setJoystick(false);
  G.start();
  G.go('hub', { attract: true }, { instant: true });
  G.music('hub');
})();
