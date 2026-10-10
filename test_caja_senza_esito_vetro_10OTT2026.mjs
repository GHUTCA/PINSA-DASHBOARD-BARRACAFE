// BANCO · LA BARRA «UN GESTO NO LLEGO A LA BASE DE DATOS» NEL VETRO DELLA CAJERA (V28, collaudo 10-ott: «il bordo dice creada, la riga va in quarantena, il vetro deve dirlo») · TERZA PENNA
// Criteri: ① una lettura con senza_esito accende la barra ROSSA in OGNI schermata (la costruisce barra()) con COSA, QUALE sobre/macchina, A CHE ORA e PERCHE' in parole sue — mai il JSON ② una lettura buona senza il campo
//          la spegne da sola (ormai e arrivato) ③ «Entendido» la nasconde per QUEL gesto e non per gli altri (si ricorda) ④ nessun HTML iniettabile (uid, testi) ⑤ una lettura FALLITA non cancella la barra
//          ⑥ senza nulla da dire la barra e quella di ieri ⑦ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 320))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const a = SRC.slice(Math.max(0, i - 6), i) === 'async ' ? i - 6 : i;
  const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(a, eol + 1);
  return SRC.slice(a, SRC.indexOf('\n}\n', i) + 3); };

function mondo(SRC, o) {
  o = o || {}; const ls = new Map(), removed = [];
  const ctx = { JSON, Math, Date, String, Number, Object, Array, Promise, RegExp, encodeURIComponent, PROVA: false, SES: { user: 'Mayra' }, PASO: 1, LOCAL: 'bks', BORDE: { bks: 'https://borde.test' }, TOKEN: 't', PIN_CAJA: '1111', toast() {},
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, v) },
    document: { getElementById: (id) => (id === 'senzaEsito' ? { remove() { removed.push(id); } } : null) },
    esRespuestaPin: async () => false, risp: o.risp, fetch: async () => { if (ctx.risp === 'rete') throw new Error('rete'); return { ok: true, status: 200, json: async () => ctx.risp }; } };
  vm.createContext(ctx);
  const a = SRC.indexOf('var SENZA_ESITO'), b = SRC.indexOf('/* [05-ott · modo prueba] planta una caja_sobre');
  vm.runInContext(fnDe(SRC, 'esc') + '\n' + SRC.slice(a, b) + '\n' + fnDe(SRC, 'barra') + '\n' + fnDe(SRC, 'getCaja') + '\nthis.F = { barra, getCaja, senzaEsitoHtml, cajaVistoSE, seVistos, seIdSeguro };', ctx);
  return { ctx, ls, removed };
}
const SE = (extra) => Object.assign({ uid: 'cnt-1005', accion: 'caja_conteo', que: 'el conteo', estado: 'failed', motivo: 'ingest_quarantena', detalle: '1005', ts: new Date('2026-10-10T12:30:00').getTime() }, extra || {});

