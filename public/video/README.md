# Carousel footage

The pursuit carousel on the homepage plays a background clip behind each panel.
Neither file is committed — drop them in here and they appear:

| File | Panel | Content |
| --- | --- | --- |
| `orthodoxy.mp4` | Foundations | Icons, liturgy, candlelight, architecture |
| `gaming.mp4` | Fun | Gaming and anime montage |

Nothing breaks without them. A missing file errors, the component strips the
`<video>`, and the panel falls back to its gradient — which is what the site
does today.

## What to aim for

These sit under a heavy black overlay and behind text, so they are atmosphere,
not the subject. Loud footage fights the copy and loses.

- **Under 6 seconds, seamlessly looping.** A visible cut is more distracting
  than no video at all.
- **Under 3 MB each**, ideally nearer 1.5. Two autoplaying clips can easily
  outweigh everything else on the page put together, and this is a personal
  site people may open on mobile data.
- **720p is plenty.** The clip is heavily darkened and partly covered; 1080p
  buys nothing visible and costs double.
- **No audio track.** It is muted anyway, so an audio stream is pure weight.
- **Slow movement.** Drifting or long takes read as atmosphere; fast cuts
  under text read as chaos.

## Compressing

With ffmpeg installed:

```bash
ffmpeg -i source.mp4 -t 6 -an -vf "scale=1280:-2,fps=24" \
  -c:v libx264 -crf 30 -preset slow -movflags +faststart \
  public/video/gaming.mp4
```

`-an` strips audio, `-crf 30` is aggressive but fine under an overlay, and
`+faststart` lets playback begin before the whole file has arrived.

Check the result: `ls -lh public/video/`. If either file is over about 3 MB,
raise the `-crf` number until it is not.

## A note on the source

Use footage you have the right to use. Anime and game capture are somebody
else's work, and a montage of it on a site that links to a merch store is the
kind of thing rights holders act on. Your own gameplay capture is safer ground
than clips lifted from elsewhere.
