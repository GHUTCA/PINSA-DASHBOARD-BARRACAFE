// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · un sì del GAS non diventa due corti (23-oct)
// Reperto: 🎛 BKP `BKP V32 IL CORTE DI ARIANNA E CHIUSO DUE VOLTE NON RIPROVARE` (CM-261023-5IVI 19:19 + LNRI 19:20).
// Gira `cierreEnviar` · `cierreAbrir` (solo l'ingresso) · `_cieUid` · `_cieOk*` · `_cieYaCerraste` VERI in vm, col GAS finto che dice sì e il riepilogo che lancia.
// node test_sala_corte_no_doble_23OCT2026.mjs [sala.html] · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const FILE = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || new URL('./sala.html', import.meta.url);
const ORIG = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
const fnRiga = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n', i) + 1); };
async function banco(SRC, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = 'async ' + fnVin(SRC, 'cierreEnviar') + fnVin(SRC, '_cieUid') + fnRiga(SRC, '_cieUidKey') + fnRiga(SRC, '_cieOkKey') + fnRiga(SRC, '_cieOkSegna') +
    fnVin(SRC, '_cieOkRecente') + fnVin(SRC, '_cieYaCerraste') + fnRiga(SRC, '_cieDeNuevo') +
    (SRC.includes('function _cieDuda(') ? fnVin(SRC, '_cieDuda') + 'async ' + fnVin(SRC, '_cieDudaMira') : '');
  function mondo({ guardia = true, paso4Lancia = true, timeout = false, mira = 'ya' } = {}) {
    const LS = {}; const L = { gas: 0, render: [], toast: [], abrir: 0 };
    let now = Date.parse('2026-10-23T19:19:00-03:00');
    const ctx = { JSON, String, Math, Object, Number, Date: Object.assign(function (x) { return new globalThis.Date(x == null ? now : x); }, { now: () => now }),
      localStorage: { getItem: (k) => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); }, removeItem: (k) => { delete LS[k]; } },
      STATE: { codigo: '3805', nombre: 'Arianna' }, CIE: { paso: 2, data: null, uid: '', uidMonto: null, motivo: '', enviando: false, res: null, tol: 2000, franja: 'dia' },
      CIE_GUARDIA_ON: guardia, CIE_OK_MS: 15 * 60000, CORTE_BORDE_ON: true, CAJA_ATTO1_ON: true, CORTE_TRAS_BORDE_ON: false, SALDO_SIN_PADRON_ON: false,
      _fechaOpJS: () => '2026-10-23', _slugSalaJS: (s) => String(s).toLowerCase(), _cieMontoValor: () => 0, esc: (s) => String(s), fmtPrice: (n) => '$' + n,
      $: () => ({ disabled: false, textContent: '' }), toast: (k, s) => L.toast.push([k, s]), _cieRender: (h) => L.render.push(h), bordeHecho: () => {},
      _cerrarMeseroAlBorde: async () => null, CIE_DUDA_MS: 30, setTimeout, setInterval, clearInterval,
      gasPost: async (act, body) => {
        if (act === 'getCierreMesero') { L.mira = (L.mira || 0) + 1; if (mira === 'muto') throw new Error('rete'); if (mira === 'ya') return { ok: true, ya_cerrado: { declarado: 0, id: 'CM-261023-5IVI', ts: new globalThis.Date(now).toISOString() } };
          if (mira === 'am') return { ok: true, ya_cerrado: { declarado: 0, id: 'CM-261023-AM01', ts: new globalThis.Date(L.amTs || (now - 5 * 3600000)).toISOString() } };
          return { ok: true, ya_cerrado: null }; }
        L.gas++; (L.uids = L.uids || []).push(body.uid); if (timeout === true && L.gas === 1) throw new Error('AbortError'); if (typeof timeout === 'number' && L.gas === timeout) throw new Error('AbortError'); if (L.gas === 1) L.amTs = now; return { ok: true, id: 'CM-261023-' + (L.gas === 1 ? '5IVI' : 'LNRI'), mesero: 'Arianna' }; },
      _ciePaso4: () => { if (paso4Lancia) throw new TypeError('x.map is not a function'); L.render.push('PASO4'); }, _ciePaso4Dedup: () => {}, _ciePaso3Motivo: () => {}, _cieSaldo: () => {},
      cierreAbrir: () => { L.abrir++; } };
    ctx.CIE.pasarMesas = true;   // come Arianna: mesas da passare ⇒ il GAS
    vm.createContext(ctx); vm.runInContext(F, ctx);
    return { ctx, L, LS, invia: () => vm.runInContext('cierreEnviar()', ctx), avanza: (ms) => { now += ms; } };
  }
  // A · la scena di Arianna: il GAS dice sì, il riepilogo lancia
  { const w = mondo({ mira: 'no' }); await w.invia();   // il libro «no»: se il riepilogo uscisse dal try, si vedrebbe «no quedó guardado»
    t('A1 · il sì del GAS con il riepilogo che lancia: «Ya cerraste», mai «No entró — reintenta»', w.L.gas === 1 && w.L.render.some((h) => /Ya cerraste tu turno/.test(h) && /CM-261023-5IVI/.test(h)) && !w.L.toast.some((x) => /reintenta/.test(x[1])), w.L);
    w.ctx.CIE.paso = 2; w.avanza(60000); await w.invia();
    t('A2 · il secondo tocco un minuto dopo (le 19:20 di Arianna): NESSUN secondo corte, la schermata «Ya cerraste»', w.L.gas === 1 && w.L.render.filter((h) => /Ya cerraste/.test(h)).length === 2, w.L);
    w.avanza(16 * 60000); w.ctx.CIE.paso = 2; await w.invia();
    t('A3 · dopo 15 minuti un corte nuovo si può (il secondo turno del giorno)', w.L.gas === 2, w.L.gas); }
  // B · «contaste mal — cerrar de nuevo» è una scelta esplicita e passa
  { const w = mondo(); await w.invia(); vm.runInContext('_cieDeNuevo()', w.ctx); w.ctx.CIE.paso = 2; await w.invia();
    t('B · «cerrar de nuevo» riapre il flusso e il corte nuovo entra (una dichiarazione nuova, voluta)', w.L.abrir === 1 && w.L.gas === 2 && w.ctx.CIE.deNuevo === false, w.L); }
  // C · il riepilogo che non lancia: si vede come ieri
  { const w = mondo({ paso4Lancia: false }); await w.invia();
    t('C · senza eccezione il riepilogo è quello di sempre (_ciePaso4)', w.L.render.includes('PASO4') && !w.L.render.some((h) => /Ya cerraste/.test(h))); }
  // D · ?cieg=0: il comportamento di ieri (il «prima», misurato)
  { const w = mondo({ guardia: false }); let err = null; try { await w.invia(); } catch (e) { err = e; }
    w.ctx.CIE.paso = 2; w.avanza(60000); try { await w.invia(); } catch (e) {}
    t('D · il PRIMA, a guardia spenta: «No entró — reintenta» e un SECONDO corte al secondo tocco (5IVI + LNRI)', w.L.toast.some((x) => /No entró — reintenta/.test(x[1])) && w.L.gas === 2, w.L); }
  // G · la scena VERA di Arianna (💵 G2): timeout di cerrarMesero, stesso uid. Il vetro non dice «reintenta»: aspetta e chiede al libro
  { const w = mondo({ timeout: true, mira: 'ya' }); const p = w.invia(); await new Promise((r) => setTimeout(r, 5)); w.ctx.CIE.paso = 2; await w.invia();
    const durante = w.L.gas; await p;
    t('G1 · timeout: «Puede que haya entrado», e un tocco durante l attesa NON manda niente', w.L.render.some((h) => /Puede que haya entrado/.test(h)) && durante === 1 && !w.L.toast.some((x) => /reintenta/.test(x[1])), w.L);
    t('G2 · il libro ha il corte (stesso importo): «Ya cerraste 5IVI», chiave bruciata, UN solo cerrarMesero', w.L.mira === 1 && w.L.gas === 1 && w.L.render.some((h) => /Ya cerraste/.test(h) && /5IVI/.test(h)) && !w.LS['sala_cieuid_2026-10-23_arianna'], w.L);
    w.ctx.CIE.paso = 2; await w.invia(); t('G3 · e dopo, un altro tocco: niente (il segno vale 15 min)', w.L.gas === 1); }
  { const w = mondo({ timeout: true, mira: 'no' }); await w.invia(); const u1 = (w.L.uids || [])[0];
    t('G4 · il libro NON ha il corte: «Intentar de nuevo»', w.L.render.some((h) => /no quedó guardado/.test(h) && /Intentar de nuevo/.test(h)), w.L.render.slice(-1));
    await w.invia(); t('G5 · il nuovo tentativo porta la STESSA chiave (il GAS fa dedup se il primo entra tardi)', w.L.gas === 2 && w.L.uids[1] === u1, w.L.uids); }
  { const w = mondo({ timeout: true, mira: 'muto' }); await w.invia();
    t('G6 · il libro non risponde: «No sabemos si entró — pregúntale al JL»', w.L.render.some((h) => /No sabemos si entró/.test(h) && /Pregúntale al JL/.test(h)) && w.L.gas === 1, w.L.render.slice(-1)); }
  { const w = mondo({ timeout: true, guardia: false }); try { await w.invia(); } catch (e) {} w.ctx.CIE.paso = 2; try { await w.invia(); } catch (e) {}
    t('G7 · il PRIMA (guardia spenta): «reintenta» e il secondo cerrarMesero col MEDESIMO uid (la forma del libro: 9 in 13 giorni)', w.L.toast.some((x) => /No entró — reintenta/.test(x[1])) && w.L.gas === 2 && w.L.uids[0] === w.L.uids[1], w.L.uids); }
  // G8 · [💵 EL GIRO] il corte AM a $0 del mattino NON chiude il PM a $0 andato in timeout
  { const w = mondo({ timeout: true, mira: 'am' }); await w.invia();
    t('G8 · il libro ha solo il corte AM (vecchio, stesso importo $0): NON «Ya cerraste», ma «no quedó guardado» e la chiave resta', !w.L.render.some((h) => /Ya cerraste/.test(h)) && w.L.render.some((h) => /no quedó guardado/.test(h)) && !!w.LS['sala_cieuid_2026-10-23_arianna'], w.L.render.slice(-1)); }
  // G9 · AM entrato col sì, quattro ore dopo il PM va in timeout: l'ora del primo invio NON si eredita dall'AM (③)
  { const w = mondo({ timeout: 2, mira: 'am', paso4Lancia: false }); await w.invia();
    w.avanza(4 * 3600000); w.ctx.CIE.paso = 2; await w.invia();
    t('G9 · il PM in timeout dopo un AM entrato: «no quedó guardado», mai «Ya cerraste» con l id dell AM', w.L.gas === 2 && !w.L.render.some((h) => /Ya cerraste/.test(h) && /AM01/.test(h)) && w.L.render.some((h) => /no quedó guardado/.test(h)), w.L.render.slice(-2)); }
  t('E · cierreAbrir guarda il segno prima di ricominciare', /\{ const _ok = CIE\.deNuevo \? null : _cieOkRecente\(\); if \(_ok\) \{ _cieYaCerraste\(_ok\); return; \} \}   \/\/ \[23-ott\] un corte di pochi minuti fa/.test(fnVin(SRC, 'cierreAbrir')));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['il riepilogo fuori dal try', "        try { if (r.dedup) _ciePaso4Dedup(r); else _ciePaso4(r); }\n        catch (eP) {", "        { if (r.dedup) _ciePaso4Dedup(r); else _ciePaso4(r); }\n        if (0) {"],
    ['il segno non nasce', "      if (CIE_GUARDIA_ON) { _cieOkSegna(r); CIE.deNuevo = false; }", ''],
    ['il secondo tocco non guarda il segno', "  { const _ok = CIE.deNuevo ? null : _cieOkRecente(); if (_ok) { _cieYaCerraste(_ok); return; } }   // [23-ott] il secondo tocco dopo un sì", ''],
    ['il segno non scade', '(o && o.ts && Date.now() - o.ts < CIE_OK_MS)', '(o && o.ts)'],
    ['il timeout torna a dire reintenta', "    if (CIE_GUARDIA_ON) { CIE.enviando = false; await _cieDuda(monto); return; }", ''],
    ['nell attesa il bottone manda', "  if (CIE.dudaHasta && Date.now() < CIE.dudaHasta) return;   // [23-ott] nella finestra del dubbio non parte niente", ''],
    ['il corte trovato non brucia la chiave', "    try { localStorage.removeItem(_cieUidKey()); } catch (e2) {}\n    CIE.uid = ''; CIE.uidMonto = null; CIE.envioTs = 0;\n    _cieOkSegna({ id: y.id || '' });", "    _cieOkSegna({ id: y.id || '' });"],
    ['② il libro vale anche se vecchio', "  if (yNuovo && (y.declarado", "  if (y && (y.declarado"],
    ['③ l ora non si azzera dove si brucia la chiave', "CIE.uid = ''; CIE.uidMonto = null; CIE.envioTs = 0;\n      CIE.res = r;", "CIE.uid = ''; CIE.uidMonto = null;\n      CIE.res = r;"],
    ['«de nuevo» ignorato', 'function _cieDeNuevo() { CIE.deNuevo = true; cierreAbrir(); }', 'function _cieDeNuevo() { cierreAbrir(); }'],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
