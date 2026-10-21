# marcsgc.github.io · raíz del dominio

Este repositorio ya no contiene ninguna app. Solo tiene:

- `index.html`: página con enlaces a las apps (`/graficalo/` y `/formidex/`). Si la abre la Gráficalo antigua (instalada, la app de Android, un enlace compartido o el atajo «Registro rápido»), redirige sola a `/graficalo/`.
- `sw.js`: retira el service worker que dejó la Gráficalo antigua en la raíz. Solo se desregistra; no borra cachés ni datos. Déjalo aquí unos meses, hasta que todos los móviles hayan abierto la app al menos una vez.
- `.well-known/assetlinks.json`: lo busca Android en la raíz para la app de Google Play de Gráficalo. **No lo borres ni lo muevas.** Si publicas otra app en Google Play desde este dominio, se añade aquí como otra entrada.
- `.nojekyll`: hace falta para que GitHub publique la carpeta `.well-known`.
- `privacidad.html`: lleva a la política de privacidad de Gráficalo en `/graficalo/privacidad.html`, por si Google Cloud o Google Play siguen apuntando aquí.

Cada app vive en su propio repositorio: `graficalo` y `formidex`.
