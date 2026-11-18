# The Library of Wyggzantium's collection, built from Fjord and Bjorn's media
# catalogue (the "Wyggzantium Media Catalogue" artifact, 18 Nov 2026).
#
#   python3 -I scripts/wyggzantium-catalogue.py
#
# reads data/wyggzantium-catalogue.json (the {audio, video} catalogue, kept in
# the repo: add new finds there) and rewrites data/library.json, keeping its
# gallery. Three arguments override the paths: catalogue, output, current
# library. It writes the new library and, beside it, a .covers
# list of the YouTube ids whose thumbnails are the covers (in /tmp, not the repo): fetch each as
# https://i.ytimg.com/vi/<id>/maxresdefault.jpg (hqdefault if missing),
# square it to 384 px and save it to public/wyggzantium/covers/<id>.jpg.
#
# How it groups: CDs are albums of tracks (Cringe Core Records in two volumes,
# Dyer Mode and its remixes, Alex Sorin's SORIN EAGLES and singles, and so
# on); Dyerwave is on LP, and its full-album streams are cut into tracks by
# their posted timestamps (start/end); The Lord of Spirits is a CD per
# episode; each lecture series is a DVD box set, and the debates are boxed by
# debater and topic. Edit the album lists below
# when the catalogue grows.
import json, os, re, sys
src, out, prev = sys.argv[1:4] if len(sys.argv) >= 4 else ('data/wyggzantium-catalogue.json', 'data/library.json', 'data/library.json')
d = json.load(open(src))
A = {a['id']: a for a in d['audio']}
PAL = ['#7a1218', '#1f3f5c', '#2e5240', '#5a3a1a', '#3a2a5c', '#6b4a12', '#1a1a1a', '#8a2a4a', '#2f6f6f', '#7a5a1a']

def secs(t):
    p = [int(x) for x in t.split(':')]
    s = 0
    for x in p: s = s * 60 + x
    return s

def credit(a):
    return {'name': a['channel'], 'url': a['channel_url'], 'video': a['url'], 'note': f"posted on {a['channel']}'s YouTube channel"}

def clean(t):
    t = re.sub(r'\s*#\S+', '', t)
    t = re.sub(r'\s*\((Official[^)]*|official[^)]*|Music Video|visualizer)\)', '', t)
    t = re.sub(r'\s*\[(Official|official)[^\]]*\]', '', t)
    t = t.replace('"', '').replace('“', '').replace('”', '').strip(' -')
    return re.sub(r'\s{2,}', ' ', t)

def track(i, title=None, start=None, end=None):
    a = A[i]
    t = {'title': title or clean(a['title']), 'youtube': i, 'credit': credit(a)}
    if start is not None: t['start'] = start
    if end is not None: t['end'] = end
    return t

def segments(i, lines):
    """Tracks from a full stream's timestamps: (title, 'mm:ss', 'mm:ss')."""
    return [track(i, t, secs(a), secs(b)) for t, a, b in lines]

albums = []
def album(section, group, title, artist, tracks, cover, fmt='cd', year=None):
    albums.append({'id': re.sub(r'[^a-z0-9]+', '-', (section + ' ' + title).lower()).strip('-'), 'format': fmt,
                   'title': title, 'artist': artist, 'year': year, 'section': section, 'group': group,
                   'colour': PAL[len(albums) % len(PAL)], 'cover': f'/wyggzantium/covers/{cover}.jpg', 'tracks': tracks})

by = lambda cat, ch=None: sorted([a for a in d['audio'] if a['cat'] == cat and (ch is None or a['channel'].startswith(ch))], key=lambda a: a['date'])

# --- Jay Dyer and his label -------------------------------------------------
S = 'Jay Dyer'
ccr = by('own', 'Cringe Core Records')
album(S, 'Cringe Core Records', 'Cringe Core Records, Vol. 1', 'Jay Dyer & Dr. Evo', [track(a['id']) for a in ccr[:8]], ccr[0]['id'], year=int(ccr[0]['date'][:4]))
album(S, 'Cringe Core Records', 'Cringe Core Records, Vol. 2', 'Jay Dyer & Dr. Evo', [track(a['id']) for a in ccr[8:]], ccr[8]['id'], year=int(ccr[8]['date'][:4]))
jd = by('own', 'Jay Dyer ')  # not the livestreams channel? handled below
jd = [a for a in by('own') if a['channel'] == 'Jay Dyer']
rmx = [a for a in jd if re.search(r'remix|mix\b|MIX|REMIX|Remix', a['title'])]
orig = [a for a in jd if a not in rmx]
album(S, 'Dyer Mode', 'Dyer Mode', 'Jay Dyer', [track(a['id']) for a in orig], orig[0]['id'], year=int(orig[0]['date'][:4]))
album(S, 'Dyer Mode', 'Dyer Mode: The Remixes', 'Jay Dyer', [track(a['id']) for a in rmx], rmx[0]['id'], year=int(rmx[0]['date'][:4]))
ls = by('own', 'Jay Dyer Livestreams')
album(S, 'Dyer Mode', 'Livestream Cuts', 'Jay Dyer', [track(a['id']) for a in ls], ls[0]['id'], year=int(ls[0]['date'][:4]))

