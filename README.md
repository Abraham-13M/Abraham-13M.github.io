# Abraham-13M.github.io

Pequeño catálogo interactivo de videojuegos (HTML/CSS/JS estático).

Archivos principales
- `index.html` — Página principal / landing
- `accion.html` — Página con juegos de acción
- `catalogo.html` — Catálogo completo con búsqueda, filtros, paginación y wishlist
- `registro.html` — Formulario de registro (cliente)

Abrir el proyecto localmente (Windows)

Opción A — Usar el script PowerShell incluido (recomendado en Windows)

1. Abre PowerShell en la carpeta del proyecto:

	cd "c:\Users\USUARIOM\Documents\digitalizacion\Abraham-13M.github.io"

2. Ejecuta el script:

	.\serve-local.ps1

	El script arranca un servidor estático usando Python en el puerto 8000.

3. Abre en el navegador:

	http://localhost:8000/  (o directamente `http://localhost:8000/catalogo.html`)

Notas: si tu política de ejecución de PowerShell impide ejecutar scripts, puedes lanzar el script con la política temporalmente deshabilitada:

	powershell -ExecutionPolicy Bypass -File .\serve-local.ps1

Opción B — Usar Python manualmente

Si tienes Python 3 instalado puedes servir la carpeta con:

	python -m http.server 8000

y abrir `http://localhost:8000/`.

Opción C — Usar Live Server en VS Code

- Abre la carpeta en VS Code y usa la extensión Live Server (botón "Go Live") para servir los archivos.

Publicación (opcional)

- Puedes subir el repositorio a GitHub y activar GitHub Pages desde la configuración de la rama (`main`) para publicar como sitio estático.
- URL típica: `https://<tu-usuario>.github.io/<repo-name>/`

Problemas comunes
- Si al abrir el script PowerShell ves un error sobre políticas de ejecución, usa la línea con `-ExecutionPolicy Bypass` o ajusta tu ExecutionPolicy temporalmente.
- Si no tienes Python instalado, instala Python 3 desde https://python.org o usa Live Server en VS Code.

Siguientes pasos sugeridos
- Crear una vista "Favoritos" en `catalogo.html` para ver los juegos guardados en la wishlist.
- Mejorar accesibilidad (atributos ARIA, foco en modales) y añadir un backend si quieres persistencia real de usuarios y carrito.

Contacto
- Este repositorio y los archivos fueron generados durante una sesión interactiva. Si quieres que añada alguna característica (favoritos, carrito, exportar JSON, despliegue automático), dime cuál y lo implemento.
