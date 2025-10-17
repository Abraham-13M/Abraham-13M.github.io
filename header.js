// header.js - shared header/submenu initialization
(function(){
  function initHeader(){
    const catalogLink = document.getElementById('catalogLink');
    const catalogToggle = document.getElementById('catalogToggle');
    const catalogSubmenu = document.getElementById('catalogSubmenu');
    const submenuFavorites = document.getElementById('submenuFavorites');
    const submenuPlatform = document.getElementById('submenuPlatform');
    const mobileFavorites = document.getElementById('mobileFavorites');
    const mobilePlatform = document.getElementById('mobilePlatform');
    const navToggle = document.getElementById('navToggle');
    const mobileNav = document.getElementById('mobileNav');
    const headerSearchForm = document.getElementById('headerSearchForm');
    const headerSearch = document.getElementById('headerSearch');
    const favCounter = document.getElementById('favCounter');
    const favCount = document.getElementById('favCount');
    const platformFilter = document.getElementById('platformFilter');

    // Unified close helper: always remove visual 'open' class and update aria state
    function closeCatalogSubmenu(){
      if(catalogSubmenu){ catalogSubmenu.classList.remove('open'); }
      if(catalogToggle){
        catalogToggle.setAttribute('aria-expanded','false');
        catalogToggle.classList.remove('open');
      }
    }

    if(catalogToggle && catalogSubmenu){
      catalogToggle.addEventListener('click', (e)=>{
        const open = catalogToggle.getAttribute('aria-expanded') === 'true';
  if(open) closeCatalogSubmenu(); else {
          catalogSubmenu.classList.add('open'); catalogToggle.setAttribute('aria-expanded','true'); if(catalogToggle) catalogToggle.classList.add('open');
          const menuItems = Array.from(catalogSubmenu.querySelectorAll('[role="menuitem"]'));
          menuItems.forEach((it, idx)=>{
            it.tabIndex = -1;
            it.addEventListener('focus', ()=>{ menuItems.forEach((m,i)=> m.tabIndex = (i===idx?0:-1)); });
            it.addEventListener('keydown', (ev)=>{
              if(ev.key === 'ArrowDown'){ ev.preventDefault(); const next = (idx+1) % menuItems.length; menuItems[next].focus(); }
              if(ev.key === 'ArrowUp'){ ev.preventDefault(); const prev = (idx-1 + menuItems.length) % menuItems.length; menuItems[prev].focus(); }
              if(ev.key === 'Home'){ ev.preventDefault(); menuItems[0].focus(); }
              if(ev.key === 'End'){ ev.preventDefault(); menuItems[menuItems.length-1].focus(); }
              if(ev.key === 'Escape'){ closeCatalogSubmenu(); if(catalogToggle) catalogToggle.focus(); }
            });
          });
          const first = menuItems[0]; if(first) first.focus();
        }
        e.stopPropagation();
      });
      document.addEventListener('click', (e)=>{ if(catalogSubmenu && !catalogSubmenu.contains(e.target) && e.target !== catalogToggle && e.target !== catalogLink) closeCatalogSubmenu(); });
      document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeCatalogSubmenu(); });
    }

    if(catalogLink && catalogToggle){
      catalogLink.addEventListener('keydown', (e)=>{
        if(e.key === 'ArrowDown'){
          e.preventDefault();
          if(catalogSubmenu) catalogSubmenu.classList.add('open');
          if(catalogToggle){ catalogToggle.setAttribute('aria-expanded','true'); catalogToggle.classList.add('open'); }
          const first = catalogSubmenu && catalogSubmenu.querySelector('[role="menuitem"]'); if(first) first.focus();
        }
      });
    }

    // submenu favorites behaviour - try to use page globals if available
    if(submenuFavorites){
      submenuFavorites.addEventListener('click', ()=>{
        if(window.favorites && window.favorites.length>0 && Array.isArray(window.catalog) && typeof window.renderCatalog === 'function'){
          const favItems = window.catalog.filter(i=>window.favorites.includes(i.nombre));
          if(window.currentPage!==undefined) window.currentPage = 1;
          window.renderCatalog(favItems);
        } else {
          alert('No hay favoritos disponibles o la página no soporta la vista de favoritos.');
        }
        closeCatalogSubmenu();
      });
    }

    if(submenuPlatform){
      submenuPlatform.addEventListener('change', ()=>{
        const p = submenuPlatform.value;
        if(platformFilter) platformFilter.value = p;
        if(mobilePlatform) mobilePlatform.value = p;
        if(typeof window.applyFilters === 'function') window.applyFilters();
        closeCatalogSubmenu();
      });
    }

    if(mobileFavorites){
      mobileFavorites.addEventListener('click', (e)=>{
        e.preventDefault();
        if(window.favorites && window.favorites.length>0 && Array.isArray(window.catalog) && typeof window.renderCatalog === 'function'){
          const favItems = window.catalog.filter(i=>window.favorites.includes(i.nombre));
          if(window.currentPage!==undefined) window.currentPage = 1;
          window.renderCatalog(favItems);
        } else { alert('No tienes favoritos.'); }
        if(navToggle) navToggle.click();
      });
    }

    if(mobilePlatform){
      mobilePlatform.addEventListener('change', ()=>{
        const v = mobilePlatform.value;
        if(platformFilter) platformFilter.value = v;
        if(typeof window.applyFilters === 'function') window.applyFilters();
        if(navToggle) navToggle.click();
      });
    }

    // mobile nav
    if(navToggle){
      navToggle.addEventListener('click', ()=>{
        const open = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', String(!open));
        if(!open){ if(mobileNav){ mobileNav.style.display = 'block'; mobileNav.setAttribute('aria-hidden','false'); } }
        else { if(mobileNav){ mobileNav.style.display = 'none'; mobileNav.setAttribute('aria-hidden','true'); } }
      });
    }

    // header search: redirect same as before
    if(headerSearchForm && headerSearch){
      headerSearchForm.addEventListener('submit', (e)=>{ e.preventDefault(); const q = headerSearch.value.trim(); if(!q) return window.location.href='catalogo.html'; window.location.href = 'catalogo.html?search=' + encodeURIComponent(q); });
      headerSearch.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ headerSearchForm.dispatchEvent(new Event('submit')); } });
    }

    // favCounter basic behaviour (if page has catalog + favorites + renderCatalog)
    if(favCounter){
      favCounter.addEventListener('click', ()=>{
        if(window.favorites && window.favorites.length>0 && Array.isArray(window.catalog) && typeof window.renderCatalog === 'function'){
          const favItems = window.catalog.filter(i=>window.favorites.includes(i.nombre));
          if(window.currentPage!==undefined) window.currentPage = 1;
          window.renderCatalog(favItems);
        } else { alert('No tienes favoritos aún. Marca juegos con el botón ☆/★ para agregarlos.'); }
      });
      favCounter.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){ e.preventDefault(); favCounter.click(); } });
      favCounter.addEventListener('focus', ()=> favCounter.classList.add('focus-ring')); favCounter.addEventListener('blur', ()=> favCounter.classList.remove('focus-ring'));
    }

    // update favCount if page exposes updateFavCounter()
    if(typeof window.updateFavCounter === 'function') window.updateFavCounter();
  }

  // expose init function and also auto-init if script is loaded after DOM
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    try{ initHeader(); }catch(e){ /* fail silently */ }
  } else {
    window.addEventListener('DOMContentLoaded', ()=>{ try{ initHeader(); }catch(e){ } });
  }

  // also expose for manual invocation if needed
  window.initHeader = initHeader;
})();