# --- Alex Sorin, Jimbob and Cleave: each a section of his own --------------
fr = by('friends')
se = [a for a in fr if a.get('album') == 'SORIN EAGLES']
album('Alex Sorin', 'Albums', 'SORIN EAGLES', 'Alex Sorin', [track(a['id']) for a in se], se[0]['id'], year=int(se[0]['date'][:4]))
sg = [a for a in fr if a['channel'].startswith('Alex Sorin') and a.get('album') != 'SORIN EAGLES']
sg += [a for a in fr if a['title'].startswith('“Oooh”')]
album('Alex Sorin', 'Singles', 'Singles', 'Alex Sorin', [track(a['id']) for a in sg], [a for a in sg if a.get('album') == 'BURNING IN COLD'][0]['id'])
jb = [a for a in fr if 'Jimbob' in a['title'] or a['channel'] == 'MadeByJimbob']
album('Jimbob', 'Songs', 'MadeByJimbob', 'Jimbob', [track(a['id']) for a in jb], jb[0]['id'])
cl = [a for a in fr if 'Cleave' in a['title']]
album('Cleave', 'Songs', 'Cleave to the Talmud', 'Cleave & Alex Sorin', [track(a['id']) for a in cl], cl[0]['id'])
left = [a for a in fr if a not in se + sg + jb + cl]
assert not left, [a['title'] for a in left]

# --- Dyerwave: the albums and EPs on CD, everything else a 7-inch single --
S = 'Dyerwave'
artist = 'AmidTheRuins1453'
cd = lambda g, t, tr, cov, y=None: album(S, g, t, artist, tr, cov, 'cd', y)
cd('Albums', 'Dyerwave Vol. 1', [track('LMQVcsHNS8w', 'Dyerwave Vol. 1 (Full Album)')], 'LMQVcsHNS8w', 2019)
cd('Albums', 'Dyerwave II', [track('iI4r7E7u02w', 'Dyerwave II (Full EP)')], 'iI4r7E7u02w', 2019)
cd('Albums', 'Dyerwave III', [track(i) for i in ['D7I3QqGE9_w', '9H6JxsnIZdM', '3L8jfDHHHlw', 'dJbKxFaYrnA', '6h_TxFcVXaI', 'UBlpI0aiJEQ', 'vwzvfmmRzi8']] + [track('fKHJJnfkzzk', 'Outro', secs('23:50'), secs('24:14'))], 'fKHJJnfkzzk', 2020)
cd('Albums', 'Orthowave: Dyerwave Origins', segments('SVyzg1oyrQw', [
    ('Dyer Nerds, Rise Up (Intro)', '00:00', '03:28'), ('The Grid', '03:29', '06:44'), ('Lord of Free Men (Orthodox Emperor)', '06:45', '12:11'),
    ('Inside the Nerd Cell', '12:12', '15:45'), ('The Tension', '15:46', '18:06'), ('No More Debates (Total Chad Nerd Victory)', '18:07', '21:00')]), 'SVyzg1oyrQw', 2022)
cd('Albums', 'Orthowave: Rise of the Orthosphere', segments('iNorCIJ-mBQ', [
    ('Al Fadi Shouts-Out', '00:00', '00:19'), ('Orthowave', '00:21', '02:42'), ('What We Believe', '02:43', '05:19'),
    ('The Faith That Established the Universe', '05:20', '10:27'), ('The Arena', '10:29', '14:28'), ("Lord's Prayer", '14:30', '18:35'),
    ('Symphonia (Single Version)', '18:37', '23:39'), ('Dogma & Ethos (Remastered)', '23:41', '27:36'), ('The City of God (Single Version)', '27:37', '32:31'),
    ('Way of the World', '32:33', '34:53'), ('Icon', '34:55', '37:30'), ('Icon II', '37:32', '40:44'), ('The Nous', '40:46', '44:39')]), 'iNorCIJ-mBQ', 2023)
