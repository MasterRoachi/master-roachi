// The games room's TV (The Library of Wyggzantium, 18 Nov 2026). The scene
// lays this page over the television's screen (or a handheld's) and tells it
// what to play in its address: ?core=<EmulatorJS core>&rom=<path>&title=<name>.
// EmulatorJS comes from its CDN, pinned to one version; the game comes only
// from the library's own private store (/roms/, behind Access) or, on this
// machine in development, public/wyggzantium/roms-local/ (never committed).
(function () {
  var VERSION = '4.2.3';
  var CORES = ['nes', 'snes', 'n64', 'gb', 'gba', 'nds', 'psx', 'segaMD', 'segaSaturn', 'psp'];
  var q = new URLSearchParams(location.search);
  var core = q.get('core') || '';
  var rom = q.get('rom') || '';
  var say = function (msg) {
    parent.postMessage(Object.assign({ tv: true }, msg), location.origin);
  };
  var ownStore = /^\/roms\/[^?#]+$/.test(rom) || /^\/wyggzantium\/roms-local\/[^?#]+$/.test(rom);
  if (CORES.indexOf(core) < 0 || !ownStore || rom.indexOf('..') >= 0) {
    say({ state: 'refused' });
    return;
  }
  window.EJS_player = '#game';
  window.EJS_core = core;
  window.EJS_gameUrl = rom;
  window.EJS_gameName = q.get('title') || 'Game';
  window.EJS_pathtodata = 'https://cdn.emulatorjs.org/' + VERSION + '/data/';
  window.EJS_startOnLoaded = true;
  window.EJS_color = '#c9a24a';
  window.EJS_backgroundColor = '#000000';
  window.EJS_language = 'en-US';
  // The PSP core runs on threads, which needs the page cross-origin isolated.
  window.EJS_threads = core === 'psp';
  window.EJS_ready = function () { say({ state: 'ready' }); };
  window.EJS_onGameStart = function () { say({ state: 'playing' }); };
  // The scene pauses the game when you get up, and carries on when you sit back down.
  addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || !e.data.tv) return;
    var emu = window.EJS_emulator;
    if (!emu) return;
    if (e.data.cmd === 'pause' && emu.pause) emu.pause();
    if (e.data.cmd === 'play' && emu.play) emu.play();
  });
  var s = document.createElement('script');
  s.src = window.EJS_pathtodata + 'loader.js';
  s.crossOrigin = 'anonymous';
  s.onerror = function () { say({ state: 'failed' }); };
  document.body.appendChild(s);
})();
