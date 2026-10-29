/* [28-ott · 🛎 SALA V33 · AUT-0744/0763 · «Factura a fin de mes»]
   Modulo del vetro, additivo: NON è ancora agganciato a sala.html (il punto di
   ingresso nel COBRO lo decide il disegno). Nessun GAS: il PIN passa dal bordo
   (`_pinJlAlBorde` di sala.html), la scrittura va al bordo (`/factura/<local>`).
   Con la leva FACTURA_FIN_DE_MES_ON a "0" il bordo non scrive nulla. */
(function () {
  'use strict';

  // Stesso modulo 11 del bordo (src/factura.js rutValido): un RUT sbagliato si ferma qui.
  function rutValidoCl(raw) {
    var s = String(raw || '').replace(/[.\-\s]/g, '').toUpperCase();
    if (!/^\d{7,8}[0-9K]$/.test(s)) return null;
    var cuerpo = s.slice(0, -1), dv = s.slice(-1), suma = 0, mult = 2;
    for (var i = cuerpo.length - 1; i >= 0; i--) {
      suma += Number(cuerpo[i]) * mult;
      mult = mult === 7 ? 2 : mult + 1;
    }
    var resto = 11 - (suma % 11);
    var attesa = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
    return dv === attesa ? cuerpo + '-' + dv : null;
  }

  // UUID coniato dal vetro (lato che ripete): è anche la chiave d'idempotenza del gesto.
  function nuovoUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // Costruisce il payload del verbo. Ritorna { ok:true, payload } oppure { ok:false, error }.
  // Il cliente esistente porta solo il suo id; quello nuovo porta un UUID coniato qui e il RUT validato.
  function costruisciFactura(o) {
    if (!o || !o.pin_jl) return { ok: false, error: 'pin_jl_requerido' };
    if (!(o.total > 0)) return { ok: false, error: 'total_no_valido' };
    var cli = {};
    if (o.cliente_existente && o.cliente_existente.cliente_id) {
      cli.cliente_id = o.cliente_existente.cliente_id;
    } else {
      var rut = rutValidoCl(o.rut);
      if (!rut) return { ok: false, error: 'rut_no_valido' };
      if (!String(o.razon_social || '').trim()) return { ok: false, error: 'razon_social_requerida' };
      cli = { cliente_id_nuevo: nuovoUuid(), rut: String(o.rut).trim(), razon_social: String(o.razon_social).trim(),
        giro: String(o.giro || '').trim(), email: String(o.email || '').trim() };
    }
    return { ok: true, payload: { pin_jl: String(o.pin_jl).trim(), conto_id: o.conto_id, total: o.total,
      idempotencia: nuovoUuid(), cliente: cli } };
  }

  // Invia il gesto al bordo. Nessun GAS. Ritorna la risposta del bordo o { ok:false, error }.
  async function inviaFactura(local, payload) {
    try {
      if (!BORDE_SALA || !BORDE_SALA.URL) return { ok: false, error: 'bordo_no_configurado' };
      var u = BORDE_SALA.URL + '/factura/' + encodeURIComponent(local) + '?t=' + encodeURIComponent(BORDE_SALA.T);
      var r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ payload: payload }), cache: 'no-store' });
      return await r.json();
    } catch (e) { return { ok: false, error: 'sin_bordo' }; }
  }

  // Finestra di prova (solo con ?factura=1): PIN JL, cliente, invio al bordo, esito a schermo.
  // Il conto id non è ancora nel vetro: lo scrive il tester, finché il bordo non lo consegna.
  function campo(lab, id, tipo) {
    var w = document.createElement('label');
    w.style.cssText = 'display:block;margin:6px 0;font-size:13px';
    w.textContent = lab;
    var i = document.createElement('input');
    i.id = id; i.type = tipo || 'text';
    i.style.cssText = 'display:block;width:100%;padding:6px;margin-top:2px;box-sizing:border-box';
    w.appendChild(i);
    return w;
  }
  function abrir(opts) {
    var o = opts || {};
    var prev = document.getElementById('salaFacturaOverlay');
    if (prev) prev.remove();
    var box = document.createElement('div');
    box.id = 'salaFacturaOverlay';
    box.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;color:#111;max-width:420px;width:100%;border-radius:10px;padding:16px;max-height:90vh;overflow:auto;font-family:sans-serif';
    var h = document.createElement('div');
    h.style.cssText = 'font-weight:700;margin-bottom:6px';
    h.textContent = 'Factura a fin de mes · mesa ' + (o.mesa || '?');
    var esito = document.createElement('div');
    esito.style.cssText = 'margin-top:10px;font-size:13px;white-space:pre-wrap';
    var invia = document.createElement('button');
    invia.textContent = 'Enviar';
    invia.style.cssText = 'margin-top:10px;width:100%;padding:10px;font-weight:700';
    card.appendChild(h);
    card.appendChild(campo('Conto id (prova)', 'sfConto', 'text'));
    card.appendChild(campo('Total', 'sfTotal', 'number'));
    card.appendChild(campo('PIN del JL', 'sfPin', 'password'));
    card.appendChild(campo('RUT del cliente', 'sfRut', 'text'));
    card.appendChild(campo('Razón social', 'sfRazon', 'text'));
    card.appendChild(campo('Giro', 'sfGiro', 'text'));
    card.appendChild(campo('Email para la factura', 'sfEmail', 'email'));
    card.appendChild(invia);
    card.appendChild(esito);
    box.appendChild(card);
    document.body.appendChild(box);
    document.getElementById('sfConto').value = o.conto || '';
    document.getElementById('sfTotal').value = o.total || '';
    invia.onclick = async function () {
      var v = costruisciFactura({
        pin_jl: document.getElementById('sfPin').value,
        conto_id: document.getElementById('sfConto').value.trim(),
        total: Number(document.getElementById('sfTotal').value),
        rut: document.getElementById('sfRut').value,
        razon_social: document.getElementById('sfRazon').value,
        giro: document.getElementById('sfGiro').value,
        email: document.getElementById('sfEmail').value
      });
      if (!v.ok) { esito.textContent = 'Fermato dal vetro: ' + v.error; return; }
      if (!v.payload.conto_id) { esito.textContent = 'Fermato dal vetro: conto_id_requerido'; return; }
      invia.disabled = true;
      esito.textContent = 'Enviando al bordo…';
      var r = await inviaFactura(o.local || (window.CFG && CFG.LOCAL) || 'BKS', v.payload);
      invia.disabled = false;
      esito.textContent = 'Risposta del bordo:\n' + JSON.stringify(r, null, 2);
    };
    box.onclick = function (e) { if (e.target === box) box.remove(); };
  }

  window.SalaFactura = { rutValidoCl: rutValidoCl, costruisciFactura: costruisciFactura, inviaFactura: inviaFactura, abrir: abrir };
})();
