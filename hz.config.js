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
  guia2:     'Inclinalo y acercalo despacio:\nlas imágenes se activan con el movimiento del teléfono.',

  // archivo de triggers que genera preparar.html
  mind: './mindar/targets.mind',

  // blanco y negro: todos los colores del motor pasan a su gris de igual luminancia, y además se filtra
  // la imagen 3D completa (texturas y colores propios de los GLB incluidos).
  // contraste: 1 = neutro, más de 1 endurece los grises · camara: false deja la cámara en color
  paleta:  { modo: 'bn', contraste: 1.15, camara: true },
  colores: { tinta: '#FFFFFF', fondo: '#000000', puntos: '#FFFFFF' },   // textos y puntitos de la pantalla de carga

  escenas: [

    // 0 · CONDENSACIÓN — un punto de luz, la materia se condensa en el modelo, rayos y polvo que sube
    { efecto: 'condensacion', modelo: './assets/0.glb',
      posicion: '0 -0.45 0.15', escala: 0.85, marco: 0.55
      // foco: '0 0.5 0',       // dónde nace la luz, en coordenadas del modelo (sin esto se ubica solo)
      // vidrio: 'nombre',      // malla que se trata como superficie iluminada
      // metal: '*',            // mallas que se vuelven metal ('*' = todas)
    },

    // 1 · AGUA — ondas que caen con la inclinación del teléfono; las gotas develan una imagen bajo la superficie
    //     imagen: un PNG/WebP propio, o una generativa: 'gen:interferencia' · 'gen:anillos' · 'gen:moire'
    { efecto: 'agua', imagen: 'gen:interferencia', marco: 0.7 },

    // 2 · RED — la luz dibuja la malla en ondas circulares desde el centro, nodos y pulsos
    { efecto: 'red', modelo: './assets/2.glb', posicion: '0 0 0.3',
      malla: 'red',        // nombre de la malla de líneas (si no existe, usa la más grande)
      cruz: ''             // nodo que recibe una luz propia ('' = ninguno)
    },

    // 3 · LLUVIA — lluvia, bruma y salpicaduras; a los 16 s una imagen emerge de la niebla
    { efecto: 'lluvia', modelo: './assets/3.glb', posicion: '0 0 0.01', imagen: 'gen:anillos' },

    // 4 · PALABRA — las partículas escriben el texto y se transforman en el modelo; acorde y coro
    { efecto: 'palabra', modelo: './assets/4.glb', texto: '[Hz]',
      posicion: '0 0 0.15', escala: 1 },

    // 5 · GÉNESIS — los puntos forman el modelo, aparece y crece la hélice que se cierra en aureola
    { efecto: 'genesis', modelo: './assets/5.glb', posicion: '0 0 0.2', escala: 0.85 },

    // 6 · CONSTRUCCIÓN — una pieza brilla y late, otra se construye con luz; red de nodos arriba
    { efecto: 'construccion', modelo: './assets/6.glb', posicion: '0 -0.1 0.2', escala: 0.8,
      brillo: 'brillo',      // malla que brilla ('*' = todas)
      aristas: 'aristas',    // malla que se construye desde la base (si no existe, usa la más grande)
      opciones: { 'brillo-malla__aristas': { intensity: 0.12, halo: 0 } }   // en blanco y negro, menos brillo propio deja ver el volumen
    }

  ]
};

// Opciones finas: cualquier parámetro de los componentes se puede pisar por escena, por ejemplo
//   opciones: { 'genesis': { gather: 6 }, 'dna-helix': { segments: 120 }, 'marco-luz': {...} }
// Otros interruptores por escena: girar: false · helice: false · red: false · sonido: false · marco: false · target: 3
