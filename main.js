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
});
