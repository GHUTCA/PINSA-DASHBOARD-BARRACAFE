/* BANCO · D8 di EL GIRO (06-ott) · «Confirma tu retiro»: Ya entregaste hoy / Con esta entrega
   Gira sulle funzioni VERE estratte da sala.html. Uso: node test_sala_d8_conferma_06OTT2026.mjs [sala.html] */
import fs from 'fs'; import vm from 'vm';
const src = fs.readFileSync(process.argv[2] || 'sala.html', 'utf8');
const prendi = (nome) => { const i = src.indexOf('function ' + nome + '('); if (i < 0) return '';
  let d = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); } } return ''; };
const W = { innerHTML: '' };
const g = { $: () => W, document: { body: { appendChild() {} }, createElement: () => W }, fmtPrice: (n) => '$' + Number(n).toLocaleString('es-CL'),
  Date, Math, Object, String, Number };
vm.createContext(g);
vm.runInContext('let _cajaConfAperta = ""; ' + prendi('_cajaConfMostrar') + '\n' + (prendi('_cajaEntregadoAntes') || ''), g);
let ok = 0, ko = 0; const vero = (n, c, i) => { c ? (ok++, console.log('  🟢 ' + n)) : (ko++, console.log('  🔴 ' + n + (i !== undefined ? ' → ' + i : ''))); };
// la riga che il vetro costruisce davvero (r = estado_mesero)
const riga = (r) => { const antes = g._cajaEntregadoAntes ? g._cajaEntregadoAntes(r) : (r.entregado || 0);
  g._cajaConfMostrar(Object.assign({}, r.por_confirmar[0], { entregado_antes: antes }));
  const m = W.innerHTML.match(/Ya entregaste hoy<\/span><b>([^<]*)<\/b>[\s\S]*Con esta entrega<\/span><b>([^<]*)<\/b>/); return m ? m[1] + ' / ' + m[2] : 'nessuna riga'; };
vero('demo 999: un ritiro in attesa e nessuno prima ⇒ $0 / $35.299',
  riga({ entregado: 35299, por_confirmar: [{ uid_gesto: 'a', monto: 35299, ts: 1 }] }) === '$0 / $35.299', riga({ entregado: 35299, por_confirmar: [{ uid_gesto: 'a', monto: 35299, ts: 1 }] }));
vero('un ritiro firmato di $10.000 prima ⇒ $10.000 / $45.299',
  riga({ entregado: 45299, por_confirmar: [{ uid_gesto: 'b', monto: 35299, ts: 1 }] }) === '$10.000 / $45.299', riga({ entregado: 45299, por_confirmar: [{ uid_gesto: 'b', monto: 35299, ts: 1 }] }));
vero('due in attesa (20.000 e 15.000), uno firmato da 5.000 ⇒ la prima scheda dice $5.000 / $25.000',
  riga({ entregado: 40000, por_confirmar: [{ uid_gesto: 'c', monto: 20000, ts: 1 }, { uid_gesto: 'd', monto: 15000, ts: 2 }] }) === '$5.000 / $25.000', riga({ entregado: 40000, por_confirmar: [{ uid_gesto: 'c', monto: 20000, ts: 1 }, { uid_gesto: 'd', monto: 15000, ts: 2 }] }));
vero('mai sotto zero (entregado in ritardo rispetto al pendiente)',
  riga({ entregado: 0, por_confirmar: [{ uid_gesto: 'e', monto: 1000, ts: 1 }] }) === '$0 / $1.000');
vero('le due chiamate del vetro usano la stessa regola (nessun «entregado_antes: r.entregado» rimasto)', !/entregado_antes:\s*r\.entregado/.test(src));
vero('il giro del mesero è a 10 s', /setInterval\(_cajaGiroMesero, 10000\)/.test(src));
console.log((ko ? '🔴 ' : '🟢 ') + ok + ' verdi · ' + ko + ' rossi'); process.exit(ko ? 1 : 0);
