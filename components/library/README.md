# The Library of Wyggzantium

A 3D library at `/wyggzantium/`, meant for wigga.masterroachi.com. It fills the
whole window, the site's nav and footer included. Built 18 Nov 2026 with Master
Roachi; handed to Bjorn and Fjord the same day. `lib/library.ts` says what it is
and holds the data types.

## Where things are

| Path | What |
|---|---|
| `app/wyggzantium/` | The page (noIndex until it opens). |
| `lib/library.ts` | Types, and the media rule: YouTube embeds, each credited. |
| `data/library.json` | The shelves. **Generated**: don't hand-edit. |
| `data/wyggzantium-catalogue.json` | The source catalogue: 286 audio, 385 video (31 lectures, 354 debates, each with a `topic`). |
| `scripts/wyggzantium-catalogue.py` | Catalogue → library.json. The album and box groupings live here. |
| `public/wyggzantium/covers/` | One cover per YouTube id: its thumbnail, uncropped on a blurred copy of itself, 384 px (JPEG q82; 512 px until 18 Nov, which was 22 MB). |
| `public/wyggzantium/texts/` | Each readable book's text, gzipped, one paragraph to a line: 37 Church Fathers volumes from CCEL (public domain), 39 MB. `scripts/wyggzantium-texts.py` makes them. |
| `public/wyggzantium/eagle.png` | The Palaiologan eagle, public domain (see `eagle-licence.txt`). |
| `public/wyggzantium/pictures/` | The gallery behind the screen. |
| `public/wyggzantium/models/` | The furniture: 12 CC0 models from Poly Haven, each one `.glb` with WebP textures (7.5 MB). `LICENCE.txt` credits each. |
| `components/library/` | The scene. |

## Rebuilding the shelves

1. Edit `data/wyggzantium-catalogue.json` (new finds) or the groupings in the script.
2. `python3 -I scripts/wyggzantium-catalogue.py` rewrites `data/library.json`, keeping its gallery, and writes the list of cover ids to `/tmp/wyggzantium-covers.txt`.
3. For each new id, fetch `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` (`hqdefault` if missing), trim black bars, fit inside 384×384 over a blurred, darkened cover-fill of itself, and save as `public/wyggzantium/covers/<id>.jpg`.

## The scene, file by file

- `scene.ts`: everything that happens. It covers the room, walls, stations, the CD/LP/box/book flows, clicks, hover, ladders, the Index and the players.
- `walls.ts`: shelving, instanced. `placeItems` puts each section on a fresh shelf under a brass label, and groups under paper labels. Box sets span several compartments.
- `models.ts`: jewel case, DVD keep case, the box set (`makeBoxSet`, CD or DVD), 7-inch single, book, players, turntable.
- `textures.ts`: every printed surface: covers, spines, booklets, disc art, and the box sets' foil faces (`boxFront`, `boxSpine` draw colour, foil and roughness maps).
- `hall.ts`, `style.ts`, `furniture.ts`, `projector.ts`, `gallery.ts`, `ladders.ts`: the room and its things. `buildShell` cuts the games room's doorway in the Books wall.
- `props.ts`: the Poly Haven models. `prop(name, fit, standIn)` gives a group holding the old built piece until the model loads, then the model; if it never loads, the old piece stays.
- `boardgame.ts`, `boardrules.ts`: the games table. Click it to sit; play chess or checkers against the computer, Easy, Medium or Hard; the panel is `GamePanel` in `Library.tsx`. `boardrules.ts` is pure (no three.js): the rules and a negamax search. Its chess moves match the standard perft counts (start position to depth 4, Kiwipete to 3, position 3 to 4), and Hard answers in under 0.3 s.
- `gamesroom.ts`: the games room behind the Books wall. Bay 1 of the Books wall (world x 7.7 to 11.05, below 2.97 m) is a pair of bookcase doors, each shelved as a book `Wall` of its own (`doorWalls`, filled by the Books pass), hinged so it swings; the oxblood book with the gilt border on the first leaf's fifth shelf (`leverSlot`) is the lever. Behind is a 12 × 9 m room shelved all round, a bay to each of 18 consoles (`CONSOLES`): empty cases of each console's shape and colour, and a real case for each game listed. The 13 home consoles stand on two benches either side of the television; the 5 handhelds on a stand by the sofa. `PLAY` says how each plays: its EmulatorJS core, or why it cannot.
- `consoles.ts`: the 18 consoles and their media, modelled in code: each with its tray, lid or slot (`setOpen`), where a disc or cartridge sits (`seat`, `approach`), a power light, and a handheld's screen.
- `emulator.ts`: lays a game over the television's screen or a handheld's (CSS3D, as the DVD is over the projector screen), or says why it cannot play. The game runs in `public/wyggzantium/tv/`, a page of its own running EmulatorJS 4.2.3 from cdn.emulatorjs.org.
- `reader.ts`: a book's text, fetched when it is first opened and laid out to the page `textures.ts` draws (`PAGE`), and the ribbons: where each book was left, kept in this browser's localStorage. A book is six real leaves, reprinted a spread on after every turn (`settleBook` in `scene.ts`).
- `media.ts`: plays a file or a YouTube embed (postMessage, no API script). `start` and `end` cut a track from a full-album stream.
- `sfx.ts`: synthesised sound effects, with no files.

