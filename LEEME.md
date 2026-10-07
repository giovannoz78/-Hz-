# [Hz] · realidad aumentada

Es el mismo motor de The Connection, con las siete escenas y todo su comportamiento intactos, pero con lo que cambia de proyecto a proyecto sacado afuera del HTML. `index.html` no se edita: los textos, la paleta y qué modelo va en cada trigger viven en `hz.config.js`, y los datos que antes estaban embebidos en base64 (los marcos de luz, las formas de puntos de los modelos) viven en `hz-datos.js`, que se genera solo.

## Carpeta

```
index.html        el motor
hz.config.js      textos, paleta y escenas (lo único que se edita a mano)
hz-datos.js       marcos, formas y miniaturas (lo genera preparar.html)
preparar.html     la herramienta para generar targets.mind y hz-datos.js
mindar/targets.mind
assets/0.glb … 6.glb   formas geométricas de reemplazo (nudo, red geodésica, anillos,
                       columna de frecuencia, esfera que respira, anillo y pirámide)
```

Todo viene armado para funcionar sin nada más que los triggers: los modelos de `assets/` son de reemplazo y ya tienen sus formas de puntos en `hz-datos.js`. Cuando cargues tus triggers en `preparar.html`, sumá también tus GLB (o estos) para que el archivo nuevo traiga las formas.

## Cambiar triggers y modelos

Abrí `preparar.html` desde el servidor (o con cualquier servidor local), cargá las imágenes de los triggers en el orden de las escenas y los GLB de condensación, palabra y génesis. Con "Compilar targets.mind" bajás el archivo para `mindar/`, y con "Descargar hz-datos.js" el archivo que va al lado de `index.html`. Si después cambiás solo un modelo, "Sumar a un hz-datos.js anterior" conserva lo que ya estaba.

El marco de luz se calcula separando el trazo del fondo por color; el control "centro libre" define el radio del círculo central que queda sin luz para la animación. Si un trigger tiene mucha textura o grano y el marco sale sucio en la vista previa, probá con "claro sobre oscuro" u "oscuro sobre claro".

Las formas de puntos se guardan por nombre de archivo, así que el GLB tiene que llamarse igual que en `hz.config.js`. Si una forma no está en `hz-datos.js` el motor la calcula en el teléfono cuando termina de bajar el modelo; funciona igual, solo que la secuencia arranca un poco más tarde.

## Probar sin imprimir

`index.html?ver=3` abre la escena 3 sin cámara, con la miniatura del trigger debajo: arrastrar gira, la rueda acerca. Sirve para ajustar posición, escala y nombres de mallas antes de ir al teléfono.

## Nombres de mallas

Tres escenas buscan partes del modelo por nombre (el de la malla o el de cualquier nodo padre, sin importar mayúsculas ni signos). En `red` es `malla`, la red de líneas que la luz dibuja; en `construccion` son `brillo`, la pieza que late, y `aristas`, la que se construye desde la base. Si el nombre no aparece se usa la malla más grande, y `brillo: '*'` ilumina todas.

## Blanco y negro

Con `paleta.modo: 'bn'` cada color del motor pasa a su gris de igual luminancia y, además, la imagen 3D completa se filtra a grises, así que las texturas y los colores propios de cualquier GLB también quedan en blanco y negro. `contraste` endurece o ablanda los grises y `camara: false` deja la imagen de la cámara en color. Sacando `modo` y poniendo `matiz` (0-360) los dorados se llevan a otro tono; `matiz: 40, saturacion: 1` es el oro original.

## Imágenes generativas

Las escenas agua y lluvia necesitan una imagen. Además de un PNG o WebP propio aceptan tres patrones que se dibujan en el momento, en blanco sobre transparente: `gen:interferencia` (dos fuentes de onda que se cruzan), `gen:anillos` (anillos concéntricos que se quiebran) y `gen:moire` (dos tramas superpuestas).

## Componentes renombrados

custodia → `condensacion`, nombre-carlo → `palabra-forma`, relicario-revela → `revela-bajo-agua`, aparicion-niebla → `aparicion-bruma`, vitral-marco → `marco-luz`, plexus-resplandor → `red-resplandor`, piramide-construye → `construye-aristas`, infinito-glow → `brillo-malla`. Los demás (lluvia, niebla, salpicaduras, ripple, plexus, hélice, acorde, coro) conservan su nombre. Cualquier parámetro se puede pisar por escena con `opciones: { 'componente': { … } }`.
