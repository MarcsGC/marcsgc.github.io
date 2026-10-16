# Gráficalo · versión 3.2

Novedad: la app está en **7 idiomas** (español, inglés, portugués, francés, italiano, alemán y catalán). Elige sola el idioma del móvil y se puede cambiar en ☰ Menú → Tema e idioma.

## Cómo actualizar tu web

1. En tu repositorio `marcsgc.github.io`, pulsa **Add file → Upload files**.
2. Arrastra **todo el contenido** de esta carpeta, incluidas las carpetas `lang`, `lib`, `ocr` e `icons` (la carpeta `lang` es nueva; si no se sube al arrastrar, súbela por separado).
3. Pulsa **Commit changes** y espera un par de minutos.

No borres `.well-known` ni `.nojekyll`. No hace falta generar un `.aab` nuevo.

Cada vez que publiques cambios, cambia `VERSION` en `sw.js` (ahora `graficalo-v3.2`) y `APP_VERSION` en `app.js`.

## Traducciones

Cada idioma está en `lang/xx.js`. Si alguien te sugiere una corrección, busca la frase en ese archivo y cambia el texto que hay después de los dos puntos.
