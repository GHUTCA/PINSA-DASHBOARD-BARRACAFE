// BANCO · «De vuelta del banco» con la salida todavia en cola (EL GIRO 37BD9C1 §②, 10-ott) · TERZA PENNA
// ① con en_cola:true la pantalla avisa «todavía está llegando» ② salida_en_camino => mensaje con palabras (no el codigo), se queda en la pantalla ③ salida_no_llego => «NO llegó… avisa a MIGRACIÓN»
// ④ otro motivo => el mensaje de siempre ⑤ el exito cierra como siempre ⑥ sin en_cola no hay aviso ⑦ mutantes.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };
function mondo(SRC, o) {
  const els = {}, toasts = [], posts = [], app = { innerHTML: '' };
  const mk = (id) => (els[id] || (els[id] = { id, value: '', onclick: null, addEventListener() {} }));
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, console, app, MULTI: false, NOCHES: [], MANANA: { sobres: [] }, DEPOSITO_PENDIENTE: null, PASO: 4, DIA_HOY: 'd', DIA_NOCHE: 'n', UIDS_GESTO: {},
    barra: () => '', esc: (x) => String(x == null ? '' : x), fmt: (n) => '$' + n, toast: (m, k) => toasts.push([m, k]), renderError() {}, pantalla6() { ctx.fatto = true; }, pantallaReservaSobre() {}, uidGesto: (p) => p + '-1',
    unTocoUnHecho: (b, fn) => { b.onclick = fn; }, SES: { user: 'Mayra' }, postCaja: async (b) => { posts.push(b); return o.risposta; },
    getCaja: async () => ({ ok: true, salida_pendiente: { uid_gesto: 'dep-1', a_depositar: 358532, en_cola: o.enCola ? true : undefined } }), document: { getElementById: mk, querySelector: mk } };
  vm.createContext(ctx);
  vm.runInContext(['uidGestoEstable', 'pantalla9'].map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { pantalla9 };', ctx);
  return { ctx, mk, toasts, posts, app };
}
async function banco(SRC) {
  { const m = mondo(SRC, { enCola: true, risposta: { ok: false, motivo: 'salida_en_camino' } }); await m.ctx.F.pantalla9();
    t('① en_cola: el aviso «todavía está llegando» esta en la pantalla', /todavía está llegando al sistema\. Si el número/.test(m.app.innerHTML), m.app.innerHTML);
    m.mk('nro').value = '48213'; await m.mk('cerrar').onclick();
    t('② salida_en_camino: mensaje con palabras, la pantalla no avanza', m.toasts.length === 1 && /todavía está llegando al sistema\. Espera un minuto/.test(m.toasts[0][0]) && !/salida_en_camino/.test(m.toasts[0][0]) && !m.ctx.fatto, m.toasts); }
  { const m = mondo(SRC, { enCola: true, risposta: { ok: false, motivo: 'salida_no_llego' } }); await m.ctx.F.pantalla9(); m.mk('nro').value = '48213'; await m.mk('cerrar').onclick();
    t('③ salida_no_llego: «NO llegó… avisa a MIGRACIÓN», no avanza', m.toasts.length === 1 && /NO llegó/.test(m.toasts[0][0]) && /MIGRACIÓN/.test(m.toasts[0][0]) && !m.ctx.fatto, m.toasts); }
  { const m = mondo(SRC, { enCola: false, risposta: { ok: false, motivo: 'otro_motivo' } }); await m.ctx.F.pantalla9(); m.mk('nro').value = '48213'; await m.mk('cerrar').onclick();
    t('④ otro motivo: el mensaje de siempre', m.toasts.length === 1 && m.toasts[0][0] === 'No se guardó: otro_motivo', m.toasts);
    t('⑥ sin en_cola no hay aviso', !/todavía está llegando/.test(m.app.innerHTML)); }
  { const m = mondo(SRC, { enCola: true, risposta: { ok: true } }); await m.ctx.F.pantalla9(); m.mk('nro').value = '48213'; await m.mk('cerrar').onclick();
    t('⑤ exito: «Depósito cerrado» y vuelve a la pantalla de inicio; el post lleva la referencia', m.toasts.length === 1 && m.toasts[0][0] === 'Depósito cerrado' && m.ctx.fatto === true && m.posts[0].referencia_uid === 'dep-1' && m.posts[0].nro_deposito === '48213', [m.toasts, m.posts]); }
  { const m = mondo(SRC, { enCola: true, risposta: { ok: true } }); await m.ctx.F.pantalla9(); await m.mk('cerrar').onclick();
    t('sin numero: no postea', m.posts.length === 0 && /Escribe el número/.test(m.toasts[0][0])); }
  t('version >= 1.8.2', /caja 1\.(8\.[2-9]|9\.\d)<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('sin aviso en_cola', "(DEPOSITO_PENDIENTE.en_cola ? '<div class=\"note\">", "(false ? '<div class=\"note\">");
await mut('salida_en_camino con el codigo crudo', "if (!r.ok && r.motivo === 'salida_en_camino') {", "if (false) {");
await mut('salida_no_llego con el codigo crudo', "if (!r.ok && r.motivo === 'salida_no_llego') {", "if (false) {");
await mut('salida_en_camino sin return (avanza igual)', "Espera un minuto y guarda el número otra vez', 'bad'); return; }", "Espera un minuto y guarda el número otra vez', 'bad'); }");
await mut('salida_no_llego sin MIGRACION', "avisa a MIGRACIÓN', 'bad'); return; }", "avisa', 'bad'); return; }");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
