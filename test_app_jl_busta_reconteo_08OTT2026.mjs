// BANCO · EMERG «EMERG BUSTA CONTEO RIPETUTO NON AVANZA» · TERZA PENNA · 08-ott-2026
// Il JL conta la busta alla cieca: se non quadra la casella si svuota e c'e un nuovo tentativo. Il bordo NON conta come nuovo tentativo lo stesso numero con lo STESSO uid (lo
// tratta come un retry di rete). Prima: `CJ1.sobUid` restava lo stesso fra un conteggio umano e l'altro ⇒ chi riconta e trova la stessa cifra restava fermo al tentativo 2.
// Corre la `cjSobEnviar` VERA di app_jl.html contro un bordo finto che applica quella regola (uid+cifra uguali ⇒ stessa risposta, nessun tentativo in piu).
import fs from 'node:fs'; import vm from 'node:vm';
const H = fs.readFileSync(new URL('./app_jl.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const t = (n, c, i) => { c ? ok++ : (ko++, console.log('✗', n, i === undefined ? '' : JSON.stringify(i).slice(0, 260))); };
const i = H.indexOf('async function cjSobEnviar('); if (i < 0) throw new Error('cjSobEnviar');
const fnSrc = H.slice(i, H.indexOf('\n}\n', i) + 3);

function mundo(esperado) {
  let n = 0; const posts = []; let ultimo = null; let intentos = 0;
  const el = { value: '' };
  const ctx = { CJ1: { enviando: false, sobUid: null }, STATE: { pin: '2222' }, CJ1_ERR: {}, posts, toasts: [],
    $: () => el, toast: (k, m) => ctx.toasts.push(k + ':' + m), pintaTab: () => {}, cjMotivoTxt: (m) => String(m), parseInt, Number, String,
    cajaNuevoUid: (p) => p + '-' + (++n),
    cajaPost1: async (b) => {
      posts.push(b);
      if (ultimo && ultimo.uid === b.uid_gesto && ultimo.contado === b.contado) return ultimo.resp;   // un retry de red: la stessa risposta, nessun tentativo in piu
      intentos++;
      const resp = (b.contado === esperado) ? { ok: true, sobre_nro: '1001', con_diferencia: false }
        : (intentos >= 3 ? { ok: true, sobre_nro: '1001', con_diferencia: true } : { ok: true, cuadra: false, intento: intentos, de: 3 });
      ultimo = { uid: b.uid_gesto, contado: b.contado, resp }; return resp;
    } };
  vm.createContext(ctx);
  vm.runInContext(fnSrc + '\n;this.API = { cjSobEnviar };', ctx);
  return { ctx, el, posts };
}
const tocca = async (m, cifra) => { m.el.value = String(cifra); await m.ctx.API.cjSobEnviar(null); };

// ① tre conteggi UGUALI e sbagliati ⇒ al 3º la busta nasce con diferencia
{ const m = mundo(89319);
  await tocca(m, 80000); t('1º conteggio sbagliato: intento 1 de 3', m.ctx.CJ1.sob && m.ctx.CJ1.sob.intento === 1, m.ctx.CJ1.sob);
  await tocca(m, 80000); t('2º conteggio IDENTICO: intento 2 (non resta fermo)', m.ctx.CJ1.sob && m.ctx.CJ1.sob.intento === 2, m.ctx.CJ1.sob);
  await tocca(m, 80000); t('3º identico: nasce la busta CON diferencia (e il numero)', m.ctx.CJ1.sob && m.ctx.CJ1.sob.nro === '1001' && m.ctx.CJ1.sob.dif === true, m.ctx.CJ1.sob);
  t('ogni conteggio umano ha un uid DIVERSO', new Set(m.posts.map((p) => p.uid_gesto)).size === 3, m.posts.map((p) => p.uid_gesto)); }
// ② un retry di RETE (errore incerto) dentro lo STESSO tentativo tiene l'uid: non si duplica
{ const m = mundo(89319); let primo = true; const orig = m.ctx.cajaPost1;
  m.ctx.cajaPost1 = async (b) => { m.posts.push(b); if (primo) { primo = false; throw new Error('timeout'); } return { ok: true, cuadra: false, intento: 1, de: 3 }; };
  await tocca(m, 80000); const uid1 = m.posts[0].uid_gesto;
  await tocca(m, 80000);
  t('dopo un timeout l\'uid NON cambia (e lo stesso gesto)', m.posts.length === 2 && m.posts[1].uid_gesto === uid1, m.posts.map((p) => p.uid_gesto)); }
// ③ la cifra giusta al 1º colpo: busta senza diferencia, uid azzerato per la prossima busta
{ const m = mundo(89319); await tocca(m, 89319);
  t('cifra esatta: busta 1001 senza diferencia', m.ctx.CJ1.sob.nro === '1001' && m.ctx.CJ1.sob.dif === false && m.ctx.CJ1.sobUid === null); }
console.log(ko === 0 ? `✅ ${ok}/${ok} verdi` : `❌ ${ko} rossi su ${ok + ko}`); process.exit(ko ? 1 : 0);
