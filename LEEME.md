# Gráficalo · versión 0.3

Novedades: 7 idiomas (español, inglés, portugués, francés, italiano, alemán y catalán) y registro rápido para proyectos con fechas.

## Cómo actualizar tu web

1. En tu repositorio `marcsgc.github.io`, pulsa **Add file → Upload files**.
2. Arrastra **todo el contenido** de esta carpeta, incluidas las carpetas `lang`, `lib`, `ocr` e `icons`.
3. Pulsa **Commit changes** y espera un par de minutos.

No borres `.well-known` ni `.nojekyll`. No hace falta generar un `.aab` nuevo.

## Numeración de versiones

Cada vez que publiques cambios, sube el número en dos sitios:
- `app.js` → `APP_VERSION` (lo que se ve en Menú → Acerca de), por ejemplo `"0.4"`.
- `sw.js` → `VERSION`, por ejemplo `"graficalo-v0.4"`. Si no lo cambias, los móviles seguirán mostrando la versión guardada.

En PWABuilder usa el mismo nombre de versión (App version: 0.3) y sube siempre el version code (1, 2, 3…).

## Traducciones

Cada idioma está en `lang/xx.js`. Para corregir una frase, búscala en ese archivo y cambia el texto que hay después de los dos puntos.
