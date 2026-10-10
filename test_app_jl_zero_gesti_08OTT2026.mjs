// BANCO · app_jl v1.36.0 · AUT-0613 · EL JL A CERO GESTOS (el vetro) · TERZA PENNA · 08-ott-2026
// Corre las funciones VERDADERAS de app_jl.html (extraídas del archivo) con un DOM de mentira. Criterios: sin las leves del /salud el vetro es el de ayer ·
// «Recibí $X» manda UN verbo SIN cifra (la calcula el bordo) · «Recibí otra cifra» abre la casilla de siempre · «Hacer el sobre ahora» muestra el NÚMERO grande ·
// la noche vieja se puede cerrar con su día · el cierre dice el NOMBRE y lleva a donde se resuelve · «Cerrar igual» pide motivo y PIN y solo existe con pendientes.
import fs from 'node:fs';
const H = fs.readFileSync(new URL('./app_jl.html', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
let ok = 0, ko = 0; const vero = (n, c, i) => { c ? (ok++, console.log('  🟢 ' + n)) : (ko++, console.log('  🔴 ' + n + (i !== undefined ? ' → ' + JSON.stringify(i).slice(0, 300) : ''))); };
const scripts = [...H.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
let comp = 0; for (const s of scripts) { try { new Function(s); comp++; } catch (e) { vero('compila', false, String(e).slice(0, 200)); } }
vero('los scripts inline compilan (' + comp + '/' + scripts.length + ')', comp === scripts.length);
vero('la versión es 1.36.0 o posterior (la 1.37.0 añade «¿Quién entrega?», banco propio)', /id="ver">app_jl v1\.3[67]\.0</.test(H));
const fx = (nome, async_) => { const m = H.match(new RegExp((async_ ? 'async ' : '') + 'function ' + nome + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}')); if (!m) throw new Error('falta ' + nome); return m[0]; };
const one = (nome) => { const m = H.match(new RegExp('function ' + nome + '\\([^)]*\\) \\{[^\\n]*\\}')); if (!m) throw new Error('falta ' + nome); return m[0]; };
const src = [one('cjFlag'), one('cjRetOtra'), fx('cjRetTodo', true), fx('cjSobAuto', true), one('cjCieIgualAbrir'), one('cjCieIgualCerrar'), one('cjCieSet'), fx('cjCieIgualEnviar', true),
  fx('_cjPendientes'), one('_cjRiga'), one('_cjMmSs'), one('_cjArg'), one('_cjEntregaOn'), fx('_cjEntrega'), fx('_cjEnManoDe'), fx('_cjEntregaSel'), fx('cjAtto1Html')].join('\n');
function mundo(salud, CJ1, extra) {
  const W = { posts: [], toasts: [], pinta: 0, risposta: null };
  const mk = new Function('CJ1', 'W', 'STATE', '$', 'toast', 'pintaTab', 'cajaPost1', 'cajaNuevoUid', 'cjAtto1Giro', 'fmt', 'cjMotivoTxt', 'CJ1_ERR', 'esc', '_cjMesasDetalle', '_cjMesasAbiertas', '_cjHace', 'cjAtto3On', 'cjRetAbrir',
    src + '\nreturn { cjFlag, cjRetOtra, cjRetTodo, cjSobAuto, cjCieIgualAbrir, cjCieIgualCerrar, cjCieSet, cjCieIgualEnviar, _cjPendientes, cjAtto1Html };');
  const F = mk(CJ1, W, { salud: salud, pin: '2222' }, (id) => (extra && extra.dom && extra.dom[id]) || null, (k, m) => W.toasts.push(k + ':' + m), () => { W.pinta++; },
    async (b) => { W.posts.push(b); return W.risposta ? W.risposta(b) : { ok: true, accodato: true }; }, (p) => p + '-uid', () => {}, (n) => '$' + Math.round(n).toLocaleString('es-CL'), (m) => 'm:' + m, {},
    (x) => String(x == null ? '' : x).replace(/[&<>"]/g, ''), () => (extra && extra.mesas) || [], () => ((extra && extra.mesas) || []).map((m) => m.mesa), () => 'hace 1 min', () => false, () => {});
  return { F, W };
}
const SALUD_ON = { flags: { caja_atto1_on: '1', caja_recibi_todo_on: '1', caja_sobre_auto_on: '1', caja_cierre_pendientes_on: '1' } };
const ST = (x) => Object.assign({ meseros: [{ mesero: 'Ruth', en_mano: 12300, ventas_efectivo: 10000, propina_efectivo: 2300, residuo: 0, entregado: 0 }, { mesero: 'Gabriel', en_mano: 0 }],
  da_imbustare: { n: 0 }, sobres: [], totale_en_mano: 12300 }, x || {});
const RET = () => ({ mesero: 'Ruth', att: { mesero: 'Ruth', en_mano: 12300, ventas_efectivo: 10000, propina_efectivo: 2300, residuo: 0, entregado: 0 }, uid: 'CJ-RIT-1' });

/* CONTRATTO COL BORDO (BKP `BKP 0613 CAMBIATO CAMBIADO CONTRATTO`): la parola del rifiuto la prendo dal SORGENTE del bordo, non da un letterale mio — due banchi che si danno ragione da soli non provano il contratto. */
const BORDO_SRC = process.env.BORDO_SRC || new URL('../_wt_0613/src/index.js', import.meta.url);
const SRC_BORDO = fs.readFileSync(BORDO_SRC, 'utf8');
const mP = /error: 'rifiutato', motivo: '(en_mano_cambia\w+)'/.exec(SRC_BORDO);
const PAROLA_BORDO = mP ? mP[1] : '(non trovata nel bordo)';
vero('la parola del bordo si trova nel sorgente del bordo', !!mP, BORDO_SRC);
vero('il vetro controlla ESATTAMENTE la parola del bordo (' + PAROLA_BORDO + ')', H.includes("r.motivo === '" + PAROLA_BORDO + "'"));
console.log('── ① sin las leves: el vetro de ayer');
{ const CJ1 = { st: ST(), ret: RET() }; const { F } = mundo({ flags: { caja_atto1_on: '1' } }, CJ1); const h = F.cjAtto1Html();
  vero('con el ritiro abierto y SIN la leva: la casilla de siempre y «Confirmar» (no «Recibí»)', /id="cj1Monto"/.test(h) && />Confirmar</.test(h) && !/Recibí/.test(h), h.slice(0, 200));
  vero('cjFlag es falso sin /salud', mundo(null, CJ1).F.cjFlag('caja_recibi_todo_on') === false && mundo({}, CJ1).F.cjFlag('caja_recibi_todo_on') === false); }
{ const CJ1 = { st: ST({ da_imbustare: { n: 2, suma_riferimento: 55000 } }) }; const { F } = mundo({ flags: { caja_atto1_on: '1' } }, CJ1); const h = F.cjAtto1Html();
  vero('con ritiros sin sobre y SIN la leva: «Detalle retiro efectivo» con su casilla (el conteo de ayer), sin «Hacer el sobre ahora»', /Detalle retiro efectivo/.test(h) && /cj1SobContado/.test(h) && !/Hacer el sobre ahora/.test(h)); }
{ const CJ1 = { st: ST() }; const { F } = mundo({ flags: { caja_atto1_on: '1' } }, CJ1, { mesas: [] }); const h = F.cjAtto1Html();
  vero('el cierre SIN la leva dice lo de ayer («No hay nada que tocar aquí»), aunque Ruth tenga dinero', /No hay nada que tocar aquí/.test(h) && !/Cerrar igual/.test(h)); }

console.log('── ② Recibí $X: UN toque, sin cifra');
{ const CJ1 = { st: ST(), ret: RET() }; const { F, W } = mundo(SALUD_ON, CJ1); const h = F.cjAtto1Html();
  vero('el panel dice ENTREGA $12.300 grande y el botón «Recibí $12.300»', /ENTREGA/.test(h) && /\$12\.300/.test(h) && /Recibí \$12\.300/.test(h), h.slice(0, 300));
  vero('«Recibí otra cifra» está, y la casilla NO (todavía)', /Recibí otra cifra/.test(h) && !/id="cj1Monto"/.test(h));
  await F.cjRetTodo();
  vero('el toque manda UN verbo ritiro con recibi:"todo" y SIN monto (la cifra la pone el bordo) ni esperado', W.posts.length === 1 && W.posts[0].verbo === 'ritiro' && W.posts[0].recibi === 'todo' && W.posts[0].mesero === 'Ruth' && !('monto' in W.posts[0]) && !('esperado_ora' in W.posts[0]) && W.posts[0].uid_gesto === 'CJ-RIT-1' && W.posts[0].visto === 12300, W.posts);
  vero('el toque lleva `visto`: la cifra que el JL VIO en el boton (revision de BKP)', W.posts[0].visto === 12300);
  vero('al aceptar, el ritiro se cierra y se pide el estado de nuevo', CJ1.ret === null); }
{ const CJ1 = { st: ST(), ret: RET() }; const { F, W } = mundo(SALUD_ON, CJ1);
  W.risposta = () => ({ ok: false, error: 'rifiutato', motivo: 'nada_que_recibir' }); await F.cjRetTodo();
  vero('«nada_que_recibir» (ya lo recibió otro teléfono): lo dice, cierra el panel, no deja un botón muerto', CJ1.ret === null && W.toasts.some((t) => /ya no tiene dinero/.test(t)), W.toasts); }
{ const CJ1 = { st: ST(), ret: RET() }; const { F, W } = mundo(SALUD_ON, CJ1);
  const pintaPrima = W.pinta; W.risposta = () => ({ ok: false, error: 'rifiutato', motivo: PAROLA_BORDO, en_mano: 15300, visto: 12300 }); await F.cjRetTodo();
  const h = F.cjAtto1Html();
  vero('la pantalla se REDIBUJA despues de actualizar la cifra (pintaTab corrio)', W.pinta > pintaPrima, [W.pinta, pintaPrima]);
  vero('«en_mano_cambiato»: el panel NO se cierra, el boton se redibuja con la cifra NUEVA y avisa; un solo post', CJ1.ret !== null && CJ1.ret.att.en_mano === 15300 && /Recibí \$15\.300/.test(h) && W.toasts.some((t) => /cambió/.test(t) && /15\.300/.test(t)) && W.posts.length === 1, [CJ1.ret && CJ1.ret.att.en_mano, W.toasts]);
  W.risposta = null; await F.cjRetTodo();
  vero('al tocar de nuevo manda visto = la cifra nueva y la MISMA clave (nada habia nacido)', W.posts.length === 2 && W.posts[1].visto === 15300 && W.posts[1].uid_gesto === 'CJ-RIT-1', W.posts); }
{ const CJ1 = { st: ST(), ret: RET() }; const { F, W } = mundo(SALUD_ON, CJ1);
  W.risposta = () => { throw new Error('timeout'); }; await F.cjRetTodo();
  vero('un timeout NO mata la clave: el reintento es el MISMO ritiro', CJ1.retDubbio && CJ1.retDubbio.Ruth === 'CJ-RIT-1' && W.toasts.some((t) => /no se duplica/.test(t)), CJ1.retDubbio); }
{ const CJ1 = { st: ST(), ret: RET(), enviando: true }; const { F, W } = mundo(SALUD_ON, CJ1); await F.cjRetTodo();
  vero('un doble toque (enviando) no manda dos veces', W.posts.length === 0); }
{ const CJ1 = { st: ST(), ret: RET() }; const { F } = mundo(SALUD_ON, CJ1); F.cjRetOtra(); const h = F.cjAtto1Html();
  vero('«Recibí otra cifra» abre la casilla y la confirmación de SIEMPRE (con la guardia sobre el esperado)', CJ1.ret.otra === true && /id="cj1Monto"/.test(h) && />Confirmar</.test(h) && !/ENTREGA/.test(h), h.slice(0, 200)); }

console.log('── ③ la busta nace sola');
{ const CJ1 = { st: ST({ da_imbustare: { n: 2, suma_riferimento: 55000 } }) }; const { F } = mundo(SALUD_ON, CJ1); const h = F.cjAtto1Html();
  vero('con ritiros sin sobre y la leva: «Retiros sin sobre» y «Hacer el sobre ahora» (NO la casilla de contar)', /Retiros sin sobre/.test(h) && /Hacer el sobre ahora/.test(h) && !/cj1SobContado/.test(h), h.slice(0, 300)); }
{ const CJ1 = { st: ST({ da_imbustare: { n: 2, suma_riferimento: 55000 } }) }; const { F, W } = mundo(SALUD_ON, CJ1);
  W.risposta = () => ({ ok: true, accodato: true, sobre_nro: '1004', suma: 405470, n_retiros: 5, dia: '2026-10-07', origen: 'sistema' }); await F.cjSobAuto();
  vero('el toque manda sobre_auto SIN cifra y sin día (hoy)', W.posts.length === 1 && W.posts[0].verbo === 'sobre_auto' && !('dia_op' in W.posts[0]) && !('contado' in W.posts[0]), W.posts);
  const h = F.cjAtto1Html();
  vero('«SOBRE 1004 · $405.470 — escribe este número en el sobre»: el número es lo MÁS grande', /1004/.test(h) && /\$405\.470/.test(h) && /escribe este número en el sobre/.test(h) && /font-size:44px/.test(h) && /Listo, lo escribí/.test(h), h.slice(0, 400)); }
{ const CJ1 = { st: ST({ da_imbustare: { n: 0 }, da_imbustare_prev: { dia: '2026-10-07', n: 2, suma_riferimento: 268093 } }) }; const { F, W } = mundo(SALUD_ON, CJ1); const h = F.cjAtto1Html();
  vero('anoche quedaron 2 retiros sin sobre (después de las 06:00): se ve con su día y el botón', /Anoche quedó sin sobre/.test(h) && /2026-10-07/.test(h) && /\$268\.093/.test(h) && /cjSobAuto\(this,'2026-10-07'\)/.test(h), h.slice(0, 400));
  W.risposta = () => ({ ok: true, accodato: true, sobre_nro: '1005', suma: 268093, dia: '2026-10-07' }); await F.cjSobAuto(null, '2026-10-07');
  vero('...y el toque manda la NOCHE de los retiros (dia_op), no la del reloj', W.posts[0].dia_op === '2026-10-07', W.posts); }
{ const CJ1 = { st: ST({ da_imbustare: { n: 0 } }) }; const { F, W } = mundo(SALUD_ON, CJ1);
  W.risposta = () => ({ ok: false, error: 'sin_retiros_por_ensobrar' }); await F.cjSobAuto();
  vero('si ya no queda nada («sin_retiros_por_ensobrar») lo dice y no deja nada colgado', W.toasts.some((t) => /No quedan retiros sin sobre/.test(t)) && !CJ1.sob, W.toasts); }

console.log('── ④ el cierre no se calla');
{ const CJ1 = { st: ST() }; const { F } = mundo(SALUD_ON, CJ1); const h = F.cjAtto1Html();
  vero('Ruth tiene $12.300 en la mano: lo dice con el NOMBRE y lleva a donde se resuelve («Retirarle a Ruth»)', /Ruth tiene \$12\.300 en la mano/.test(h) && /nadie se lo retiró/.test(h) && /Retirarle a Ruth/.test(h) && /cjRetAbrir\('Ruth'\)/.test(h), h.slice(0, 500));
  vero('y existe «Cerrar igual — diré por qué» (solo porque hay pendientes)', /Cerrar igual — diré por qué/.test(h)); }
{ const CJ1 = { st: ST({ meseros: [{ mesero: 'Ruth', en_mano: 0 }], da_imbustare: { n: 0 } }) }; const { F } = mundo(SALUD_ON, CJ1); const h = F.cjAtto1Html();
  vero('SIN pendientes: nada de «Cerrar igual» (un cierre limpio no tiene bóton: el turno se cierra solo al abrir el siguiente)', !/Cerrar igual/.test(h) && /No hay nada que tocar aquí/.test(h)); }
{ const CJ1 = { st: ST({ meseros: [{ mesero: 'Ruth', en_mano: 0 }], da_imbustare: { n: 2, suma_riferimento: 55000 } }) }; const { F } = mundo(SALUD_ON, CJ1); const h = F.cjAtto1Html();
  vero('retiros sin sobre al cierre: «2 retiros sin sobre» + «Hacer el sobre ahora» + «Cerrar igual»', /2 retiros sin sobre/.test(h) && /Hacer el sobre ahora/.test(h) && /Cerrar igual/.test(h)); }
{ const CJ1 = { st: ST() }; const { F } = mundo(SALUD_ON, CJ1, { mesas: [{ mesa: '12', total: 9000, mesero: 'Ruth' }] }); const h = F.cjAtto1Html();
  vero('con mesas abiertas sigue «No se puede cerrar todavía» (lo de ayer): el cierre con pendientes no aparece', /No se puede cerrar todavía/.test(h) && !/Cerrar igual/.test(h)); }
{ const CJ1 = { st: ST() }; const { F, W } = mundo(SALUD_ON, CJ1);
  F.cjCieIgualAbrir(); vero('«Cerrar igual» abre un formulario con motivo y PIN, uid propio', CJ1.cie && CJ1.cie.abierto && CJ1.cie.uid === 'CJ-CIE-uid');
  const h = F.cjAtto1Html();
  vero('el formulario pide «¿Por qué cierras así?» y «Tu PIN» (type=password)', /¿Por qué cierras así\?/.test(h) && /placeholder="Tu PIN"/.test(h) && /type="password"/.test(h));
  await F.cjCieIgualEnviar();
  vero('sin motivo NO manda nada', W.posts.length === 0 && W.toasts.some((t) => /por qué/.test(t)));
  F.cjCieSet('motivo', 'ya no estaba'); await F.cjCieIgualEnviar();
  vero('sin PIN NO manda nada', W.posts.length === 0 && W.toasts.some((t) => /PIN/.test(t)));
  F.cjCieSet('pin', '2222'); await F.cjCieIgualEnviar();
  const p = W.posts[0];
  vero('con motivo + PIN: cierre_turno con cerrar_igual:true, el motivo, el PIN tecleado y SIN inventar nada más', p && p.verbo === 'cierre_turno' && p.cerrar_igual === true && p.motivo === 'ya no estaba' && p.pin_jl === '2222' && p.uid_gesto === 'CJ-CIE-uid' && Array.isArray(p.mesas_abiertas) && p.mesas_abiertas.length === 0, p);
  vero('al cerrar: se vacía el formulario y se avisa que Alberto lo ve esta noche', CJ1.cie === null && W.toasts.some((t) => /Alberto lo ve/.test(t)), W.toasts); }
{ const CJ1 = { st: ST() }; const { F, W } = mundo(SALUD_ON, CJ1); F.cjCieIgualAbrir(); F.cjCieSet('motivo', 'x y'); F.cjCieSet('pin', '0000');
  W.risposta = () => ({ ok: false, error: 'pin_jl_invalido' }); await F.cjCieIgualEnviar();
  vero('PIN equivocado: no se cierra y el formulario sigue abierto (no se pierde lo escrito)', CJ1.cie && CJ1.cie.motivo === 'x y' && W.toasts.some((t) => /pin/i.test(t))); }

console.log('── ⑤ lo que no cambia');
vero('el ritiro sobre el esperado sigue pidiendo confirmación (cjRetConfirma / ¿Retiras $X? Faltaban $Y)', /¿Retiras ' \+ fmt\(CJ1\.ret\.conf\)/.test(H) && /function cjRetConfirma/.test(H));
vero('el botón «Cerrar el turno» (AUT-0597) NO volvió: cjCieEnviar sigue sin ningún botón que la llame', !/onclick="cjCieEnviar/.test(H));
vero('no hay recordatorios ni notificaciones nuevas', !/Notification\.|setTimeout\([^)]*cjSob/.test(H.slice(H.indexOf('v1.36.0'))));

console.log(ko === 0 ? `\n✅ ${ok}/${ok + ko} verdi` : `\n❌ ${ko} rossi su ${ok + ko}`); process.exit(ko === 0 ? 0 : 1);
