// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la riga del motivo sotto la busta rossa in meno (29-ott)
// Reperto: 🎛 V33 `PROGRAMMA SOBRE MOTIVO JL` · bordo `869dc4b` (ramo terza-sobre-motivo-29oct): `pide_motivo` sul sobre, verbo `sobre_motivo`.
// Gira `cjSobEnviar`, `cjSobMotivoIn`, `cjSobMotivo` VERE di app_jl.html in vm, e il pezzo VERO di `cjAtto1Html` che disegna la busta col numero.
// node test_app_jl_sobre_motivo_29OCT2026.mjs · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const ORIG = fs.readFileSync(new URL('./app_jl.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const fnB = (H, n) => { const k = H.indexOf('function ' + n + '('); if (k < 0) throw new Error(n);
  let d = 0, j = H.indexOf('{', k); for (; j < H.length; j++) { if (H[j] === '{') d++; else if (H[j] === '}') { d--; if (d === 0) break; } }
  return (H.slice(Math.max(0, k - 6), k) === 'async ' ? 'async ' : '') + H.slice(k, j + 1) + '\n'; };
async function banco(H, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const F = ['cjSobEnviar', 'cjSobMotivoIn', 'cjSobMotivo', '_cjFine', '_cjFascia', '_cjNum'].map((n) => fnB(H, n)).join('');
  const a = H.indexOf('  } else if (sob && sob.nro) {\n'), b = H.indexOf('  } else if (di.n && sobAuto) {', a);
  const RENDER = 'function rendi() { let h = ""; const sob = CJ1.sob; if (false) {\n' + H.slice(a, b) + '  }\n return h; }\n';
  function mondo(risp) {
    const el = { conta: { value: '' }, mot: null }; let n = 0;
    const ctx = { CJ1: { enviando: false, sobUid: null }, STATE: { pin: '2222' }, CJ1_ERR: {}, posts: [], toasts: [], String, Number, parseInt, Date,
      $: (id) => (id === 'cj1SobContado' ? el.conta : id === 'cj1SobMotivo' ? el.mot : null), toast: (k, m) => ctx.toasts.push(k + ':' + m), pintaTab: () => {},
      cjMotivoTxt: (m) => 'M:' + m, document: { activeElement: null }, cajaNuevoUid: (p) => p + '-' + (++n), fmt: (x) => '$' + x,
      esc: (s) => (s || '').toString().replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
      cajaPost1: async (p) => { ctx.posts.push(p); const r = risp(p); if (r instanceof Error) throw r; return r; } };
    vm.createContext(ctx); vm.runInContext(F + RENDER, ctx); return { ctx, el };
  }
  const BUSTA = (extra) => Object.assign({ ok: true, sobre_nro: '1004', cuadra: false, con_diferencia: true }, extra || {});
  const nasce = async (m) => { m.el.conta.value = '26.000'; await m.ctx.cjSobEnviar(null); };
  { const m = mondo(() => BUSTA()); await nasce(m); const h = m.ctx.rendi();
    t('A · busta rossa SENZA pide_motivo (leva spenta, sobrante, ambra) ⇒ nessuna casella, «A la caja fuerte» c\'è', !/cj1SobMotivo/.test(h) && !/Sabes por qué/.test(h) && /A la caja fuerte/.test(h), h); }
  { const m = mondo(() => BUSTA({ cuadra: true, con_diferencia: false, fascia: 'verde', diferencia: 0 })); await nasce(m);
    t('A2 · busta verde ⇒ nessuna casella', !/cj1SobMotivo/.test(m.ctx.rendi())); }
  { const m = mondo(() => BUSTA({ pide_motivo: 'true' })); await nasce(m);
    t('A3 · pide_motivo che non è esattamente true ⇒ nessuna casella', !/cj1SobMotivo/.test(m.ctx.rendi())); }
  { const m = mondo(() => BUSTA({ pide_motivo: true })); await nasce(m); const h = m.ctx.rendi();
    t('B · pide_motivo:true ⇒ la casella, opzionale, 140, e «A la caja fuerte» resta (non è un cancello)', /¿Sabes por qué falta\?/.test(h) && /\(opcional\)/.test(h) && /maxlength="140"/.test(h) && />Guardar</.test(h) && /A la caja fuerte/.test(h), h);
    m.el.mot = { value: '   ' }; const n0 = m.ctx.posts.length; await m.ctx.cjSobMotivo(null);
    t('C · in bianco ⇒ niente parte, nessun errore rosso', m.ctx.posts.length === n0 && !m.ctx.toasts.some((x) => /^err/.test(x)), m.ctx.toasts); }
  { let k = 0; const m = mondo((p) => (p.verbo === 'sobre' ? BUSTA({ pide_motivo: true }) : (++k === 1 ? new Error('timeout') : { ok: true, accodato: true })));
    await nasce(m); m.el.mot = { value: '  Ray pagó un taxi <con> la caja  ' }; await m.ctx.cjSobMotivo(null);
    const p1 = m.ctx.posts[1];
    t('D · il motivo parte: verbo sobre_motivo, numero della busta, testo trim, PIN del JL, uid del client', p1 && p1.verbo === 'sobre_motivo' && p1.sobre_nro === '1004' && p1.texto === 'Ray pagó un taxi <con> la caja' && p1.pin_jl === '2222' && /^CJ-MOT-/.test(p1.uid_gesto), p1);
    t('D2 · rete caduta ⇒ la casella resta, nessun «guardado»', !m.ctx.CJ1.sob.mok && /cj1SobMotivo/.test(m.ctx.rendi()));
    await m.ctx.cjSobMotivo(null); const p2 = m.ctx.posts[2];
    t('E · il ritento porta lo STESSO uid (il bordo non scrive due righe)', p2 && p2.uid_gesto === p1.uid_gesto, [p1, p2]);
    const h = m.ctx.rendi();
    t('E2 · guardato ⇒ la casella sparisce e si vede il testo, passato da esc', !/cj1SobMotivo/.test(h) && /Motivo guardado: «Ray pagó un taxi &lt;con&gt; la caja»/.test(h), h); }
  { const m = mondo((p) => (p.verbo === 'sobre' ? BUSTA({ pide_motivo: true }) : { ok: false, error: 'rifiutato', motivo: 'texto_largo' }));
    await nasce(m); m.el.mot = { value: 'x' }; await m.ctx.cjSobMotivo(null);
    t('F · rifiuto del bordo ⇒ toast col motivo, la casella resta', m.ctx.toasts.includes('err:M:texto_largo') && /cj1SobMotivo/.test(m.ctx.rendi()), m.ctx.toasts); }
  { const m = mondo(() => BUSTA({ pide_motivo: true })); await nasce(m);
    m.ctx.cjSobMotivoIn({ value: 'a medias' }); m.el.mot = null;
    t('G · il testo scritto sopravvive a un ridisegno (vive in CJ1.sob)', /value="a medias"/.test(m.ctx.rendi())); }
  t('H · le parole del bordo hanno la loro frase in spagnolo', ['texto_vacio', 'texto_largo', 'sobre_sin_faltante', 'sobre_desconocido', 'sobre_motivo_spento'].every((k) => new RegExp('\\n  ' + k + ": '").test(H)));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['casella senza pide_motivo', "pm: r.pide_motivo === true }", 'pm: true }'],
    ['casella anche se pide_motivo non è esattamente true', "pm: r.pide_motivo === true }", 'pm: !!r.pide_motivo }'],
    ['il bianco parte lo stesso', "  if (!texto) { toast('warn', 'Está en blanco: no se guarda nada'); return; }\n", ''],
    ['uid nuovo a ogni tocco', '  if (!sob.muid) sob.muid = cajaNuevoUid(\'CJ-MOT\');', "  sob.muid = cajaNuevoUid('CJ-MOT');"],
    ['niente esc sul motivo guardato', "Motivo guardado: «' + esc(sob.mok) + '»", "Motivo guardado: «' + sob.mok + '»"],
    ['la casella toglie «A la caja fuerte» (cancello)', "      '<button class=\"btn acc\" onclick=\"cjSobListo()\">A la caja fuerte</button></div>';\n  } else if (di.n && sobAuto) {", "      '</div>';\n  } else if (di.n && sobAuto) {"],
    ['guardado anche se il bordo dice no', "    if (r && r.ok) { if (CJ1.sob === sob) { sob.mok = texto;", "    if (r) { if (CJ1.sob === sob) { sob.mok = texto;"],
    ['il testo scritto si perde al ridisegno', "value=\"' + esc(sob.mtx || '') + '\"", "value=\"\""],
  ];
  let m = 0; for (const [n, a, b] of M) { if (!ORIG.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r;
    try { r = await banco(ORIG.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = await banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
