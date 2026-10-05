/* 🎛 BANCO · CARGO CAJA NELLA TORRE — prima testa, TERZA PENNA · 03-ott-2026
   Gira sul sorgente VERO di atalaya.html (estratto, non riscritto): prova che
   la porta della cajera esiste, è esclusiva del cargo CAJA, e che CAJA resta
   nella sua casa (ALCANCE) come JL/OP — mai '*'.
   uso: node test_cargo_caja_torre_03OTT2026.mjs                             */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('./atalaya.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) throw new Error('script non trovato');
/* stub minimo del DOM: il file chiama gid()/addEventListener al caricamento
   per disegnare la torre — qui non disegniamo niente, ci servono solo le
   funzioni pure (ALCANCE, puertasDe, rolPuede, puertasAbiertas, alcanceDe). */
const nodoFinto = { classList: { toggle(){}, add(){}, remove(){} }, addEventListener(){}, style: {},
  appendChild(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }, set innerHTML(v){}, get innerHTML(){ return ''; } };
const documentoFinto = {
  getElementById(){ return nodoFinto; }, addEventListener(){}, querySelector(){ return null; },
  querySelectorAll(){ return []; }, createElement(){ return nodoFinto; },
  body: nodoFinto, documentElement: nodoFinto,
};
const ctx = { console, document: documentoFinto, window: {}, localStorage: { getItem(){ return null; }, setItem(){}, removeItem(){} },
  location: { search: '', href: '' }, fetch: () => Promise.resolve({ ok: false }),
  setTimeout, clearTimeout, setInterval: () => 0, clearInterval(){}, navigator: { userAgent: '' } };
vm.createContext(ctx);
/* Tutto il file vive dentro una sola IIFE `(function(){ ... })();` — ALCANCE
   e le altre non sono visibili da fuori. L'estrazione si inietta PRIMA della
   chiusura, non dopo: stessa funzione, un'uscita in più. */
const scriptConExport = 'var API;\n' + m[1].replace(/\}\)\(\);\s*$/,
  'API = { ALCANCE, puertasDe, rolPuede, puertasAbiertas, alcanceDe };\n  })();');
vm.runInContext(scriptConExport, ctx);
const { ALCANCE, puertasDe, rolPuede, puertasAbiertas, alcanceDe } = ctx.API;

let ok = 0, ko = 0;
const check = (nome, cond) => { console.log((cond ? '🟢' : '🔴') + ' ' + nome); cond ? ok++ : ko++; };

const F_BKS = { tipo: 'bks', scope: 'bks', emp: 'BKS' };
const puertas = puertasDe(F_BKS);
const cajaDoors = puertas.filter(p => p.href === 'caja_cajera.html');

check('① la puerta de la caja existe en el facade bks', cajaDoors.length === 1);
check('② roles = exactamente "CAJA", ninguna otra sigla', cajaDoors[0] && cajaDoors[0].roles === 'CAJA');
check('③ soloConSesion:true (firma_caja viene de la sesión del portal, no de un código de turno)',
  cajaDoors[0] && cajaDoors[0].soloConSesion === true);

const CARGOS = ['OP', 'JL', 'JB', 'CC', 'GO', 'GC', 'GG', 'CAJA'];
for (const rol of CARGOS) {
  const abiertas = puertasAbiertas(F_BKS, rol).map(p => p.href);
  const ve = abiertas.indexOf('caja_cajera.html') >= 0;
  if (rol === 'CAJA') check('④ CAJA VE su propia puerta', ve);
  else check('④ ' + rol + ' NO ve la puerta de la caja (exclusiva)', !ve);
}

check('⑤ CAJA no ve ninguna otra puerta de bks (solo la suya)',
  puertasAbiertas(F_BKS, 'CAJA').length === 1);

check('⑥ ALCANCE.CAJA = "casa", igual que JL/OP — nunca "*"', ALCANCE.CAJA === 'casa');
check('⑦ alcanceDe resuelve CAJA a SU local, no a toda la torre',
  JSON.stringify(alcanceDe({ role: 'CAJA', local: 'rsc' })) === JSON.stringify(['rsc']));
check('⑧ un CAJA sin local (local vacío) no ve ningún local — prudencia, no "*"',
  JSON.stringify(alcanceDe({ role: 'CAJA', local: '' })) === JSON.stringify([]));

/* ═══ MUTAZIONE — se la condivisione tornasse larga ═══ */
{
  const mHtml = html.replace("roles:'CAJA', soloConSesion:true", "roles:'CAJA,JL', soloConSesion:true");
  const mCtx = { console, document: documentoFinto, window: {}, localStorage: ctx.localStorage,
    location: { search: '', href: '' }, fetch: ctx.fetch, setTimeout, clearTimeout,
    setInterval: () => 0, clearInterval(){}, navigator: { userAgent: '' } };
  vm.createContext(mCtx);
  const mScript = 'var API;\n' + mHtml.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/\}\)\(\);\s*$/, 'API = { puertasAbiertas };\n  })();');
  vm.runInContext(mScript, mCtx);
  const jlVede = mCtx.API.puertasAbiertas(F_BKS, 'JL').some(p => p.href === 'caja_cajera.html');
  check('MUTAZIONE — se roles diventasse "CAJA,JL", il banco lo vede (JL vedrebbe la caja)', jlVede === true);
}

console.log('\n═══ ESITO: ' + ok + '/' + (ok + ko) + ' ═══');
console.log(ko === 0 ? '🟢 la porta è esclusiva del cargo CAJA, e CAJA resta nella sua casa.' : '🔴 NON consegnare.');
process.exit(ko === 0 ? 0 : 1);
