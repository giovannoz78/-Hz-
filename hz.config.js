// Versión 3D: fragmentos triangulados con espesor. Un toque reinicia la secuencia.
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
  guia2:     '',

  // texto en pantalla mientras se ve una tarjeta ('' = sin texto)
  aviso:     '',

  // archivo de triggers que genera preparar.html
  mind: './mindar/targets.mind',

  // paleta. modo 'glow': toda la imagen se colorea por su brillo con un mapa de calor.
  //   mapa: 'coral' (nube de puntos en color natural: ámbar, cian, óxido, salvia, azul y oro, en manchas que siguen a la tarjeta)
  //         'termico' (imagen satelital infrarroja: azul, cian, verde, amarillo, rojo, rojo oscuro en lo más intenso)
  //         'inferno' · 'arbol' · 'montana' · o una lista propia de 6 colores, de lo tenue a lo intenso
  //   halo: velo suave alrededor de los trazos (0 = nada, 1 = suave)
  //   camaraTermica: la cámara en grises con sus zonas más claras en calor, como una imagen satelital (false = cámara en grises)
  //   camara: false muestra la cámara en color (los triggers de cristal se ven con su azul); true la pasa a grises
  //   umbral: desde qué brillo de la cámara empieza el calor (0.5 = más zonas calientes, 0.75 = solo luces fuertes)
  //   cercania: cuánto calienta acercar el teléfono (0 = nada, 1 = normal, 2 = mucho)
  // modo 'bn' vuelve al blanco y negro puro.
  paleta: { modo: 'natural', camara: false },

  // sonido: cada escena tiene su capa sintetizada en el teléfono; arranca con el primer toque en pantalla (o el botón 🔊).
  // false lo apaga. volumen: 0 a 1.
  sonido:  { volumen: 0.8 },
  // vista: 'pie' para la escena sobre el borde inferior de la tarjeta y la saca hacia quien mira,
  // así apuntando de frente ya se ve de costado, en volumen. inclina: 90 = totalmente de pie, 60 = un poco recostada.
  // 'plana' la deja acostada sobre la página (hay que inclinar el teléfono para verla de costado).
  vista:   { vista: 'pie', inclina: 72 },
  colores: { tinta: '#FFFFFF', fondo: '#000000', puntos: '#FFFFFF' },   // textos y puntitos de la pantalla de carga

  escenas: [
    { efecto: 'micelio', marco: false, vista: { vista: 'plana' }, opciones: { 'hz-fractura': { cantidad: 10, profundidad: 0.85, expansion: 1.5, duracion: 13 } } },
    { efecto: 'deshielo', marco: false, vista: { vista: 'plana' }, opciones: { 'hz-fractura': { cantidad: 10, profundidad: 0.85, expansion: 1.5, duracion: 13 } } },
    { efecto: 'bosque', marco: false, vista: { vista: 'plana' }, opciones: { 'hz-fractura': { cantidad: 10, profundidad: 0.85, expansion: 1.5, duracion: 13 } } },
    { efecto: 'coral', marco: false, vista: { vista: 'plana' }, opciones: { 'hz-fractura': { cantidad: 10, profundidad: 0.85, expansion: 1.5, duracion: 13 } } },
    { efecto: 'glaciar', marco: false, vista: { vista: 'plana' }, opciones: { 'hz-fractura': { cantidad: 10, profundidad: 0.85, expansion: 1.5, duracion: 13 } } },
    { efecto: 'sinapsis', marco: false, vista: { vista: 'plana' }, opciones: { 'hz-fractura': { cantidad: 10, profundidad: 0.85, expansion: 1.5, duracion: 13 } } },
    { efecto: 'hoyo-negro', marco: false, vista: { vista: 'plana' }, opciones: { 'hz-fractura': { cantidad: 10, profundidad: 0.85, expansion: 1.5, duracion: 13 } } }
  ]
};

// Opciones finas: cualquier parámetro de los componentes se puede pisar por escena, por ejemplo
//   opciones: { 'genesis': { gather: 6 }, 'dna-helix': { segments: 120 }, 'marco-luz': {...} }
// Altura: todas las escenas se levantan sobre la página para leerse en volumen al mirarlas de costado
//   (alto, z y mira en las opciones de cada una).
// Otros interruptores por escena: girar: false · helice: false · red: false · sonido: false · marco: false · target: 3
