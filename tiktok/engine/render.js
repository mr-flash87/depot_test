// Usage: node engine/render.js episodes/<date> [--preview t1,t2,...]
// Needs in the episode folder: episode.json, words.json, voice.mp3
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const FPS = 30;
const dir = path.resolve(process.argv[2]);
const previewArg = process.argv.indexOf('--preview');
const fmtArg = process.argv.indexOf('--format');
const FORMAT = fmtArg > -1 ? process.argv[fmtArg + 1] : '9x16';
const SIZES = { '9x16': [1080, 1920], '4x5': [1080, 1350], '1x1': [1080, 1080], '16x9': [1920, 1080] };
const [VW, VH] = SIZES[FORMAT];
const root = path.resolve(__dirname, '..');

const episode = JSON.parse(fs.readFileSync(path.join(dir, 'episode.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(dir, 'words.json'), 'utf8'));
const voice = path.join(dir, 'voice.mp3');
const duration = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voice]).toString()) + 0.8;

// per-frame loudness (0..1) for the avatar's reaction
function levels() {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', voice, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  const s = new Int16Array(raw.buffer, raw.byteOffset, raw.length / 2);
  const per = 8000 / FPS, out = [];
  for (let i = 0; i < s.length; i += per) {
    let sum = 0; const end = Math.min(s.length, i + per);
    for (let j = i; j < end; j++) sum += (s[j] / 32768) ** 2;
    out.push(Math.sqrt(sum / Math.max(1, end - i)));
  }
  const max = Math.max(...out) || 1;
  let prev = 0;
  return out.map(v => (prev = prev * 0.5 + Math.min(1, v / max * 2.2) * 0.5));
}

(async () => {
  const avatar = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', episode.template === 'template_dark.html' ? 'avatar.png' : 'avatar_cutout.png')).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, episode.template || 'template.html'));
  const chars = {};
  for (const [k, c] of Object.entries(episode.characters || {}))
    chars[k] = { label: c.label, src: 'data:image/png;base64,' + fs.readFileSync(path.join(root, c.img)).toString('base64') };
  await page.evaluate(d => window.setup(d), { episode, words, levels: levels(), fps: FPS, duration, avatar, chars });
  if (FORMAT !== '9x16') await page.evaluate(({ VW, VH, panel }) => {
    // split layout: the 9:16 stage scaled to full height on the left, branded panel on the right
    const sc = VH / 1920, st = document.getElementById('stage');
    for (const el of [document.documentElement, document.body]) { el.style.width = VW + 'px'; el.style.height = VH + 'px'; }
    Object.assign(st.style, { width: '1080px', height: '1920px', transform: `scale(${sc})`, transformOrigin: '0 0', right: 'auto', bottom: 'auto' });
    const pn = document.createElement('div'); pn.id = 'panel';
    Object.assign(pn.style, { position: 'absolute', top: 0, bottom: 0, right: 0, left: (1080 * sc) + 'px' });
    pn.innerHTML = panel || ''; document.body.appendChild(pn);
  }, { VW, VH, panel: episode.panel });
  await page.evaluate(() => { window.render(1); return document.fonts.ready; });

  if (previewArg > -1) {
    for (const t of process.argv[previewArg + 1].split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(dir, `preview_${FORMAT}_${t}.png`) });
    }
    await browser.close();
    return;
  }

  const out = path.join(dir, (episode.output || 'video.mp4').replace(/\.mp4$/, FORMAT === '9x16' ? '.mp4' : `_${FORMAT}.mp4`));
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-i', voice, '-filter_complex', '[1:a]apad,loudnorm=I=-14:TP=-1.5:LRA=11[a]', '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = Math.ceil(duration * FPS);
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${total}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done ->', out);
})();
