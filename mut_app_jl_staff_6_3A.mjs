// Mutanti della lista meseros dell'app JL (6.3 A): ogni mutazione su una COPIA di app_jl.html; il banco DEVE diventare rosso. Uso: node mut_app_jl_staff_6_3A.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const QUI = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/') + '/';
const SRC = readFileSync(QUI + 'app_jl.html', 'utf8').replace(/\r\n/g, '\n');
const MUT = [
  ['M1 il segreto torna in ?t=', (s) => s.replace("encodeURIComponent(LOC_PG[CFG.LOCAL] || CFG.LOCAL), { headers: { 'x-borde-token': CFG.T },", "encodeURIComponent(LOC_PG[CFG.LOCAL] || CFG.LOCAL) + '?t=' + CFG.T, { headers: {},"), ['1.05', '4.02']],
  ['M2 bordo spento/vuoto: niente ripiego GAS', (s) => s.replace("return dalGas();   // bordo spento (503) o senza persone: il GAS di sempre", 'return null;'), ['2.01', '2.02']],
  ['M3 l\'errore del GAS resta muto', (s) => s.replace("_STAFF_JL_ERR = (r && (r.error || r.exige)) || 'sin_respuesta';", "_STAFF_JL_ERR = '';"), ['3.01']],
  ['M4 nessun nuovo tentativo dopo un errore', (s) => s.replace("else { _STAFF_JL_TS = 0; _STAFF_JL_ERR = (r && (r.error", "else { _STAFF_JL_ERR = (r && (r.error"), ['3.02']],
  ['M5 la lista porta anche chi non sta in plaza', (s) => s.replace('r.staff.filter(function (s) { return s.en_plaza; })', 'r.staff'), ['1.02']],
  ['M6 RIESCO non si traduce in RSC', (s) => s.replace("RIESCO: 'RSC'", "RIESCO: 'RIESCO'"), ['1.07']],
  ['M7 la scheda torna a «Cargando…» per sempre', (s) => s.replace("(_STAFF_JL_ERR ? '<p class=\"mini\" style=\"color:#E8B23A\">⚠️ No pude traer la lista de meseros (' + esc(_STAFF_JL_ERR) + ') · reintento solo — por ahora salen solo los del turno de hoy.</p>' : '<p class=\"mini\">Cargando el personal… (ya están los del turno de hoy)</p>')", "'<p class=\"mini\">Cargando el personal… (ya están los del turno de hoy)</p>'"), ['4.01']],
  ['M8 il fallimento del bordo non porta al GAS', (s) => s.replace('.catch(function () { clearTimeout(to); return dalGas(); })', '.catch(function () { clearTimeout(to); return null; })'), ['2.03']]
];
mkdirSync(tmpdir() + '/mut_appjl', { recursive: true });
let presi = 0;
for (const [nome, f, attesi] of MUT) {
  const s2 = f(SRC);
  if (s2 === SRC) { console.log('  MUTAZIONE NON APPLICATA:', nome); continue; }
  const p = (tmpdir() + '/mut_appjl/app_jl.html').replace(/\\/g, '/'); writeFileSync(p, s2);
  const o = spawnSync(process.execPath, [QUI + 'test_app_jl_staff_08OTT2026.mjs'], { encoding: 'utf8', env: Object.assign({}, process.env, { APP_JL_HTML: p }) });
  const m = o.stdout.match(/ROSSI: ([^\n]*)/); const rs = m ? m[1].trim().split(/\s+/) : [];
  const preso = attesi.every((a) => rs.includes(a)); if (preso) presi++;
  console.log(`  ${preso ? 'PRESA ' : 'SFUGGITA'} ${nome} → rossi: ${rs.join(' ') || '(nessuno)'}${m ? '' : ' · ' + (o.stderr || o.stdout).slice(-120)}`);
}
console.log(`MUTAZIONI · ${presi}/${MUT.length} prese`);
