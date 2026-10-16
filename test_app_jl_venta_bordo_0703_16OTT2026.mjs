// BANCO · AUT-0703 · LA VENTA DELL'APP DEL JL DAL BORDO (🎛 V30 `V30 AUT-0703 LA VENTA DEL JL DAL BORDO OGGI`, 16-ott) · TERZA PENNA
// Alberto: «l'app del JL dopo mezzanotte si blocca» — la venta veniva SOLO da getCaja (Google); `servicio` (bordo, pagos PG per giorno operativo) era spento.
// Criteri: ① Ventas «General» e la scheda Caja leggono `_cajaVista` (il bordo se fresco), non STATE.caja ② con servicio fresco: Venta/Cuentas/Propina DEL BORDO
//          e la pillola dice «del bordo» ③ servicio vecchio o spento: Google, e la pillola dice «de Google» con l'età ④ Google vecchio >3 min o in errore: pillola ambra,
//          mai un numero fermo che sembra vivo ⑤ con Ventas davanti il bordo si rinfresca (Google no) ⑥ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'app_jl.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
const NOW = Date.now();
const GOOGLE = () => ({ ok: true, venta: 100000, cuentas: 12, boletas: 11, propinas: { tarjeta: 7000, efectivo: 3000 }, por_mesero: {} });
const SERV = () => ({ ok: true, fuente: 'bordo', venta: 250000, cuentas: 20, propinas: 21000, por_mesero: { Ray: { cobrado: 250000, n_cobros: 20, propinas: 21000 } } });
function mondo(SRC, o) {
  const STATE = { caja: o.caja === undefined ? GOOGLE() : o.caja, vista: null, ts: { caja: o.cajaTs === undefined ? NOW - 20000 : o.cajaTs },
    salud: { flags: { caja_atto1_on: '1', caja_servicio_on: o.leva === false ? '0' : '1' } }, serv: o.serv || null, cajaErr: o.err || '' };
  if (o.serv) STATE.ts.serv = o.servTs === undefined ? NOW - 5000 : o.servTs;
  const ctx = { JSON, Math, Date, String, Number, Object, Array, RegExp, STATE, VTAB: 'general', TURNI: {},
    fmt: (n) => '$' + Number(n || 0).toLocaleString('es-CL'), esc: String,
    edadS: (k) => Math.round((Date.now() - (STATE.ts[k] || 0)) / 1000), _fmtEdadS: (s) => 'hace ' + s + ' s', _ventasMeseros: () => '' };
  vm.createContext(ctx);
  vm.runInContext(['cjFlag', 'cjAtto1On', '_servOn', '_servFresco', '_cajaVista', '_slugSalaJS', '_cjMesasDetalle', '_cjMesasAbiertas', 'edadTxt', '_cajaFuenteHtml', '_ventasFranjas', 'vVentas']
    .map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { _cajaFuenteHtml, vVentas };', ctx);
  return ctx.F;
}
const venta = (h) => { const m = h.match(/<td>Venta<\/td><td><b>([^<]*)<\/b>/); return m ? m[1] : null; };
const prop = (h) => { const m = h.match(/<td>Propina<\/td><td><b>([^<]*)<\/b>/); return m ? m[1] : null; };
function banco(SRC) {
  const k0 = ko;
  { const F = mondo(SRC, { serv: SERV() }); const h = F.vVentas();
    t('② servicio fresco: Venta del BORDO (250.000), non di Google (100.000)', venta(h) === '$250.000', venta(h));
    t('② servicio fresco: Propina del bordo (21.000)', prop(h) === '$21.000', prop(h));
    t('② la pillola dice «del bordo»', /📷 del bordo hace/.test(F._cajaFuenteHtml()) && /pill on/.test(F._cajaFuenteHtml()), F._cajaFuenteHtml()); }
  { const F = mondo(SRC, { serv: SERV(), servTs: NOW - 4 * 60000 }); const h = F.vVentas();
    t('③ servicio di 4 min fa: si torna a Google (100.000) e la pillola lo dice', venta(h) === '$100.000' && /de Google hace/.test(F._cajaFuenteHtml()), [venta(h), F._cajaFuenteHtml()]); }
  { const F = mondo(SRC, { serv: SERV(), leva: false }); const h = F.vVentas();
    t('③ leva spenta: Google, come ieri', venta(h) === '$100.000' && /de Google/.test(F._cajaFuenteHtml())); }
  { const F = mondo(SRC, { cajaTs: NOW - 10 * 60000 });
    t('④ Google di 10 min fa: pillola AMBRA (un numero fermo non sembra vivo)', /pill amb/.test(F._cajaFuenteHtml()), F._cajaFuenteHtml()); }
  { const F = mondo(SRC, { err: 'timeout' });
    t('④ Google in timeout: ambra e lo dice («Google no responde»)', /pill amb/.test(F._cajaFuenteHtml()) && /Google no responde/.test(F._cajaFuenteHtml()), F._cajaFuenteHtml()); }
  { const F = mondo(SRC, {});
    t('④ Google fresco senza errore: pillola normale', /pill off/.test(F._cajaFuenteHtml()) && !/pill amb/.test(F._cajaFuenteHtml())); }
  { const F = mondo(SRC, { caja: null, cajaTs: 0, serv: SERV() }); const h = F.vVentas();
    t('② senza Google ma col bordo fresco: la venta c è (250.000)', venta(h) === '$250.000', venta(h)); }
  { const F = mondo(SRC, { serv: SERV() }); const h = F.vVentas();
    t('le franjas restano di Google e lo dicono', /Por turno y franja <span class="pill [a-z]+">📷 de Google/.test(h)); }
  // ① e ⑤ sul codice
  const vC = fnDe(SRC, 'vCaja'), vV = fnDe(SRC, 'vVentas');
  t('① vCaja legge _cajaVista, non STATE.caja', /^function vCaja\(\) \{\n  const c = _cajaVista\(\);/.test(vC));
  t('① vVentas legge _cajaVista, non STATE.caja', /^function vVentas\(\) \{\n  const c = _cajaVista\(\);/.test(vV));
  t('① la pillola di vCaja e di vVentas e _cajaFuenteHtml', /El día ' \+ _cajaFuenteHtml\(\)/.test(vC) && /General ' \+ _cajaFuenteHtml\(\)/.test(vV));
  t('🟡 EL GIRO · senza Google e col bordo fresco le Mesas abiertas vengono dalla vista del bordo (_cjMesasDetalle), non spariscono',
    /const maB = \(!STATE\.caja && c\.fuente_bordo\) \? _cjMesasDetalle\(\)\.map\(/.test(vC) && /const ma = maB \|\| c\.mesas_abiertas \|\| \[\];/.test(vC));
  t('⑤ con Ventas davanti (TAB 3) gira giroServicio, Google no', /if \(TAB === 2 \|\| TAB === 0\) giroCaja\(\); else if \(TAB === 3\) giroServicio\(\);/.test(SRC));
  t('versione >= 1.40.4', /app_jl v1\.(40\.[4-9]|4[1-9]\.\d|[5-9]\d\.\d)/.test(SRC));
  return ko - k0;
}
banco(SRC0);
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» ⇒ banco ROSSO', rossi > 0, rossi); };
mut('vVentas torna a Google', "function vVentas() {\n  const c = _cajaVista();", "function vVentas() {\n  const c = STATE.caja;");
mut('vCaja torna a Google', "function vCaja() {\n  const c = _cajaVista();", "function vCaja() {\n  const c = STATE.caja;");
mut('la propina resta di Google', "(c && c.fuente_bordo) ? (c.propinas_bordo || 0)", "false ? 0");
mut('Google vecchio non si colora', "return '<span class=\"pill ' + (vecchia ? 'amb' : 'off')", "return '<span class=\"pill ' + ('off')");
mut('l errore di Google non si dice', "(STATE.cajaErr ? ' · ' + esc(", "(false ? ' · ' + esc(");
mut('Ventas non rinfresca il bordo', " else if (TAB === 3) giroServicio();", "");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