cd('Albums', 'Orthowave: Instrumentals & Variations', segments('xEHwMEWjg40', [
    ('Orthowave (Album Edit)', '00:00', '02:18'), ('What We Believe (Album Edit)', '02:20', '04:54'),
    ('The Faith That Established the Universe (Album Edit)', '04:56', '10:03'), ('The Arena (Cinematic Edit)', '10:04', '14:01'),
    ("Lord's Prayer (Extended Edit)", '14:02', '18:06'), ('Dogma & Ethos (Album Edit)', '18:07', '21:22'),
    ('Way of the World (Variations)', '21:24', '27:50'), ('Icon (Variations)', '27:51', '30:25'), ('The Nous (Album Edit)', '30:26', '33:46')]), 'xEHwMEWjg40', 2023)
cd('Albums', 'Chad Nerds: The Interweb Saga Vol. 1', segments('IPnPS40WOG0', [
    ('Warning', '00:00', '02:30'), ('Enter The Nerdrome', '02:32', '10:21'), ('Get Ready', '10:22', '14:22'),
    ('Tension Builder', '14:23', '19:46'), ('We Are Chad Nerds', '19:47', '24:30')]), 'IPnPS40WOG0', 2025)
cd('Albums', "Matt Dillamonke' (Maxi Single)", segments('Q2ZyTdWgFGY', [("Matt Dilamonke' (Kingpin Studio Edit)", '00:00', '02:21'), ("Matt Dillamonke' (First Studio Raw Take)", '02:23', '04:41'),
                               ("Matt Dillamonke' (Kingfish Studio Jam Session)", '04:43', '07:00')]), 'Q2ZyTdWgFGY', 2025)
cd('Albums', 'DyerWave Radio', [track('BqWj-7GuVQo', 'DyerRadio AM: DyerWave Radio I'), track('xptzpUItCbg', 'DyerRadio AM: DyerWave Radio II')], 'BqWj-7GuVQo', 2026)
used = {t['youtube'] for a in albums if a['section'] == S for t in a['tracks']}
SINGLE_TITLES = {
    'Rt8BkCr7noU': 'Dyerwave II (Preview)', 'dgbPSot1GPo': '30-40000 Chad Nerds (Demo)', 'BdLdpZAR2qo': 'Byzantium',
    'IUK6Cl-wGjY': 'Byzantium (Instrumental)', 'C9-wq_AaJK4': 'Dyerwave Origins (EP Preview)', '67Q9SoGMi1k': 'Origins (Demo Intro)',
    'sbhYlTex9f4': 'Rise of the Orthosphere (Demo LP Preview)', 'bleiZiGUnkc': "Jay's Analysis Theme (Piano Variations)",
    '-JycXGN2nG8': 'Dyerwave Music (Piano Edition)', 'B-Pz9-fAJ24': 'MEAN [Dyerphonk]', 'pjuUxClcgz0': 'MEAN [Dyerphonk] (30 Minutes)',
    'mFRLMElq2P8': 'Tyrannical Reigner (Synth Rock Remix)', 'jcUidQfPizc': 'Gossiping (Synth Rock Cover)',
    '6H2N7_H0jGs': 'Chad Nerd: Master Debater', 'TrSbtXiRhGQ': 'Orthowave', 'tY7yEatBabY': 'The City of God',
    '-loeektu1gk': 'AmidTheRuins1453 Theme', '3PhwQ5yfbRM': 'On the Shoulders of Giants', 'xWzUZtlup7w': 'On the Shoulders of Giants (Orthodox Christianity and Western Civilization)',
    'bOvGIhoC9W4': 'The Inversion', 'd9CW0IOUcVo': 'Dyerwave Main Theme', 'HsT8Py4Z-qE': 'AI Cities', 'lCtDhJ4Vn2k': 'Dyerwave Theme (Dark Synth Rework)',
    'Vmo4KpB2cGs': 'Jay Dyerwave Theme Song',
}
for a in by('dyerwave'):
    if a['id'] in used: continue
    t = SINGLE_TITLES.get(a['id'], clean(re.sub(r'^Amid The Ruins 1453\s*-\s*', '', a['title'])))
    album(S, 'Singles', t, artist if a['channel'] == 'amidtheruins1453' else a['channel'], [track(a['id'], t)], a['id'], 'vinyl', int(a['date'][:4]))

