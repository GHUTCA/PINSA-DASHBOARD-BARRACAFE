#!/usr/bin/env node
/* SMOKE · 5.7 ⑧ · l'86 dal frontend passa dal bordo con ripiego sul GAS · 📖 MENU V24 · 08-ott-2026
   Uso: node smoke_86_frontend_08OTT2026.mjs <app_jl.html | menu_admin.html>
   Estrae `uid86` e `adminToggle86Via` dal file vero e li esegue con fetch/gasPost finti. NON È IL BANCO (è di 💵 EL GIRO). */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const file = process.argv[2];
if (!file) { console.error('uso: node smoke_86_frontend_08OTT2026.mjs <file.html>'); process.exit(2); }
const src = readFileSync(file, 'utf8');
const sn = src.replace(/\r\n/g, '\n');
function estrai(re) { const m = re.exec(sn); if (!m) throw new Error('non trovato: ' + re); return m[0]; }
const codice = estrai(/const BORDE_86 = [^\n]*\n/) + estrai(/const BORDE_TOKEN_86 = [^\n]*\n/) + estrai(/function uid86\(\)[^\n]*\n/) +
  estrai(/async function adminToggle86Via\([\s\S]*?\n\}\n/);
let n = 0, rossi = 0;
const ok = (c, nome, extra) => { n++; if (c) console.log('  ✅ ' + nome); else { rossi++; console.log('  🔴 ' + nome + (extra ? '  → ' + extra : '')); } };

function scena(bordo, opz) {
  const o = Object.assign({ search: '', local: 'BKS' }, opz || {});
  const chiamate = [], gas = [];
  const ctx = {
    CFG: { LOCAL: o.local },
    location: { search: o.search },
    URLSearchParams, AbortController, encodeURIComponent, JSON, Date, Math, setTimeout, clearTimeout, console,
    gasPost: async (action, body) => { gas.push({ action, body }); return { ok: true, via: 'gas' }; },
    fetch: async (u, init) => {
      chiamate.push({ url: String(u), init, body: JSON.parse(init.body) });
      const r = await bordo(String(u), init);
      if (r instanceof Error) throw r;
      if (r && r.__abort) { await new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('abort'), { name: 'AbortError' })))); }
      return { ok: true, json: async () => r };
    },
  };
  vm.createContext(ctx);
  vm.runInContext(codice, ctx);
  return { ctx, chiamate, gas };
}
const P = (s, ...a) => s.ctx.adminToggle86Via('1234', 'BKS-X-001', true, 'a86-prova-0001', ...a);

console.log('\n① il bordo risponde');
{
  const s = scena(async () => ({ ok: true, aceptada: true, agotado: true, user: 'JL1' }));
  const r = await P(s);
  ok(r.ok === true && s.gas.length === 0, 'bordo ok → il GAS NON si chiama');
  ok(s.chiamate.length === 1 && s.chiamate[0].url === 'https://pinsita-borde.alberto-agostini.workers.dev/admin86/BKS', 'POST a /admin86/<LOCAL> del bordo', s.chiamate.map((c) => c.url).join());
  ok(!!s.chiamate[0].init.headers['X-Borde-Token'] && !/[?&]t=/.test(s.chiamate[0].url), 'token solo in header');
  const b = s.chiamate[0].body;
  ok(b.action === 'adminToggle86' && b.pin === '1234' && b.prod_id === 'BKS-X-001' && b.value === true && b.uid === 'a86-prova-0001', 'corpo: action, pin, prod_id, value, uid (la chiave del gesto)', JSON.stringify(b));
}
{
  const s = scena(async () => ({ ok: false, error: 'pin_jl_invalido', definitivo: true }));
  const r = await P(s);
  ok(r.ok === false && r.error === 'pin_jl_invalido' && s.gas.length === 0, 'PIN sbagliato (definitivo) → si mostra, NON si ripiega sul GAS');
  const s2 = scena(async () => ({ ok: false, error: 'rate_limit', definitivo: true }));
  await P(s2);
  ok(s2.gas.length === 0, 'rate_limit (definitivo) → niente GAS');
}

console.log('\n② il bordo non risponde → GAS come sempre');
for (const [nome, bordo] of [
  ['leva spenta (404 ruta_apagada)', async () => ({ ok: false, error: 'ruta_apagada' })],
  ['need:gas (senza seme / senza PIN_JL_MAP)', async () => ({ ok: false, need: 'gas', motivo: 'sin_seme' })],
  ['rete caduta', async () => new Error('rete')],
  ['5xx senza JSON', async () => { throw new Error('http_502'); }],
  ['risposta vuota', async () => null],
]) {
  const s = scena(bordo);
  const r = await P(s);
  ok(r.via === 'gas' && s.gas.length === 1, nome + ' → ripiego sul GAS');
  ok(s.gas[0] && s.gas[0].action === 'adminToggle86' && s.gas[0].body.pin === '1234' && s.gas[0].body.prod_id === 'BKS-X-001' && s.gas[0].body.value === true, '  e il GAS riceve lo stesso gesto di prima {pin, prod_id, value}');
}
{
  const s = scena(async () => ({ __abort: true }));
  const t0 = Date.now();
  const r = await P(s);
  const ms = Date.now() - t0;
  ok(r.via === 'gas' && ms >= 2500 && ms < 4500, 'bordo muto → dopo ~3 s ripiega sul GAS (' + ms + ' ms)');
}

console.log('\n③ interruttori e chiave');
{
  const s = scena(async () => ({ ok: true }), { search: '?borde=0' });
  const r = await P(s);
  ok(s.chiamate.length === 0 && r.via === 'gas', '?borde=0 salta il bordo');
  const s2 = scena(async () => ({ ok: true }), { local: 'RIESCO' });
  await P(s2);
  ok(s2.chiamate[0].url.endsWith('/admin86/RIESCO'), 'il local del file viaggia nel path (il bordo sceglie se lo conosce)');
  const u = new Set(); for (let i = 0; i < 200; i++) u.add(s.ctx.uid86());
  ok(u.size === 200 && [...u].every((x) => /^a86-[a-z0-9]+-[a-z0-9]{1,8}$/.test(x) && x.length <= 80 && x.length >= 8), 'uid86: 200 chiavi tutte diverse, nel formato che il bordo accetta (8-80 caratteri)');
}

console.log('\n④ cuciture nel file (letto dal sorgente)');
{
  const chiamateDirette = (sn.match(/gasPost\('adminToggle86'/g) || []).length;
  ok(chiamateDirette === 1, 'l\'unica chiamata diretta al GAS è il ripiego dentro adminToggle86Via', 'trovate ' + chiamateDirette);
  ok(/adminToggle86Via\(/.test(sn.replace(/async function adminToggle86Via\(/, '')), 'il gesto dell\'86 usa adminToggle86Via');
}

console.log('\n' + (rossi ? '🔴 ' + rossi + ' rossi su ' + n : '🟢 ' + n + ' controlli, tutti verdi'));
process.exit(rossi ? 1 : 0);
