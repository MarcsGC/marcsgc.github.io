# Gráficalo

App web instalable (PWA) para crear gráficos y calcular estadísticas. Funciona sin conexión y guarda los proyectos en el propio móvil.

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app entera (diseño, tabla, gráficos y estadísticas) |
| `chart.umd.js` | Librería Chart.js 4.4.1 (gráficos), incluida para que funcione sin internet |
| `manifest.webmanifest` | Nombre, colores e iconos para que el móvil la pueda instalar |
| `sw.js` | Service worker: guarda la app para usarla sin conexión |
| `icons/` | Iconos de la app (192 px, 512 px y versión adaptable para Android) |

## 1. Probarla en tu ordenador

Abre una terminal en esta carpeta y ejecuta:

```
python -m http.server 8000
```

Luego abre http://localhost:8000 en el navegador. (Abrir el `index.html` con doble clic también funciona, pero sin modo offline.)

## 2. Publicarla gratis en GitHub Pages

1. Crea una cuenta en https://github.com si no la tienes.
2. Pulsa **New repository**, ponle nombre (por ejemplo `graficalo`), márcalo como **Public** y créalo.
3. Pulsa **uploading an existing file** y arrastra **todo el contenido** de esta carpeta (incluida la carpeta `icons`). Pulsa **Commit changes**.
4. Ve a **Settings → Pages**. En *Branch* elige `main` y carpeta `/ (root)`. Guarda.
5. En un par de minutos tu app estará en `https://TU-USUARIO.github.io/graficalo/`.

Abre esa dirección en el móvil con Chrome → menú ⋮ → **Instalar app** (en iPhone: Safari → Compartir → **Añadir a pantalla de inicio**).

## 3. Actualizarla

Sube los archivos nuevos al repositorio y **cambia `VERSION` en `sw.js`** (por ejemplo `graficalo-v2`). Si no la cambias, los móviles seguirán mostrando la versión guardada.

## 4. Subirla a Google Play

1. Con la app ya publicada en GitHub Pages, entra en https://www.pwabuilder.com y pega su dirección.
2. Elige **Package for stores → Android**. Descarga el paquete; incluye un archivo `.aab` (lo que se sube a Google Play) y `assetlinks.json`.
3. **Guarda bien el archivo de firma (`signing.keystore`) y sus contraseñas.** Sin él no podrás actualizar la app en Google Play nunca más.
4. En el repositorio crea la carpeta `.well-known` y sube dentro `assetlinks.json`. Debe verse en `https://TU-USUARIO.github.io/.well-known/assetlinks.json`.
   - Ojo: GitHub Pages solo sirve `.well-known` en la raíz del dominio. Para eso necesitas un repositorio llamado `TU-USUARIO.github.io` (pon ahí la app, o solo el `assetlinks.json`). Si no, la app funciona igual pero mostrará una barra de dirección arriba.
   - Añade también un archivo vacío llamado `.nojekyll` en la raíz para que GitHub no oculte la carpeta `.well-known`.
5. En Google Play Console: crea la app, sube el `.aab` a **Prueba cerrada**, invita a 12 testers y espera los 14 días antes de pedir acceso a producción (requisito para cuentas personales creadas después de noviembre de 2023).
6. Google Play te pedirá una **política de privacidad**. Como la app no envía datos a ningún sitio, basta con una página sencilla que lo diga.
