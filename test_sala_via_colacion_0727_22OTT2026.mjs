// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · AUT-0727: via il bottone colación dalla sala (22-ott)
// Richiesta: 🎛 `V32 AUT-0727 VIA IL BOTTONE COLACION SUBITO`. Leggero, come chiesto: nessuna porta alla colación · gli altri motivi di ELIMINAR intatti.
// node test_sala_via_colacion_0727_22OTT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  // le porte: un onclick che apre la colación, in qualunque foglio
  const porte = (SRC.match(/onclick="[^"]*(_dtTipo\(\\'coln\\'\)|_dtoColacion\()/g) || []);
  t('A · nessun bottone apre la colación (foglio nuovo e foglio vecchio ?desc2=0)', porte.length === 0, porte);
  t('A2 · nessun testo «🍱 Colación» resta su un bottone', !/<b>🍱 Colación|c4nm">🍱 Colación/.test(SRC));
  // il foglio nuovo: gli altri motivi ci sono
  for (const [n, re] of [['convenio', /onclick="_dtTipo\(\\'conv\\'\)"/], ['descuento', /onclick="_dtTipo\(\\'dto\\'\)"/], ['familia', /onclick="_dtTipo\(\\'fam\\'\)"/],
    ['otro monto', /onclick="_dtTipo\(\\'otro\\'\)"/], ['un producto', /_dtTipo\(\\'prod\\'\)/]]) t('B · foglio nuovo: ' + n + ' c è ancora', re.test(SRC));
  // il foglio vecchio: gli altri motivi ci sono
  for (const [n, re] of [['20%', /onclick="_dtoPct\(/], ['un producto', /onclick="_dtoProducto\(/], ['otro monto', /onclick="_dtoOtroMonto\(/]]) t('C · foglio vecchio: ' + n + ' c è ancora', re.test(SRC));
  t('D · la versione è bumpata oltre la v3.228.16', /id="ver">sala v3\.228\.(1[7-9]|[2-9]\d) · vetro/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il chip nuovo torna', "        '<button class=\"c4pick\" style=\"margin:5px 0\" onclick=\"_dtTipo(\\'otro\\')\">' +", "        '<button class=\"c4pick\" style=\"margin:5px 0\" onclick=\"_dtTipo(\\'coln\\')\"><span class=\"c4nm\">🍱 Colación</span></button>' +\n        '<button class=\"c4pick\" style=\"margin:5px 0\" onclick=\"_dtTipo(\\'otro\\')\">' +"],
    ['il bottone vecchio torna', "    /* [22-ott · AUT-0727] il bottone «🍱 Colación» del foglio vecchio", "    '<button class=\"opt2\" onclick=\"_dtoColacion(\\'' + esc(mesa) + '\\')\"><b>🍱 Colación · deja en $0</b></button>' +\n    /* [22-ott · AUT-0727] il bottone «🍱 Colación» del foglio vecchio"],
    ['via anche la familia', "onclick=\"_dtTipo(\\'fam\\')\"", "onclick=\"_dtTipo(\\'xx\\')\""],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } const r = banco(ORIG.split(a).join(b), true); /* tutte le occorrenze: un motivo può avere più porte */ console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
