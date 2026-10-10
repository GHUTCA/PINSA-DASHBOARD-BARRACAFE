// BANCO · I CORTES POS: IL SEPARATORE DELLE MIGLIAIA MENTRE SI SCRIVE (Alberto via V28, 10-ott: «1.802.361») · TERZA PENNA
// Criteri: ① una cifra si formatta al volo (1802361 → 1.802.361), con $ , spazi e zeri iniziali ② l'operazione e IDEMPOTENTE ③ cio che NON e una cifra resta com'e (resta invalido: il punto (e) di BKP del 09-ott,
//          «un - o un . non diventa un corte 0») ④ il valore formattato si legge COME PRIMA (stesse cifre) ⑤ il valore gia salvato si mostra formattato ⑥ il formato va PRIMA del confronto ⑦ mutanti.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path';
const AQUI = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC0 = fs.readFileSync(process.argv[2] || path.join(AQUI, 'caja_cajera.html'), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0, muto = false; const t = (n, c, i) => { c ? ok++ : (ko++, muto || console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 300))); };
const fnDe = (SRC, nome) => { const i = SRC.indexOf('function ' + nome + '('); if (i < 0) throw new Error(nome); const eol = SRC.indexOf('\n', i), r1 = SRC.slice(i, eol);
  if (/\}\s*$/.test(r1) && (r1.match(/\{/g) || []).length === (r1.match(/\}/g) || []).length) return SRC.slice(i, eol + 1);
  return SRC.slice(i, SRC.indexOf('\n}\n', i) + 3); };
function mondo(SRC) {
  const ctx = { String, RegExp }; vm.createContext(ctx);
  vm.runInContext(['miles', 'milesDe', 'milesInput'].map((n) => fnDe(SRC, n)).join('\n') + '\nthis.F = { miles, milesDe, milesInput };', ctx); return ctx.F;
}
function banco(SRC) {
  const F = mondo(SRC), D = F.milesDe;
  t('① 1802361 → 1.802.361', D('1802361') === '1.802.361', D('1802361'));
  t('① bis mientras se escribe: 1 · 18 · 180 · 1802 · 18023 · 180236 · 1802361', ['1', '18', '180', '1802', '18023', '180236', '1802361'].map(D).join('|') === '1|18|180|1.802|18.023|180.236|1.802.361', ['1', '18', '180', '1802', '18023', '180236', '1802361'].map(D));
  t('① ter con $ , y espacios: «$ 1802361» · «1,802,361» · «1 802 361» → 1.802.361', D('$ 1802361') === '1.802.361' && D('1,802,361') === '1.802.361' && D('1 802 361') === '1.802.361', [D('$ 1802361'), D('1,802,361'), D('1 802 361')]);
  t('① quater ceros iniciales fuera, pero un 0 solo es un 0 (una maquina sin movimiento es un corte declarado)', D('0012') === '12' && D('0') === '0' && D('000') === '0', [D('0012'), D('0'), D('000')]);
  t('② idempotente: formatear lo ya formateado no cambia nada', ['1.802.361', '12.000', '999', '0'].every((x) => D(x) === x) && D(D('1802361')) === D('1802361'));
  t('③ lo que NO es una cifra se deja como esta (sigue invalido): «-» · «.» · «12a» · «-5» · vacio', D('-') === '-' && D('.') === '.' && D('12a') === '12a' && D('-5') === '-5' && D('') === '', [D('-'), D('.'), D('12a'), D('-5'), D('')]);
  const valida = /^[\s$]*\d[\d.,\s]*$/;   // la regla de valores() en pantalla8 (guardia de fuente mas abajo)
  t('④ el valor formateado sigue siendo «valido» y tiene las MISMAS cifras que lo escrito', ['1802361', '$ 45000', '1,000', '0'].every((x) => valida.test(D(x)) && D(x).replace(/[^0-9]/g, '') === x.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '')));
  t('④ bis … y valores() sigue parseando con replace(/[^0-9]/g)', /Number\(raw\.replace\(\/\[\^0-9\]\/g, ''\)\)/.test(SRC) && SRC.includes("/^[\\s$]*\\d[\\d.,\\s]*$/.test(raw)"));
  let valor = '1802361'; const el = { get value() { return valor; }, set value(v) { valor = v; }, listeners: {}, addEventListener(e, fn) { this.listeners[e] = fn; } };
  F.milesInput(el); el.listeners.input();
  t('② el handler de input reescribe el campo', valor === '1.802.361', valor);
  valor = '12a'; el.listeners.input(); t('③ y no toca lo invalido', valor === '12a', valor);
  t('⑤ el corte ya guardado se muestra formateado (miles(prev.corte))', /value="' \+ \(prev \? miles\(prev\.corte\) : ''\) \+ '"/.test(SRC));
  const iF = SRC.indexOf('milesInput(el); el.addEventListener(\'input\', comparar)');
  t('⑥ el formato se engancha ANTES del confronto (comparar lee el valor ya formateado)', iF > 0);
  t('⑥ bis version >= 1.4.0 (el separador de miles ya esta)', /caja 1\.[4-9]\.\d<\/small>/.test(SRC));
}
banco(SRC0);
const mut = (nome, da, a) => { if (!SRC0.includes(da)) { ko++; console.log('✗ mutante «' + nome + '»: stringa non trovata'); return; }
  const k0 = ko, o0 = ok; muto = true; const k1 = ko; try { banco(SRC0.replace(da, () => a)); } catch (e) { ko++; } muto = false; const rossi = ko - k1; ko = k0; ok = o0;
  t('⑦ mutante «' + nome + '» => banco ROSSO', rossi > 0, rossi); };
mut('separador mal', "String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')", "String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')");
mut('formatea lo invalido', "if (!/^[\\s$]*\\d[\\d.,\\s]*$/.test(r)) return r;", "");
mut('el cero solo desaparece', ".replace(/^0+(?=\\d)/, '')", ".replace(/^0+/, '')");
mut('ceros iniciales se quedan', ".replace(/[^0-9]/g, '').replace(/^0+(?=\\d)/, ''));", ".replace(/[^0-9]/g, ''));");
mut('el handler no reescribe', "if (f !== el.value) el.value = f;", "");
mut('lo guardado sin formato', "value=\"' + (prev ? miles(prev.corte) : '') + '\">'", "value=\"' + (prev ? prev.corte : '') + '\">'");
mut('el formato despues del confronto', "milesInput(el); el.addEventListener('input', comparar);", "el.addEventListener('input', comparar);");
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
