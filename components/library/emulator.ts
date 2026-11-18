import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import type { Object3D } from 'three';
import { PLAY, type Game } from './gamesroom';

// The games room's screens (his ask, 18 Nov 2026): the old television, and
// each handheld's own. A game plays in public/wyggzantium/tv/, a page of its
// own running EmulatorJS, laid over the screen in the page the way the DVD
// is laid over the projector screen. When it cannot play (a console no
// browser can emulate, not signed in, a game not in the store yet), the
// screen says why instead.


export type ScreenState =
  | { kind: 'loading' }
  | { kind: 'playing' }
  | { kind: 'message'; text: string; link?: { href: string; label: string } };

/** Where a game's file is: the private store, or on this machine in development. */
export const romUrl = (rom: string) => {
  const local = typeof location !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  const path = rom.split('/').map(encodeURIComponent).join('/');
  return local ? `/wyggzantium/roms-local/${path}` : `/roms/${path}`;
};

/** Whether a game can be played here and now, and if not, why not. */
export async function check(game: Game): Promise<ScreenState & { src?: string }> {
  const play = PLAY[game.console];
  if ('why' in play) return { kind: 'message', text: play.why };
  if (play.threads && !globalThis.crossOriginIsolated) return { kind: 'message', text: 'PSP games play in Chrome or Edge, not in this browser.' };
  const url = romUrl(game.rom);
  let status = 0;
  try {
    status = (await fetch(url, { method: 'HEAD', credentials: 'same-origin', redirect: 'manual' })).status;
  } catch {
    status = 0;
  }
  // Access answers a visitor who is not signed in with a redirect to its login.
  if (status === 403 || status === 0 || (status >= 300 && status < 400))
    return { kind: 'message', text: 'These games are Master Roachi’s own. Sign in to play.', link: { href: '/roms/', label: 'Sign in' } };
  if (status === 404) return { kind: 'message', text: `${game.title} is not in the store yet.` };
  if (status >= 400) return { kind: 'message', text: 'The game store is not answering. Try again in a moment.' };
  const q = new URLSearchParams({ core: play.core, rom: url, title: game.title });
  return { kind: 'loading', src: `/wyggzantium/tv/index.html?${q}` };
}

export interface Overlay {
  object: CSS3DObject;
  frame: HTMLIFrameElement | null;
  show(state: ScreenState): void;
  /** Sends the TV page a command: pause or play. */
  send(cmd: 'pause' | 'play'): void;
  dispose(): void;
}

/**
 * Lays a screen's picture over it: the game, or a message. `anchor` faces out
 * of the screen (+z). `PX` is the width it is laid out at before it is scaled
 * to the screen: a handheld's smaller, so its words are as large as the TV's.
 */
export function overlay(anchor: Object3D, w: number, h: number, src: string | undefined, PX = 640): Overlay {
  const height = Math.round((PX * h) / w);
  const box = document.createElement('div');
  Object.assign(box.style, {
    width: `${PX}px`,
    height: `${height}px`,
    background: '#000',
    pointerEvents: 'auto',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    color: '#e9dcbc',
    font: '600 22px Georgia, serif',
    textAlign: 'center',
  });
  let frame: HTMLIFrameElement | null = null;
  if (src) {
    frame = document.createElement('iframe');
    frame.src = src;
    frame.title = 'The games room television';
    frame.allow = 'autoplay; fullscreen; gamepad';
    Object.assign(frame.style, { width: '100%', height: '100%', border: '0', gridArea: '1 / 1' });
    box.append(frame);
  }
  const note = document.createElement('div');
  Object.assign(note.style, { gridArea: '1 / 1', padding: '0 48px', lineHeight: '1.4', pointerEvents: 'auto' });
  box.append(note);
  const object = new CSS3DObject(box);
  object.scale.setScalar(w / PX);
  // A hair in front of the glass.
  object.position.z = 0.004;
  anchor.add(object);

  const show = (state: ScreenState) => {
    note.replaceChildren();
    note.style.display = state.kind === 'playing' ? 'none' : '';
    if (state.kind === 'loading') note.textContent = 'Loading…';
    if (state.kind === 'message') {
      const p = document.createElement('p');
      p.textContent = state.text;
      note.append(p);
      if (state.link) {
        const a = document.createElement('a');
        a.href = state.link.href;
        a.target = '_top';
        a.textContent = state.link.label;
        Object.assign(a.style, { color: '#24190f', background: '#c9a24a', padding: '8px 20px', borderRadius: '999px', textDecoration: 'none', font: '600 18px system-ui, sans-serif' });
        note.append(a);
      }
    }
  };
  return {
    object,
    frame,
    show,
    send: (cmd) => frame?.contentWindow?.postMessage({ tv: true, cmd }, location.origin),
    dispose() {
      anchor.remove(object);
      box.remove();
    },
  };
}
