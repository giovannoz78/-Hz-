// [Hz] · realidad aumentada
// Todo lo que cambia de un proyecto a otro está acá. El motor (index.html) no se toca.
//
// Cada escena es un trigger: la escena 0 es la primera imagen con la que se compiló targets.mind,
// la 1 la segunda, y así. Si cambiás el orden de las imágenes en preparar.html, cambiá el orden acá.
//
// Los modelos de assets/ (0.glb … 6.glb) son formas geométricas de reemplazo para que todo funcione
// desde el primer momento; se cambian por los propios con el mismo nombre o editando "modelo".

window.HZ = {

  // pantalla de carga ("\n" = salto de línea; lo que quede vacío no se muestra)
  titulo:    '[Hz]',
  subtitulo: '',
  frase:     '',
  guia:      'Apuntá la cámara a la imagen',
  guia2:     'Movete alrededor de la imagen:\ncada escena tiene volumen.',

  // texto en pantalla mientras se ve una tarjeta ('' = sin texto)
  aviso:     'Movete alrededor de la imagen',

  // archivo de triggers que genera preparar.html
  mind: './mindar/targets.mind',

  // paleta. modo 'glow': toda la imagen se colorea por su brillo con un mapa de calor.
  //   mapa: 'termico' (imagen satelital infrarroja: azul, cian, verde, amarillo, rojo, rojo oscuro en lo más intenso)
  //         'inferno' · 'arbol' · 'montana' · o una lista propia de 6 colores, de lo tenue a lo intenso
  //   halo: velo suave alrededor de los trazos (0 = nada, 1 = suave)
  //   camaraTermica: la cámara en grises con sus zonas más claras en calor, como una imagen satelital (false = cámara en grises)
  //   umbral: desde qué brillo de la cámara empieza el calor (0.5 = más zonas calientes, 0.75 = solo luces fuertes)
  //   cercania: cuánto calienta acercar el teléfono (0 = nada, 1 = normal, 2 = mucho)
  // modo 'bn' vuelve al blanco y negro puro.
  paleta:  { modo: 'glow', mapa: 'termico', halo: 1.0, contraste: 1.0, camaraTermica: false, umbral: 0.62, cercania: 1.0, camara: true },

  // sonido: cada escena tiene su capa sintetizada en el teléfono; arranca con el primer toque en pantalla (o el botón 🔊).
  // false lo apaga. volumen: 0 a 1.
  sonido:  { volumen: 0.8 },
  // vista: 'pie' para la escena sobre el borde inferior de la tarjeta y la saca hacia quien mira,
  // así apuntando de frente ya se ve de costado, en volumen. inclina: 90 = totalmente de pie, 60 = un poco recostada.
  // 'plana' la deja acostada sobre la página (hay que inclinar el teléfono para verla de costado).
  vista:   { vista: 'pie', inclina: 72 },
  colores: { tinta: '#FFFFFF', fondo: '#000000', puntos: '#FFFFFF' },   // textos y puntitos de la pantalla de carga

  escenas: [

    // 0 · MICELIO — hifas que nacen de unas esporas, crecen ramificándose sobre la página y después las recorren pulsos de luz
    //     ajustes: opciones: { 'micelio': { esporas: 5, crece: 14, rama: 0.045, radio: 0.46 } }
    { efecto: 'micelio', marco: false, opciones: { 'micelio': { trepa: 0.6, alto: 0.5 } } },

    // 1 · ESPEJO — así arriba, como abajo: la página es el horizonte; una red de nodos flota encima y su reflejo vive debajo,
    //     unidos por hilos verticales, con un flujo de reloj de arena que cruza de un mundo al otro. Tocar la pantalla suma nodos.
    //     ajustes: opciones: { 'espejo': { nodos: 42, enlace: 0.15, alto: 0.36, arena: 160 } }
    //     (el efecto anterior sigue disponible: { efecto: 'fuego' })
    { efecto: 'espejo', marco: false, opciones: { 'espejo': { alto: 0.55 } } },

    // 2 · BOSQUE — bosque en nube de puntos, como un escaneo LiDAR: crece desde la página, se mece con el viento
    //     y lo recorre una línea de escaneo; al acercar el teléfono sube el viento (sonido y movimiento de los árboles)
    //     ajustes: opciones: { 'bosque': { arboles: 16, alto: 0.42, puntos: 26000, crece: 8, escaneo: 5, viento: 1 } }
    //     (puntos baja el costo en teléfonos lentos: 15000 se ve casi igual)
    //     (el efecto anterior sigue disponible: { efecto: 'mercurio' })
    { efecto: 'bosque', marco: false, opciones: { 'bosque': { alto: 0.62 } } },

    // 3 · ACRECIÓN — el shader "Accretion" de @XorDev (shadertoy.com/view/WcKXDV) sobre la página, en grises
    //     ajustes: opciones: { 'acrecion': { tamano: 1, escala: 1, velocidad: 1, pasos: 20, brillo: 1 } }
    //     (pasos baja el costo en teléfonos lentos: 14 o 16 se ve casi igual)
    //     (el efecto anterior sigue disponible: { efecto: 'estalagmitas' })
    { efecto: 'acrecion', marco: false, opciones: { 'acrecion': { brillo: 0.6, mira: true, z: 0.32, tamano: 0.9 } } },

    // 4 · ESPIRAL — esfera de vidrio con espirales adentro, del shader de Matthias Hurrle (@atzedent), flotando sobre la página
    //     ajustes: opciones: { 'espiral': { tamano: 0.62, z: 0.24, pasos: 60, velocidad: 1 } }
    //     (pasos baja el costo en teléfonos lentos: 40 se ve casi igual)
    //     (el efecto anterior sigue disponible: { efecto: 'estalactitas' })
    { efecto: 'espiral', marco: false, opciones: { 'espiral': { z: 0.4, tamano: 0.68 } } },

    // 5 · SINAPSIS — neuronas suspendidas; el impulso viaja por el axón, destella en la sinapsis y la siguiente dispara
    //     ajustes: opciones: { 'sinapsis': { neuronas: 22, viaje: 0.9 } }
    { efecto: 'sinapsis', marco: false, opciones: { 'sinapsis': { alto: 0.58 } } },

    // 6 · AGUJERO NEGRO — horizonte de sucesos, anillo de fotones, disco de acreción en espiral y estrellas que caen
    //     ajustes: opciones: { 'hoyo-negro': { radio: 0.06, disco: 0.36, inclina: 12, estrellas: 1600 } }
    { efecto: 'hoyo-negro', marco: false, opciones: { 'hoyo-negro': { z: 0.34, inclina: 18 } } }

  ]
};

// Opciones finas: cualquier parámetro de los componentes se puede pisar por escena, por ejemplo
//   opciones: { 'genesis': { gather: 6 }, 'dna-helix': { segments: 120 }, 'marco-luz': {...} }
// Altura: todas las escenas se levantan sobre la página para leerse en volumen al mirarlas de costado
//   (alto, z y mira en las opciones de cada una).
// Otros interruptores por escena: girar: false · helice: false · red: false · sonido: false · marco: false · target: 3