## Rules kept so far (Master Roachi's)

- **Media:** everything is a YouTube embed (youtube-nocookie), always visible, never a hidden player. Every item is credited to its channel with a link.
- **Shelving:**
  - Sections take only the shelf they fill, with no big plaques.
  - All of Jay Dyer's lecture series sit under one group, Global Elite Books.
  - Records are 7-inch singles; albums are CDs.
  - Lecture series are box sets, one disc per lecture. The Lord of Spirits is one CD per episode, with no box sets.
  - Debates: each debater has his own section, with a box set per topic (not per year), oldest first and at most 12 discs to a box. Jay's call-in livestreams are a topic of their own. Nick's are formal debates only. The topic is `topic` in the catalogue (18 Nov).
- **Hover:** shows what an item is, top left.
- **Games room (18 Nov):** the games are Master Roachi's own and private. Each is a line in `data/wyggzantium-games.json` (`console`, `title`, `rom`, optional `cover`); the file itself goes in the R2 bucket `wyggzantium-roms` at that key, and is read only through `wigga.masterroachi.com/roms/`, behind Access. Click a case and it goes into its console and plays on the television (a handheld's, on the handheld, held up to you). Cases are public; games are not; nothing in the repo holds a game.
- **What plays:** NES, SNES, N64, Game Boy, GBA, DS, PS1, Mega Drive and Saturn everywhere. PSP only in Chromium browsers, which alone get the page cross-origin isolated (worker/library.ts; YouTube embeds stay working there as `credentialless` frames). PS2 and Dreamcast have browser emulators (a PCSX2 port, Flycast WASM) not yet wired in. PS3, Vita, Xbox, 360, GameCube and Wii have none: their TV says so.
- **In development** a test cartridge of our own (`public/wyggzantium/roms-local/nes/test-blue.nes`, a blue screen; ignored by git) stands on the NES shelf, and games load from `public/wyggzantium/roms-local/<rom>`.
- **Games table:** you play ivory (white in chess), from the near side, and move first. Chess promotes to a queen; checkers is English draughts (captures forced, crowning ends the move).

## Open, as handed over

- **Not committed.** Pushing to main deploys; it needs Master Roachi's word.
- **Before going live (Fjord): done 18 Nov, waiting on his word to push.**
  - `frame-src https://www.youtube-nocookie.com` in `public/_headers`;
  - wigga.masterroachi.com: a custom domain in `wrangler.jsonc`, and `worker/library.ts`, which opens the address on `/wyggzantium/` and forwards the apex page there (tests in `scripts/worker-test.mjs`);
  - noIndex lifted, with the canonical and share-card URL on the wigga address.
- **Gallery:** Jay Dyer's portrait needs a photo the site is free to show. None exists on Commons. Three gallery frames are still empty.
- **Books:** the Church Fathers are on the wall, 38 volumes (Ante-Nicene, and Nicene and Post-Nicene Series I and II) from Master Roachi's library. Each is in the catalogue's `books` with a CCEL link and its licence. They are readable: the text is CCEL's, never Master Roachi's own files. ANF X (bibliography and index) has no text, since CCEL and his copy are page scans only. A book's slot is sized by the wall's filler, not by `pages`. Until it fills, the two book-filled doors stand out on it; once Bjorn's books go in they blend.
- **Size:** covers are 18 MB at 384 px (Fjord, 18 Nov; 22 MB at 512). They load only when a case or box is built, so this is the repo's and the deploy's weight, not a visit's. WebP at q72 would save about a third more, but every `cover` path would change with it.
- **Phones:** heavy scenes; untested on a phone.
- **Testing:** headless Chromium on the rig's GPU (`--use-angle=vulkan`) runs it at 60 fps; SwiftShader is too slow to drive. In dev, `window.__library.act(...)` takes `real:<n>`, `goto:<n>`, `view:x,y,z,tx,ty,tz`, `click-held`, `climb:<n>`, `games-door`, `game-sit`, `game-square:<rank*8+file>`, `arcade-stop` for tests.
