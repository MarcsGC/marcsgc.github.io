# Gráficalo · versión 0.5

Novedades: sincronización con Google Drive entre móvil y ordenador, y pantalla de inicio para elegir plantilla (sin proyectos de ejemplo).

## Cómo actualizar tu web

1. En tu repositorio `marcsgc.github.io`, pulsa **Add file → Upload files**.
2. Arrastra **todo el contenido** de esta carpeta, incluidas las carpetas `lang`, `lib`, `ocr` e `icons`. Hay un archivo nuevo, `sync.js`: no te lo dejes. También ha cambiado `privacidad.html`.
3. Pulsa **Commit changes** y espera un par de minutos.

No borres `.well-known` ni `.nojekyll`. No hace falta generar un `.aab` nuevo: los móviles con la app instalada recibirán la 0.5 solos al abrirla (a veces hace falta cerrarla y abrirla dos veces).

## Numeración de versiones

Cada vez que publiques cambios, sube el número en dos sitios:
- `app.js` → `APP_VERSION` (lo que se ve en Menú → Acerca de), ahora `"0.5"`.
- `sw.js` → `VERSION`, ahora `"graficalo-v0.5"`. Si no lo cambias, los móviles seguirán mostrando la versión guardada.

Si generas un `.aab` nuevo en PWABuilder, usa el mismo nombre de versión (App version: 0.5) y sube siempre el version code (1, 2, 3…).

## Novedades que ve el usuario

El texto del aviso «Novedades» está en `extras.js`, en `WHATS_NEW`. Para la próxima versión añade una entrada nueva con su número (por ejemplo `"0.6": [...]`).

## Traducciones

Cada idioma está en `lang/xx.js`. Para corregir una frase, búscala en ese archivo y cambia el texto que hay después de los dos puntos.

## Google Drive

El ID de cliente de Google está al principio de `sync.js` (`GDRIVE_CLIENT_ID`). No es secreto. Si algún día cambias de dominio, añade la nueva dirección en Google Cloud (orígenes autorizados y URI de redirección, con la barra final).
