# Registro de cambios de Gráficalo

## 0.5 · 19 de octubre de 2026

### Nuevo
- **Sincronización con Google Drive** (Menú → Sincronizar con Google Drive): los mismos proyectos en el móvil y en el ordenador. Se guardan en la carpeta oculta de la app en el Drive del usuario; sin servidores propios.
  - Se sincroniza al abrir la app, tras cada cambio y al volver a ella.
  - Si un proyecto se edita en dos dispositivos a la vez, se queda el cambio más reciente y se guarda una copia del otro.
  - Los proyectos borrados se borran también en los demás dispositivos.
  - Desconectar, con opción de borrar la copia de Drive.
- **Pantalla de inicio** con las plantillas agrupadas (seguimiento diario, estudios, dinero y trabajo, otros), con icono y aviso de las que tienen registro rápido. Desde ahí también se pueden traer los proyectos de Google Drive o restaurar una copia.

### Cambiado
- La primera vez que se abre la app se muestra la pantalla de inicio en lugar de proyectos de ejemplo y el tutorial (sigue disponible en «Ver cómo funciona» y en el menú).
- Al borrar todos los proyectos se vuelve a la pantalla de inicio; ya no se regeneran los ejemplos.
- «Nuevo proyecto» usa el mismo selector agrupado de plantillas.
- Política de privacidad actualizada con la sincronización con Google Drive.

## 0.4 · 16 de octubre de 2026

### Nuevo
- **Tendencia y media de 7 días** en los gráficos de líneas y áreas con fechas (se activan en Personalizar). La línea de tendencia se prolonga hasta el objetivo.
- **Fecha estimada para llegar al objetivo** y **ritmo por semana** en el registro rápido, calculados con los últimos 30 días.
- **IMC** con su categoría y **cambio entre kg y lb** (convierte todos los valores y el objetivo) en los proyectos de peso corporal.
- **Comparar periodos** (Estadísticas → Periodos): esta semana frente a la anterior, este mes frente al pasado o los últimos 30 días frente a los 30 anteriores.
- **«¿Qué nota necesito?»** en el menú: calcula la nota mínima del próximo examen según los pesos, la media que quieres y la nota máxima. Puede cargar las notas de una fila del proyecto.
- **Media ponderada en las fórmulas**: `ponderada(A; 30; B; 70)` para una fila y `mediap(A; B)` para una columna con los pesos de otra.
- **6 plantillas nuevas**: presupuesto anual, hucha de ahorro, tensión arterial, glucosa, horas de trabajo y hábitos.
- **Bloqueo con PIN** (Menú → Tema, idioma y PIN). Se vuelve a pedir si la app pasa más de un minuto en segundo plano.
- **Novedades**: al actualizar se muestra qué ha cambiado; también en el menú.
- **Enviar sugerencias o errores** desde el menú, por correo.
- **Valorar la app** en Google Play (se ofrece una sola vez tras unos días de uso, y siempre desde el menú).

### Mejorado
- En el registro rápido, el cambio se colorea en verde cuando te acerca al objetivo.
- Todas las novedades traducidas a los 7 idiomas.

## 0.3 · 16 de octubre de 2026

### Nuevo
- **7 idiomas**: español, inglés, portugués, francés, italiano, alemán y catalán. La app usa el idioma del móvil y se puede cambiar en Menú → Tema e idioma. Números, decimales y fechas se adaptan a cada país.
- **Registro rápido** en los proyectos con fechas: escribes el valor, pulsas Guardar y la fecha de hoy se pone sola. Muestra el último valor, el cambio desde el anterior y desde el inicio, la media de 7 días y lo que falta para tu objetivo.
- **Plantilla «Peso corporal»**, con objetivo que se dibuja como línea en el gráfico.
- **Acceso directo «Registro rápido»** al mantener pulsado el icono de la app.
- **Varios gráficos por proyecto** y pestaña **Panel** con todos ellos y las cifras clave.
- **13 tipos de gráfico**: nuevos Barras + línea con doble eje y Recuento de categorías para respuestas de texto.
- **Anotaciones**: líneas de referencia (objetivo, aprobado…), máximo y mínimo resaltados y notas sobre un punto.
- **5 paletas de color**, entre ellas una apta para daltónicos y una en escala de grises para imprimir.
- **Pantalla completa** con zoom y desplazamiento.
- **Columnas de texto y de fecha**, además de números y fórmulas.
- **Ordenar y filtrar filas**; los gráficos y las estadísticas usan solo las filas filtradas.
- **Deshacer y rehacer** cualquier cambio.
- **Tablas cruzadas** con prueba chi-cuadrado y V de Cramér.
- **Contrastes de hipótesis**: t de Student (una muestra, independientes y emparejadas) y ANOVA, explicados en palabras.
- **Calculadora de probabilidad** normal y binomial, con la curva dibujada.
- **Modo paso a paso** para media, mediana, moda, varianza, desviación típica, cuartiles y regresión lineal.
- **Informe en PDF** con gráficos, estadísticas y datos.
- **Exportar a Excel** con una hoja de datos y otra de estadísticas.
- **Compartir** la imagen de un gráfico y compartir un proyecto con un enlace (los datos van dentro del enlace).
- **Copia de seguridad** de todos los proyectos en un archivo, y restaurarla.
- **Leer una tabla desde una foto** (beta), todo en el móvil y sin conexión.
- **Tutorial inicial** de tres pantallas.
- **Tema claro, oscuro o automático**.
- Nuevas plantillas: **Registro diario** y **Encuesta**.

### Mejorado
- La importación de Excel y CSV conserva las columnas de texto y detecta fechas.
- La imagen del gráfico se puede exportar con fondo claro u oscuro.
- Política de privacidad actualizada (cámara, fotos y enlaces) y disponible en español e inglés.

## 0.2 · 15 de octubre de 2026

### Nuevo
- Columnas ilimitadas, con nombre y color propios.
- Columnas con fórmulas: operaciones, `redondear`, `raiz`, `si`, `suma`, `media`…
- 11 tipos de gráfico: barras, horizontales, apiladas, líneas, áreas, sectores, anillo, radar, dispersión, histograma y diagrama de caja.
- Personalizar el gráfico: título, nombres de los ejes, colores, leyenda y tamaño de letra.
- Tablas de frecuencias (fi, Fi, hi, Hi) con intervalos automáticos.
- Regresiones lineal, exponencial, logarítmica, potencial y polinómica, con predicción.
- Importar archivos de Excel.
- Plantillas: notas de clase, gastos, entrenamiento, ventas y relación entre dos variables.

## 0.1 · 15 de octubre de 2026

Primera versión publicada en Google Play.
- Tabla de datos con una o dos series.
- Gráficos de barras, líneas, sectores, dispersión e histograma.
- Estadísticas básicas con explicaciones.
- Pegar datos e importar CSV.
- Guardar el gráfico como imagen.
- Funciona sin conexión.
