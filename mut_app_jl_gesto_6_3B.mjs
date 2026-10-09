// Mutanti di «Guardar» dal bordo (6.3 B, app): ogni mutazione su una COPIA di app_jl.html; il banco DEVE diventare rosso. Uso: node mut_app_jl_gesto_6_3B.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const QUI = dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/') + '/';
const SRC = readFileSync(QUI + 'app_jl.html', 'utf8').replace(/\r\n/g, '\n');
const MUT = [
  ['M1 su timeout si ripiega sul GAS', (s) => s.replace("catch (e) { clearTimeout(to); return { usado: true, ok: false, timeout: true, hechos: i }; }", 'catch (e) { clearTimeout(to); return { usado: false }; }'), ['5.01']],
  ['M2 «agregar» ignorato', (s) => s.replace('if (!agregar) { for (const n of previos)', 'if (true) { for (const n of previos)'), ['2.04']],
  ['M3 la sostituzione perde il sustituye_persona_id', (s) => s.replace("sustituye_persona_id: aQuitar[0].persona_id, motivo:", "motivo:"), ['2.01', '2.02']],
  ['M4 «gate_spento» non ripiega', (s) => s.replace("if (i === 0) return { usado: false };", "if (i === 0) return { usado: true, ok: false, err: 'gate' };"), ['3.04', '3.05', '3.06']],
  ['M5 l\'uid_gesto è lo stesso per ogni gesto', (s) => s.replace("uid_gesto: _uidGesto(), pin_jl", "uid_gesto: 'g-fisso-0001', pin_jl"), ['2.03']],
  ['M6 il PIN del JL non viaggia', (s) => s.replace(", pin_jl: STATE.pin }, gestos[i]);", " }, gestos[i]);"), ['1.03']],
  ['M7 il segreto torna in ?t=', (s) => s.replace("encodeURIComponent(LOC_PG[CFG.LOCAL] || CFG.LOCAL), { method: 'POST', headers: { 'content-type': 'application/json', 'x-borde-token': CFG.T }", "encodeURIComponent(LOC_PG[CFG.LOCAL] || CFG.LOCAL) + '?t=' + CFG.T, { method: 'POST', headers: { 'content-type': 'application/json' }"), ['1.02', '7.02']],
  ['M8 su errore vero si ripiega sul GAS', (s) => s.replace("if (j.ok === false) return { usado: true, ok: false, err:", "if (j.ok === false) return { usado: false, err:"), ['4.01', '4.02', '4.03']],
  ['M9 la riga ottimista non si toglie', (s) => s.replace("togli(); toast('err', '✋ No se guardó: ' + (bd.bloqueado", "toast('err', '✋ No se guardó: ' + (bd.bloqueado"), ['4.04']],
  ['M10 anche con la lista del GAS prova il bordo', (s) => s.replace("if (_STAFF_JL_FONTE !== 'bordo') return { usado: false };", ''), ['3.01']],
  ['M11 la franja vecchia va al bordo', (s) => s.replace("if (!/^([01][0-9]|2[0-3]):[0-5][0-9]-([01][0-9]|2[0-3]|24):[0-5][0-9]$/.test(f)) return { usado: false };", ''), ['3.02']],
  ['M12 un nome non risolvibile non ripiega', (s) => s.replace("const pp = porNombre(n); if (!pp) return { usado: false };", "const pp = porNombre(n); if (!pp) continue;"), ['3.03']]
];
mkdirSync(tmpdir() + '/mut_appjl_b', { recursive: true });
let presi = 0;
for (const [nome, f, attesi] of MUT) {
  const s2 = f(SRC);
  if (s2 === SRC) { console.log('  MUTAZIONE NON APPLICATA:', nome); continue; }
  const p = (tmpdir() + '/mut_appjl_b/app_jl.html').replace(/\\/g, '/'); writeFileSync(p, s2);
  const o = spawnSync(process.execPath, [QUI + 'test_app_jl_gesto_08OTT2026.mjs'], { encoding: 'utf8', env: Object.assign({}, process.env, { APP_JL_HTML: p }) });
  const m = o.stdout.match(/ROSSI: ([^\n]*)/); const rs = m ? m[1].trim().split(/\s+/) : [];
  const preso = attesi.every((a) => rs.includes(a)); if (preso) presi++;
  console.log(`  ${preso ? 'PRESA ' : 'SFUGGITA'} ${nome} → rossi: ${rs.join(' ') || '(nessuno)'}${m ? '' : ' · ' + (o.stderr || o.stdout).slice(-120)}`);
}
console.log(`MUTAZIONI · ${presi}/${MUT.length} prese`);
