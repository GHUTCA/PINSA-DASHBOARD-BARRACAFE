// BANCO · la caduta su Google sul vetro del mesero (sala.html) · 03-ott-2026
// Criteri di DESIGN V24 (bacheca «DESIGN CADUTA GOOGLE SUL VETRO», ④):
//  ① fallback → la riga esce e comincia con «Salió» · ② il chip resta dopo il toast ·
//  ③ il chip se ne va quando il bordo vede quel pedido · ④ cammino normale ⇒ niente riga, niente chip ·
//  ⑤ il chip non è `urge` (colore `sig`) · + leva NASCE SPENTA: spenta = mondo di ieri.
import fs from 'node:fs';
import vm from 'node:vm';

const SRC = fs.readFileSync(new URL('./sala.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0;
const t = (nome, cond) => { if (cond) { ok++; } else { ko++; console.log('✗', nome); } };

// ── estrazione del blocco puro (dal marcatore al fondo di _cadutaBandaHtml)
const i0 = SRC.indexOf("const CADUTA_RIGA");
const i1 = SRC.indexOf('function _cadutaBandaHtml');
const i2 = SRC.indexOf('\n}\n', i1) + 3;
t('blocco estraibile', i0 > 0 && i1 > i0 && i2 > i1);
const blocco = SRC.slice(i0, i2);

function mondo(leva) {
  const ctx = {
    CADUTA_GOOGLE_ON: leva,
    esc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    Date, Object, String,
  };
  vm.createContext(ctx);
  // `const` non finisce nel contesto: si espongono le uniche cose che il banco guarda
  vm.runInContext(blocco + '\n;this.API = { CADUTA_RIGA, CADUTA_CHIP, _CAIDOS, _cadutaMarca, _cadutaDichiara, _cadutaSalaDelBordo, _cadutaPotatura, _cadutaChipHtml, _cadutaBandaHtml };', ctx);
  return ctx.API;
}

// ── A · LEVA ACCESA
{
  const A = mondo(true);
  // ① la riga comincia con «Salió»
  t('riga comincia da Salió', A.CADUTA_RIGA.startsWith('Salió'));
  t('riga parola per parola (DESIGN)', A.CADUTA_RIGA === 'Salió, pero tardará en aparecer en la cuenta.');
  t('riga non nomina Google/bordo/camino', !/google|borde|bordo|camino|gas\b/i.test(A.CADUTA_RIGA));

  // marca: solo crearPedidoMesero riuscito
  t('marca crearPedidoMesero ok', A._cadutaMarca('crearPedidoMesero', { ok: true })._via_google === true);
  t('NON marca un altro verbo', A._cadutaMarca('marcarPedido', { ok: true })._via_google === undefined);
  t('NON marca un rifiuto (ok:false)', A._cadutaMarca('crearPedidoMesero', { ok: false, error: 'x' })._via_google === undefined);
  t('NON marca una risposta nulla', A._cadutaMarca('crearPedidoMesero', null) === null);

  // ① dichiara → riga che comincia da Salió + mesa
  const r1 = A._cadutaMarca('crearPedidoMesero', { ok: true });
  const riga = A._cadutaDichiara(r1, 'u-1', '12');
  t('dichiara: comincia da Salió', riga.startsWith('Salió'));
  t('dichiara: porta la mesa', riga.includes('Mesa 12'));
  t('dichiara: ricorda il pedido', !!A._CAIDOS['u-1'] && A._CAIDOS['u-1'].mesa === '12');

  // ④ cammino normale ⇒ niente riga, niente chip
  const rN = { ok: true, id_pedido: 'P-9' };
  t('normale: nessuna riga', A._cadutaDichiara(rN, 'u-2', '7') === '');
  t('normale: nessun segno ricordato', !A._CAIDOS['u-2']);
  t('normale: nessun chip', A._cadutaChipHtml('u-2') === '');

  // ② il chip resta (finché il bordo non vede): 'tardará', colore sig, mai urge
  const chip = A._cadutaChipHtml('u-1');
  t('chip presente per il pedido caduto', chip.includes('tardará'));
  t('chip classe caida-chip (sig), non urge', chip.includes('caida-chip') && !/urge|bad|err/.test(chip));
  const banda = A._cadutaBandaHtml();
  t('banda per la mesa 12', banda.includes('Mesa 12') && banda.includes('Salió'));
  t('banda non è urge', !/urge|bad|err/.test(banda));

  // ③ potatura: una sala NON del bordo (Google) non toglie niente
  const salaGoogle = { mios: [{ uuid: 'u-1', mesa: '12' }] };           // niente _edad_dato_s
  A._cadutaPotatura(salaGoogle);
  t('sala da Google non toglie il chip', !!A._CAIDOS['u-1']);
  // sala vecchia del bordo (_vieja_s) non toglie
  A._cadutaPotatura({ _edad_dato_s: 5, _vieja_s: 900, mios: [{ uuid: 'u-1' }] });
  t('foto vecchia del bordo non toglie il chip', !!A._CAIDOS['u-1']);
  // sala del bordo fresca SENZA il pedido: resta
  A._cadutaPotatura({ _edad_dato_s: 4, mios: [{ uuid: 'altro' }] });
  t('bordo fresco senza il pedido: il chip resta', !!A._CAIDOS['u-1']);
  // sala del bordo fresca CON il pedido: se ne va (in qualunque lista)
  for (const k of ['mios', 'pendientes', 'pagados', 'sin_dueno', 'por_limpiar']) {
    const B = mondo(true);
    B._cadutaDichiara({ _via_google: true }, 'u-x', '3');
    const left = B._cadutaPotatura(Object.assign({ _edad_dato_s: 4 }, { [k]: [{ uuid: 'u-x', mesa: '3' }] }));
    t('bordo vede il pedido in ' + k + ' → chip via', left === 0 && !B._CAIDOS['u-x'] && B._cadutaChipHtml('u-x') === '' && B._cadutaBandaHtml() === '');
  }
  // potatura con vettori assenti non esplode
  let boom = false; try { A._cadutaPotatura({ _edad_dato_s: 1 }); } catch (e) { boom = true; }
  t('potatura senza liste non esplode', !boom);
  t('un solo pedido sparito, l\'altro resta', (function () {
    const C = mondo(true);
    C._cadutaDichiara({ _via_google: true }, 'a', '1'); C._cadutaDichiara({ _via_google: true }, 'b', '2');
    C._cadutaPotatura({ _edad_dato_s: 2, mios: [{ uuid: 'a' }] });
    return !C._CAIDOS.a && !!C._CAIDOS.b;
  })());
  // nessun timer: il segno non sparisce «a tempo»
  t('nessun tempo nel blocco (setTimeout/setInterval)', !/setTimeout|setInterval/.test(blocco));
  // uuid mancante: nessun segno fantasma
  t('senza uuid non ricorda', mondo(true)._cadutaDichiara({ _via_google: true }, '', '1') === '');
}

// ── B · LEVA SPENTA = mondo di ieri, riga per riga
{
  const S = mondo(false);
  t('spenta: non marca', S._cadutaMarca('crearPedidoMesero', { ok: true })._via_google === undefined);
  t('spenta: nessuna riga', S._cadutaDichiara({ ok: true, _via_google: true }, 'u', '1') === '');
  t('spenta: nessun segno', Object.keys(S._CAIDOS).length === 0);
  t('spenta: nessun chip', S._cadutaChipHtml('u') === '');
  t('spenta: nessuna banda', S._cadutaBandaHtml() === '');
}

// ── C · guardie sul sorgente (cablaggio) — il banco non vede ciò che non legge
{
  // la leva nasce SPENTA e ha i due idiomi di sempre
  const lev = SRC.slice(SRC.indexOf('const CADUTA_GOOGLE_ON'), SRC.indexOf('const TECLADO_ON'));
  t('leva: default spenta', /getItem\('sala_cag'\) === '1'/.test(lev) && /catch \(e\) \{ return q === '1'; \}/.test(lev));
  t('leva: ?cag=1 e ?cag=0', /q === '1'/.test(lev) && /q === '0'/.test(lev));
  // entrambi i ritorni a Google di staffPost passano da _cadutaMarca
  const sp0 = SRC.indexOf('async function staffPost');
  const sp1 = SRC.indexOf('let _PENNA_ULT');
  const sp = SRC.slice(sp0, sp1);
  const gasRet = sp.match(/return[^;\n]*gasPost\(/g) || [];
  t('staffPost: 2 ritorni su gasPost', gasRet.length === 2);
  t('staffPost: tutti i ritorni su gasPost passano da _cadutaMarca', gasRet.every(s => s.includes('_cadutaMarca(action,')));
  // i due siti di crearPedidoMesero dichiarano la caduta
  const siti = SRC.split("staffPost('crearPedidoMesero', body)").length - 1;
  t('due siti staffPost crearPedidoMesero', siti === 2);
  t('i due siti chiamano _cadutaDichiara', (SRC.match(/= _cadutaDichiara\(r, /g) || []).length === 2);
  t('i due siti mostrano un toast sig', (SRC.match(/toast\('sig', _caida, 6000\)/g) || []).length === 2);
  // renderMesas pota e dipinge la banda; cardPedido porta il chip
  t('renderMesas pota', /_cadutaPotatura\(r\);/.test(SRC));
  t('renderMesas dipinge la banda', /_cadutaBandaHtml\(\) \+/.test(SRC));
  t('cardPedido porta il chip', /_cadutaChipHtml\(p\.uuid\)/.test(SRC));
  // ⑤ il colore: .sig definito, nessun uso di --cs-urge nel blocco caduta
  t('toast.sig definito', /\.toast\.sig\{/.test(SRC));
  t('CSS caduta senza urge/rosso', !/caida[^}]*(urge|bad|#ff6b6b|#ef4444|#7f1d1d)/i.test(SRC));
  // la riga di DESIGN esiste una sola volta come costante
  t('una sola costante della riga', (SRC.match(/Salió, pero tardará en aparecer en la cuenta\./g) || []).length === 1);
  // il toast normale resta intatto (cammino normale)
  t('toast normale intatto (crearPedido)', SRC.includes("' · en tus MÍOS');"));
  t('toast normale intatto (menu)', SRC.includes("' · $0 (ya pagada en la fórmula)'));"));
}

// ── D · MUTAZIONE: il banco deve accorgersi se si rompe ciò che protegge
{
  const muta = (da, a) => SRC.replace(da, a);
  const rilancia = (src) => {
    const j0 = src.indexOf('const CADUTA_RIGA'), j1 = src.indexOf('function _cadutaBandaHtml');
    const j2 = src.indexOf('\n}\n', j1) + 3;
    const ctx = { CADUTA_GOOGLE_ON: true, esc: s => String(s), Date, Object, String }; vm.createContext(ctx);
    vm.runInContext(src.slice(j0, j2) + '\n;this.API = { CADUTA_RIGA, _CAIDOS, _cadutaMarca, _cadutaDichiara, _cadutaPotatura, _cadutaChipHtml };', ctx);
    return ctx.API;
  };
  // M1: la potatura ignora la fonte (Google toglie il chip) → il caso «sala da Google non toglie» deve cadere
  const m1 = rilancia(muta('if (!_cadutaSalaDelBordo(r)) return ks.length;', ''));
  m1._cadutaDichiara({ _via_google: true }, 'u', '1'); m1._cadutaPotatura({ mios: [{ uuid: 'u' }] });
  t('mutazione M1 (potatura senza fonte) è CATTURATA dal caso Google', !m1._CAIDOS.u);   // se la mutazione passa, il chip è sparito: il banco A lo avrebbe visto rosso
  // M2: la riga non comincia più da Salió → il banco ① cade
  const m2 = rilancia(muta("'Salió, pero", "'Listo, pero"));
  t('mutazione M2 (riga senza Salió) è CATTURATA', !m2.CADUTA_RIGA.startsWith('Salió'));
  // M3: marca anche i rifiuti → il banco «NON marca ok:false» cade
  const m3 = rilancia(muta('&& r.ok === true) {', ') {'));
  t('mutazione M3 (marca anche i rifiuti) è CATTURATA', m3._cadutaMarca('crearPedidoMesero', { ok: false })._via_google === true);
}

console.log(ko === 0 ? `✅ ${ok}/${ok + ko} verdi` : `❌ ${ko} rossi su ${ok + ko}`);
process.exit(ko === 0 ? 0 : 1);
