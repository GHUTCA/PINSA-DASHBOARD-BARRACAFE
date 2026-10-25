// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · le mesas sin garzón (24-oct)
// Contratto ⚙️ ARQ `ARQ V32 CORTE AL JL 1DAB7CA PRONTO`: traspaso_a «JL» (slug jl) · al_jl:true nei traspasos. Regola 🎛 `V32 IL CORTE AM NON ASPETTA PIU IL JL`.
// Gira `_sinGarzon` · `sinGarzonVer` (app_jl) e la riga dei traspasos di `_ciePaso4` (sala) VERI in vm.
// node test_app_jl_sin_garzon_24OCT2026.mjs · --mutanti
import fs from 'node:fs'; import vm from 'node:vm';
const JL0 = fs.readFileSync(new URL('./app_jl.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SA0 = fs.readFileSync(new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const QC = fs.readFileSync(new URL('./que_cambio.html', import.meta.url), 'utf8');
const fnVin = (S, n) => { const i = S.indexOf('function ' + n + '('); if (i < 0) throw new Error(n); return S.slice(i, S.indexOf('\n}\n', i) + 3); };
function banco(JL, SA, quieto) {
  let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n + (c || i === undefined ? '' : '  → ' + JSON.stringify(i).slice(0, 300))); };
  const mondo = (vista) => { const L = { toast: [] }; const ctx = { STATE: { vista }, String, toast: (k, s) => L.toast.push([k, s]) }; vm.createContext(ctx); vm.runInContext(fnVin(JL, '_sinGarzon') + fnVin(JL, 'sinGarzonVer'), ctx); return { ctx, L }; };
  { const w = mondo({ meseros: { jl: { nombre: 'JL', mesas: [{ mesa: '34', total: 12000 }, { mesa: '107', total: 36080 }, { mesa: '20', total: 0 }] }, ruth: { mesas: [{ mesa: '50', total: 9000 }] } } });
    const sg = vm.runInContext('_sinGarzon()', w.ctx);
    t('A · le mesas della fetta jl con consumo, ordinate (la 20 a $0 no, quelle di Ruth no)', JSON.stringify(sg) === '["34","107"]', sg);
    vm.runInContext('sinGarzonVer()', w.ctx);
    t('B · il tocco dice quali, e il gesto vero col bordo 187d1b7 (la plaza in Turno), mai «cóbralas tú»', /Mesas sin garzón: 34 · 107/.test((w.L.toast[0] || [])[1] || '') && /Asigna su plaza a un garzón en «Turno» y le pasan a él/.test(w.L.toast[0][1]) && !/cóbralas tú/.test(w.L.toast[0][1])); }
  { const w = mondo({ meseros: { ruth: { mesas: [{ mesa: '50', total: 9000 }] } } });
    t('C · senza la fetta jl (leva del bordo spenta): niente, e il tocco non fa niente', vm.runInContext('_sinGarzon()', w.ctx).length === 0 && (vm.runInContext('sinGarzonVer()', w.ctx), w.L.toast.length === 0)); }
  { const w = mondo(null); t('D · senza vista: niente, mai un errore', vm.runInContext('_sinGarzon()', w.ctx).length === 0); }
  t('E · la testa mostra l icona col numero, solo se ce ne sono', /const sg = _sinGarzon\(\);[^\n]*\n\s+if \(sg\.length\) A\.push\('<button class="urg" onclick="sinGarzonVer\(\)" title="mesas sin garzón">🧑‍🍳<i>' \+ sg\.length/.test(JL));
  // la sala del mesero: dopo il corte, «→ el JL» con la spiegazione quando al_jl
  { const i = SA.indexOf('  if (r.traspasos && r.traspasos.length) {'); const blocco = i < 0 ? '' : SA.slice(i, SA.indexOf('\n  }\n', i) + 4);   // il blocco VERO di _ciePaso4
    const f = (tr) => vm.runInContext('(function(r){ let h = ""; ' + blocco + ' return h; })', vm.createContext({ esc: (s) => String(s), fmtPrice: (n) => '$' + n }))({ traspasos: tr });
    let h1 = '', h2 = ''; try { h1 = f([{ mesa: '107', a: 'JL', al_jl: true, consumo: 36080 }]); h2 = f([{ mesa: '31', a: 'Isa', consumo: 5000 }]); } catch (e) { h1 = 'ERR ' + e.message; }
    t('F · corte con al_jl: «Mesa 107 → el JL (no había garzón…)»; un traspaso normale resta «→ Isa»', /Mesa 107 → <b>el JL<\/b>/.test(h1) && /la asigna el JL/.test(h1) && /Mesa 31 → <b>Isa<\/b>/.test(h2) && !/el JL/.test(h2), { h1, h2 }); }
  t('G · «Qué cambió» NON la annuncia: il vetro è muto finché la leva del bordo è "0", la riga va col giorno della leva', !/Mesas sin garzón/.test(QC));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['jl', 'la fetta jl ignorata', "    const v = ms.jl || ms.JL || null;", '    const v = null;'],
    ['jl', 'anche le mesas a $0', "if (m && (+m.total || 0) > 0 && out.indexOf(String(m.mesa)) < 0)", "if (m && out.indexOf(String(m.mesa)) < 0)"],
    ['jl', 'l icona non compare', "  if (sg.length) A.push('<button class=\"urg\" onclick=\"sinGarzonVer()\"", "  if (false) A.push('<button class=\"urg\" onclick=\"sinGarzonVer()\""],
    ['sa', 'la sala non dice el JL', "(t.al_jl ? 'el JL' : esc(t.a))", 'esc(t.a)'],
  ];
  let m = 0; for (const [f, n, a, b] of M) { const S = f === 'jl' ? JL0 : SA0; if (!S.includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } let r; try { r = f === 'jl' ? banco(S.split(a).join(b), SA0, true) : banco(JL0, S.split(a).join(b), true); } catch (e) { r = { ko: 1 }; } console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(JL0, SA0, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
