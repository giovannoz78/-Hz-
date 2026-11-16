// [Hz] · PIEL — lo que está en el trigger entra por las yemas y avanza por la mano real.
// La mano no se dibuja: se recorta de la cámara, cuadro a cuadro, por el color de la piel
// (muestreado en la propia mano, dentro de la zona que marca MediaPipe). Así la materia queda
// adentro del contorno verdadero, entre los dedos, y la piel se sigue viendo debajo.
// Necesita window.HZMano (MediaPipe Hands) y una imagen: HZPiel.imagen(url).
window.HZPiel = window.HZPiel || (function () {
  const CFG = { avance: 14, suelta: 0.8, espera: 400, debug: false };
  const cv = document.createElement('canvas'); cv.id = 'hz-piel';
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:99991';
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const PARES=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20],[0,9],[0,13],[1,5]];
  const SEGS=PARES.map(([a,b])=>`seg(p,uL[${a}],uL[${b}],uD[${a}],uD[${b}],dmin,tt);`).join('');
  const FS = `precision highp float;
  uniform vec2 uRes; uniform float uDpr; uniform vec4 uVid; uniform sampler2D uV; uniform sampler2D uImg;
  uniform vec2 uL[21]; uniform float uD[21]; uniform vec3 uRef; uniform float uSig; uniform float uConf;
  uniform float uF; uniform float uT; uniform float uA; uniform float uDebug; uniform float uImgOk;
  vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
    return mix(mix(dot(hash(i),f),dot(hash(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)),dot(hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
  vec3 ycc(vec3 c){float y=dot(c,vec3(.299,.587,.114));return vec3(y,(c.b-y)*.564,(c.r-y)*.713);}
  vec3 vid(vec2 px){vec2 uv=(px-uVid.xy)/uVid.zw; return texture2D(uV,uv).rgb;}
  void seg(vec2 p,vec2 A,vec2 B,float da,float db,inout float dmin,inout float tt){
    vec2 ab=B-A; float h=clamp(dot(p-A,ab)/max(dot(ab,ab),1.),0.,1.); float d=length(p-A-ab*h);
    if(d<dmin){dmin=d;tt=mix(da,db,h);} }
  void main(){
    vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;
    float palm=max(length(uL[9]-uL[0]),20.);
    float dmin=1e5,tt=1.;
    ${SEGS}
    // zona posible de la mano: tubos alrededor del esqueleto, generosos
    float r=palm*.30; float zona=1.-smoothstep(r*.9,r*1.6,dmin);
    if(zona<=0.){ gl_FragColor=vec4(0.); return; }
    // piel: parecido de color con la piel muestreada en la mano (5 muestras para suavizar el borde)
    float sk=0.;
    for(int i=0;i<5;i++){ vec2 o=i==0?vec2(0):i==1?vec2(1.5,0):i==2?vec2(-1.5,0):i==3?vec2(0,1.5):vec2(0,-1.5);
      vec3 q=ycc(vid(p+o)); vec2 dc=q.yz-uRef.yz; float yl=smoothstep(.05,.16,q.x)*(1.-smoothstep(.97,1.,q.x));
      sk+=exp(-dot(dc,dc)/(2.*uSig*uSig))*yl; }
    sk=clamp(sk/5.*1.35,0.,1.);
    sk=mix(1.-smoothstep(r*.45,r*.95,dmin),sk,uConf);   // si la muestra de piel no es confiable, cae al tubo
    float m=zona*smoothstep(.25,.7,sk);
    // coordenadas propias de la mano: siguen su posición, giro y tamaño
    vec2 ax=normalize(uL[9]-uL[0]+vec2(1e-3)); vec2 hp=vec2(dot(p-uL[0],vec2(ax.y,-ax.x)),dot(p-uL[0],ax))/palm;
    float n=fbm(hp*2.6+vec2(0.,uT*.03));
    float fr=uF-tt+.3*n;                      // >0 donde ya entró
    float inv=smoothstep(0.,.07,fr);
    // la imagen del trigger corre por la mano de las yemas hacia la muñeca
    vec2 w=vec2(fbm(hp*1.7+uT*.05),fbm(hp*1.7+vec2(5.2,1.3)-uT*.04));
    vec2 iu=vec2(.5+hp.x*.42,.15+hp.y*.42)+w*.12+vec2(0.,-uT*.018);
    vec3 img=uImgOk>.5?texture2D(uImg,fract(iu)).rgb:vec3(.35,.8,1.);
    float lum=dot(img,vec3(.3,.55,.15));
    // vetas: grietas finas que van delante y adentro
    float ve=1.-abs(fbm(hp*4.2+w*1.5+vec2(0.,uT*.02)));
    ve=pow(clamp(ve,0.,1.),9.);
    // puntos: la imagen hecha nube de puntos, pegada a la piel
    vec2 cel=hp*46.; vec2 jit=hash(floor(cel))*.25; float dd=length(fract(cel)-.5-jit);
    float tam=.18+.32*lum; float pto=1.-smoothstep(tam*.55,tam,dd);
    float hondo=smoothstep(.0,.5,fr);          // atrás del frente la materia se asienta y cubre
    float hueco=smoothstep(.5,.72,fbm(hp*6.5+vec2(3.1,0.)));   // poros donde la piel sigue asomando
    float cub=inv*clamp(mix(.62,.95,hondo)+ve*.4-hueco*.55,0.,1.);
    cub=max(cub,inv*pto*.9);
    float delante=ve*smoothstep(-.22,0.,fr)*(1.-inv);           // grietas que se adelantan al frente
    float borde=exp(-pow(fr/.03,2.));
    vec3 hielo=img*(.85+.9*lum);
    vec3 col=hielo*cub + vec3(.6,.97,1.)*(delante*.95+borde*.9);
    float al=clamp(cub*.9*smoothstep(.03,.22,lum)+delante*.55+borde*.45,0.,1.);   // lo oscuro de la imagen deja ver la piel
    col*=mix(1.,smoothstep(.03,.22,lum),inv);
    col*=m*uA; al*=m*uA;
    if(uDebug>.5){ col=mix(col,vec3(1.,.15,.6)*m*.6,.6); al=max(al,m*.4); }
    gl_FragColor=vec4(col,al);
  }`;
  function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  let pr, U = {}, tV, tI, imgOk = 0, ok = false;
  try {
    pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes','uDpr','uVid','uV','uImg','uL','uD','uRef','uSig','uConf','uF','uT','uA','uDebug','uImgOk'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
    const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    tV = tex(); tI = tex(); gl.uniform1i(U.uV, 0); gl.uniform1i(U.uImg, 1);
    // profundidad desde la yema (0) hasta la muñeca (1)
    const D = [1, .45,.3,.15,0, .45,.3,.15,0, .45,.3,.15,0, .45,.3,.15,0, .45,.3,.15,0];
    gl.uniform1fv(U.uD, D);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    ok = true;
  } catch (e) { console.warn('[Hz] piel', e); }

  // la imagen del trigger (potencia de 2 para poder repetirla)
  function imagen(src) {
    if (!src || !ok) return; const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 512; c.getContext('2d').drawImage(im, 0, 0, 512, 512);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tI); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); imgOk = 1; };
    im.src = src;
  }
  // muestra de piel: color en puntos de la palma y de las falanges medias, leído del mismo cuadro
  const mc = document.createElement('canvas'); mc.width = 96; mc.height = 96; const mx = mc.getContext('2d', { willReadFrequently: true });
  const ref = { y: .5, cb: -.05, cr: .08, sig: .05, conf: 0 };
  function muestrear(src, lmN) {
    const vw = src.videoWidth || src.naturalWidth, vh = src.videoHeight || src.naturalHeight; if (!vw) return;
    mx.drawImage(src, 0, 0, 96, 96); const d = mx.getImageData(0, 0, 96, 96).data;
    const pts = []; const mid = (a, b, k) => ({ x: lmN[a].x + (lmN[b].x - lmN[a].x) * k, y: lmN[a].y + (lmN[b].y - lmN[a].y) * k });
    const cen = { x: (lmN[0].x + lmN[5].x + lmN[17].x + lmN[9].x) / 4, y: (lmN[0].y + lmN[5].y + lmN[17].y + lmN[9].y) / 4 };
    pts.push(cen, mid(0, 9, .5), mid(0, 5, .6), mid(0, 17, .6), mid(5, 6, .5), mid(9, 10, .5), mid(13, 14, .5), mid(17, 18, .5), mid(6, 7, .5), mid(10, 11, .5), mid(9, 13, .5), mid(5, 9, .5));
    const cbs = [], crs = [], ys = [];
    for (const q of pts) { const x = Math.round(q.x * 95), y = Math.round(q.y * 95); if (x < 1 || y < 1 || x > 94 || y > 94) continue;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const k = ((y + j) * 96 + x + i) * 4, r = d[k] / 255, g = d[k + 1] / 255, b = d[k + 2] / 255;
        const Y = .299 * r + .587 * g + .114 * b; ys.push(Y); cbs.push((b - Y) * .564); crs.push((r - Y) * .713); } }
    if (cbs.length < 20) { ref.conf *= .9; return; }
    const med = a => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
    const cb = med(cbs), cr = med(crs), Y = med(ys);
    const mad = Math.max(med(cbs.map(v => Math.abs(v - cb))), med(crs.map(v => Math.abs(v - cr))));
    const k = ref.conf > 0 ? .25 : 1; ref.cb += (cb - ref.cb) * k; ref.cr += (cr - ref.cr) * k; ref.y += (Y - ref.y) * k;
    ref.sig += (Math.min(.08, Math.max(.022, mad * 2.6)) - ref.sig) * k;
    // confiable si la piel tiene color propio (no gris) y la muestra es pareja
    const cromo = Math.hypot(cr, cb), parejo = mad < .05;
    ref.conf += ((cromo > .025 && parejo ? 1 : .35) - ref.conf) * .2;
  }

  let F = 0, A = 0, T = 0, ult = performance.now(), visto = false, cuadro = 0;
  const L = new Float32Array(42), Lp = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  function frame() {
    requestAnimationFrame(frame); if (!ok) return;
    const ahora = performance.now(), st = Math.min(.05, (ahora - ult) / 1000); ult = ahora; T += st;
    const M = window.HZMano, src = window.hzManoFuente || (M && M.src) || document.querySelector('video');
    const hay = !!(M && M.lm && src && ahora - M.t < CFG.espera);
    if (hay) { F = Math.min(1.25, F + st / CFG.avance * 1.25); A = Math.min(1, A + st * 3); }
    else { A = Math.max(0, A - st / CFG.suelta); if (A <= 0) { F = 0; visto = false; } }
    if (typeof window.hzPielForzar === 'number') F = window.hzPielForzar;
    const DPR = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * DPR) || cv.height !== Math.round(H * DPR)) { cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (A <= 0 || !src || !(src.videoWidth || src.naturalWidth)) return;
    const sr = src.getBoundingClientRect();
    if (hay) {
      const adel = Math.min(80, ahora - M.t + 30);   // adelanta la mano lo que tarda MediaPipe en leerla
      for (let i = 0; i < 21; i++) { const l = M.lm[i], v = M.vel && M.vel[i];
        const x = sr.left + (l.x + (v ? v.x * adel : 0)) * sr.width, y = sr.top + (l.y + (v ? v.y * adel : 0)) * sr.height;
        if (!visto) { Lp[i].x = x; Lp[i].y = y; } else { Lp[i].x += (x - Lp[i].x) * .7; Lp[i].y += (y - Lp[i].y) * .7; } }
      visto = true;
      if ((cuadro++ & 1) === 0) muestrear(src, M.lm);
    }
    for (let i = 0; i < 21; i++) { L[i * 2] = Lp[i].x; L[i * 2 + 1] = Lp[i].y; }
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tV);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src); } catch (e) { return; }
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uDpr, DPR); gl.uniform4f(U.uVid, sr.left, sr.top, sr.width, sr.height);
    gl.uniform2fv(U.uL, L); gl.uniform3f(U.uRef, ref.y, ref.cb, ref.cr); gl.uniform1f(U.uSig, ref.sig); gl.uniform1f(U.uConf, ref.conf);
    gl.uniform1f(U.uF, F); gl.uniform1f(U.uT, T); gl.uniform1f(U.uA, A); gl.uniform1f(U.uDebug, CFG.debug ? 1 : 0); gl.uniform1f(U.uImgOk, imgOk);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function iniciar() { if (iniciar.ok) return; iniciar.ok = true; document.body.appendChild(cv); requestAnimationFrame(frame); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar); else iniciar();
  return { CFG, imagen, ref, get avance() { return F; } };
})();
