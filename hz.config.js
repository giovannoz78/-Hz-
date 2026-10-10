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

  // paleta. modo 'glow': toda la imagen 3D se colorea por su brillo, cian en los trazos (blanco en los núcleos)
  // y un halo rojo alrededor; vale para todas las escenas y para cualquier GLB.
  //   frio / calido: los dos colores · halo: cuánto resplandor (0 = nada, 1 = normal, 2 = mucho)
  //   contraste: más de 1 endurece · camara: false deja la imagen de la cámara en color (true la pasa a grises)
  // modo 'bn' vuelve al blanco y negro puro.
  paleta:  { modo: 'glow', frio: '#19E6FF', calido: '#FF2340', halo: 1.0, contraste: 1.1, camara: true },
  colores: { tinta: '#FFFFFF', fondo: '#000000', puntos: '#FFFFFF' },   // textos y puntitos de la pantalla de carga

  escenas: [

    // 0 · MICELIO — hifas que nacen de unas esporas, crecen ramificándose sobre la página y después las recorren pulsos de luz
    //     ajustes: opciones: { 'micelio': { esporas: 5, crece: 14, rama: 0.045, radio: 0.46 } }
    { efecto: 'micelio', marco: 0.55 },

    // 1 · ESPEJO — así arriba, como abajo: la página es el horizonte; una red de nodos flota encima y su reflejo vive debajo,
    //     unidos por hilos verticales, con un flujo de reloj de arena que cruza de un mundo al otro. Tocar la pantalla suma nodos.
    //     ajustes: opciones: { 'espejo': { nodos: 42, enlace: 0.15, alto: 0.36, arena: 160 } }
    //     (el efecto anterior sigue disponible: { efecto: 'fuego' })
    { efecto: 'espejo', marco: 0.6 },

    // 2 · MERCURIO — gotas de metal líquido que se atraen y se funden; al quedar una sola, estalla y vuelve a empezar
    //     ajustes: opciones: { 'mercurio': { gotas: 14, tamano: 0.045, atrae: 0.012, queda: 5 } }
    //     (el efecto anterior, red, sigue disponible: { efecto: 'red', modelo: './assets/2.glb', malla: 'red' })
    { efecto: 'mercurio', marco: 0.6 },

    // 3 · ACRECIÓN — el shader "Accretion" de @XorDev (shadertoy.com/view/WcKXDV) sobre la página, en grises
    //     ajustes: opciones: { 'acrecion': { tamano: 1, escala: 1, velocidad: 1, pasos: 20, brillo: 1 } }
    //     (pasos baja el costo en teléfonos lentos: 14 o 16 se ve casi igual)
    //     (el efecto anterior sigue disponible: { efecto: 'estalagmitas' })
    { efecto: 'acrecion', marco: 0.5 },

    // 4 · ESPIRAL — esfera de vidrio con espirales adentro, del shader de Matthias Hurrle (@atzedent), flotando sobre la página
    //     ajustes: opciones: { 'espiral': { tamano: 0.62, z: 0.24, pasos: 60, velocidad: 1 } }
    //     (pasos baja el costo en teléfonos lentos: 40 se ve casi igual)
    //     (el efecto anterior sigue disponible: { efecto: 'estalactitas' })
    { efecto: 'espiral', marco: 0.5 },

    // 5 · SINAPSIS — neuronas suspendidas; el impulso viaja por el axón, destella en la sinapsis y la siguiente dispara
    //     ajustes: opciones: { 'sinapsis': { neuronas: 22, viaje: 0.9 } }
    { efecto: 'sinapsis', marco: 0.6 },

    // 6 · AGUJERO NEGRO — horizonte de sucesos, anillo de fotones, disco de acreción en espiral y estrellas que caen
    //     ajustes: opciones: { 'hoyo-negro': { radio: 0.06, disco: 0.36, inclina: 12, estrellas: 1600 } }
    { efecto: 'hoyo-negro', marco: 0.6 }

  ]
};

// Opciones finas: cualquier parámetro de los componentes se puede pisar por escena, por ejemplo
//   opciones: { 'genesis': { gather: 6 }, 'dna-helix': { segments: 120 }, 'marco-luz': {...} }
// Otros interruptores por escena: girar: false · helice: false · red: false · sonido: false · marco: false · target: 3
