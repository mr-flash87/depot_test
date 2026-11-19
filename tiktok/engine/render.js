// Usage: node engine/render.js episodes/<date> [--preview t1,t2,...]
// Needs in the episode folder: episode.json, words.json, voice.mp3
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const FPS = 30;
const dir = path.resolve(process.argv[2]);
const previewArg = process.argv.indexOf('--preview');
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
  const avatar = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', 'avatar.png')).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'template.html'));
  await page.evaluate(d => window.setup(d), { episode, words, levels: levels(), fps: FPS, duration, avatar });
  await page.evaluate(() => document.fonts.ready);

  if (previewArg > -1) {
    for (const t of process.argv[previewArg + 1].split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(dir, `preview_${t}.png`) });
    }
    await browser.close();
    return;
  }

  const out = path.join(dir, episode.output || 'video.mp4');
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
