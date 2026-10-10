// BANCO · UNA SALA SALVATA PIU VECCHIA DEL TETTO NON SI DISEGNA MAI COME SE FOSSE VIVA (🎛 V28 AUT-0663 `FOTO SALVATA SENZA ETA CURA ALLA RADICE`, 10-ott) · TERZA PENNA
// Il caso: telefono di Ary, mesa 100 — il catch del poll ridisegnava `sala_foto_v1` SENZA tetto d'eta per ~6 ore, con i bottoni del denaro accesi. Qui si esegue il BLOCCO VERO del catch (estratto dal sorgente) e
// le funzioni vere, con una foto di 6 ore. Criteri: ① leva ACCESA + foto morta (in STATE o in localStorage) => niente render, «Mesas: sin datos» con l'eta, sezioni vuote, nessun bottone di denaro, STATE.sala scheletro
// marcato `_foto_local` ② foto entro il tetto => come ieri ③ LEVA SPENTA => come ieri, anche con 6 ore ④ `?fotoviva=1|0` forza ⑤ il confine dei 30 min ⑥ l'eta si ricorda anche dal boot (salaFotoTs) ⑦ la leva si legge da /salud
// ⑧ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'sala.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(i, eol + 1);
  return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
const H = 3600000, MIN = 60000;
function blocco(SRC) { const a = SRC.indexOf('if (PINTA_ON) try {'); const b = SRC.indexOf('} catch (e3)', a); if (a < 0 || b < 0) throw new Error('blocco catch'); return SRC.slice(a, b) + '} catch (e3) { throw e3; }'; }
function mondo(SRC, o) {
  const els = {}; const el = (id) => (els[id] || (els[id] = { id, innerHTML: '', textContent: '', _cl: new Set(), classList: { add: (...c) => c.forEach((x) => els[id]._cl.add(x)), remove: (...c) => c.forEach((x) => els[id]._cl.delete(x)), contains: (c) => els[id]._cl.has(c) } }));
  const rendered = []; const now = Date.now();
  const ls = {}; if (o.foto) ls.sala_foto_v1 = JSON.stringify({ ts: now - o.foto.edad, nombre: o.foto.nombre || 'Ary', local: 'BKS', r: { mios: [{ uuid: 'pm-x', mesa: '100', estado: 'atendido', total: 135780 }] } });
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Set, console, PINTA_ON: true, CFG: { LOCAL: 'BKS' }, QS: new URLSearchParams(o.qs || ''),
    STATE: { nombre: 'Ary', sala: o.sala || null, salaTs: o.salaTs || 0, mesasModel: [{ mesa: '100' }], pollProxOk: 5 }, localStorage: { getItem: (k) => (k in ls ? ls[k] : null) },
    $: el, document: { querySelector: () => (o.hayTessere ? {} : null) }, render: (r) => { rendered.push(r); }, refrescar() {}, _of: el('offline'), FOTO_VIVA_ON: !!o.leva, FOTO_VIVA_LEIDA: o.leida !== false, cerrada: 0, cerrarMesa() { ctx.cerrada++; } };
  el('secMesas').innerHTML = o.tessere ? '<div class="mtile">100</div>' : '';
  if (o.tessere) { el('kpis').innerHTML = 'Venta turno $135.780'; el('csHero').innerHTML = 'Por cobrar ahora $135.780'; el('tick').innerHTML = '<span>mesa 100</span>'; el('vpanel').innerHTML = '<button>COBRAR</button>'; el('mesaSheetContent').innerHTML = 'mesa 100'; ctx.STATE.selMesas = ['100']; } ['secPend', 'secSinDueno', 'secMios', 'secLimpiar'].forEach((id) => { el(id).innerHTML = o.tessere ? '<button>COBRAR</button><button>ELIMINAR</button>' : ''; });
  vm.createContext(ctx);
  vm.runInContext(['_fotoVivaOn', '_fotoMuerta', '_salaEdadMs', '_edadTxtMs', '_salaMuertaPinta'].map((n) => fnDe(SRC, n)).join('\n') + '\n' + SRC.match(/var FOTO_TETTO_MS = [^;]+;/)[0] + '\nthis.run = function () { ' + blocco(SRC).replace(/^if \(PINTA_ON\) try \{/, 'if (PINTA_ON) try {') + ' };', ctx);
  return { ctx, els, rendered, run: () => ctx.run(), leva: (v) => { ctx.FOTO_VIVA_ON = v; } };
}
const FOTO = (edad, nombre) => ({ edad, nombre });
async function banco(SRC) {
  // ① leva accesa + foto morta
  { const m = mondo(SRC, { leva: true, sala: { _foto_local: 5, mios: [{ uuid: 'pm-x', mesa: '100', estado: 'atendido' }] }, salaTs: Date.now() - 6 * H, tessere: true }); m.run();
    t('① foto di 6 h in STATE: niente render', m.rendered.length === 0, m.rendered.length);
    t('① bis «Mesas: sin datos» con l eta (6 h)', /Mesas: sin datos/.test(m.els.secMesas.innerHTML) && /6 h/.test(m.els.secMesas.innerHTML) && /Reintentar/.test(m.els.secMesas.innerHTML), m.els.secMesas.innerHTML.slice(0, 200));
    t('① ter NESSUN bottone di denaro: le sezioni di pedidos/limpiar sono vuote e il panel non nomina cobrar/eliminar come azione', ['secPend', 'secSinDueno', 'secMios', 'secLimpiar'].every((id) => m.els[id].innerHTML === '') && !/<button[^>]*>(COBRAR|ELIMINAR|Cobrar|Eliminar)/.test(m.els.secMesas.innerHTML), m.els.secLimpiar.innerHTML);
    t('① quater STATE.sala = scheletro vuoto marcato `_foto_local`+`_muerta`, nessun pedido, mesasModel vuoto', m.ctx.STATE.sala._muerta === true && m.ctx.STATE.sala._foto_local && m.ctx.STATE.sala.mios.length === 0 && m.ctx.STATE.mesasModel.length === 0, m.ctx.STATE.sala);
    t('① quinto il banner e ROSSO (senza `vieja`) e dice l eta', /Sin sala/.test(m.els.offline.textContent) && /6 h/.test(m.els.offline.textContent) && m.els.offline.classList.contains('show') && !m.els.offline.classList.contains('vieja'), [m.els.offline.textContent, [...m.els.offline._cl]]); }
  { const m = mondo(SRC, { leva: true, foto: FOTO(6 * H), hayTessere: false }); m.run();
    t('① sesto senza STATE.sala ma `sala_foto_v1` di 6 h in localStorage (il caso di Ary dopo il ricarico): MORTA, niente render', m.rendered.length === 0 && /Mesas: sin datos/.test(m.els.secMesas.innerHTML) && m.ctx.STATE.sala._muerta === true, [m.rendered.length, m.els.secMesas.innerHTML.slice(0, 80)]);
    t('① settimo e ricorda l eta vera della foto', Math.abs((Date.now() - m.ctx.STATE.salaFotoTs) - 6 * H) < 5000, m.ctx.STATE.salaFotoTs); }
  { const m = mondo(SRC, { leva: true, foto: FOTO(6 * H) }); m.run(); m.run();
    t('① ottavo il catch successivo (il poll continua a fallire) resta morto e non resuscita', m.rendered.length === 0 && m.ctx.STATE.sala._muerta === true); }
  // ① (EL GIRO) l'intestazione tiene i soldi: kpis, csHero, ticker, pannello dei verbi, scheda della mesa
  { const m = mondo(SRC, { leva: true, sala: { _foto_local: 5, mios: [{ uuid: 'pm-x', mesa: '100', estado: 'atendido' }] }, salaTs: Date.now() - 6 * H, tessere: true }); m.run();
    t('① EL GIRO: «Venta turno $135.780» (kpis) e «Por cobrar ahora» (csHero) NON restano sopra il «sin datos»', m.els.kpis.innerHTML === '' && m.els.csHero.innerHTML === '' && m.els.csHero.classList.contains('hide'), [m.els.kpis.innerHTML, m.els.csHero.innerHTML]);
    t('① EL GIRO bis il ticker, il pannello dei verbi e la scheda della mesa sono vuoti, nessuna mesa selezionata, la scheda si chiude', m.els.tick.innerHTML === '' && m.els.vpanel.innerHTML === '' && m.els.mesaSheetContent.innerHTML === '' && m.ctx.STATE.selMesas.length === 0 && m.ctx.cerrada === 1, [m.els.tick.innerHTML, m.els.vpanel.innerHTML, m.ctx.cerrada]);
    t('① EL GIRO ter in tutto il DOM della sala non resta il numero 135.780', !Object.values(m.els).some((e) => /135\.780/.test(e.innerHTML + e.textContent)), Object.values(m.els).filter((e) => /135\.780/.test(e.innerHTML)).map((e) => e.id)); }
  // ⑥ ⑦ (EL GIRO) la leva non ancora letta, o che non arriva mai: il verso sicuro e «sin datos»
  { const m = mondo(SRC, { leva: false, leida: false, foto: FOTO(6 * H) }); m.run();
    t('⑥ EL GIRO: il poll muore PRIMA del /salud (leva non ancora letta): la foto di 6 h NON si disegna', m.rendered.length === 0 && m.ctx.STATE.sala._muerta === true, [m.rendered.length]); }
  { const m = mondo(SRC, { leva: false, leida: false, sala: { mios: [] }, salaTs: Date.now() - 6 * H, tessere: true }); m.run();
    t('⑥ bis stessa cosa con STATE.sala gia in mano (prima strada del catch)', m.rendered.length === 0 && m.els.kpis.innerHTML === '');
    const v = mondo(SRC, { leva: false, leida: false, foto: FOTO(10 * MIN) }); v.run();
    t('⑥ ter non letta + foto di 10 min: si disegna (il tetto vale per le foto VECCHIE, non per ogni foto)', v.rendered.length === 1); }
  { const m = mondo(SRC, { leva: true, leida: false, qs: 'fotoviva=0', foto: FOTO(6 * H) }); m.run();
    t('⑥ quater non letta + `?fotoviva=0`: il ritorno sul telefono vince, si disegna come ieri', m.rendered.length === 1); }
  { const m = mondo(SRC, { leva: false, leida: true, foto: FOTO(6 * H) }); m.run();
    t('⑦ letta e SPENTA dal bordo: come ieri (la guardia non e imposta dove il bordo ha detto no)', m.rendered.length === 1); }
  // ⑧ (EL GIRO 19:55) a leva "0" lo scheletro della sala morta non e una sala: se la guardia era accesa (leva non ancora letta) e poi il /salud dice «spenta», si torna alla foto salvata come ieri, mai a un telefono vuoto
  { const m = mondo(SRC, { leva: false, leida: false, foto: FOTO(6 * H) }); m.run();
    t('⑧ prima la guardia vale (non letta): sin datos', m.rendered.length === 0 && m.ctx.STATE.sala._muerta === true);
    m.ctx.FOTO_VIVA_LEIDA = true; m.run();
    t('⑧ bis poi il /salud dice «spenta»: il catch successivo NON ridisegna lo scheletro vuoto ma la foto salvata come ieri', m.rendered.length === 1 && m.rendered[0].mios && m.rendered[0].mios.length === 1 && !m.ctx.STATE.sala._muerta, [m.rendered.length, m.ctx.STATE.sala]); }
  // ② entro il tetto: come ieri
  { const m = mondo(SRC, { leva: true, foto: FOTO(10 * MIN), hayTessere: true }); m.run();
    t('② foto di 10 min: si disegna (render) col banner giallo «Sala de hace 10 min»', m.rendered.length === 1 && /Sala de hace 10 min/.test(m.els.offline.textContent) && m.els.offline.classList.contains('vieja') && m.ctx.STATE.sala._foto_local > 0 && !m.ctx.STATE.sala._muerta, [m.rendered.length, m.els.offline.textContent]); }
  { const m = mondo(SRC, { leva: true, sala: { mios: [] }, salaTs: Date.now() - 5 * MIN }); m.run();
    t('② bis STATE.sala di 5 min: render come ieri', m.rendered.length === 1 && !m.ctx.STATE.sala._muerta); }
  // ③ leva spenta = come ieri anche con 6 ore
  { const m = mondo(SRC, { leva: false, foto: FOTO(6 * H) }); m.run();
    t('③ LEVA SPENTA: la foto di 6 h si ridisegna come ieri (render, banner giallo)', m.rendered.length === 1 && /Sala de hace 360 min/.test(m.els.offline.textContent), [m.rendered.length, m.els.offline.textContent]); }
  { const m = mondo(SRC, { leva: false, sala: { mios: [] }, salaTs: Date.now() - 6 * H }); m.run();
    t('③ bis leva spenta + STATE.sala di 6 h: render come ieri', m.rendered.length === 1 && !m.ctx.STATE.sala._muerta); }
  // ④ ?fotoviva
  { const m = mondo(SRC, { leva: false, qs: 'fotoviva=1', foto: FOTO(6 * H) }); m.run();
    t('④ `?fotoviva=1` forza la guardia anche a leva spenta (la prova con Alberto)', m.rendered.length === 0 && m.ctx.STATE.sala._muerta === true); }
  { const m = mondo(SRC, { leva: true, qs: 'fotoviva=0', foto: FOTO(6 * H) }); m.run();
    t('④ bis `?fotoviva=0` la spegne anche a leva accesa (ritorno sul telefono, senza deploy)', m.rendered.length === 1 && !m.ctx.STATE.sala._muerta); }
  // ⑤ il confine
  { const a = mondo(SRC, { leva: true, foto: FOTO(29 * MIN + 30000) }); a.run(); const b = mondo(SRC, { leva: true, foto: FOTO(31 * MIN) }); b.run();
    t('⑤ confine: 29,5 min viva · 31 min morta (stesso tetto del boot, 30)', a.rendered.length === 1 && b.rendered.length === 0 && b.ctx.STATE.sala._muerta === true, [a.rendered.length, b.rendered.length]); }
  // altra persona
  { const m = mondo(SRC, { leva: true, foto: { edad: 6 * H, nombre: 'Otro' } }); m.run();
    t('la foto di un ALTRO mesero non si usa in nessun caso (come ieri): nessun render, nessuna scheletro-morta', m.rendered.length === 0 && !(m.ctx.STATE.sala && m.ctx.STATE.sala._muerta)); }
  // pure
  { const m = mondo(SRC, {});
    t('_edadTxtMs: 45 min · 6 h · 1,5 h · 1 min minimo', m.ctx._edadTxtMs(45 * MIN) === '45 min' && m.ctx._edadTxtMs(6 * H) === '6 h' && m.ctx._edadTxtMs(90 * MIN) === '1.5 h' && m.ctx._edadTxtMs(5000) === '1 min', [m.ctx._edadTxtMs(45 * MIN), m.ctx._edadTxtMs(6 * H), m.ctx._edadTxtMs(90 * MIN)]); }
  // ⑥⑦ il sorgente
  t('⑥ il boot ricorda l eta vera (salaFotoTs = f.ts) accanto a `_foto_local`', /f\.r\._foto_local = Math\.max\(1, Math\.round\(\(Date\.now\(\) - f\.ts\) \/ 1000\)\);\n\s+STATE\.salaFotoTs = f\.ts;/.test(SRC));
  t('⑦ la leva si legge da /salud (`foto_viva_on`) e nasce spenta', /FOTO_VIVA_ON = String\(cercaK\(j, 'foto_viva_on'\)\) === '1'/.test(SRC) && /var FOTO_VIVA_ON = false;/.test(SRC));
  t('⑦ il /salud segna la leva «letta» e la variabile nasce non letta', /FOTO_VIVA_LEIDA = true;/.test(SRC) && /var FOTO_VIVA_LEIDA = false;/.test(SRC));
  t('versione >= 3.226.1', /sala v3\.(226\.[1-9]|22[7-9]\.\d|2[3-9]\d\.\d|[3-9]\d\d\.\d)/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('il catch con STATE.sala ridisegna sempre', "if (STATE.sala && _fotoMuerta(_salaEdadMs())) {", "if (false) {");
await mut('la foto di localStorage ridisegnata sempre', "if (_fotoMuerta(Date.now() - f.ts)) {", "if (false) {");
await mut('la guardia ignora la leva', "return _fotoVivaOn() && edadMs > FOTO_TETTO_MS;", "return edadMs > FOTO_TETTO_MS;");
await mut('il tetto raddoppiato', "var FOTO_TETTO_MS = 30 * 60000;", "var FOTO_TETTO_MS = 600 * 60000;");
await mut('?fotoviva=0 ignorato', "if (q === '1') return true; if (q === '0') return false;", "if (q === '1') return true;");
await mut('?fotoviva=1 ignorato', "const q = QS.get('fotoviva'); if (q === '1') return true;", "const q = QS.get('fotoviva');");
await mut('lo scheletro non e marcato _foto_local', "_foto_local: 1, _muerta: true,", "_muerta: true,");
await mut('le sezioni dei pedidos non si svuotano', "['secPend', 'secSinDueno', 'secMios', 'secLimpiar', 'kpis'", "['kpis'");
await mut('il mesasModel resta', "STATE.mesasModel = []; STATE.selMesas = [];", "STATE.selMesas = [];");
await mut('l eta non si dice', "hace <b>' + txt + '</b>", "hace <b>' + '</b>");
await mut('il banner resta giallo (vieja)', "of.classList.remove('vieja'); of.classList.add('show');", "of.classList.add('show', 'vieja');");
await mut('lo scheletro si ridisegna a leva spenta', "} else if (STATE.sala && !STATE.sala._muerta) {", "} else if (STATE.sala) {");
await mut('la leva non letta vale come spenta', "return FOTO_VIVA_LEIDA ? FOTO_VIVA_ON === true : true; }", "return FOTO_VIVA_ON === true; }");
await mut('kpis non si svuota', "'secLimpiar', 'kpis', 'csHero'", "'secLimpiar', 'csHero'");
await mut('csHero non si svuota', "'kpis', 'csHero', 'tick'", "'kpis', 'tick'");
await mut('il ticker resta', "'csHero', 'tick', 'vpanel'", "'csHero', 'vpanel'");
await mut('il pannello dei verbi resta', "'tick', 'vpanel', 'mesaSheetContent'", "'tick', 'mesaSheetContent'");
await mut('la scheda della mesa resta', "'vpanel', 'mesaSheetContent', 'salaSub'", "'vpanel', 'salaSub'");
await mut('csHero non si nasconde', "hh.classList.add('hide');", "");
await mut('la scheda non si chiude', "if (typeof cerrarMesa === 'function') cerrarMesa();", "");
await mut('la selezione resta', "STATE.mesasModel = []; STATE.selMesas = [];", "STATE.mesasModel = [];");
await mut('il /salud non segna letta', "FOTO_VIVA_LEIDA = true;  ", "  ");
await mut('il boot non ricorda l eta', "STATE.salaFotoTs = f.ts;   // [AUT-0663] l'eta' vera: il catch decide col tetto", "");
await mut('/salud non porta la leva', "FOTO_VIVA_ON = String(cercaK(j, 'foto_viva_on')) === '1';", "");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
