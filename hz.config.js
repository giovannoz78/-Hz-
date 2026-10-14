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
  //   mapa: 'coral' (nube de puntos en color natural: ámbar, cian, óxido, salvia, azul y oro, en manchas que siguen a la tarjeta)
  //         'termico' (imagen satelital infrarroja: azul, cian, verde, amarillo, rojo, rojo oscuro en lo más intenso)
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

    // Las siete escenas son nubes de puntos con su propio color (assets/*.bin). Cada una llega como polvo y se arma de pie
    // sobre la tarjeta; al acercar mucho el teléfono se desarma en polvo que gira y al alejarlo se vuelve a condensar.
    // Ajustes comunes por escena: opciones: { 'nube': { tamano: 1, punto: 0.0035, brillo: 1.15, arma: 4.5, dispersa: 1 } }
    //   tamano: escala de la nube · punto: tamaño de cada punto · arma: segundos que tarda en armarse · dispersa: 0 = no se desarma
    //   ola / olaVel: pulsos de luz que la recorren · viento: cuánto se mece · giro: velocidad de giro
    // Los efectos anteriores siguen disponibles con -lineas: { efecto: 'micelio-lineas' }

    // 0 · MICELIO — trama circular de hifas finísimas sobre la página; pulsos de luz que salen de los centros
    { efecto: 'micelio', marco: false },

    // 1 · DESHIELO — canal de agua de deshielo tallado en el hielo, en nube de puntos (180 mil puntos con el color de la foto);
    //     el agua corre hundida entre las dos laderas y la recorren pulsos de luz; suena a hilo de agua y gotas
    //     (la mosca sigue disponible: { efecto: 'mosca' } · el vórtice doble: { efecto: 'espejo' })
    { efecto: 'deshielo', marco: false },

    // 2 · BOSQUE — un claro circular de fustes verticales de puntos que se mecen; al acercar el teléfono sube el viento
    { efecto: 'bosque', marco: false },

    // 3 · CORAL — escaneo real de un coral (160 mil puntos con su color)
    { efecto: 'coral', marco: false },


    // 4 · GLACIAR — frente de hielo en nube de puntos (190 mil puntos con el color de la foto: blancos, celestes y azul profundo
    //     en las grietas) parado sobre el agua con témpanos; cruje y cada tanto se desprende un bloque
    //     (el relieve en malla cian sigue disponible: { efecto: 'terreno' } · la esfera de espirales: { efecto: 'espiral' })
    { efecto: 'glaciar', marco: false },

    // 5 · SINAPSIS — núcleos incandescentes unidos por arcos de polvo; los impulsos viajan de uno a otro
    { efecto: 'sinapsis', marco: false },

    // 6 · AGUJERO NEGRO — disco de acreción que gira más rápido cerca del centro, anillo de fotones y estrellas
    { efecto: 'hoyo-negro', marco: false }

  ]
};

// Opciones finas: cualquier parámetro de los componentes se puede pisar por escena, por ejemplo
//   opciones: { 'genesis': { gather: 6 }, 'dna-helix': { segments: 120 }, 'marco-luz': {...} }
// Altura: todas las escenas se levantan sobre la página para leerse en volumen al mirarlas de costado
//   (alto, z y mira en las opciones de cada una).
// Otros interruptores por escena: girar: false · helice: false · red: false · sonido: false · marco: false · target: 3
