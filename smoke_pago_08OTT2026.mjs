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
const OK = { ok: true, mesa: '12', folio: 'PC-B-261008-ABC123', total: 20000, pedidos: 1,
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
  ok(/var VER = 'pago v0\.3';/.test(html.replace(/\r\n/g, '\n')), 'la targhetta è pago v0.3');
}

console.log('\n' + (rossi ? '🔴 ' + rossi + ' rossi su ' + n : '🟢 ' + n + ' controlli, tutti verdi'));
process.exit(rossi ? 1 : 0);
