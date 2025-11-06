// Simple embedded chatbot
// - local knowledge responder: searches products and blog entries on the page
// - optional server proxy: POST to /.netlify/functions/chat-proxy with {question}
// Usage: script loaded with defer; automatically creates a floating chat button
(function(){
  if(!document || !document.body) return;

  const STORAGE_KEY = 'vv-chat-history-v1';
  // server mode: 'auto' = try to detect serverless endpoint, true = force, false = disable
  let enableServerMode = 'auto'; // set to true to force, false to disable
  const serverEndpoint = '/.netlify/functions/chat-proxy';
  let serverAvailable = false;

  // Detect server endpoint availability with a lightweight ping
  async function detectServer(timeout = 1800){
    if(enableServerMode === false) return false;
    try{
      const controller = new AbortController();
      const id = setTimeout(()=>controller.abort(), timeout);
      const resp = await fetch(serverEndpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'ping'}),signal:controller.signal});
      clearTimeout(id);
      // if we get any response (200 or 500), consider server reachable
      return resp && (resp.status >= 200 && resp.status < 600);
    }catch(e){ return false; }
  }

  // Helper: normalize text
  function norm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9áéíóúñü\s]/gi,' ').replace(/\s+/g,' ').trim(); }

  // Escape HTML for safe output in chat
  function escapeHtml(str){
    return String(str||'')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Build knowledge base from DOM
  function buildKnowledge(){
    const kb = [];
    // products using schema.org Product or .product articles
    document.querySelectorAll('[itemscope][itemtype*="Product"], .product').forEach(node=>{
      try{
        const title = (node.querySelector('[itemprop="name"]') || node.querySelector('h4') || node).textContent.trim();
        const desc = (node.querySelector('[itemprop="description"]') || node.querySelector('p') || {textContent:''}).textContent.trim();
        const linkEl = node.querySelector('a[href]');
        const link = linkEl && linkEl.getAttribute ? linkEl.getAttribute('href') : null;
        const img = (node.querySelector('img')||{}).getAttribute('src') || '';
        const priceEl = node.querySelector('[itemprop="price"]');
        const price = priceEl ? priceEl.textContent.trim() : ''; 
        const badge = node.querySelector('.badge') ? (node.querySelector('.badge').textContent||'') : '';
        const onSale = !!badge || (link && link.includes('oferta'));
        const txt = (title + ' ' + desc + ' ' + (node.getAttribute('data-title') || '')).trim();
        if(title) kb.push({type:'product',title,desc,txt:norm(txt),url:link,img,price,badge,onSale});
      }catch(e){/* ignore */}
    });

    // articles / novedades
    document.querySelectorAll('#novedades article, article.product').forEach(a=>{
      try{
        const title = (a.querySelector('h4')||{}).textContent||'';
        const desc = (a.querySelector('p')||{}).textContent||'';
        const link = (a.querySelector('a[href]')||{}).getAttribute ? (a.querySelector('a[href]')||{}).getAttribute('href') : null;
        if(title) kb.push({type:'article',title,desc,txt:norm(title + ' ' + desc),url:link});
      }catch(e){}
    });

    // small FAQ set
    const faq = [
      {q:'envio', a:'Realizamos envíos 24/48h. Envío gratuito a partir de 30€.'},
      {q:'devolucion', a:'Puedes devolver productos en 14 días, consulta nuestras condiciones en tienda.'},
      {q:'pago', a:'Aceptamos tarjeta, transferencia y pagos por plataforma segura.'},
      {q:'horario', a:'Nuestra tienda está abierta lun-vie de 10:00 a 19:00.'},
      {q:'asesoramiento', a:'Ofrecemos asesoramiento gratuito en tienda y online. Describe tus necesidades y te ayudamos.'},
      {q:'oferta', a:'Actualmente hay varias ofertas en nuestros productos. Puedo listarlas si quieres — prueba: "¿Qué ofertas hay?"'}
    ];

    return {kb,faq};
  }

  function tokenize(s){ return (s||'').split(/\s+/).filter(Boolean); }

  function findBestLocalAnswer(question, data){
    const q = norm(question);
    // check FAQs
    for(const f of data.faq){ if(q.includes(f.q)) return {type:'faq',answer:f.a}; }

    // Special case: ask for ofertas/oferta
    if(q.includes('oferta') || q.includes('ofertas')){
      const offers = data.kb.filter(it=> it.type === 'product' && (it.onSale || (it.url && it.url.includes('oferta'))));
      if(offers.length){
        const items = offers.slice(0,12).map(it=>{
          const priceText = it.price ? ` — <strong>${it.price} €</strong>` : '';
          const badgeText = it.badge ? ` <span style="color:var(--green-700);font-weight:700">(${it.badge.trim()})</span>` : '';
          const href = it.url || '#';
          return `<li><a href="${href}">${escapeHtml(it.title)}</a>${priceText}${badgeText}</li>`;
        }).join('\n');
        const html = `<div>Tenemos <strong>${offers.length}</strong> ofertas destacadas ahora mismo:<ul style="padding-left:16px;margin:6px 0">${items}</ul><div class="small muted">Pulsa en un producto para ver la oferta y condiciones.</div></div>`;
        return {type:'offers', answer: html, meta:{count:offers.length}};
      }else{
        return {type:'offers', answer: 'Ahora mismo no hay ofertas destacadas. Puedes revisar la sección <a href="#ofertas">Ofertas</a> para ver promociones.'};
      }
    }

    const qTokens = new Set(tokenize(q));
    let best = null;
    for(const item of data.kb){
      const itTokens = tokenize(item.txt);
      let matches = 0;
      for(const t of itTokens){ if(qTokens.has(t)) matches++; }
      const score = matches / Math.max(1, itTokens.length);
      if(!best || score > best.score){ best = {item,score}; }
    }
    if(best && best.score > 0.08){
      const it = best.item;
      const short = it.desc || it.title;
      const answer = `Creo que esto puede ayudar: <strong>${it.title}</strong> — ${short}` + (it.url?` <a href="${it.url}">Ver</a>`:'');
      return {type:it.type,answer,meta:it};
    }
    return null;
  }

  // UI creation
  const chatBtn = document.createElement('button');
  chatBtn.className = 'chat-btn';
  chatBtn.type = 'button';
  chatBtn.title = 'Abrir chat de ayuda';
  chatBtn.innerText = 'Chatear';
  document.body.appendChild(chatBtn);

  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div class="chat-header">
      <div style="display:flex;align-items:center;gap:12px"><div class="title">Ayuda · Verde Vida</div><div class="server-indicator" style="font-size:12px;opacity:0.9">&nbsp;</div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn-clear" title="Borrar historial" style="background:transparent;border:none;color:white;font-weight:700;cursor:pointer;margin-right:6px">🗑</button>
        <button class="btn-export" title="Exportar" style="background:transparent;border:none;color:white;font-weight:700;cursor:pointer;margin-right:6px">⤓</button>
        <button class="btn-close" title="Cerrar" style="background:transparent;border:none;color:white;font-weight:800;cursor:pointer">✕</button>
      </div>
    </div>
    <div class="chat-messages" role="log" aria-live="polite"></div>
    <div class="chat-hint">Prueba: "¿Qué me recomiendas para dormir?" o "¿Cuánto tarda el envío?"</div>
    <div class="chat-suggestions" style="display:flex;gap:8px;padding:8px">
      <!-- suggestion buttons inserted by JS -->
    </div>
    <div class="chat-input">
      <input placeholder="Escribe tu pregunta..." aria-label="Pregunta" />
      <button class="send">Enviar</button>
    </div>
  `;
  document.body.appendChild(panel);

  const messages = panel.querySelector('.chat-messages');
  const input = panel.querySelector('.chat-input input');
  const sendBtn = panel.querySelector('.chat-input button');
  const closeBtn = panel.querySelector('.btn-close');
  const btnClear = panel.querySelector('.btn-clear');
  const btnExport = panel.querySelector('.btn-export');
  const suggestionsContainer = panel.querySelector('.chat-suggestions');
  const serverIndicator = panel.querySelector('.server-indicator');

  function appendMessage(text, who='bot'){ const el = document.createElement('div'); el.className = 'chat-msg ' + (who==='user' ? 'user' : 'bot'); el.innerHTML = text; messages.appendChild(el); messages.scrollTop = messages.scrollHeight; }

  function setOpen(open){ panel.style.display = open ? 'flex' : 'none'; if(open) input.focus(); }
  chatBtn.addEventListener('click', ()=> setOpen(panel.style.display === 'none'));
  closeBtn.addEventListener('click', ()=> setOpen(false));

  // Clear history button
  btnClear.addEventListener('click', ()=>{
    if(!confirm('Borrar el historial de chat?')) return;
    messages.innerHTML = '';
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  });

  // Export history as JSON
  btnExport.addEventListener('click', ()=>{
    try{
      const arr = Array.from(messages.querySelectorAll('.chat-msg')).map(el=>({who: el.classList.contains('user')? 'user':'bot', text: el.innerHTML}));
      const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'vv-chat-history.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }catch(e){ alert('Error exportando: ' + e); }
  });

  // Suggestions quick buttons
  function renderSuggestions(){
    const suggestions = [
      '¿Qué me recomiendas para dormir?',
      '¿Qué sirve para la piel seca?',
      '¿Tienen ofertas ahora?',
      '¿Cuánto tarda el envío?'
    ];
    suggestionsContainer.innerHTML = '';
    suggestions.forEach(s=>{
      const b = document.createElement('button'); b.type='button'; b.className='suggestion'; b.textContent = s;
      b.addEventListener('click', ()=>{ input.value = s; sendBtn.click(); });
      suggestionsContainer.appendChild(b);
    });
  }
  renderSuggestions();

  // Load history
  try{ const hist = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); hist.forEach(h=> appendMessage(h.text, h.who)); }catch(e){}

  function saveHistory(){
    const arr = Array.from(messages.querySelectorAll('.chat-msg')).map(el=>({who: el.classList.contains('user')? 'user':'bot', text: el.innerHTML}));
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-50))); }catch(e){}
  }

  const data = buildKnowledge();

  // Try to enrich KB by fetching objective pages (non-blocking)
  async function enrichKB(){
    const slugs = ['relajacion','sueno','digestivo','inmunidad','energia','concentracion','piel'];
    for(const s of slugs){
      try{
        const url = new URL(`./objetivo-${s}.html`, location.href).href;
        const resp = await fetch(url, {method:'GET'});
        if(!resp.ok) continue;
        const text = await resp.text();
        try{
          const dp = new DOMParser(); const doc = dp.parseFromString(text, 'text/html');
          const title = (doc.querySelector('h1') || doc.querySelector('h2') || {}).textContent || `Objetivo ${s}`;
          const paras = Array.from(doc.querySelectorAll('p')).slice(0,6).map(p=>p.textContent.trim()).join(' ');
          const txt = norm(title + ' ' + paras);
          data.kb.push({type:'article', title: title.trim(), desc: paras.slice(0,160), txt, url});
        }catch(e){}
      }catch(e){}
    }
  }
  enrichKB();

  // Run server detection if requested
  (async function(){
    const ok = await detectServer();
    serverAvailable = !!ok;
    if(enableServerMode === 'auto') enableServerMode = serverAvailable;
    if(serverAvailable){
      if(serverIndicator) serverIndicator.innerText = 'IA disponible';
    } else {
      if(serverIndicator) serverIndicator.innerText = 'Modo local';
    }
  })();

  async function handleQuestion(q){
    // avoid concurrent sends
    if(input.disabled) return;
    input.disabled = true; sendBtn.disabled = true;
    appendMessage(q, 'user');
    appendMessage('<em>Escribiendo...</em>', 'bot');
    messages.lastElementChild.scrollIntoView({behavior:'smooth'});

    try{
      // local answer
      const local = findBestLocalAnswer(q, data);
      if(local){
        // replace last bot "typing" with answer
        if(messages.lastElementChild && messages.lastElementChild.innerHTML && messages.lastElementChild.innerHTML.includes('Escribiendo')) messages.removeChild(messages.lastElementChild);
        appendMessage(local.answer, 'bot');
        return;
      }

      // fallback to server if configured and available
      if(enableServerMode){
        if(!serverAvailable){
          // Try to detect on-demand
          serverAvailable = await detectServer();
          if(!serverAvailable){
            if(messages.lastElementChild && messages.lastElementChild.innerHTML && messages.lastElementChild.innerHTML.includes('Escribiendo')) messages.removeChild(messages.lastElementChild);
            appendMessage('El servicio de IA no está disponible. Respondo localmente. (Prueba preguntas sobre envío, devoluciones, horario o menciona un producto.)', 'bot');
            return;
          }
        }

        try{
          const resp = await fetch(serverEndpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})});
          if(resp.ok){
            const body = await resp.json();
            const text = body.answer || body.result || JSON.stringify(body);
            // update indicator if server tells us provider
            try{ if(body && body.provider && serverIndicator) serverIndicator.innerText = (body.provider === 'anthropic' ? 'Claude Sonnet 4' : 'IA disponible'); }catch(e){}
            if(messages.lastElementChild && messages.lastElementChild.innerHTML && messages.lastElementChild.innerHTML.includes('Escribiendo')) messages.removeChild(messages.lastElementChild);
            appendMessage(text, 'bot');
            return;
          }else{
            // server reachable but returned error (e.g., OPENAI_API_KEY missing)
            let bodyText = await resp.text().catch(()=> '');
            if(messages.lastElementChild && messages.lastElementChild.innerHTML && messages.lastElementChild.innerHTML.includes('Escribiendo')) messages.removeChild(messages.lastElementChild);
            appendMessage('Error desde el servidor de IA: ' + (bodyText || resp.statusText || resp.status), 'bot');
            return;
          }
        }catch(err){
          if(messages.lastElementChild && messages.lastElementChild.innerHTML && messages.lastElementChild.innerHTML.includes('Escribiendo')) messages.removeChild(messages.lastElementChild);
          appendMessage('Error en la comunicación con el servidor de IA. Respondo localmente.', 'bot');
          return;
        }
      }

      // Generic fallback: search for keyword matches and return list
      const qn = norm(q);
      const qTokens = new Set(tokenize(qn));
      const matches = data.kb.map(it=>{
        const tokens = tokenize(it.txt);
        let m=0; for(const t of tokens) if(qTokens.has(t)) m++;
        return {it,score:m};
      }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,6);

      if(messages.lastElementChild && messages.lastElementChild.innerHTML && messages.lastElementChild.innerHTML.includes('Escribiendo')) messages.removeChild(messages.lastElementChild);
      if(matches.length){
        const html = ['No estoy seguro, pero esto puede interesarte:','<ul style="padding-left:16px;margin:6px 0">', ...matches.map(m=>`<li><a href="${m.it.url|| '#'}">${m.it.title}</a> — ${m.it.desc||''}</li>`),'</ul>'].join('\n');
        appendMessage(html, 'bot');
      }else{
        appendMessage('Lo siento, no tengo una respuesta directa. Prueba preguntas sobre envíos, devoluciones, horario o menciona un producto concreto.', 'bot');
      }
    }finally{
      // remove typing if still present
      if(messages.lastElementChild && messages.lastElementChild.innerHTML && messages.lastElementChild.innerHTML.includes('Escribiendo')){
        messages.removeChild(messages.lastElementChild);
      }
      input.disabled = false; sendBtn.disabled = false; saveHistory();
    }
  }

  sendBtn.addEventListener('click', ()=>{
    const v = input.value.trim(); if(!v) return; input.value=''; handleQuestion(v);
  });
  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendBtn.click(); } });

  // Expose a small API on window for power users
  window.VVChat = {
    open: ()=> setOpen(true),
    close: ()=> setOpen(false),
    ask: (q)=> handleQuestion(q)
  };

})();
