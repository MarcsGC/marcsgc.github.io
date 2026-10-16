# Gráficalo · versión 3

## Cómo actualizar tu web (y la app de Google Play)

1. En tu repositorio `marcsgc.github.io`, borra los archivos sueltos de la versión anterior que ya no se usan: `chart.umd.js` y `xlsx.full.min.js` (ahora están dentro de la carpeta `lib`). Si no los borras no pasa nada; solo ocupan sitio.
2. Pulsa **Add file → Upload files** y arrastra **todo el contenido** de esta carpeta, incluidas las carpetas `lib`, `ocr` e `icons`.
   - Si el navegador no sube las carpetas al arrastrarlas, súbelas por separado: entra en **Add file → Upload files** y arrastra cada carpeta.
3. Pulsa **Commit changes** y espera un par de minutos.

No borres la carpeta `.well-known` ni el archivo `.nojekyll`.

La app de Google Play carga esta web, así que **no hace falta generar un `.aab` nuevo**.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura y diseño |
| `i18n.js` | Textos en inglés |
| `stats.js` | Cálculos: estadística, regresiones, distribuciones, contrastes y fórmulas |
| `app.js` | Datos, proyectos, deshacer, filtros, importación, menú y ajustes |
| `charts.js` | Gráficos, anotaciones, panel, pantalla completa e imagen |
| `statsview.js` | Pantalla de estadísticas y paso a paso |
| `export.js` | PDF, Excel, copia de seguridad y enlaces para compartir |
| `ocr.js` | Leer tablas desde fotos |
| `main.js` | Arranque |
| `sw.js` | Modo sin conexión. **Cambia `VERSION` cada vez que publiques cambios** |
| `lib/` | Chart.js, zoom, SheetJS (Excel) y jsPDF |
| `ocr/` | Tesseract.js y el idioma español (solo se descarga la primera vez que alguien lee una foto) |
| `privacidad.html` | Política de privacidad actualizada (español e inglés) con tu correo |

Los proyectos guardados de las versiones 1 y 2 se convierten solos.
