// main.js - comportamiento mínimo para la landing
document.addEventListener('DOMContentLoaded', function(){
  // Aplicar tema si se pasa ?theme=olive o ?theme=sage, o guardar/leer de localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get('theme');
  const savedTheme = localStorage.getItem('vv-theme');
  const html = document.documentElement;
  if(themeParam){
    html.setAttribute('data-theme', themeParam);
    localStorage.setItem('vv-theme', themeParam);
    console.info('Tema aplicado desde query param:', themeParam);
  } else if(savedTheme){
    html.setAttribute('data-theme', savedTheme);
    console.info('Tema aplicado desde localStorage:', savedTheme);
  }

  // Rellenar año en footer
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Newsletter form handling (Netlify will process server-side). We keep client-side feedback.
  const newsletterForm = document.getElementById('newsletterForm');
  if(newsletterForm){
    newsletterForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const email = (document.getElementById('newsletterEmail')||{}).value || '';
      if(!email){ alert('Introduce un correo válido'); return; }

      // Prefer serverless function if deployed on Netlify (use /.netlify/functions/...)
      const endpoint = '/.netlify/functions/mailerlite-subscribe';
      try{
        const res = await fetch(endpoint, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email}) });
        if(res.ok){
          alert('Gracias. Te hemos suscrito — revisa tu correo para confirmar.');
          newsletterForm.reset();
          return;
        }
        // fallback to Formspree if function not available
        const text = await res.text();
        console.warn('Serverless subscribe failed:', text);
      }catch(err){
        console.info('Serverless endpoint no disponible, intentando Formspree o simulación.');
      }

      // If here, we try Formspree posting if the form has action set
      const action = newsletterForm.getAttribute('action');
      if(action){
        // create a form and submit
        const form = document.createElement('form');
        form.method = 'POST'; form.action = action;
        const input = document.createElement('input'); input.type='hidden'; input.name='email'; input.value=email; form.appendChild(input);
        document.body.appendChild(form); form.submit();
        return;
      }

      // fallback simulation
      alert('Gracias. (Simulación) Revisar configuración de serverless/Formspree para envío real.');
      newsletterForm.reset();
    });
  }

  // Contact form fallback: if not hosted on Netlify, show a friendly alert on submit
  const contactForm = document.getElementById('contactForm');
  if(contactForm && !contactForm.hasAttribute('data-netlify')){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      alert('Formulario enviado (simulado). En producción configura Netlify Forms o Formspree.');
    });
  }

  // Rellenar panel dev-status si existe
  const devTheme = document.getElementById('dev-theme');
  const devContact = document.getElementById('dev-contact-action');
  const devNews = document.getElementById('dev-news-action');
  const devImages = document.getElementById('dev-images');
  const devFunctions = document.getElementById('dev-functions');
  if(devTheme) devTheme.textContent = document.documentElement.getAttribute('data-theme') || 'default';
  if(devContact) devContact.textContent = contactForm ? (contactForm.getAttribute('action') || '(no action)') : '(no contact form)';
  if(devNews) devNews.textContent = newsletterForm ? (newsletterForm.getAttribute('action') || '(serverless first)') : '(no newsletter form)';
  if(devFunctions) devFunctions.textContent = '/.netlify/functions/mailerlite-subscribe';
  if(devImages){
    const imgs = ['hero.jpg','about.jpg','lavanda.jpg','curcuma.jpg','infusion.jpg'];
    const present = imgs.filter(n=>{ try{ return !!document.querySelector(`img[src$="${n}"]`); }catch(e){return false;} });
    devImages.textContent = present.length ? present.join(', ') : 'ninguna encontrada';
  }

  // Smooth scroll para enlaces internos (mejora la navegación como en la referencia)
  document.querySelectorAll('a[href^="#"]').forEach(function(link){
    link.addEventListener('click', function(e){
      const href = this.getAttribute('href');
      if(!href || href === '#') return; // deja comportamiento por defecto
      try{
        const target = document.querySelector(href);
        if(target){
          e.preventDefault();
          target.scrollIntoView({behavior:'smooth', block:'start'});
          // foco accesible
          target.setAttribute('tabindex','-1');
          target.focus({preventScroll:true});
          // actualizar URL sin recargar
          history.replaceState(null, '', href);
        }
      }catch(err){
        // si hay problema, dejamos comportamiento por defecto
        console.warn('Smooth scroll failed for', href, err);
      }
    });
  });

  // ---------- BÚSQUEDA CLIENTE (filtrado simple)
  const searchInput = document.getElementById('siteSearch');
  const products = Array.from(document.querySelectorAll('.product'));
  function normalize(s){ return (s||'').toString().toLowerCase(); }
  function filterProducts(term){
    const q = normalize(term).trim();
    if(!q){ products.forEach(p=>p.style.display=''); return; }
    products.forEach(p=>{
      const title = normalize(p.getAttribute('data-title') || p.querySelector('[itemprop=name]')?.textContent);
      const desc = normalize(p.querySelector('[itemprop=description]')?.textContent || '');
      const hay = (title + ' ' + desc).indexOf(q) !== -1;
      p.style.display = hay ? '' : 'none';
    });
  }
  if(searchInput){
    let debounce;
    searchInput.addEventListener('input', function(e){
      clearTimeout(debounce);
      debounce = setTimeout(()=> filterProducts(this.value), 180);
    });
    // permitir buscar con Enter
    searchInput.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); filterProducts(this.value); } });
  }

  // ---------- CARRUSEL DE OFERTAS (scroll horizontal + arrastrar con ratón/touch)
  const offersWrap = document.querySelector('.offers-wrap');
  if (offersWrap) {
    const carousel = offersWrap.querySelector('.offers-carousel');
    const prev = offersWrap.querySelector('.offers-prev');
    const next = offersWrap.querySelector('.offers-next');

    if (carousel) {
      // compute an approximate item width dynamically (first item + gap)
      const firstItem = carousel.querySelector('.product');
      const gap = parseFloat(getComputedStyle(carousel).gap) || 18;
      const itemWidth = firstItem ? Math.round(firstItem.getBoundingClientRect().width + gap) : 320;

      // arrow buttons scroll by one item
      if (prev) prev.addEventListener('click', () => carousel.scrollBy({ left: -itemWidth, behavior: 'smooth' }));
      if (next) next.addEventListener('click', () => carousel.scrollBy({ left: itemWidth, behavior: 'smooth' }));

      // --- Drag to scroll (pointer events) ---
      // We'll use pointer events so mouse and touch work the same. While dragging we block link clicks.
      let isPointerDown = false;
      let startX = 0;
      let startScroll = 0;
      let pointerId = null;
      let wasDragging = false;

      carousel.style.touchAction = carousel.style.touchAction || 'pan-y'; // allow vertical native scrolling

      carousel.addEventListener('pointerdown', (e) => {
        // only left button or touch
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        isPointerDown = true;
        wasDragging = false;
        pointerId = e.pointerId;
        carousel.setPointerCapture(pointerId);
        startX = e.clientX;
        startScroll = carousel.scrollLeft;
        carousel.classList.add('is-dragging');
      });

      carousel.addEventListener('pointermove', (e) => {
        if (!isPointerDown || e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 5) wasDragging = true;
        // invert dx: moving mouse right should scroll left visually
        carousel.scrollLeft = startScroll - dx;
      });

      function endPointer(e) {
        if (!isPointerDown || (pointerId && e && e.pointerId && e.pointerId !== pointerId)) return;
        isPointerDown = false;
        try{ if(pointerId) carousel.releasePointerCapture(pointerId); }catch(err){}
        pointerId = null;
        carousel.classList.remove('is-dragging');
        // small debounce to keep wasDragging true for the subsequent click event
        if (wasDragging) {
          // temporarily mark the carousel as having been dragged so clicks inside it can be ignored
          carousel.dataset.wasDragging = '1';
          setTimeout(()=>{ delete carousel.dataset.wasDragging; }, 50);
        }
      }

      carousel.addEventListener('pointerup', endPointer);
      carousel.addEventListener('pointercancel', endPointer);
      carousel.addEventListener('lostpointercapture', endPointer);

      // Prevent clicks on links while dragging (so a drag doesn't trigger navigation)
      // Allow product links inside the carousel (class .btn-primary) to navigate even after a drag.
      carousel.addEventListener('click', function(e){
        if (carousel.dataset.wasDragging) {
          const a = e.target.closest('a');
          if (a) {
            // If the link is the product CTA, allow navigation — user expects to open the product page.
            if (a.classList && a.classList.contains('btn-primary')) {
              return; // allow default navigation
            }
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }, true);

      // Support legacy touch as fallback (keeps behaviour for older browsers)
      let touchStartX = 0, touchStartScroll = 0, touchDown = false;
      carousel.addEventListener('touchstart', function(e){ if(e.touches && e.touches[0]){ touchDown=true; touchStartX = e.touches[0].clientX; touchStartScroll = carousel.scrollLeft; } }, {passive:true});
      carousel.addEventListener('touchmove', function(e){ if(!touchDown) return; const dx = e.touches[0].clientX - touchStartX; carousel.scrollLeft = touchStartScroll - dx; }, {passive:true});
      carousel.addEventListener('touchend', function(){ touchDown=false; });
    }

    // Delegated click fallback: ensure prev/next work even if direct listeners fail
    offersWrap.addEventListener('click', function(e){
      const btnPrev = e.target.closest('.offers-prev');
      const btnNext = e.target.closest('.offers-next');
      if (btnPrev && carousel){ e.preventDefault(); const firstItem = carousel.querySelector('.product'); const gap = parseFloat(getComputedStyle(carousel).gap) || 18; const w = firstItem ? Math.round(firstItem.getBoundingClientRect().width + gap) : 320; carousel.scrollBy({left:-w,behavior:'smooth'}); return; }
      if (btnNext && carousel){ e.preventDefault(); const firstItem = carousel.querySelector('.product'); const gap = parseFloat(getComputedStyle(carousel).gap) || 18; const w = firstItem ? Math.round(firstItem.getBoundingClientRect().width + gap) : 320; carousel.scrollBy({left:w,behavior:'smooth'}); return; }
    });
  }

  // If the carousel doesn't overflow (few items on wide screens) clone items until it does so arrows/drag work.
  ;(function ensureCarouselOverflow(){
    const wrap = document.querySelector('.offers-wrap');
    if(!wrap) return;
    const track = wrap.querySelector('.offers-carousel');
    if(!track) return;

    const originalItems = Array.from(track.querySelectorAll('.product'));
    if(originalItems.length === 0) return;

    // Try to clone synchronously and also after images load (in case widths weren't calculated yet)
    function tryClone(maxRounds=6){
      let rounds = 0;
      // safety: don't run forever
      while(track.scrollWidth <= track.clientWidth && rounds < maxRounds){
        originalItems.forEach(it=>{
          const c = it.cloneNode(true);
          c.classList.add('cloned');
          // ensure no duplicate ids inside clones
          c.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
          track.appendChild(c);
        });
        rounds++;
      }
      if(rounds > 0) console.info('offers-carousel: cloned items x' + rounds + ' to force overflow');
      return rounds;
    }

    // First attempt now
    let made = tryClone(5);
    // If nothing was cloned (likely because images not loaded yet) schedule another attempt on window load
    if(made === 0){
      window.addEventListener('load', function(){ tryClone(8); });
      // also try a short timeout in case load already fired
      setTimeout(()=> tryClone(3), 250);
    }
  })();

  // Fallback: if the native select is not visible or not rendering correctly,
  // create a row of buttons so users can choose an objective. This helps when
  // some browsers or CSS environments hide the select control.
  (function heroSelectFallback(){
    const heroSelect = document.getElementById('hero-select');
    const heroBtn = document.getElementById('hero-cta');
    if(!heroSelect || !heroBtn) return;
    // detect if select is visible
    const cs = getComputedStyle(heroSelect);
    const isHidden = cs.display === 'none' || cs.visibility === 'hidden' || heroSelect.offsetWidth === 0 || heroSelect.options.length === 0;
    if(!isHidden) return; // native select visible, nothing to do

    // build fallback buttons
    const wrapper = document.createElement('div');
    wrapper.className = 'hero-select-fallback';
    Array.from([].slice.call(heroSelect.options)).forEach(opt=>{
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = opt.textContent || opt.value;
      b.dataset.value = opt.value;
      b.addEventListener('click', function(){
        // mark active
        wrapper.querySelectorAll('button').forEach(btn=>btn.classList.remove('active'));
        b.classList.add('active');
        // set select value (if possible) and simulate click on the CTA
        try{ heroSelect.value = b.dataset.value; }catch(e){}
        // trigger the CTA navigation
        heroBtn.click();
      });
      wrapper.appendChild(b);
    });
    // insert after the select (or at end of hero-controls)
    const parent = heroSelect.parentNode;
    if(parent){ parent.appendChild(wrapper); }
    console.info('hero-select-fallback: created fallback buttons because select was not visible');
  })();

  // Enhanced carousel: indicators + autoplay
  (function(){
    const offersWrapLocal = document.querySelector('.offers-wrap');
    if(!offersWrapLocal) return;
    const carousel = offersWrapLocal.querySelector('.offers-carousel');
    if(!carousel) return;
    const items = Array.from(carousel.querySelectorAll('.product'));
    if(items.length === 0) return;
    // create indicators
    const dots = document.createElement('div');
    dots.className = 'offers-dots';
    items.forEach((it, idx)=>{
      const d = document.createElement('button');
      d.className = 'offers-dot';
      d.setAttribute('aria-label', 'Ir a oferta ' + (idx+1));
      d.addEventListener('click', ()=>{
        const left = it.offsetLeft - carousel.offsetLeft;
        carousel.scrollTo({left,behavior:'smooth'});
      });
      dots.appendChild(d);
    });
    const nextBtn = offersWrapLocal.querySelector('.offers-next');
    if(nextBtn) offersWrapLocal.insertBefore(dots, nextBtn);

    function updateDots(){
      const scrollLeft = carousel.scrollLeft;
      let active = 0;
      items.forEach((it, idx)=>{ if(scrollLeft + 10 >= it.offsetLeft - carousel.offsetLeft) active = idx; });
      Array.from(dots.children).forEach((b,i)=> b.classList.toggle('active', i===active));
    }
    carousel.addEventListener('scroll', ()=> updateDots());
    updateDots();

    // autoplay
    let autoplay = setInterval(()=>{
      const current = Array.from(dots.children).findIndex(d=>d.classList.contains('active'));
      const nextIdx = (current+1) % items.length;
      const it = items[nextIdx];
      carousel.scrollTo({left: it.offsetLeft - carousel.offsetLeft, behavior:'smooth'});
    }, 4500);
    // pause on hover/focus
    offersWrapLocal.addEventListener('mouseover', ()=> clearInterval(autoplay));
    offersWrapLocal.addEventListener('mouseleave', ()=> { clearInterval(autoplay); autoplay = setInterval(()=>{ const current = Array.from(dots.children).findIndex(d=>d.classList.contains('active')); const nextIdx = (current+1) % items.length; const it = items[nextIdx]; carousel.scrollTo({left: it.offsetLeft - carousel.offsetLeft, behavior:'smooth'}); }, 4500); });
    // accessibility: keyboard navigation for dots
    dots.querySelectorAll('.offers-dot').forEach((b, i)=> b.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const it = items[i]; carousel.scrollTo({left: it.offsetLeft - carousel.offsetLeft, behavior:'smooth'}); } }));
  })();

  // ---------------- CART (local-only, simple) ----------------
  // Cart stored in localStorage under key 'vv-cart'
  function getCart(){
    try{ return JSON.parse(localStorage.getItem('vv-cart') || '[]'); }catch(e){ return []; }
  }
  function saveCart(cart){ localStorage.setItem('vv-cart', JSON.stringify(cart)); updateCartUI(); }
  function updateCartUI(){
    const cart = getCart();
    const count = cart.reduce((s,i)=>s + (i.qty||0), 0);
    const total = cart.reduce((s,i)=>s + (parseFloat(i.price)||0) * (i.qty||0), 0).toFixed(2);
    const cartLink = document.querySelector('.cart-link');
    if(cartLink){
      cartLink.innerHTML = `🛒 <span class="small muted">${count} · ${total} €</span>`;
    }
  }
  function addToCart(item){
    const cart = getCart();
    const existing = cart.find(i=>i.id === item.id);
    if(existing){ existing.qty = (existing.qty||1) + (item.qty||1); }
    else { cart.push({ id: item.id, name: item.name, price: item.price, qty: item.qty || 1 }); }
    saveCart(cart);
  }

  // Delegate add-to-cart clicks (buttons with .btn-add-cart)
  document.addEventListener('click', function(e){
    const b = e.target.closest && e.target.closest('.btn-add-cart');
    if(!b) return;
    e.preventDefault();
    const id = b.getAttribute('data-id');
    const name = b.getAttribute('data-name') || b.getAttribute('data-id');
    const price = parseFloat(b.getAttribute('data-price') || '0');
    addToCart({ id, name, price, qty: 1 });
    // small feedback
    b.textContent = 'Añadido ✓';
    setTimeout(()=>{ b.textContent = 'Añadir al carrito'; }, 1200);
  });

  // No-op: product links ('.btn-primary') in the offers carousel will navigate normally.

  // Update cart UI on load
  updateCartUI();

  // The 'Comprar' CTAs in the offers carousel are standard <a class="btn-primary" href="..."> links.
  // We intentionally allow native browser navigation for these links (same as 'Ver producto').
  // If any other script is preventing navigation, it's safer to inspect/remove that script
  // rather than force navigation here. For debugging purposes you can enable the log below.
  // Example debug (uncomment if needed):
  // document.querySelectorAll('.offers-wrap .offers-carousel a.btn-primary').forEach(a=> a.addEventListener('click', e=> console.log('offers CTA clicked', a.href), {capture:true}));

  // DEBUG: log clicks on offers carousel CTAs without modifying behavior.
  // This helps diagnose why a click might not navigate in the user's browser.
  document.addEventListener('click', function debugOffersClick(e){
    try{
      const anchor = e.target.closest && e.target.closest('.offers-wrap .offers-carousel a.btn-primary');
      if(!anchor) return; // not an offer CTA
      const wrap = anchor.closest('.offers-wrap');
      const carousel = wrap && wrap.querySelector('.offers-carousel');
      console.groupCollapsed('DEBUG: offers CTA click');
      console.log('href:', anchor.getAttribute('href'));
      console.log('isTrusted:', e.isTrusted, 'defaultPrevented:', e.defaultPrevented);
      console.log('event target:', e.target);
      console.log('carousel wasDragging dataset:', carousel && carousel.dataset && carousel.dataset.wasDragging);
      console.log('anchor classes:', anchor.className);
      console.log('window.location.href (before):', window.location.href);
      console.groupEnd();
      // do not prevent default – only logging
    }catch(err){ console.warn('debugOffersClick error', err); }
  }, true);

  // DEBUG: monitor who calls preventDefault for click events on offers CTAs.
  // This temporarily wraps Event.prototype.preventDefault to log a stack trace
  // when some code prevents the click on a .offers-carousel a.btn-primary.
  (function monitorPreventDefault(){
    try{
      const origPrevent = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function(){
        try{
          if(this && this.type === 'click'){
            const t = this.target || this.srcElement;
            const anchor = t && t.closest && t.closest('.offers-wrap .offers-carousel a.btn-primary');
            if(anchor){
              console.groupCollapsed('DEBUG preventDefault called for offers CTA');
              console.log('anchor href:', anchor.getAttribute('href'));
              console.log('event target:', t);
              console.log('call stack:');
              console.trace();
              console.groupEnd();
            }
          }
        }catch(err){ /* ignore debug errors */ }
        return origPrevent.apply(this, arguments);
      };
    }catch(err){ console.warn('monitorPreventDefault failed', err); }
  })();

  // Ensure buy links inside the offers carousel behave exactly like 'Ver producto'.
  // If native navigation is blocked by another handler, this capture-phase listener
  // will attempt navigation shortly after the click. It does not prevent default
  // behaviour; it only forces navigation as fallback.
  (function ensureOffersCTABehavior(){
    const offersWrap = document.querySelector('.offers-wrap');
    if(!offersWrap) return;
    const carousel = offersWrap.querySelector('.offers-carousel');
    if(!carousel) return;
    const anchors = carousel.querySelectorAll('a.btn-primary');
    anchors.forEach(a=>{
      a.addEventListener('click', function(e){
        try{
          const href = a.getAttribute('href');
          if(!href) return;
          // schedule a fallback navigation shortly after the click.
          // Most of the time the browser will navigate natively and the timeout
          // will never be reached because the page unloads. If something prevented
          // the navigation, this will open the target in the same tab.
          setTimeout(()=>{
            // If location already changed to the target, skip
            try{ if(location.pathname.endsWith(href) || location.href.indexOf(href) !== -1) return; }catch(err){}
            window.location.assign(href);
          }, 80);
        }catch(err){ console.warn('offers CTA fallback navigation error', err); }
      }, {capture:true});
    });
  })();

  // HERO CTA: navegar a una página de objetivo según la selección del usuario
  (function heroCTA(){
    const heroBtn = document.getElementById('hero-cta');
    const heroSelect = document.getElementById('hero-select');
    if(!heroBtn || !heroSelect) return;
    heroBtn.addEventListener('click', function(e){
      try{
        const val = (heroSelect.value || 'relajacion').toString().trim();
        // map value to a file name (we use "objetivo-<slug>.html" in the site root)
        const allowed = ['relajacion','sueno','digestivo','inmunidad','energia','concentracion','piel'];
        const slug = allowed.includes(val) ? val : 'relajacion';
  // use a relative path so navigation works from file:// and from any hosting root
  const href = './objetivo-' + slug + '.html';
  // debug log
  console.info('Hero CTA -> navigating to', href);
  // navigate in same tab; small delay for UX (button ripple) then assign
  setTimeout(()=> { window.location.href = href; }, 60);
      }catch(err){ console.warn('Hero CTA navigation failed', err); }
    });
  })();

  // Provide a visible options toggle/menu beside the select so users can open
  // a clear list of objectives if the native dropdown doesn't render properly.
  (function heroOptionsMenu(){
    const heroControls = document.querySelector('.hero-controls');
    const heroSelect = document.getElementById('hero-select');
    const heroBtn = document.getElementById('hero-cta');
    if(!heroControls || !heroSelect || !heroBtn) return;

    // create toggle button if not present
    let toggle = heroControls.querySelector('.hero-options-toggle');
    if(!toggle){
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'hero-options-toggle';
      toggle.textContent = 'Opciones';
      // insert after the select
      heroSelect.insertAdjacentElement('afterend', toggle);
    }

    // build floating menu appended to body to avoid clipping
    let menu = document.querySelector('.hero-options-menu');
    if(!menu){
      menu = document.createElement('div');
      menu.className = 'hero-options-menu';
      menu.setAttribute('role','menu');
      document.body.appendChild(menu);
    }

    // populate menu from select options
    function renderMenu(){
      menu.innerHTML = '';
      Array.from(heroSelect.options).forEach(opt=>{
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = opt.textContent;
        b.dataset.value = opt.value;
        b.addEventListener('click', ()=>{
          // set select, close menu and trigger navigation
          try{ heroSelect.value = b.dataset.value; }catch(e){}
          // visual active state
          menu.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          menu.classList.remove('open');
          // trigger the CTA's handler (same as clicking the CTA)
          heroBtn.click();
        });
        menu.appendChild(b);
      });
    }

    renderMenu();

    // toggle behavior
    toggle.addEventListener('click', function(){
      menu.classList.toggle('open');
      // position menu near the toggle (calculate coords)
      const rect = toggle.getBoundingClientRect();
      // place menu under toggle on wide screens, or fixed bottom on small
      if(window.innerWidth > 900){
        menu.style.left = (rect.left) + 'px';
        menu.style.top = (rect.bottom + 8) + 'px';
        menu.style.right = 'auto';
      } else {
        menu.style.left = '';
        menu.style.right = '12px';
      }
    });

    // close on outside click or Esc
    document.addEventListener('click', function(e){ if(!menu.contains(e.target) && !toggle.contains(e.target)) menu.classList.remove('open'); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') menu.classList.remove('open'); });
  })();

  // Bubble-phase safety: if any handler prevented the default navigation for a
  // .offers-carousel a.btn-primary link, navigate programmatically here.
  // This runs in the bubble phase (after capture/target), so it detects
  // defaultPrevented set by other listeners and fixes the navigation.
  document.addEventListener('click', function(e){
    try{
      const anchor = e.target.closest && e.target.closest('.offers-wrap .offers-carousel a.btn-primary');
      if(!anchor) return;
      if(e.defaultPrevented){
        // Some script prevented the navigation; force it now in the same tab.
        window.location.assign(anchor.href);
      }
    }catch(err){ /* ignore */ }
  }, false);

  // Robust capture-phase handler: force navigation for carousel 'Comprar' links
  // in case other handlers prevent default or the browser blocks native navigation.
  document.addEventListener('click', function(e){
    try{
      const anchor = e.target.closest && e.target.closest('.offers-carousel a.btn-primary');
      if(!anchor) return;
      // Only react to primary (left) clicks without modifiers
      if(e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Prevent other handlers from interfering and navigate immediately in same tab
      e.preventDefault();
      console.info('Forced navigation to', anchor.href);
      window.location.href = anchor.href;
    }catch(err){ console.warn('Forced carousel CTA navigation failed', err); }
  }, true);

  // EXTRA: handle mousedown in capture phase to force navigation earlier
  // Some drag/pointer handlers can intercept click events; handling mousedown
  // ensures immediate navigation on left-button press (no modifiers).
  document.addEventListener('mousedown', function(e){
    try{
      const anchor = e.target.closest && e.target.closest('.offers-carousel a.btn-primary');
      if(!anchor) return;
      if(e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Prevent other handlers from stopping navigation and navigate now
      e.preventDefault();
      e.stopImmediatePropagation && e.stopImmediatePropagation();
      console.info('Mousedown forced navigation to', anchor.href);
      window.location.href = anchor.href;
    }catch(err){ console.warn('Mousedown navigation fail', err); }
  }, true);

  // Delegate clicks on buy-now buttons inside offers carousel to navigate to product pages
  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('button.buy-now');
    if(!btn) return;
    // If the button was clicked during a drag, still treat it as an intentional click
    const href = btn.getAttribute('data-href');
    if(!href) return;
    // provide tiny delay to allow any UI feedback then navigate
    e.preventDefault();
    setTimeout(()=> { window.location.href = href; }, 10);
  }, true);
});
