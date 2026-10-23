// BANCO · TERZA PENNA V32 · CONTROLLO DELL'AUTRICE · la guía del cobro v2.5 contro il vetro (23-oct)
// Richiesta: 🎛 `V32 LA GUIA DEL COBRO V2.5 OGGI`. Le quattro righe nuove dicono ciò che la sala fa OGGI: se la sala cambia, questo banco diventa rosso.
// node test_guia_cobro_v25_23OCT2026.mjs · --mutanti
import fs from 'node:fs';
const R = (f) => fs.readFileSync(new URL('./' + f, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const ORIG = { g: R('guia_turno.html'), s: R('sala.html'), q: R('que_cambio.html') };
function banco(S, quieto) {
  let ok = 0, ko = 0; const t = (n, c) => { c ? ok++ : ko++; if (!quieto) console.log((c ? '✓ ' : '✗ ') + n); };
  t('A · ④ la guida non promette più «o dos tarjetas»', !/\(o dos tarjetas\)/.test(S.g));
  t('A2 · ④ dice che due carte dello stesso tipo oggi non si possono, e di chiamare il JL', /Dos tarjetas del mismo tipo<\/b>[^<]*<b>hoy no se pueden<\/b>/.test(S.g) && /Llama al JL<\/b> antes de cobrar/.test(S.g));
  t('A3 · ④ ed è vero sul vetro: il mixto della sala NON ha una seconda carta dello stesso tipo (credito2/debito2)', !/credito2|debito2/.test(S.s));
  t('B · ③ sobran/faltan sta nei montos, non nella propina, e la carta è la «Venta» del voucher', /Si en <b>«¿Cuánto con cada uno\?»<\/b> dice <b>«sobran»<\/b> o <b>«faltan»<\/b>, la diferencia está <b>en los montos de los medios, no en la propina<\/b>/.test(S.g) && /«faltan \$… <b>de propina<\/b>»: ahí sí se corrige la propina/.test(S.g) && /«Venta» del voucher/.test(S.g));
  t('C · ① Falabella: non sulle promo, e dopo una parte sul resto', /No se aplica sobre lo que ya está en promoción/.test(S.g) && /<b>sobre lo que queda por pagar<\/b>/.test(S.g));
  t('D · ② una mesa aperta blocca le propinas del giorno', /las propinas de ese día quedan bloqueadas<\/b>/.test(S.g));
  t('E · la versione è la v2.5 nel piè di pagina e nell intestazione', /guía del cobro · v2\.5 · 23-oct-2026/.test(S.g) && /guia_turno\.html · v2\.5 · 23-oct-2026/.test(S.g));
  t('F · «Qué cambió» ha la sua riga e rimanda alla guida', /La guía del cobro, actualizada/.test(S.q) && /<a href="guia_turno\.html">la guía del cobro<\/a>/.test(S.q));
  return { ok, ko };
}
if (process.argv.includes('--mutanti')) {
  const M = [
    ['la guida torna a promettere due carte', 'g', 'Una parte en efectivo y otra con tarjeta, o una tarjeta de débito y una de crédito.', 'Una parte en efectivo y otra con tarjeta (o dos tarjetas).'],
    ['la sala impara la seconda carta (la riga diventa falsa)', 's', '<span class="ver" id="ver">', "<script>/* credito2 */</script><span class=\"ver\" id=\"ver\">"],
    ['senza la riga in Qué cambió', 'q', 'La guía del cobro, actualizada', 'Otra cosa'],
  ];
  let m = 0; for (const [n, f, a, b] of M) { if (!ORIG[f].includes(a)) { console.log('⚠ non applicabile: ' + n); continue; } const S = Object.assign({}, ORIG); S[f] = S[f].replace(a, b); const r = banco(S, true); console.log((r.ko ? '☠ muore  ' : '😐 VIVE   ') + n); if (r.ko) m++; }
  console.log('\nmutanti ' + m + '/' + M.length); process.exitCode = m === M.length ? 0 : 1;
} else { const r = banco(ORIG, false); console.log('\n' + (r.ko ? '🔴 ' + r.ko + ' rossi su ' + (r.ok + r.ko) : '🟢 ' + r.ok + ' controlli, tutti verdi')); process.exitCode = r.ko ? 1 : 0; }
