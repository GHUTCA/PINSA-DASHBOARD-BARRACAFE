// BANCO · TERZA PENNA V32 · OGNI <script> INLINE DEI VETRI COMPILA (28-ott)
// Reperto: `TERZA V32 LA SALA 59 NON COMPILA` — la .58 e la .59 avevano lo script principale rotto (un commento `//` a metà riga si mangiava il resto)
// e nessuno entrava nel turno. Tutti i banchi estraevano funzioni (`fnVin`): nessuno compilava la pagina intera. Questo sì, e prima di ogni altro.
// node test_vetri_compilano_28OCT2026.mjs [file.html ...] · --mutanti   (senza argomenti: i vetri del servizio)
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const VETRI = ['sala.html', 'app_jl.html', 'anfitriona.html', 'kds.html', 'que_cambio.html', 'mesero.html', 'menu.html'];
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = args.length ? args : VETRI.map((f) => path.join(AQUI, f)).filter((f) => fs.existsSync(f));
// gli <script> inline classici (niente src, niente type=module/json): sono quelli che il browser compila come script
function errori(html) {
  const out = []; const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi; let m, i = 0;
  while ((m = re.exec(html))) {
    const attr = m[1] || ''; i++;
    if (/\bsrc\s*=/i.test(attr) || /type\s*=\s*["']?(module|application\/(ld\+)?json|text\/template)/i.test(attr)) continue;
    try { new vm.Script(m[2], { filename: 'script' + i }); } catch (e) { out.push('script ' + i + ': ' + String(e.stack || e).split('\n').slice(0, 2).join(' | ').slice(0, 220)); }
  }
  return { out, n: i };
}
if (process.argv.includes('--mutanti')) {
  // la prova che il banco vede ciò che deve vedere: la forma esatta del 28 (commento a metà riga) e una parentesi persa
  const base = '<script>\nfunction a(){ return 1; }\nPromise.resolve().then(function(r){ a(); }).catch(function(){});\nif (a()) a();\n</script>';
  const M = [
    ['commento a metà riga (il 28-ott)', base.replace('.then(function(r)', '.then(   // commento function(r)')],
    ['parentesi persa', base.replace('return 1; }', 'return 1;')],
  ];
  let m = 0; if (errori(base).out.length) { console.log('✗ la base pulita non compila'); process.exit(1); }
  for (const [n, h] of M) { const r = errori(h).out.length > 0; console.log((r ? '☠ muore  ' : '😐 VIVE   ') + n); if (r) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else {
  let ko = 0, ok = 0;
  for (const f of files) {
    const { out, n } = errori(fs.readFileSync(f, 'utf8'));
    if (out.length) { ko++; console.log('✗ ' + path.basename(f) + ' (' + n + ' script)\n   ' + out.join('\n   ')); } else { ok++; console.log('✓ ' + path.basename(f) + ' · ' + n + ' script, tutti compilano'); }
  }
  if (!files.length) { console.log('✗ nessun vetro trovato'); ko = 1; }
  console.log('\n' + (ko ? '🔴 ' + ko + ' vetri NON compilano' : '🟢 ' + ok + ' vetri, tutti compilano')); process.exitCode = ko ? 1 : 0;
}
