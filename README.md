# Cambios en la landing

Resumen de los cambios realizados para acercar la landing al estilo de la referencia (https://www.herbolariosdimam.es):

- Header reescrito: logo, nombre, menú, campo de búsqueda y enlace de carrito.
- Barra de promoción y fila de confianza (envío 24/48h, asesoramiento, pago seguro).
- Sección "Ofertas" convertida en carrusel horizontal con controles prev/next y soporte táctil.
- Productos y ofertas anotados con microdatos Schema.org (Organization, Product, Offer) básicos.
- Búsqueda cliente: filtro simple por título/descripcion de productos (campo `#siteSearch`).
- CTA y enlaces convertidos a anchors internas que usan desplazamiento suave.
- Añadida ilustración SVG `assets/images/plant-herbal.svg` como imagen hero.

Archivos modificados:

- `index.html` — estructura del header, ofertas (carrusel), microdatos y anotaciones.
- `styles.css` — estilos para header, carousel, trust row y ajustes visuales.
- `main.js` — búsqueda cliente, smooth scroll y control del carrusel.
- `assets/images/plant-herbal.svg` — ilustración añadida.

Cómo probarlo localmente

1. Inicia el servidor local (ya incluido en el repo):

```powershell
.\serve.ps1 -Port 8000
```

2. Abre http://localhost:8000/ en tu navegador.

3. Prueba:
- Escribe en el campo de búsqueda (encabezado) para filtrar productos.
- Usa las flechas del carrusel en la sección "Ofertas" para navegar.
- Haz clic en "Comprar" en un producto para ir a la sección de contacto.

Siguientes pasos recomendados

- Conectar cada producto a páginas de producto reales (si tienes URLs / catálogo).
- Reemplazar imágenes de ejemplo por fotos optimizadas (sitio de producción).
- Añadir datos de precio más completos y disponibilidad en los microdatos (si se dispone de inventario).

Si quieres que avance con alguno de los pasos anteriores (por ejemplo enlazar productos a páginas reales o mejorar SEO con JSON-LD), dime cuál y lo implemento.
# Herbolario Verde Vida — Landing

Este repositorio contiene una landing page estática para Herbolario Verde Vida.

Contenido
- `index.html` — página principal (HTML que enlaza `styles.css` y `main.js`).
- `styles.css` — estilos principales.
- `main.js` — JavaScript mínimo para manejo de formularios y dinámicas.
- `assets/images/` — carpeta para imágenes locales (logo.svg incluido).

Imágenes locales
- Crea `assets/images/` y añade los siguientes archivos opcionales:
  - `hero.jpg`
  - `about.jpg`
  - `lavanda.jpg`
  - `curcuma.jpg`
  - `infusion.jpg`
  - `logo.svg` (ya incluido)

Netlify Forms
- El formulario de contacto y el formulario de newsletter están preparados para Netlify. Para usarlo:
  1. Sube este repositorio a GitHub.
  2. Conecta el repositorio en Netlify (New site -> GitHub).
  3. Despliega. Netlify detectará los formularios marcados con `data-netlify="true"`.
  4. En Netlify, en la sección "Forms" verás las entradas.

Formspree alternativa
- Si prefieres usar Formspree en lugar de Netlify Forms, modifica el formulario así (ejemplo para newsletter):

<form action="https://formspree.io/f/your-id" method="POST">
  <input type="email" name="email" required>
  <button type="submit">Suscribirse</button>
</form>

- Reemplaza `your-id` por el identificador que Formspree te proporcione.

Formspree (configuración en este proyecto)
- En `index.html` he añadido formularios que apuntan a Formspree con un placeholder `YOUR_FORMSPREE_ID` (contacto) y `NEWSLETTER_FORMSPREE_ID` (newsletter).
- Para activar Formspree:
  1. Regístrate en Formspree (https://formspree.io) y crea un formulario; copia el ID que te dan.
  2. Sustituye `YOUR_FORMSPREE_ID` y `NEWSLETTER_FORMSPREE_ID` en `index.html` por los IDs reales.
  3. Opcionalmente configura redirección o mensaje de confirmación en la UI de Formspree.

Doble opt-in (MailerLite / Mailchimp)
- Para una suscripción sólida y legal (GDPR-friendly), recomiendo usar MailerLite o Mailchimp con doble opt-in:
  - MailerLite: crea un formulario o un "Group" y usa su API para añadir suscriptores. Activa la opción de doble opt-in desde Settings -> Sign up forms.
  - Mailchimp: crea una lista (Audience) y una embedded form o usa la API. Habilita double opt-in en Audience settings.

Ejemplo rápido (MailerLite) - flujo básico con su API:
  1. Crea una cuenta en MailerLite y obtén tu API Key.
  2. Usa su endpoint para suscriptores:
     POST https://api.mailerlite.com/api/v2/subscribers
     Headers: Content-Type: application/json, X-MailerLite-ApiKey: <YOUR_KEY>
     Body: {"email":"user@example.com","resubscribe":false}
  3. Activa double opt-in desde la interfaz para enviar correo de confirmación. Requiere backend o función serverless para mantener la API Key segura.

Nota: no publiques la API Key en el frontend. Para una integración segura, crea una función serverless (Netlify Functions, Vercel Serverless) o un pequeño endpoint que acepte el email y llame a la API de MailerLite/Mailchimp.

Descargar imágenes locales (PowerShell)
- No puedo descargar imágenes a tu repositorio desde aquí. Puedes ejecutar los siguientes comandos en PowerShell para obtener imágenes públicas desde Unsplash (ejemplo):

```powershell
# Crea la carpeta si no existe
New-Item -ItemType Directory -Force -Path .\assets\images

# Descarga imagen para hero
(New-Object System.Net.WebClient).DownloadFile('https://images.unsplash.com/photo-1517976487492-1d6c2b2b19ac?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder', '.\assets\images\hero.jpg')

# about
(New-Object System.Net.WebClient).DownloadFile('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder', '.\assets\images\about.jpg')

# lavanda
(New-Object System.Net.WebClient).DownloadFile('https://images.unsplash.com/photo-1516691862637-9f3d7a8b5c7a?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder', '.\assets\images\lavanda.jpg')

# curcuma
(New-Object System.Net.WebClient).DownloadFile('https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder', '.\assets\images\curcuma.jpg')

# infusion
(New-Object System.Net.WebClient).DownloadFile('https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder', '.\assets\images\infusion.jpg')
```

Estos comandos guardarán las imágenes en `assets/images/`. Si prefieres otras imágenes, dímelas y te doy los enlaces directos.

Despliegue local
- Para probar localmente (no procesará formularios Netlify):
```powershell
python -m http.server 8000
# abrir http://localhost:8000
```

Notas
- Si deseas integración de email real (confirmaciones, doble opt-in), necesitas un servicio externo (Mailchimp, Sendinblue, MailerLite) o un backend que envíe correos.
- Puedo ayudarte a configurar Formspree o a crear un pequeño backend si lo deseas.

Netlify Functions (ejemplos)
- Este repositorio incluye ejemplos simples en `netlify/functions/`:
  - `mailerlite-subscribe.js` -> llama a la API de MailerLite y añade el suscriptor.
  - `mailchimp-subscribe.js` -> añade suscriptor a una lista de Mailchimp con estado `pending` (double opt-in).

Variables de entorno en Netlify
1. Entra a tu dashboard de Netlify y abre el Site settings -> Build & deploy -> Environment -> Environment variables.
2. Añade las siguientes variables según el servicio que uses:
   - Para MailerLite: `MAILERLITE_API_KEY`, opcional `MAILERLITE_GROUP_ID`.
   - Para Mailchimp: `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID`.
3. Guarda y redeploya el sitio. Las funciones funcionarán y `/.netlify/functions/mailerlite-subscribe` estará disponible.

Notas de seguridad
- No guardes API keys en el frontend. Siempre usa variables de entorno y funciones serverless.

Ejemplo de uso en el front-end
- El formulario de newsletter intenta enviar primero a la función serverless `/.netlify/functions/mailerlite-subscribe`. Si la función no responde intenta enviar mediante Formspree si la acción está definida, y finalmente muestra una simulación local.

