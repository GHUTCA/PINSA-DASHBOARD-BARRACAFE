#!/usr/bin/env node
/* SMOKE · 2.10 · pago.html fuori dal demo (legge GET /cuenta del bordo con l + pc=<folio>) · 📖 MENU V24 · 08-ott-2026
   NON È IL BANCO. Esegue lo <script> vero della pagina in un DOM finto e guarda cosa disegna per ogni risposta del bordo.
   Uso: node smoke_pago_08OTT2026.mjs      (uscita 0 = verde, 1 = almeno un rosso) */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('./pago.html', import.meta.url), 'utf8');
const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
let n = 0, rossi = 0;
const ok = (c, nome, extra) => { n++; if (c) console.log('  ✅ ' + nome); else { rossi++; console.log('  🔴 ' + nome + (extra ? '  → ' + extra : '')); } };

async function apri(query, rispondi, opz) {
  const o = Object.assign({ lang: 'es-CL' }, opz || {});
  const els = {};
  const el = (id) => (els[id] = els[id] || { id, innerHTML: '', style: {}, value: '', focus() {}, classList: { add() {}, remove() {} } });
  const chiamate = [];
  const alerts = [];
  const store = {};
  const ctx = {
    document: { getElementById: el, querySelectorAll: () => [], body: el('__body'), addEventListener() {} },
    location: { search: query, href: 'https://sistema.pinsita.cl/pago.html' + query },
    navigator: { language: o.lang, languages: [o.lang] },
    localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    URLSearchParams, AbortController, console, encodeURIComponent, JSON, Math, Date, Number, String, Array, parseInt, parseFloat, isNaN, Object,
    setTimeout: (f) => { Promise.resolve().then(f); return 1; },   // 2 s di attesa → subito
    clearTimeout() {},
    alert(m) { alerts.push(String(m)); },
    fetch: async (url, init) => { chiamate.push({ url: String(url), init }); const r = await rispondi(String(url), chiamate.length); if (r instanceof Error) throw r; return { ok: true, json: async () => r }; },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(script, ctx);
  await new Promise((r) => setTimeout(r, 30));   // lascia girare le promise
  return { body: (els.body && els.body.innerHTML) || '', foot: (els.foot && els.foot.innerHTML) || '', chiamate, ctx, alerts, els };
}
const OK = { ok: true, mesa: '12', folio: 'PC-B-261008-ABC123', total: 20000, pedidos: 1, pagado: 0, resta: 20000, resta_ignota: false,
  items: [{ n: 'Pinsa Diavola', q: 1, pu: 13200 }, { n: 'Negroni', q: 1, pu: 6800 }], cambio_dopo_carta: null };
const Q = '?l=bks&pc=pc-b-261008-abc123';

console.log('\n① la cuenta, con la chiave giusta');
{
  const r = await apri(Q, async () => OK);
  ok(r.chiamate.length === 1 && /\/cuenta\/BKS\?pc=PC-B-261008-ABC123$/.test(r.chiamate[0].url), 'una sola richiesta a /cuenta/BKS?pc=<FOLIO> (locale e folio normalizzati in maiuscolo)', r.chiamate.map((c) => c.url).join());
  ok(!!(r.chiamate[0].init.headers || {})['X-Borde-Token'] && !/[?&]t=/.test(r.chiamate[0].url), 'il token va in header X-Borde-Token, mai nell\'URL');
  ok(/Pinsa Diavola/.test(r.body) && /Negroni/.test(r.body), 'disegna le righe vere del conto');
  ok(/20\.000/.test(r.body), 'disegna il totale vero ($20.000)', r.body.slice(0, 200));
  ok(!/Esta cuenta no est/.test(r.body), 'niente messaggio di «cuenta no disponible»');
}
{
  const r = await apri('?l=bks&m=12&t=abc', async () => OK);
  ok(r.chiamate.length === 0 && /no est/.test(r.body), 'senza pc= (il vecchio l+m+t) la pagina non chiama niente e dice «no disponible»');
  const r2 = await apri('', async () => OK);
  ok(r2.chiamate.length === 0, 'senza parametri non chiama niente');
}

console.log('\n② «non so» non è una cuenta');
{
  const r = await apri(Q, async () => ({ ok: false, reintenta: true, motivo: 'cola_pg' }));
  ok(r.chiamate.length === 3, 'reintenta → 3 tentativi, non di più (' + r.chiamate.length + ')');
  ok(/No pudimos cargar/.test(r.body) && !/\$\d/.test(r.body), 'dopo i 3 tentativi lo dice, SENZA nessun totale');
  const e = await apri(Q, async () => new Error('rete'));
  ok(e.chiamate.length === 3 && /No pudimos cargar/.test(e.body), 'rete morta → stessa cosa (3 tentativi, messaggio onesto)');
  const d = await apri(Q, async () => ({ ok: false, error: 'cuenta_no_encontrada', definitivo: true }));
  ok(d.chiamate.length === 1 && /no est/.test(d.body), 'errore DEFINITIVO → un solo tentativo, «no disponible»');
  const v = await apri(Q, async (u, k) => (k < 3 ? { ok: false, reintenta: true } : OK));
  ok(v.chiamate.length === 3 && /Pinsa Diavola/.test(v.body), 'riesce al terzo tentativo → mostra il conto');
  const vuoto = await apri(Q, async () => ({ ok: true, items: [], total: 0 }));
  ok(!/Pinsa/.test(vuoto.body) && vuoto.chiamate.length === 3, 'ok ma senza righe non è un conto: non disegna niente di inventato');
}

console.log('\n③ chiusa e cambiata');
{
  const c = await apri(Q, async () => ({ ok: true, cerrada: true, total: 0, items: [] }));
  ok(/ya est/.test(c.body) && c.chiamate.length === 1, 'conto chiuso → «ya está cerrada», un solo tentativo');
  const k = await apri(Q, async () => Object.assign({}, OK, { total: 24000, cambio_dopo_carta: { carta: 20000, ora: 24000 } }));
  ok(/cambi/.test(k.body) && /20\.000/.test(k.body) && /24\.000/.test(k.body), 'se il conto è cambiato dopo la carta LO DICE (20.000 → 24.000)');
  ok(!/cambió desde/.test(r0(await apri(Q, async () => OK))), 'se non è cambiato non avvisa');
}
function r0(x) { return x.body; }

console.log('\n④ lingue e demo');
{
  const pt = await apri(Q, async () => ({ ok: true, cerrada: true }), { lang: 'pt-BR' });
  ok(/já está fechada/.test(pt.body), 'portoghese');
  const en = await apri(Q, async () => ({ ok: true, cerrada: true }), { lang: 'en-US' });
  ok(/already closed/.test(en.body), 'inglese');
  const demo = await apri('?demo=1', async () => { throw new Error('il demo non deve chiamare la rete'); });
  ok(demo.chiamate.length === 0 && /Trilog/.test(demo.body), 'il demo funziona ancora, senza rete');
}

console.log('\n⑤ il pago: POST /checkout-cuenta di pinsita-pay (contratto di 🖐 TERZA)');
const PAYOK = { ok: true, redirect_url: 'https://pay.fintoc.test/s/abc', checkout_session_id: 'cs_1', monto: 22000, consumo: 20000, propina: 2000 };
const rispondiPay = (pay) => async (u, k) => (u.includes('/checkout-cuenta') ? pay(u, k) : OK);
const post = (r) => r.chiamate.find((c) => c.url.includes('/checkout-cuenta'));
{
  const r = await apri(Q, rispondiPay(async () => PAYOK));
  r.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  const p = post(r);
  ok(p && p.url === 'https://pinsita-pay.alberto-agostini.workers.dev/checkout-cuenta' && p.init.method === 'POST', 'paga() fa POST a /checkout-cuenta di pinsita-pay');
  const body = p && JSON.parse(p.init.body);
  ok(body && body.l === 'BKS' && body.pc === 'PC-B-261008-ABC123' && body.propina_pct === 10, 'corpo: l, pc (maiuscoli) e propina_pct 10', JSON.stringify(body));
  ok(body && Object.keys(body).sort().join() === 'l,pc,propina_pct', 'il telefono NON manda importi: solo l, pc e il PORCENTAJE (il consumo e la cifra li fa il server)');
  ok(r.ctx.location.href === 'https://pay.fintoc.test/s/abc', 'va alla redirect_url di Fintoc');
  const b2 = await apri(Q, rispondiPay(async () => ({ ok: true, redirect_url: 'http://evil.test/x' })));
  b2.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  ok(!/evil/.test(b2.ctx.location.href) && b2.alerts.length === 1, 'una redirect_url NON https non si segue: avviso e basta');
  const dbl = await apri(Q, rispondiPay(async () => PAYOK));
  dbl.ctx.paga(); dbl.ctx.paga(); dbl.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  ok(dbl.chiamate.filter((c) => c.url.includes('/checkout-cuenta')).length === 1, 'tre tocchi veloci → UN solo checkout');
}
{
  const s0 = await apri(Q, rispondiPay(async () => PAYOK)); s0.ctx.PROP = 0; s0.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  ok(JSON.parse(post(s0).init.body).propina_pct === 0, 'senza propina → propina_pct 0');
  const s1 = await apri(Q, rispondiPay(async () => PAYOK)); s1.ctx.PROP = 'otro'; s1.ctx.PROP_OTRO = 3000; s1.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  ok(JSON.parse(post(s1).init.body).propina_pct === 15, 'propina «otro» $3.000 su $20.000 → 15% (la cifra la fissa il server)');
  const s2 = await apri(Q, rispondiPay(async () => PAYOK)); s2.ctx.PROP = 'otro'; s2.ctx.PROP_OTRO = 99999; s2.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  ok(JSON.parse(post(s2).init.body).propina_pct === 25, 'una propina enorme si ferma a 25%');
}
{
  const e1 = await apri(Q, rispondiPay(async () => ({ ok: false, error: 'reintenta' })));
  e1.ctx.paga(); await new Promise((x) => setTimeout(x, 60));
  ok(e1.chiamate.filter((c) => c.url.includes('/checkout-cuenta')).length === 3 && e1.alerts.length === 1 && /cargar tu cuenta/.test(e1.alerts[0]), 'reintenta → 3 tentativi poi avviso onesto, nessun redirect', e1.alerts.join('|'));
  const e2 = await apri(Q, rispondiPay(async () => ({ ok: false, error: 'cuenta_cerrada' })));
  e2.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  ok(/ya est/.test(e2.els.body.innerHTML) && e2.alerts.length === 0, 'cuenta_cerrada → la pagina passa a «ya está cerrada»');
  const e3 = await apri(Q, rispondiPay(async () => ({ ok: false, error: 'fintoc_checkout_off' })));
  e3.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  ok(e3.alerts.length === 1 && /mesero/.test(e3.alerts[0]) && !/fintoc/.test(e3.alerts[0]), 'pago spento/errore → «pídele al mesero», senza nomi tecnici');
  const e4 = await apri(Q, rispondiPay(async () => new Error('rete')));
  e4.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  ok(e4.alerts.length === 1 && e4.ctx.PAGANDO === false, 'rete caduta → avviso, e si può riprovare (PAGANDO torna false)');
}
{
  const cl = await apri(Q, async () => OK);
  ok(!/ponModo\('lomio'\)|ponModo\('iguales'\)/.test(cl.body) && /ponModo\('todo'\)/.test(cl.body), 'fuori dal demo la pagina offre SOLO «pago todo» (il parcial non esiste)');
  const dm = await apri('?demo=1', async () => OK);
  ok(/ponModo\('lomio'\)/.test(dm.body), 'nel demo le tre opzioni ci sono ancora');
  ok(/var VER = 'pago v0\.4';/.test(html.replace(/\r\n/g, '\n')), 'la targhetta è pago v0.4');
}


console.log('\n⑥ SI PAGA EL RESTO, NO EL CONSUMO (TERZA 15-ott: tras una parte pagada, el cliente pagaria dos veces)');
const R = (o) => Object.assign({}, OK, o || {});
{
  const a = await apri(Q, rispondiPay(async () => PAYOK), {});
  ok(!/Ya pagado/.test(a.body) && /\$20\.000/.test(a.body), 'nada pagado: no aparece «Ya pagado», se ve el consumo');
  const b = await apri(Q, async (u) => (u.includes('/checkout-cuenta') ? PAYOK : R({ pagado: 5000, resta: 15000 })));
  ok(/Ya pagado/.test(b.body) && /−\$5\.000/.test(b.body) && /Falta por pagar/.test(b.body) && /\$15\.000/.test(b.body), 'pagado 5.000 de 20.000: se ve «Ya pagado −$5.000» y «Falta por pagar $15.000»', b.body.slice(0, 400));
  ok(/ponModo\('todo'\)[^<]*<small>\$15\.000<\/small>/.test(b.body), 'el botón «pago todo» muestra lo que FALTA ($15.000), no el consumo');
  b.ctx.MODO = 'todo';
  ok(b.ctx.parte() === 15000 && b.ctx.lblConsumo() === 'Falta por pagar' && a.ctx.lblConsumo() === 'Consumo', 'parte() de «pago todo» = lo que FALTA ($15.000, no $20.000); la etiqueta dice «Falta por pagar» solo si ya hay una parte pagada');
  b.ctx.PROP = 'otro'; b.ctx.PROP_OTRO = 1500; b.ctx.paga(); await new Promise((x) => setTimeout(x, 30));
  const pp = post(b);
  ok(pp && JSON.parse(pp.init.body).propina_pct === 10, 'la propina «otro» en pesos se convierte a % sobre lo que FALTA (1.500 de 15.000 = 10%), no sobre el consumo', pp && pp.init.body);
  ok(pp && Object.keys(JSON.parse(pp.init.body)).sort().join() === ['l', 'pc', 'propina_pct'].join(), 'el cuerpo sigue siendo solo l · pc · propina_pct (el resto lo decide el servidor)');
}
for (const [nombre, o] of [['resta_ignota', { resta: null, pagado: null, resta_ignota: true }], ['bordo viejo sin el campo resta', { resta: undefined, pagado: undefined, resta_ignota: undefined }], ['resta no numérica', { resta: 'abc' }]]) {
  const x = await apri(Q, async (u) => (u.includes('/checkout-cuenta') ? PAYOK : R(o)));
  ok(!/onclick="paga\(\)"/.test(x.foot) && /Todavía no podemos calcular/.test(x.foot + x.body), nombre + ' ⇒ NO hay botón de pago y la página lo dice');
  ok(!/onclick="paga\(\)"/.test(x.ctx.botonesPago()) && /Todavía no podemos calcular/.test(x.ctx.botonesPago()), nombre + ' ⇒ botonesPago() (la pantalla del segundo pago y el paso final) tampoco ofrece pagar');
  x.ctx.paga(); await new Promise((z) => setTimeout(z, 30));
  ok(post(x) === undefined && x.alerts.length === 1 && /Todavía no podemos calcular/.test(x.alerts[0]), nombre + ' ⇒ paga() no llama a /checkout-cuenta (defensa): nunca se cobra el consumo', x.alerts.join('|'));
}
{
  const x = await apri(Q, async (u) => (u.includes('/checkout-cuenta') ? PAYOK : R({ pagado: 20000, resta: 0 })));
  ok(!/onclick="paga\(\)"/.test(x.foot), 'resta 0 (todo pagado) ⇒ sin botón de pago');
  for (const err of ['resta_ignota', 'resta_no_disponible', 'resta_incoerente']) {
    const e = await apri(Q, rispondiPay(async () => ({ ok: false, error: err, reintenta: true })));
    e.ctx.paga(); await new Promise((z) => setTimeout(z, 60));
    ok(e.chiamate.filter((c) => c.url.includes('/checkout-cuenta')).length === 3 && e.alerts.length === 1 && /Todavía no podemos calcular/.test(e.alerts[0]), 'el servidor dice «' + err + '» ⇒ 3 intentos y un aviso honesto, sin redirect', e.alerts.join('|'));
  }
  const p = await apri(Q, rispondiPay(async () => ({ ok: false, error: 'cuenta_pagada', cerrada: true })));
  p.ctx.paga(); await new Promise((z) => setTimeout(z, 30));
  ok(/ya está cerrada/.test(p.els.body.innerHTML) && p.alerts.length === 0, 'cuenta_pagada ⇒ la página pasa a «ya está cerrada»');
  const ec = await apri(Q, async () => ({ ok: false, reintenta: true, motivo: 'pago_en_curso' }));
  await new Promise((z) => setTimeout(z, 60));
  ok(/registrando un pago de tu mesa/.test(ec.els.body.innerHTML) && !/No pudimos cargar tu cuenta/.test(ec.els.body.innerHTML), '«reintenta · pago_en_curso» del bordo ⇒ «estamos registrando un pago de tu mesa» (nunca un importe)');
  const ot = await apri(Q, async () => ({ ok: false, reintenta: true, motivo: 'otro_motivo' }));
  await new Promise((z) => setTimeout(z, 60));
  ok(/No pudimos cargar tu cuenta/.test(ot.els.body.innerHTML), 'cualquier otro «reintenta» sigue con el texto de siempre');
  const ec2 = await apri(Q, rispondiPay(async () => ({ ok: false, error: 'reintenta', reintenta: true, motivo: 'pago_en_curso' })));
  ec2.ctx.paga(); await new Promise((z) => setTimeout(z, 60));
  ok(ec2.alerts.length === 1 && /registrando un pago de tu mesa/.test(ec2.alerts[0]), 'el checkout dice «reintenta · pago_en_curso» ⇒ el aviso lo nombra');
}

console.log('\n' + (rossi ? '🔴 ' + rossi + ' rossi su ' + n : '🟢 ' + n + ' controlli, tutti verdi'));
process.exit(rossi ? 1 : 0);