async function banco(SRC) {
  { const m = mondo(SRC, { risp: { ok: true, sobres: [], senza_esito: [SE()] } }); const r = await m.ctx.F.getCaja('manana?dia=x');
    const h = m.ctx.F.barra(true);
    t('① la lectura con senza_esito enciende la barra, en la barra de CUALQUIER pantalla', r.ok === true && /⚠ Un gesto NO llegó a la base de datos/.test(h) && /id="senzaEsito"/.test(h), h.slice(0, 200));
    t('① bis dice COSA, QUE sobre, A QUE HORA y POR QUE en palabras: «el conteo · 1005 · 12:30 — la base de datos rechazó el registro»', /el conteo · 1005 · 12:30[^—]*— la base de datos rechazó el registro/.test(h), h);
    t('① ter NUNCA el codigo crudo ni JSON (el codigo corto solo esta traducido)', !/ingest_quarantena/.test(h) && !/\{|per_partizione/.test(h.replace(/style="[^"]*"/g, '')), h);
    t('① quater le dice a quien avisar y que no se repite solo', /Avisa a Alberto/.test(h) && /No se repite solo/.test(h)); }
  { const m = mondo(SRC, { risp: { ok: true, senza_esito: [SE(), SE({ uid: 'p-1', que: 'el corte POS', detalle: 'Caja 1', motivo: 'sin_confirmar', estado: 'pendiente' })] } }); await m.ctx.F.getCaja('x');
    const h = m.ctx.F.barra(false);
    t('① quinto dos gestos: plural y las dos lineas, el pendiente con «todavía no se confirma»', /2 gestos NO llegaron/.test(h) && /el corte POS · Caja 1/.test(h) && /todavía no se confirma/.test(h), h); }
  // ② se apaga sola
  { const m = mondo(SRC, { risp: { ok: true, senza_esito: [SE()] } }); await m.ctx.F.getCaja('x'); m.ctx.risp = { ok: true, sobres: [] }; await m.ctx.F.getCaja('x');
    t('② una lectura buena SIN el campo apaga la barra (el gesto ya llego o ya se barrio)', !/senzaEsito/.test(m.ctx.F.barra(true)) && !/⚠/.test(m.ctx.F.barra(true))); }
  { const m = mondo(SRC, { risp: { ok: true, senza_esito: [SE()] } }); await m.ctx.F.getCaja('manana?dia=x'); m.ctx.risp = { ok: true, libro: null }; await m.ctx.F.getCaja('libro_ventana?dia=x&desde=a&hasta=b');
    t('② bis libro_ventana (nunca lleva el campo) NO vacia la barra; una lectura de pantalla si', /senzaEsito|⚠/.test(m.ctx.F.barra(true))); m.ctx.risp = { ok: true, sobres: [] }; await m.ctx.F.getCaja('manana?dia=x'); t('② ter y la lectura de pantalla siguiente la apaga', !/⚠/.test(m.ctx.F.barra(true))); }
  // ③ Entendido
  { const m = mondo(SRC, { risp: { ok: true, senza_esito: [SE(), SE({ uid: 'otro-2', detalle: '1006' })] } }); await m.ctx.F.getCaja('x');
    m.ctx.F.cajaVistoSE('cnt-1005');
    const h = m.ctx.F.barra(true);
    t('③ «Entendido» oculta ESE gesto y deja el otro', !/1005/.test(h) && /1006/.test(h) && /Un gesto NO llegó/.test(h), h);
    t('③ bis queda recordado (localStorage) y se pide al DOM sacar la barra actual', m.ctx.F.seVistos().indexOf('cnt-1005') >= 0 && m.removed.length === 1, [m.ctx.F.seVistos(), m.removed]);
    await m.ctx.F.getCaja('x');
    t('③ ter una lectura nueva con el MISMO gesto no lo vuelve a mostrar', !/1005/.test(m.ctx.F.barra(true)));
    t('③ quater el recuerdo tiene tope (50): no crece sin limite', (() => { for (let i = 0; i < 70; i++) m.ctx.F.cajaVistoSE('g' + i); return m.ctx.F.seVistos().length <= 50; })()); }
  // ④ seguridad
  { const m = mondo(SRC, { risp: { ok: true, senza_esito: [SE({ uid: "x'); alert(1);//<img src=x onerror=alert(2)>", que: '<b>el conteo</b>', detalle: '"><script>1</script>', motivo: '<i>x</i>' })] } }); await m.ctx.F.getCaja('x');
    const h = m.ctx.F.barra(true);
    t('④ ningun HTML ni comilla del bordo sale sin escapar (uid saneado a [A-Za-z0-9_:.-], textos con esc)', !/<img/.test(h) && !/<script/.test(h) && !/<b>el conteo/.test(h) && !/alert\(1\)/.test(h.replace(/onclick="[^"]*"/g, '')) && /onclick="cajaVistoSE\('[A-Za-z0-9_:.-]*'\)"/.test(h), h);
    t('④ bis seIdSeguro: sin comillas, parentesis ni espacios, tope 60', m.ctx.F.seIdSeguro("a'b\"c d(e)<f>") === 'abcdef' && m.ctx.F.seIdSeguro('x'.repeat(100)).length === 60); }
  // ⑤ una lectura fallida
  { const m = mondo(SRC, { risp: { ok: true, senza_esito: [SE()] } }); await m.ctx.F.getCaja('x'); m.ctx.risp = 'rete'; const r = await m.ctx.F.getCaja('x');
    t('⑤ sin red: la lectura falla y la barra SIGUE (no se borra lo que no se pudo confirmar)', r.ok === false && /⚠/.test(m.ctx.F.barra(true)));
    m.ctx.risp = { ok: false, error: 'pg_no_responde' }; await m.ctx.F.getCaja('x');
    t('⑤ bis un error del bordo tampoco la borra', /⚠/.test(m.ctx.F.barra(true))); }
  // ⑥ nada que decir
  { const m = mondo(SRC, { risp: { ok: true } }); await m.ctx.F.getCaja('x'); const h = m.ctx.F.barra(true);
    t('⑥ sin nada: la barra es la de siempre (sin ⚠), con la hora y la version', !/⚠/.test(h) && /class="bar"/.test(h) && /caja 1\.[7-9]\.\d/.test(h), h.slice(0, 200)); }
  t('⑦ version >= 1.7.0', /caja 1\.[7-9]\.\d<\/small>/.test(SRC));
}
await banco(SRC0);
const mut = async (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { await banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑦ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
await mut('la barra no esta en barra()', "function barra(titulo) {\n  return senzaEsitoHtml() + (PROVA ?", "function barra(titulo) {\n  return (PROVA ?");
await mut('libro_ventana vacia la barra', "if (path.indexOf('libro_ventana') !== 0) SENZA_ESITO", "if (true) SENZA_ESITO");
await mut('getCaja no recoge la lista', "SENZA_ESITO = Array.isArray(j.senza_esito) ? j.senza_esito : [];", "");
await mut('una lectura buena no apaga', "SENZA_ESITO = Array.isArray(j.senza_esito) ? j.senza_esito : [];", "if (Array.isArray(j.senza_esito)) SENZA_ESITO = j.senza_esito;");
await mut('Entendido no oculta', "vistos.indexOf(seIdSeguro(x.uid)) < 0", "true");
await mut('Entendido oculta todo', "vistos.indexOf(seIdSeguro(x.uid)) < 0", "vistos.length === 0");
await mut('el codigo crudo en pantalla', "esc(SE_MOTIVO[x.motivo] || x.motivo || '')", "esc(x.motivo || '')");
await mut('uid sin sanear', "return String(x == null ? '' : x).replace(/[^A-Za-z0-9_:.-]/g, '').slice(0, 60);", "return String(x == null ? '' : x);");
await mut('texto sin esc', "'<br>' + esc(x.que || 'un gesto')", "'<br>' + (x.que || 'un gesto')");
await mut('recuerdo sin tope', "v.slice(-50)", "v");
await mut('sin la hora', "(hh ? ' · ' + hh : '')", "''");
await mut('sin el detalle', "(x.detalle ? ' · ' + esc(x.detalle) : '')", "''");
await mut('un error de red borra la barra', "} catch (e) { return { ok:false, error:'sin_red' }; }", "} catch (e) { SENZA_ESITO = []; return { ok:false, error:'sin_red' }; }");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
