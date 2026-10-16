# Gráficalo · versión 2

## Cómo actualizar tu web (y la app de Google Play)

1. En tu repositorio `marcsgc.github.io`, pulsa **Add file → Upload files**.
2. Arrastra **todo el contenido** de esta carpeta (incluida la carpeta `icons`). GitHub sustituye los archivos que ya existen.
3. Pulsa **Commit changes** y espera un par de minutos.

No borres la carpeta `.well-known` ni el archivo `.nojekyll` que ya tienes en el repositorio.

La app de Google Play carga esta web, así que **no hace falta generar un `.aab` nuevo** para estos cambios: los móviles reciben la versión nueva automáticamente la próxima vez que abran la app con conexión.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura y diseño de la app |
| `app.js` | Funcionamiento de la interfaz |
| `stats.js` | Cálculos: estadística, regresiones, frecuencias y fórmulas |
| `chart.umd.js` | Chart.js 4.4.1 (gráficos) |
| `xlsx.full.min.js` | SheetJS 0.18.5 (leer Excel); solo se carga al importar un Excel |
| `sw.js` | Modo sin conexión. Cambia `VERSION` cada vez que publiques cambios |
| `manifest.webmanifest`, `icons/` | Nombre e iconos para instalar la app |

Los proyectos que ya tengas guardados de la versión 1 se convierten solos a la versión 2.
