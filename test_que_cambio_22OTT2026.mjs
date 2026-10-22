// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la pagina «Qué cambió» e i suoi due ingressi (22-oct)
// Richiesta: 🎛 `V32 INSTRUCTIVO NADIE NOS DIJO E L EMBAJADOR PRIMA`. Leggero: la pagina esiste e si apre a un tocco da sala e app_jl,
// ogni riga ha la sua data, e le righe dicono ciò che il vetro fa (i controlli incrociati più sotto). La rilettura vera è di 🖐 QUARTA.
// node test_que_cambio_22OTT2026.mjs · --mutanti
import fs from 'node:fs';
const R = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const ORIG = { qc: R('que_cambio.html'), sala: R('sala.html'), jl: R('app_jl.html') };
function banco(S, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  t('A · la sala apre la pagina con un tocco (bottone in fondo)', /onclick="window\.open\('que_cambio\.html','_blank','noopener'\)">🆕 Qué cambió<\/button>/.test(S.sala));
  t('B · l app del JL la apre dall uscita in fondo a ogni scheda', /function _salidaHtml\(\) \{\n  return '<a class="salir" href="que_cambio\.html"/.test(S.jl));
  t('C · la pagina ha la sua versione e la classe di device', /<span id="ver">que_cambio v\d+\.\d+<\/span>/.test(S.qc) && /DEVICE-CLASS: 3/.test(S.qc));
  const giorni = (S.qc.match(/<div class="dia">/g) || []).length, cambi = (S.qc.match(/<div class="cambio/g) || []).length;
  t('D · ogni cambio sta sotto un giorno (nessun cambio prima della prima data)', giorni >= 1 && S.qc.indexOf('<div class="dia">') < S.qc.indexOf('<div class="cambio'), { giorni, cambi });
  // le righe contro il vetro: ciò che la pagina promette deve esistere
  t('E · «Invitado ALE −40%» esiste nei motivi della sala', /n: 'Invitado ALE',\s+pct: 40/.test(S.sala) && /Invitado ALE/.test(S.qc));
  t('F · la colación non ha più bottone in sala', !/onclick="[^"]*_dtTipo\(\\'coln\\'\)/.test(S.sala) && /colación no se registra desde la sala/.test(S.qc));
  t('G · «➗ Dividir» esiste nel mixto della sala', /➗ Dividir/.test(S.sala) && /➗ Dividir/.test(S.qc));
  t('H · il recuadro del TOTAL DEL VOUCHER esiste in sala', /TOTAL DEL VOUCHER/.test(S.sala) && /total del voucher/i.test(S.qc));
  t('I · i motivi di sconto della pagina sono quelli della sala (10 · 10 · 10 · 20 · 40)', /'Atraso cocina',\s+pct: 10/.test(S.sala) && /'Otro reclamo',\s+pct: 20/.test(S.sala) && /−10%/.test(S.qc) && /−20%/.test(S.qc));
  t('J · la pagina rimanda alla guida del cobro', /href="guia_turno\.html"/.test(S.qc));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['senza bottone in sala', 'sala', `<button class="fbig" onclick="window.open('que_cambio.html','_blank','noopener')">🆕 Qué cambió</button>`, ''],
    ['senza ingresso nell app del JL', 'jl', `  return '<a class="salir" href="que_cambio.html"`, `  return '<a class="salir" href="x.html"`],
    ['la pagina promette una cosa che la sala non ha', 'sala', "  { k: 'invitado_ale',     n: 'Invitado ALE',      pct: 40 }", "  { k: 'xx', n: 'X', pct: 1 }"],
  ];
  let m = 0; for (const [n, f, a, b] of M) { if (!ORIG[f].includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } const S = Object.assign({}, ORIG); S[f] = S[f].split(a).join(b); const r = banco(S, true); console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
