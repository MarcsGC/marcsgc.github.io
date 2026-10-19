# Gráficalo · versión 0.4

Novedades: tendencia y fecha estimada para tu objetivo, IMC y kg/lb, comparar periodos, calculadora «¿Qué nota necesito?», media ponderada en fórmulas, 6 plantillas nuevas, bloqueo con PIN, novedades, sugerencias y valorar la app.

## Cómo actualizar tu web

1. En tu repositorio `marcsgc.github.io`, pulsa **Add file → Upload files**.
2. Arrastra **todo el contenido** de esta carpeta, incluidas las carpetas `lang`, `lib`, `ocr` e `icons`. Hay un archivo nuevo, `extras.js`: no te lo dejes.
3. Pulsa **Commit changes** y espera un par de minutos.

No borres `.well-known` ni `.nojekyll`. No hace falta generar un `.aab` nuevo: los móviles con la app instalada recibirán la 0.4 solos al abrirla (a veces hace falta cerrarla y abrirla dos veces).

## Numeración de versiones

Cada vez que publiques cambios, sube el número en dos sitios:
- `app.js` → `APP_VERSION` (lo que se ve en Menú → Acerca de), ahora `"0.4"`.
- `sw.js` → `VERSION`, ahora `"graficalo-v0.4"`. Si no lo cambias, los móviles seguirán mostrando la versión guardada.

Si generas un `.aab` nuevo en PWABuilder, usa el mismo nombre de versión (App version: 0.4) y sube siempre el version code (1, 2, 3…).

## Novedades que ve el usuario

El texto del aviso «Novedades» está en `extras.js`, en `WHATS_NEW`. Para la próxima versión añade una entrada nueva con su número (por ejemplo `"0.5": [...]`).

## Traducciones

Cada idioma está en `lang/xx.js`. Para corregir una frase, búscala en ese archivo y cambia el texto que hay después de los dos puntos.
