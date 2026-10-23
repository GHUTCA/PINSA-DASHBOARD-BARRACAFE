// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · pezzo 1.5 · corregir senza il ripiego a Google (21-ott)
// Richiesta: 🚚 `MIGRACION V32 1.5 E IL 20 DEI TURNI` ①. Gira la `_corregirAlBorde` VERA di sala.html in vm (fetch finto) + i rami dei due chiamanti.
// node test_sala_corregir_sin_gas_15_21OTT2026.mjs [sala.html]   ·   --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };

async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'async ' + fnVin(SRC, '_corregirAlBorde');
  async function chiama({ on = true, corrborde = true, pin = '', risposta, lancia = false }) {
    const chiamate = [];
    const ctx = { CORR_SIN_GAS_ON: on, CORRBORDE_ON: corrborde, BORDE_SALA: { URL: 'https://b', T: 't' }, CFG: { LOCAL: 'BKS' }, APP_ID: 'sala',
      JSON, Object, encodeURIComponent, setTimeout, clearTimeout, AbortController, _dispositivoId: () => 'dev', _vediNoAsignado: (j) => j,
      fetch: async (u, o) => { chiamate.push({ u, body: JSON.parse(o.body) }); if (lancia) throw new Error('rete'); return { json: async () => risposta }; } };
    vm.createContext(ctx); vm.runInContext(F, ctx);
    try { const r = await vm.runInContext('_corregirAlBorde(' + JSON.stringify({ uuid: 'u1', pin_jl: pin, clase: 'correccion' }) + ')', ctx); return { r, chiamate }; }
    catch (e) { return { lanciato: true, chiamate }; }
  }
  const SCRITTO = { ok: true, scritto: true, corr_uid: 'c1' }, GATE = { ok: true, scritto: false, motivo: 'gate_spento' };
  // leva spenta: com'era
  { const x = await chiama({ on: false, pin: '' }); t('A · leva spenta, senza PIN ⇒ null e NESSUNA chiamata al bordo (com era: va al GAS)', x.r === null && x.chiamate.length === 0, x); }
  { const x = await chiama({ on: false, pin: '1234', risposta: GATE }); t('A2 · leva spenta, gate_spento ⇒ null (va al GAS, com era)', x.r === null, x); }
  { const x = await chiama({ on: false, pin: '1234', lancia: true }); t('A3 · leva spenta, rete morta ⇒ null (va al GAS, com era)', x.r === null && !x.lanciato, x); }
  { const x = await chiama({ on: false, pin: '1234', risposta: SCRITTO }); t('A4 · leva spenta, scritto ⇒ la risposta del bordo', x.r && x.r.scritto === true, x); }
  // leva accesa
  { const x = await chiama({ pin: '', risposta: SCRITTO }); t('B · leva accesa, correzione libera SENZA PIN ⇒ va al bordo', x.chiamate.length === 1 && /\/correccion\/BKS$/.test(x.chiamate[0].u) && x.r.scritto === true, x); }
  { const x = await chiama({ pin: '1234', risposta: GATE }); t('C · leva accesa, gate_spento ⇒ {ok:false, error:borde_cerrado}, MAI null', x.r && x.r.ok === false && x.r.error === 'borde_cerrado', x); }
  { const x = await chiama({ pin: '1234', lancia: true }); t('D · leva accesa, rete morta/timeout ⇒ LANCIA (il chiamante dice «No sé si entró»), mai null', x.lanciato === true, x); }
  { const x = await chiama({ pin: '1234', risposta: { ok: false, error: 'pin_jl_invalido' } }); t('E · un rifiuto con merito passa uguale', x.r && x.r.error === 'pin_jl_invalido', x); }
  { const x = await chiama({ corrborde: false, pin: '1234' }); t('F · freno del telefono ?corrborde=0 ⇒ null (il ritorno dichiarato, anche a leva accesa)', x.r === null && x.chiamate.length === 0, x); }
  // i due chiamanti
  t('G · guardarCorreccion: ramo borde_cerrado che riapre il bottone e non chiude il pannello',
    /\} else if \(r && r\.error === 'borde_cerrado'\) \{[\s\S]{0,200}no se cambió nada[\s\S]{0,80}if \(btn\) btn\.disabled = false;\n\s+return;/.test(fnVin(SRC, 'guardarCorreccion__in')));
  t('G2 · guardarCorreccion: il timeout cade nel catch «No sé si entró» (await dentro il try)', /try \{[\s\S]*const rB = await _corregirAlBorde\(bodyBorde\);[\s\S]*\} catch \(e\) \{[\s\S]*No sé si entró/.test(fnVin(SRC, 'guardarCorreccion__in')));
  t('H · «Un producto»: ramo borde_cerrado prima di _pinErrorPersistente, e il .catch resta', /\} else if \(r && r\.error === 'borde_cerrado'\) \{\n\s+toast\('warn', 'El sistema no recibe correcciones ahora — no se quitó nada[\s\S]{0,120}\} else if \(!_pinErrorPersistente\(r\)\) \{/.test(SRC) && /_corregirAlBorde\(_bodyCorrBorde\)\.then\(function \(rB\) \{[\s\S]{0,4600}\}\)\.catch\(function \(\) \{\n\s+toast\('warn', 'No se pudo confirmar/.test(SRC));
  t('I · leva dal /salud, nasce spenta', /CORR_SIN_GAS_ON = String\(cercaK\(j, 'corregir_sin_gas_on'\)\) === '1';/.test(SRC) && /var CORR_SIN_GAS_ON = false;/.test(SRC));
  t('J · solo due chiamanti di _corregirAlBorde (entrambi con catch)', (SRC.match(/_corregirAlBorde\(/g) || []).length === 3);
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['senza PIN resta fuori anche a leva accesa', "if (!bodyBorde.pin_jl && !CORR_SIN_GAS_ON) return null;", "if (!bodyBorde.pin_jl) return null;"],
    ['gate_spento torna null a leva accesa', "return CORR_SIN_GAS_ON ? { ok: false, error: 'borde_cerrado' } : null;", 'return null;'],
    ['il timeout non lancia', 'if (CORR_SIN_GAS_ON) throw e;', ''],
    ['la leva non si legge', "CORR_SIN_GAS_ON = String(cercaK(j, 'corregir_sin_gas_on')) === '1';", ''],
    ['borde_cerrado non riapre il bottone', "no se cambió nada. Reintenta o avisa al JL');\n      if (btn) btn.disabled = false;", "no se cambió nada. Reintenta o avisa al JL');"],
    ['il freno del telefono ignorato', '  if (!CORRBORDE_ON) return null;\n  /* [24-set]', '  /* [24-set]'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.replace(a, b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
