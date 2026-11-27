// Prima testa (🎟): le funzioni VERE di mi_tarjeta.html (estratte dal file) contro un verificatore indipendente (node:crypto),
// come lo farebbe il bordo: segreto = HMAC(CHIAVE, local|id|disp|epoca), token = L1.id.t.base64url(HMAC(seg, "id|t")[0..10]).
import { readFileSync } from 'node:fs';
import { createHmac, timingSafeEqual } from 'node:crypto';
const src = readFileSync(process.argv[2], 'utf8');
const a = src.indexOf('function b64uDecode'), b = src.indexOf('/* ═══ IL SEGRETO');
const code = 'const BLOCCO_MS = 30000;' + src.slice(a, b) + '; return { b64uDecode, b64uEncode, bloqueDe, firmaToken };';
const P = new Function('crypto', 'atob', 'btoa', 'TextEncoder', code)(globalThis.crypto, globalThis.atob, globalThis.btoa, TextEncoder);
const CHIAVE = 'chiave-del-bordo-di-prova';
const deriva = (l, id, d, ep) => createHmac('sha256', CHIAVE).update(l + '|' + id + '|' + d + '|' + ep).digest().toString('base64url');
function verifica(tok, seg, ora) {
  const m = /^L1\.([A-Za-z0-9_-]{2,30})\.(\d{1,12})\.([A-Za-z0-9_-]{14})$/.exec(tok); if (!m) return 'token_forma';
  const [, id, ts, f] = m, t = Number(ts), now = Math.floor(ora / 30000);
  if (Math.abs(t - now) > 2) return 'hora_del_telefono';
  const att = createHmac('sha256', Buffer.from(seg, 'base64url')).update(id + '|' + t).digest().subarray(0, 10);
  const got = Buffer.from(f, 'base64url');
  return got.length === att.length && timingSafeEqual(got, att) ? 'ok' : 'no_vinculado';
}
let ok = 0, ko = 0; const prova = (n, c) => { if (c) ok++; else { ko++; console.log('ROSSO', n); } };
const seg1 = deriva('BKS', 'm0123456789ab', 'd00aa', 1), seg2 = deriva('BKS', 'm0123456789ab', 'd00aa', 2), segAltro = deriva('BKS', 'm0123456789ab', 'd00bb', 1);
const ORA = Date.UTC(2026, 11, 4, 22, 0, 7), t = P.bloqueDe(ORA);
const tok = await P.firmaToken(seg1, 'm0123456789ab', t);
prova('forma L1.id.t.firma (14 car.)', /^L1\.m0123456789ab\.\d+\.[A-Za-z0-9_-]{14}$/.test(tok));
prova('il bordo verifica il token del telefono', verifica(tok, seg1, ORA) === 'ok');
prova('blocco di 30 s', t === Math.floor(ORA / 30000) && P.bloqueDe(ORA + 29999 - (ORA % 30000)) === t && P.bloqueDe(ORA - (ORA % 30000) + 30000) === t + 1);
prova('±2 blocchi accettati', verifica(tok, seg1, ORA + 60000) === 'ok' && verifica(tok, seg1, ORA - 60000) === 'ok');
prova('3 blocchi = hora_del_telefono, non firma', verifica(tok, seg1, ORA + 90000) === 'hora_del_telefono');
prova('epoca nuova revoca il vecchio telefono', verifica(tok, seg2, ORA) === 'no_vinculado');
prova('un altro dispositivo non vale', verifica(tok, segAltro, ORA) === 'no_vinculado');
const tokAltroId = tok.replace('m0123456789ab', 'm0123456789ac');
prova('cambiare l id rompe la firma', verifica(tokAltroId, seg1, ORA) === 'no_vinculado');
const tokAltroT = tok.replace('.' + t + '.', '.' + (t + 1) + '.');
prova('cambiare t rompe la firma', verifica(tokAltroT, seg1, ORA) === 'no_vinculado');
prova('stesso blocco = stesso token (deterministico)', (await P.firmaToken(seg1, 'm0123456789ab', t)) === tok);
prova('blocco dopo = token diverso', (await P.firmaToken(seg1, 'm0123456789ab', t + 1)) !== tok);
prova('base64url andata e ritorno', P.b64uEncode(P.b64uDecode(seg1)) === seg1);
const demo = 'ZGVtby1zZWdyZXRvLWRlbC1kaXNwb3NpdGl2by0zMmI';
prova('il segreto demo passa la forma della pagina', /^[A-Za-z0-9_-]{16,128}$/.test(demo) && (await P.firmaToken(demo, 'mdemo1234abcd', t)).startsWith('L1.mdemo1234abcd.'));
prova('il token entra in un QR M senza problemi (<= 60 car.)', tok.length <= 60);
console.log('banco firma', ok + '/' + ko, '· esempio di lunghezza', tok.length);
process.exitCode = ko ? 1 : 0;
