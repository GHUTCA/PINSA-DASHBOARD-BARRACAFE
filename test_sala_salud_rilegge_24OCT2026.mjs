// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la sala rilegge /salud (24-oct)
// Perché: `TERZA V32 LE PORTE DELLA SALA VERSO GOOGLE` §E — una leva accesa non raggiungeva i telefoni già aperti (clockIn ~117 sul GAS dopo le 17:33).
// Gira `_saludLeggi` e `_saludProgramma` VERI in vm, con un /salud finto che cambia fra una lettura e l'altra.
// node test_sala_salud_rilegge_24OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const corpo = fnVin(SRC, '_saludLeggi');
  const nomi = [...new Set([...corpo.matchAll(/\b([A-Z][A-Z0-9_]{2,})\b\s*=(?!=)/g)].map((x) => x[1]))];
  function mondo(qs = '') {
    let salud = { ok: true, flags: { clockin_vetro_borde_on: '0' } };
    const L = { iv: [], cleared: 0, fetch: 0, vis: null };
    const ctx = { JSON, String, Number, parseFloat, parseInt, Math, Object, Array, Date, Promise, QS: new URLSearchParams(qs),
      BORDE_SALA: { URL: 'https://b' }, CFG: { LOCAL: 'BKS' }, localStorage: { setItem() {}, getItem() { return null; } },
      _pintarGuardiaBadge() {}, BORDE_FALLBACK_TEL: false, YAPAG3_TEL: false, DTO_MAX_PCT: 30,
      fetch: async () => { L.fetch++; return { json: async () => JSON.parse(JSON.stringify(salud)) }; },
      setInterval: (f, ms) => { L.iv.push({ f, ms }); return L.iv.length; }, clearInterval: () => { L.cleared++; },
      document: { hidden: false, addEventListener: (ev, f) => { if (ev === 'visibilitychange') L.vis = f; } } };
    for (const n of nomi) if (!(n in ctx)) ctx[n] = null;
    const cercaK = 'var cercaK = function (o, k) { if (!o || typeof o !== "object") return null; if (k in o) return o[k]; for (const x in o) { const w = cercaK(o[x], k); if (w != null) return w; } return null; };\n';
    const S2 = SRC.slice(SRC.indexOf('var SALUD_RILEGGE_ON'), SRC.indexOf('\n_saludLeggi();\n', SRC.indexOf('function _saludLeggi(')));
    vm.createContext(ctx); vm.runInContext(cercaK + S2.replace('const SALUD_RILEGGE_MS', 'var SALUD_RILEGGE_MS'), ctx);
    const leggi = async () => { vm.runInContext('_saludLeggi()', ctx); await vm.runInContext('SALUD_LEVE_P', ctx); };
    return { ctx, L, leggi, set: (f) => { salud = { ok: true, flags: f }; }, raw: (o) => { salud = o; } };
  }
  { const w = mondo(); await w.leggi();
    t('A · leva assente: una lettura sola, nessun giro (il vetro di ieri)', w.L.fetch === 1 && w.L.iv.length === 0 && w.ctx.SALUD_RILEGGE_ON === false, w.L); }
  { const w = mondo(); w.set({ clockin_vetro_borde_on: '0', sala_salud_rilegge_on: '1' }); await w.leggi();
    t('B · leva accesa: si programma il giro ogni 3 minuti', w.L.iv.length === 1 && w.L.iv[0].ms === 180000 && w.ctx.CLOCKIN_VETRO_ON === false, w.L.iv);
    w.set({ clockin_vetro_borde_on: '1', sala_salud_rilegge_on: '1' }); w.L.iv[0].f(); await w.ctx.SALUD_LEVE_P;
    t('C · IL CASO DI STANOTTE: la leva del clockIn accesa DOPO il caricamento arriva al telefono aperto al giro dopo', w.ctx.CLOCKIN_VETRO_ON === true && w.L.fetch === 2 && w.L.iv.length === 1, { cl: w.ctx.CLOCKIN_VETRO_ON, f: w.L.fetch });
    w.set({ clockin_vetro_borde_on: '0', sala_salud_rilegge_on: '1' }); w.L.iv[0].f(); await w.ctx.SALUD_LEVE_P;
    t('D · e anche il FRENO: la leva tirata arriva al giro dopo, senza ricaricare', w.ctx.CLOCKIN_VETRO_ON === false);
    w.L.vis(); await w.ctx.SALUD_LEVE_P;
    t('E · al ritorno in primo piano si rilegge subito', w.L.fetch === 4, w.L.fetch);
    w.set({ clockin_vetro_borde_on: '1', sala_salud_rilegge_on: '1' }); w.L.iv[0].f(); await w.ctx.SALUD_LEVE_P;
    w.raw({ ok: false, error: 'worker' }); w.L.iv[0].f(); await w.ctx.SALUD_LEVE_P;
    t('S1 · una rilettura {ok:false} NON spegne le leve e NON ferma il giro (💵)', w.ctx.CLOCKIN_VETRO_ON === true && w.ctx.SALUD_RILEGGE_ON === true && w.L.cleared === 0, { cl: w.ctx.CLOCKIN_VETRO_ON, re: w.ctx.SALUD_RILEGGE_ON });
    w.raw({ ok: true, flags: { clockin_vetro_borde_on: '0' } }); w.L.iv[0].f(); await w.ctx.SALUD_LEVE_P;
    t('S3 · una rilettura monca (senza la chiave della leva) è ignorata', w.ctx.CLOCKIN_VETRO_ON === true && w.L.cleared === 0);
    w.set({ clockin_vetro_borde_on: '1', sala_salud_rilegge_on: '0' }); w.L.iv[0].f(); await w.ctx.SALUD_LEVE_P;
    t('F · la leva della rilettura spenta dal bordo col "0": il giro si ferma', w.L.cleared === 1 && w.ctx.SALUD_RILEGGE_ON === false); }
  { const w = mondo(); w.raw({ ok: false, error: 'worker' }); await w.leggi();
    t('A2 · la PRIMA lettura resta quella di ieri anche con {ok:false} (nessuna leva accesa, nessun giro)', w.L.iv.length === 0 && w.ctx.CLOCKIN_VETRO_ON === false); }
  { const w = mondo('saludre=0'); w.set({ sala_salud_rilegge_on: '1' }); await w.leggi();
    t('G · ?saludre=0 ferma il giro su quell apparecchio', w.L.iv.length === 0); }
  t('H · la prima lettura parte da sola al caricamento, come prima', /\n_saludLeggi\(\);\n/.test(SRC) && !/\(function \(\) \{\n  try \{\n    if \(!BORDE_SALA \|\| !BORDE_SALA\.URL\) return;\n    SALUD_LEVE_P/.test(SRC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la leva della rilettura non si legge', "      SALUD_RILEGGE_ON = String(cercaK(j, 'sala_salud_rilegge_on')) === '1';", ''],
    ['il giro non si programma', '    if (!_SALUD_IV) _SALUD_IV = setInterval(_saludLeggi, SALUD_RILEGGE_MS);', ''],
    ['il giro non si ferma', '  } else if (_SALUD_IV) { clearInterval(_SALUD_IV); _SALUD_IV = null; }', '  }'],
    ['la rilettura monca o ok:false applicata', "      if (_SALUD_N++ > 0 && (!j || j.ok === false || cercaK(j, 'sala_salud_rilegge_on') == null)) return;", ''],
    ['il freno del telefono ignorato', "SALUD_RILEGGE_ON && QS.get('saludre') !== '0'", 'SALUD_RILEGGE_ON'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
