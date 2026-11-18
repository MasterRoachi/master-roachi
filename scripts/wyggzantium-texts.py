# The Library of Wyggzantium's readable books: each volume's text, from the
# Christian Classics Ethereal Library's plain-text editions (public domain),
# reflowed and gzipped into public/wyggzantium/texts/<id>.txt.gz.
#
#   python3 -I scripts/wyggzantium-texts.py [cache-dir]
#
# Reads the books in data/wyggzantium-catalogue.json that have a CCEL `link`.
# Downloads go to the cache dir (default /tmp/wyggzantium-ccel) and are reused.
#
# The output is one paragraph to a line, so the page can lay it out to its own
# width (components/library/reader.ts):
#   "# text"  a heading (CCEL sets these at the margin, or two spaces in)
#   "---"     a section rule (CCEL's line of underscores)
#   anything else, a paragraph (CCEL indents these three spaces, wrapped at ~75)
# The CCEL header block above the first rule is dropped: the book's own title
# page is drawn from the catalogue instead.
import gzip, json, os, re, sys, urllib.request

cache = sys.argv[1] if len(sys.argv) > 1 else '/tmp/wyggzantium-ccel'
os.makedirs(cache, exist_ok=True)
out_dir = 'public/wyggzantium/texts'
os.makedirs(out_dir, exist_ok=True)
books = json.load(open('data/wyggzantium-catalogue.json')).get('books', [])

RULE = re.compile(r'^\s*_{10,}\s*$')

def reflow(raw):
    lines = raw.replace('\r', '').split('\n')
    # Drop CCEL's metadata block: everything up to and including the second rule.
    rules = [i for i, l in enumerate(lines[:80]) if RULE.match(l)]
    if len(rules) >= 2: lines = lines[rules[1] + 1:]
    out, block = [], []

    def flush():
        if not block: return
        indent = min(len(l) - len(l.lstrip(' ')) for l in block)
        text = ' '.join(l.strip() for l in block)
        text = re.sub(r'\s{2,}', ' ', text).strip()
        if text:
            out.append(('# ' + text) if indent < 3 else text)
        block.clear()

    for l in lines:
        if RULE.match(l):
            flush()
            if out and out[-1] != '---': out.append('---')
        elif not l.strip():
            flush()
        else:
            block.append(l.rstrip())
    flush()
    while out and out[0] == '---': out.pop(0)
    return '\n'.join(out) + '\n'

total = 0
for b in books:
    link = b.get('link', '')
    m = re.search(r'/ccel/schaff/([a-z0-9]+)/', link)
    if not m: continue
    slug = m.group(1)
    src = os.path.join(cache, slug + '.txt')
    if not os.path.exists(src):
        url = f'https://ccel.org/ccel/s/schaff/{slug}/cache/{slug}.txt'
        with urllib.request.urlopen(url, timeout=180) as r, open(src + '.part', 'wb') as f:
            f.write(r.read())
        os.replace(src + '.part', src)
    text = reflow(open(src, encoding='utf-8', errors='replace').read())
    dst = os.path.join(out_dir, b['id'] + '.txt.gz')
    # CCEL has some volumes only as scans: their text is a run of "Image of
    # page iv" lines (ANF X, the bibliography and index, is one). Those get no
    # text file, and the book on the wall is left without one.
    images = len(re.findall(r'^Image of page ', text, re.M))
    if images > 0.5 * text.count('\n'):
        if os.path.exists(dst): os.remove(dst)
        print(f"{b['id']:10} skipped: CCEL has only page images ({images})")
        continue
    # mtime=0, so an unchanged text gives an unchanged file.
    with open(dst, 'wb') as raw_out, gzip.GzipFile(fileobj=raw_out, mode='wb', compresslevel=9, mtime=0) as f:
        f.write(text.encode('utf-8'))
    size = os.path.getsize(dst)
    total += size
    print(f"{b['id']:10} {len(text) // 1024:6} KB text  {size // 1024:5} KB gz")
print(f'{total / 1e6:.1f} MB in {out_dir}')
