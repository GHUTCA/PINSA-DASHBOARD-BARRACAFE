// BANCO · «DEPOSITASTE» PRIMA DI ANDARE IN BANCA (AUT-0667, difetto visto da Alberto sul 1.9.7, via 🎛 V28) · TERZA PENNA · 11-ott-2026
// Il fatto: dopo «Salir» lo schermo diceva «De vuelta del banco · Depositaste $895.774» benche Mayra non fosse ancora andata in banca. Alberto: «deve rimanere aperto finche Mayra non torna dalla banca».
// Regola: la schermata dice lo STATO vero della salida — senza N° (nessuna vuelta) e «En camino al banco · Por depositar $X»; solo DOPO aver scritto il N° e «Depositado · N° …».
// ① senza vuelta: «En camino al banco» e «Por depositar $X», mai «Depositaste»/«Depositado»/«De vuelta» ② il N° non e pre-compilato (si scrive al ritorno) ③ dopo il N°: «Depositado · N° …» e si torna alla lista
// ④ un N° rifiutato NON dice «Depositado» ⑤ il file non contiene piu «Depositaste» ne «De vuelta del banco» ⑥ mutanti.
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
    unTocoUnHecho: (b, fn) => { b.onclick = fn; }, SES: { user: 'Mayra' }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, pantallaRojaNotte() {}, postCaja: async (b) => { posts.push(b); return o.risposta || { ok: true }; },
    getCaja: async () => ({ ok: true, salida_pendiente: { uid_gesto: 'dep-1', a_depositar: 895774 } }), document: { getElementById: mk, querySelector: mk } };
  vm.createContext(ctx);
  vm.runInContext(['uidGestoEstable', 'pantalla9', 'rojaPendLeer', 'rojaSiguiente'].map((n) => fnDe(SRC, n)).join('\n') + '\nvar ROJA_PEND_KEY = "k";\nthis.F = { pantalla9 };', ctx);
  return { ctx, mk, toasts, posts, app };
}
async function banco(SRC) {
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla9(); const h = m.app.innerHTML;
    t('① senza vuelta: il titolo e «En camino al banco»', /<h1>En camino al banco<\/h1>/.test(h), h.slice(0, 300));
    t('① bis la riga grande e «Por depositar $895774» (mai un fatto compiuto)', />Por depositar<\/span><span class="v">\$895774</.test(h), h);
    t('① ter MAI «Depositaste», «Depositado» ne «De vuelta del banco» prima del N°', !/Depositaste|Depositado|De vuelta del banco/.test(h), h);
    t('① quater dice cosa fare al ritorno', /Cuando vuelvas, escribe el número del depósito/.test(h)); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla9();
    t('② il campo del N° non e pre-compilato e il bottone e «Guardar número de depósito»', />Guardar número de depósito</.test(m.app.innerHTML) && !/id="nro"[^>]*value=/.test(m.app.innerHTML), m.app.innerHTML.slice(-300)); }
  { const m = mondo(SRC, { risposta: { ok: true } }); await m.ctx.F.pantalla9(); m.mk('nro').value = '61418'; await m.mk('cerrar').onclick();
    t('③ dopo il N°: la vuelta parte col N° e il toast dice «Depositado · N° 61418»', m.posts.length === 1 && m.posts[0].evento === 'vuelta' && m.posts[0].nro_deposito === '61418' && m.toasts.length === 1 && m.toasts[0][0] === 'Depositado · N° 61418', [m.posts, m.toasts]);
    t('③ bis ...e si torna alla lista (pantalla6)', m.ctx.fatto === true); }
  { const m = mondo(SRC, { risposta: { ok: false, motivo: 'otro_motivo' } }); await m.ctx.F.pantalla9(); m.mk('nro').value = '61418'; await m.mk('cerrar').onclick();
    t('④ un N° rifiutato NON dice «Depositado» e non torna alla lista', m.toasts.length === 1 && !/Depositado/.test(m.toasts[0][0]) && !m.ctx.fatto, m.toasts); }
  { const m = mondo(SRC, {}); await m.ctx.F.pantalla9(); await m.mk('cerrar').onclick();
    t('④ bis senza N°: niente vuelta e niente «Depositado»', m.posts.length === 0 && !/Depositado/.test(m.toasts.map((x) => x[0]).join()), m.toasts); }
  t('⑤ il file non contiene piu «Depositaste» ne «De vuelta del banco»', !/Depositaste|De vuelta del banco/.test(SRC));
  t('⑤ bis «Depositado» compare in UN solo posto: il toast dopo la vuelta riuscita', (SRC.match(/Depositado/g) || []).length === 1 && /toast\('Depositado · N° ' \+ nro, 'ok'\)/.test(SRC));
  t('versione >= 1.9.8', /caja 1\.9\.([89])<\/small>/.test(SRC) || /caja 1\.(1\d|[2-9]\d)\.\d<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('torna «Depositaste»', '<span class="n">Por depositar</span>', '<span class="n">Depositaste</span>');
await mut('torna «De vuelta del banco»', '<h1>En camino al banco</h1>', '<h1>De vuelta del banco</h1>');
await mut('il toast dice «Depositado» senza N°', "toast('Depositado · N° ' + nro, 'ok');", "toast('Depositado', 'ok');");
await mut('il toast dice «Depósito cerrado»', "toast('Depositado · N° ' + nro, 'ok');", "toast('Depósito cerrado', 'ok');");
await mut('«Depositado» prima del N° (nel sottotitolo)', 'Cuando vuelvas, escribe el número del depósito', 'Depositado');
await mut('il sottotitolo non dice cosa fare', 'Cuando vuelvas, escribe el número del depósito', 'Listo');
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