# --- Fan-made ---------------------------------------------------------------
S = 'Fan-made'
fan = by('fan')
nn = [a for a in fan if a['channel'] == 'Nous Nexus' and a['id'] != 'K-krd_4HNLo']
album(S, 'Nous Nexus', 'Wigzantium Songs', 'Nous Nexus', [track(a['id']) for a in nn], nn[0]['id'])
mm = 'K-krd_4HNLo'
album(S, 'Nous Nexus', 'MEAN MACHINE: The Complete Wigzantium Experience', 'Nous Nexus', segments(mm, [
    ('Mean Machine', '00:00', '04:19'), ('Pope of the Future', '04:20', '07:53'), ('One Bitcoin Minimum 2.0', '07:54', '12:06'),
    ('Unmute Dude', '12:07', '17:07'), ('TAG 2.0', '17:08', '21:11'), ('One Last Time', '21:12', '26:03')]), mm)
mn = [a for a in fan if a['channel'] == 'Mnestheus']
album(S, 'Mnestheus & Polemic Pulse', 'Mnestheus', 'Mnestheus', [track(a['id']) for a in mn], mn[0]['id'])
pp = [a for a in fan if a['channel'] == 'Polemic Pulse']
album(S, 'Mnestheus & Polemic Pulse', 'Polemic Pulse', 'Polemic Pulse', [track(a['id']) for a in pp], pp[0]['id'])
rest = [a for a in fan if a not in nn + mn + pp and a['id'] != mm]
album(S, 'Tributes', 'Fan Tributes', 'Various', [track(a['id']) for a in rest], rest[0]['id'])

# --- The Lord of Spirits: one CD per episode, no box sets (Master Roachi,
# 18 Nov 2026), in episode order. The shelf labels run in 25s by episode
# number: the upload dates cannot group them, since many early episodes were
# uploaded again in 2023.
pods = []
P = sorted([a for a in d['audio'] if a['cat'] == 'podcast'], key=lambda a: a['ep'])
def ep_title(a):
    t = re.sub(r'^(The )?Lord of Spirits\s*[-:]\s*', '', a['title'])
    t = re.sub(r'\s*-\s*Lord of Spirits', '', t)
    return t.strip()
for a in P:
    pods.append({'id': f"lord-of-spirits-{a['ep']}", 'format': 'cd', 'title': ep_title(a), 'year': int(a['date'][:4]),
                 'artist': 'Fr. Andrew Stephen Damick & Fr. Stephen De Young',
                 'section': 'The Lord of Spirits', 'group': f"Episodes {(a['ep'] - 1) // 25 * 25 + 1}–{(a['ep'] - 1) // 25 * 25 + 25}",
                 'colour': ['#2a1f4a', '#1f3a4a', '#4a1f2a', '#1f4a33', '#4a3a1f', '#3a1f4a', '#1f2a4a'][(a['ep'] - 1) // 25 % 7],
                 'cover': f"/wyggzantium/covers/{a['id']}.jpg",
                 'tracks': [{'title': ep_title(a), 'youtube': a['id'], 'credit': credit(a)}]})

# --- Lectures, as box sets ------------------------------------------------
series = {}
lectures = [x for x in d['video'] if x.get('kind') != 'debate']
for x in lectures: series.setdefault(x['series'], []).append(x)
videos = []
def vcredit(x):
    c = credit(x)
    # The same video posted elsewhere: credited too.
    if x.get('also'): c['also'] = [{'name': a['channel'], 'url': a['url']} for a in x['also']]
    return c
def disc(x, strip=''):
    t = clean(x['title'])
    for w in [' - Jay Dyer', 'Jay Dyer', strip]:
        if w: t = t.replace(w, '')
    return {'title': t.strip(' -:|') or clean(x['title']), 'cover': f"/wyggzantium/covers/{x['id']}.jpg", 'video': {'youtube': x['id'], 'credit': vcredit(x)}}
# Every lecture series is one of his Global Elite Books (Master Roachi, 18 Nov 2026).
for s_, parts in series.items():
    parts.sort(key=lambda x: x['part'])
    videos.append({'id': 'box-' + re.sub(r'[^a-z0-9]+', '-', s_.lower()).strip('-'), 'title': s_, 'year': int(parts[0]['date'][:4]),
                   'section': 'Jay Dyer', 'group': 'Global Elite Books', 'colour': PAL[len(videos) % len(PAL)], 'format': 'dvd', 'by': 'Jay Dyer',
                   'subtitle': f"{len(parts)} {'lecture' if len(parts) == 1 else 'lectures'}",
                   'cover': f"/wyggzantium/covers/{parts[0]['id']}.jpg", 'discs': [disc(x) for x in parts]})

# --- Debates: each debater's in his own section, a box to a topic -- not a
# year -- with his call-in livestreams a topic of their own (Master Roachi,
# 18 Nov 2026). The topic is the catalogue's `topic`. Inside a box, oldest
# first; past twelve discs a topic runs to a second volume.
DEBATE_PER_BOX = 12
TOPICS = ['Atheism and the Existence of God', 'Evolution', 'Islam', 'The Trinity, Unitarians and Mormons',
          'Judaism and Hebrew Roots', 'Rome and the Papacy', 'Protestantism', 'Pagans, Gnostics and the Esoteric',
          'Politics and Society', 'Other debates', 'Call-in livestreams']
debaters = {}
for x in d['video']:
    if x.get('kind') == 'debate': debaters.setdefault(x['series'].replace('Debates: ', ''), []).append(x)
for who, ds in debaters.items():
    unknown = {x['topic'] for x in ds} - set(TOPICS)
    assert not unknown, (who, unknown)
    for topic in TOPICS:
        items = sorted([x for x in ds if x['topic'] == topic], key=lambda x: (x['date'], x['part']))
        chunks = [items[i:i + DEBATE_PER_BOX] for i in range(0, len(items), DEBATE_PER_BOX)]
        for n, ch in enumerate(chunks):
            vol = f', Vol. {n + 1}' if len(chunks) > 1 else ''
            span = f"{ch[0]['date'][:4]}–{ch[-1]['date'][:4]}" if ch[0]['date'][:4] != ch[-1]['date'][:4] else ch[0]['date'][:4]
            videos.append({'id': 'debates-' + re.sub(r'[^a-z0-9]+', '-', (who + ' ' + topic).lower()).strip('-') + f'-{n + 1}',
                           'title': topic + vol, 'year': int(ch[0]['date'][:4]), 'section': who, 'group': 'Debates',
                           'colour': PAL[len(videos) % len(PAL)], 'format': 'dvd', 'by': who,
                           'subtitle': f"{len(ch)} {'debate' if len(ch) == 1 else 'debates'}, {span}",
                           'cover': f"/wyggzantium/covers/{ch[0]['id']}.jpg", 'discs': [disc(x) for x in ch]})
# Jay Dyer's debates stand next to his lectures, in his own section.
order = list(dict.fromkeys(x['section'] for x in videos))
videos.sort(key=lambda v: order.index(v['section']))

old = json.load(open(prev))
# --- Books: from the catalogue's `books`, each with its source and licence
# there; the wall gets the Book fields (lib/library.ts). The Church Fathers,
# the three sets in their volumes, from Master Roachi's library (18 Nov 2026).
books = [{'id': b['id'], 'title': b['title'], 'author': b['editors'], 'colour': b['colour'], 'pages': b['pages'],
          'height': b['height'], 'section': 'The Church Fathers', 'group': b['set'],
          **({'text': f"/wyggzantium/texts/{b['id']}.txt.gz"} if os.path.exists(f"public/wyggzantium/texts/{b['id']}.txt.gz") else {})}
         for b in sorted(d.get('books', []), key=lambda b: (b['set'] != 'Ante-Nicene Fathers', b['set'], b['volume']))]

lib = {'fill': False, 'music': albums, 'podcasts': pods, 'videos': videos, 'books': books, 'gallery': old.get('gallery', [])}
json.dump(lib, open(out, 'w'), indent=2, ensure_ascii=False)
covers = sorted({a['cover'].split('/')[-1][:-4] for a in albums + pods + videos} | {x['cover'].split('/')[-1][:-4] for v in videos for x in v['discs']})
open('/tmp/wyggzantium-covers.txt', 'w').write('\n'.join(covers))
print(len(books), 'books;', len([v for v in videos if v['group']=='Debates']), 'debate boxes', sum(len(v['discs']) for v in videos if v['group']=='Debates'), 'debates;', len(albums), 'albums/singles', sum(len(a['tracks']) for a in albums), 'tracks;', len(pods), 'podcast CDs;', len(videos), 'box sets', sum(len(v['discs']) for v in videos), 'discs;', len(covers), 'covers')
for a in albums: print(' ', a['format'], '|', a['section'], '|', a['group'], '|', a['title'], len(a['tracks']))
