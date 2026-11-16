// [Hz] · CONTAGIO — el fitoplancton sale del glaciar e invade lo que lo toca.
// No necesita reconocer una mano. MindAR sabe dónde está el trigger y cómo se ve: todo lo que lo tapa
// (dedos, la mano a contraluz, entrando desde cualquier lado) aparece como diferencia con la imagen original.
// Desde ahí el plancton sigue por el mismo cuerpo fuera de la tarjeta, reconociéndolo por su color,
// y avanza desde el borde del glaciar hacia afuera.
window.HZPiel = window.HZPiel || (function () {
  const CFG = { avance: 5, suelta: 1.5, umbral: 0.5, debug: false };
  const cv = document.createElement('canvas'); cv.id = 'hz-piel';
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:99991';
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision highp float;
  uniform vec2 uRes; uniform float uDpr; uniform vec4 uVid; uniform sampler2D uV; uniform sampler2D uImg;
  uniform mat3 uHi; uniform float uAsp; uniform float uCardPx;
  uniform float uMedC; uniform float uMedR; uniform vec2 uCast; uniform float uUmbral;
  uniform vec3 uMano; uniform float uManoSig; uniform float uManoOk;
  uniform float uF; uniform float uT; uniform float uA; uniform float uDebug;
  vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
    return mix(mix(dot(hash(i),f),dot(hash(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)),dot(hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
  float anillo(float d,float r,float w){return 1.-smoothstep(0.,w,abs(d-r));}
  // una célula de fitoplancton en q (radio ~1). tipo 0 diatomea céntrica, 1 pennada, 2 cadena, 3 dinoflagelado, 4 cocolitofórido
  float celula(vec2 q,float tipo,float t){
    float d=length(q), a=atan(q.y,q.x), v=0.;
    if(tipo<.5){ v=anillo(d,.8,.07)+anillo(d,.45,.05)*.6; v+=(1.-smoothstep(.75,.8,d))*smoothstep(.12,.0,abs(sin(a*9.)))*.55*step(.45,d); v+=(1.-smoothstep(.0,.18,d))*.8; }
    else if(tipo<1.5){ vec2 e=q*vec2(.45,1.3); float de=length(e); v=anillo(de,.42,.035); v+=(1.-smoothstep(.38,.42,de))*smoothstep(.25,.0,abs(sin(q.x*14.)))*.5; v+=(1.-smoothstep(.0,.06,abs(q.y)))*(1.-smoothstep(.3,.4,de))*.6; }
    else if(tipo<2.5){ for(int i=-2;i<=2;i++){ vec2 c=q-vec2(float(i)*.42,0.); float dc=length(c); v+=anillo(dc,.18,.04)+(1.-smoothstep(.0,.08,dc))*.7; } v+=(1.-smoothstep(.0,.02,abs(q.y)))*step(abs(q.x),.95)*.4; }
    else if(tipo<3.5){ vec2 e=q*vec2(1.,.8); float de=length(e); v=anillo(de,.6,.05); v+=(1.-smoothstep(.0,.035,abs(q.y-.08*sin(q.x*6.))))*(1.-smoothstep(.5,.62,de))*.8;
      vec2 f=q-vec2(.55,-.3); v+=(1.-smoothstep(.0,.025,abs(f.y+.15*sin(f.x*10.-t*6.))))*step(0.,f.x)*step(f.x,.6)*.6; v+=(1.-smoothstep(.55,.62,de))*.18; }
    else { v=anillo(d,.55,.05); for(int i=0;i<7;i++){ float b=float(i)*.8976; vec2 c=q-.55*vec2(cos(b),sin(b)); v+=anillo(length(c),.18,.035); } v+=(1.-smoothstep(.0,.2,d))*.4; }
    return clamp(v,0.,1.);
  }
  vec3 ycc(vec3 c){float y=dot(c,vec3(.299,.587,.114));return vec3(y,(c.b-y)*.564,(c.r-y)*.713);}
  vec3 vid(vec2 px){return texture2D(uV,(px-uVid.xy)/uVid.zw).rgb;}
  void main(){
    vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;
    vec3 h=uHi*vec3(p,1.); vec2 uv=h.xy/h.z;                 // coordenadas de la tarjeta (0..1), también fuera de ella
    vec2 fuera2=max(max(-uv,uv-1.),0.)*vec2(1.,uAsp);
    float fuera=length(fuera2);                              // distancia a la tarjeta, en anchos de tarjeta
    if(fuera>.9||h.z<=0.){ gl_FragColor=vec4(0.); return; }
    // color de la cámara (suavizado) y color esperado del trigger en ese punto
    float r=max(1.,uCardPx*.018);
    vec3 cam=(vid(p)*2.+vid(p+vec2(r,0))+vid(p-vec2(r,0))+vid(p+vec2(0,r))+vid(p-vec2(0,r)))/6.;
    vec3 qc=ycc(cam);
    float adentro=step(fuera,0.);
    float tapa=0.;
    if(adentro>.5){
      float e=.02;
      vec3 ref=(texture2D(uImg,uv)*2.+texture2D(uImg,uv+vec2(e,0))+texture2D(uImg,uv-vec2(e,0))+texture2D(uImg,uv+vec2(0,e))+texture2D(uImg,uv-vec2(0,e))).rgb/6.;
      vec3 qr=ycc(ref);
      float d=max(0.,qr.x/uMedR-qc.x/uMedC)*.9+max(0.,qc.x/uMedC-qr.x/uMedR)*.25+length((qc.yz-qr.yz)-uCast)*3.;
      tapa=smoothstep(uUmbral-.15,uUmbral+.2,d);
    }
    // fuera de la tarjeta: el mismo cuerpo, reconocido por el color que tenía al tapar la imagen
    vec2 dm=qc.yz-uMano.yz; float dy=(qc.x-uMano.x)/max(uMano.x*.9,.06);
    float pare=exp(-dot(dm,dm)/(2.*uManoSig*uManoSig))*exp(-dy*dy*.5);
    float sigue=smoothstep(.35,.7,pare)*uManoOk*(1.-smoothstep(.45,.85,fuera));
    float sigueAdentro=smoothstep(.35,.7,pare)*uManoOk;
    float m=adentro>.5?tapa:sigue*smoothstep(.12,.25,uMano.x);   // afuera solo si el cuerpo no es una sombra (si no, se confunde con el fondo oscuro)
    // avance: nace donde el cuerpo toca el glaciar y se extiende hacia afuera
    vec2 hp=vec2(uv.x,uv.y*uAsp);
    float n=fbm(hp*6.+vec2(0.,uT*.05));
    float fr=uF-fuera*1.6+.25*n-.1;
    float inv=smoothstep(0.,.08,fr);
    vec2 w=vec2(fbm(hp*4.+uT*.05),fbm(hp*4.+vec2(5.2,1.3)-uT*.04));
    float ve=pow(clamp(1.-abs(fbm(hp*11.+w*1.5+vec2(0.,uT*.02))),0.,1.),9.);
    vec2 cel=hp*120.; vec2 id=floor(cel); float dd=length(fract(cel)-.5-hash(id)*.3);
    float vive=.5+.5*sin(uT*(1.5+hash(id+3.).x)+hash(id).y*6.28);
    float polvo=(1.-smoothstep(.06,.16,dd))*(.35+.65*vive);
    // FITOPLANCTON: dos capas de células que derivan sobre lo invadido
    float pk=0., pkCol=0.;
    for(int capa=0;capa<2;capa++){
      float esc=capa==0?11.:19.;
      vec2 g=hp*esc+vec2(float(capa)*3.7,uT*.12*(1.+float(capa)));
      vec2 idc=floor(g); vec2 hh=hash(idc+float(capa)*17.); vec2 hh2=hash(idc*1.7+5.3);
      float hay=step(capa==0?-.2:.2,hh2.x);
      vec2 cen=idc+.5+hh*.22+.06*vec2(sin(uT*.6+hh.x*6.),cos(uT*.5+hh.y*6.));
      vec2 q=(g-cen); float tam=capa==0?.42+.1*hh2.y:.32+.08*hh2.y;
      q=rot(hh.x*6.28+uT*.2*hh.y)*q/tam;
      float tipo=floor((hh2.y*.5+.5)*4.999);
      float c=celula(q,tipo,uT)*hay*step(length(q),1.2);
      float aparece=smoothstep(-.05,.12,fr-.12*hh.y);
      float pulso=.65+.35*sin(uT*(1.2+hh.y)+hh.x*9.);
      pk=max(pk,c*aparece*pulso); pkCol+=tipo*c;
    }
    vec3 teal=vec3(.12,.85,.78), cian=vec3(.55,.97,1.);
    vec3 tono=mix(vec3(.25,1.,.85),vec3(.6,.9,1.),fract(pkCol*.37));
    float hondo=smoothstep(0.,.5,fr), velo=.06+.12*hondo;
    float borde=exp(-pow(fr/.03,2.))*step(.001,uF);
    vec3 col=teal*(velo+polvo*.45+ve*.45)*inv + tono*pk*1.3 + cian*borde*.7;
    float al=clamp((velo*.6+polvo*.2)*inv+pk*.8+borde*.3,0.,1.);
    col*=m*uA; al*=m*uA;
    if(uDebug>.5){ col=mix(col,vec3(1.,.15,.6)*m*.7,.7); al=max(al,m*.5);
      if(abs(fuera)<.003&&adentro<.5){ col=vec3(1.,.9,0.); al=1.; } }
    gl_FragColor=vec4(col,al);
  }`;
  function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  let pr, U = {}, tV, tI, ok = false;
  try {
    pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes','uDpr','uVid','uV','uImg','uHi','uAsp','uCardPx','uMedC','uMedR','uCast','uUmbral','uMano','uManoSig','uManoOk','uF','uT','uA','uDebug'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
    const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    tV = tex(); tI = tex(); gl.uniform1i(U.uV, 0); gl.uniform1i(U.uImg, 1);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    ok = true;
  } catch (e) { console.warn('[Hz] contagio', e); }

  // ---- la imagen del trigger activo (la miniatura de hz-datos.js) ----
  const G = 32;                                         // grilla de comparación sobre la tarjeta
  const rc = document.createElement('canvas'), rx = rc.getContext('2d', { willReadFrequently: true });
  let refPx = null, refIdx = null, refAsp = 1;
  function cargarRef(i) {
    const D = window.HZ_DATOS || {}, src = D.miniaturas && D.miniaturas[i]; if (!src) return;
    refIdx = i; const im = new Image();
    im.onload = () => { refAsp = (D.aspectos && D.aspectos[i]) || im.height / im.width;
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tI); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      rc.width = G; rc.height = G; rx.filter = 'blur(1.5px)'; rx.drawImage(im, 0, 0, G, G); refPx = rx.getImageData(0, 0, G, G).data; };
    im.src = src;
  }
  // ---- dónde está la tarjeta en la pantalla ----
  function homografia(s, d) {   // 4 puntos s -> 4 puntos d, matriz 3x3 por filas
    const A = [], B = [];
    for (let i = 0; i < 4; i++) { const [x, y] = s[i], [u, v] = d[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
    for (let c = 0; c < 8; c++) { let m = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      [A[c], A[m]] = [A[m], A[c]]; [B[c], B[m]] = [B[m], B[c]];
      for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; } }
    const h = B.map((b, i) => b / A[i][i]); return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }
  const aplicar = (H, x, y) => { const w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]; };
  let V3 = null;
  function tarjeta() {
    const sc = document.querySelector('a-scene'), cam = sc && sc.camera, T = window.AFRAME && AFRAME.THREE; if (!cam || !T || !sc.renderer) return null;
    if (!V3) V3 = new T.Vector3();
    const cr = sc.renderer.domElement.getBoundingClientRect();
    for (const an of document.querySelectorAll('.hz-ancla')) { const o = an.object3D; if (!o || !o.visible) continue;
      const m = (an.id || '').match(/(\d+)$/); const i = m ? m[1] : null;
      if (i !== refIdx) cargarRef(i);
      const a = refAsp, P = [[-.5, a / 2], [.5, a / 2], [.5, -a / 2], [-.5, -a / 2]].map(([x, y]) => {
        V3.set(x, y, 0).applyMatrix4(o.matrixWorld).project(cam); return [cr.left + (V3.x * .5 + .5) * cr.width, cr.top + (-V3.y * .5 + .5) * cr.height]; });
      if (P.some(q => !isFinite(q[0]))) continue;
      return { P, idx: i };
    }
    return null;
  }
  // ---- comparación en la CPU (baja resolución): luz media, tinte de la pantalla y color de lo que tapa ----
  const vc = document.createElement('canvas'), vx = vc.getContext('2d', { willReadFrequently: true });
  const est = { medC: .5, medR: .5, cast: [0, 0], mano: [.3, 0, .05], manoSig: .05, manoOk: 0, tapado: 0 };
  const yccJ = (r, g, b) => { const y = .299 * r + .587 * g + .114 * b; return [y, (b - y) * .564, (r - y) * .713]; };
  const med = a => { const s = Float32Array.from(a).sort(); return s.length ? s[s.length >> 1] : 0; };
  function comparar(src, sr, Huv) {
    if (!refPx) return;
    const vw = src.videoWidth || src.naturalWidth, vh = src.videoHeight || src.naturalHeight; if (!vw) return;
    const W = 160, H = Math.round(160 * vh / vw); if (vc.width !== W || vc.height !== H) { vc.width = W; vc.height = H; }
    vx.filter = 'blur(2px)'; vx.drawImage(src, 0, 0, W, H); const d = vx.getImageData(0, 0, W, H).data;
    const C = [], R = [];
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const [sx, sy] = aplicar(Huv, (i + .5) / G, (j + .5) / G);
      const px = Math.floor((sx - sr.left) / sr.width * W), py = Math.floor((sy - sr.top) / sr.height * H);
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const k = (py * W + px) * 4, q = (j * G + i) * 4;
      C.push(yccJ(d[k] / 255, d[k + 1] / 255, d[k + 2] / 255)); R.push(yccJ(refPx[q] / 255, refPx[q + 1] / 255, refPx[q + 2] / 255));
    }
    if (C.length < G * G * .3) return;
    est.medC = Math.max(.04, med(C.map(c => c[0]))); est.medR = Math.max(.04, med(R.map(c => c[0])));
    est.cast = [med(C.map((c, i) => c[1] - R[i][1])), med(C.map((c, i) => c[2] - R[i][2]))];
    const tap = [];
    for (let i = 0; i < C.length; i++) { const c = C[i], r = R[i];
      const dd = Math.max(0, r[0] / est.medR - c[0] / est.medC) * .9 + Math.max(0, c[0] / est.medC - r[0] / est.medR) * .25 + Math.hypot(c[1] - r[1] - est.cast[0], c[2] - r[2] - est.cast[1]) * 3;
      if (dd > CFG.umbral + .1) tap.push(c); }
    est.tapado = tap.length / C.length;
    if (tap.length >= 6) {
      const m = [med(tap.map(c => c[0])), med(tap.map(c => c[1])), med(tap.map(c => c[2]))];
      const s = Math.max(.02, Math.min(.07, Math.max(med(tap.map(c => Math.abs(c[1] - m[1]))), med(tap.map(c => Math.abs(c[2] - m[2])))) * 2.5));
      const k = est.manoOk > 0 ? .3 : 1; for (let z = 0; z < 3; z++) est.mano[z] += (m[z] - est.mano[z]) * k; est.manoSig += (s - est.manoSig) * k;
      est.manoOk = Math.min(1, est.manoOk + .25);
    } else est.manoOk = Math.max(0, est.manoOk - .05);
  }

  let F = 0, A = 0, T = 0, ult = performance.now(), cuadro = 0, ultT = null, ultVisto = 0, sinTapar = 0;
  function frame() {
    requestAnimationFrame(frame); if (!ok) return;
    const ahora = performance.now(), st = Math.min(.05, (ahora - ult) / 1000); ult = ahora; T += st;
    const DPR = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * DPR) || cv.height !== Math.round(H * DPR)) { cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const src = window.hzManoFuente || document.querySelector('video'); if (!src || !(src.videoWidth || src.naturalWidth)) return;
    const sr = src.getBoundingClientRect();
    const t = tarjeta();
    if (t) { ultT = t; ultVisto = ahora; }
    const vigente = ultT && ahora - ultVisto < 1200;   // si MindAR pierde la tarjeta un instante, sigue en su último lugar
    if (vigente) {
      const Huv = homografia([[0, 0], [1, 0], [1, 1], [0, 1]], ultT.P), Hi = homografia(ultT.P, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      if (t && (cuadro++ & 1) === 0) comparar(src, sr, Huv);
      const hay = est.tapado > .015 && est.tapado < .8;   // algo tapa el glaciar (y no es que la tarjeta entera se perdió)
      if (hay) { sinTapar = 0; F = Math.min(1.6, F + st / CFG.avance * 1.6); A = Math.min(1, A + st * 3); }
      else { sinTapar += st; if (sinTapar > CFG.suelta) { A = Math.max(0, A - st); if (A <= 0) F = 0; } }
      if (typeof window.hzPielForzar === 'number') { F = window.hzPielForzar; A = 1; }
      if (A <= 0) return;
      if (est.tapado > .55) return;   // casi toda la tarjeta "difiere": es MindAR desalineado un instante, no una mano
      const cardPx = Math.hypot(ultT.P[1][0] - ultT.P[0][0], ultT.P[1][1] - ultT.P[0][1]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tV);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src); } catch (e) { return; }
      gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uDpr, DPR); gl.uniform4f(U.uVid, sr.left, sr.top, sr.width, sr.height);
      gl.uniformMatrix3fv(U.uHi, false, [Hi[0], Hi[3], Hi[6], Hi[1], Hi[4], Hi[7], Hi[2], Hi[5], Hi[8]]);
      gl.uniform1f(U.uAsp, refAsp); gl.uniform1f(U.uCardPx, cardPx);
      gl.uniform1f(U.uMedC, est.medC); gl.uniform1f(U.uMedR, est.medR); gl.uniform2f(U.uCast, est.cast[0], est.cast[1]); gl.uniform1f(U.uUmbral, CFG.umbral);
      gl.uniform3f(U.uMano, est.mano[0], est.mano[1], est.mano[2]); gl.uniform1f(U.uManoSig, est.manoSig); gl.uniform1f(U.uManoOk, est.manoOk);
      gl.uniform1f(U.uF, F); gl.uniform1f(U.uT, T); gl.uniform1f(U.uA, A); gl.uniform1f(U.uDebug, CFG.debug ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else { A = 0; F = 0; }
  }
  function iniciar() { if (iniciar.ok) return; iniciar.ok = true; document.body.appendChild(cv); requestAnimationFrame(frame); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar); else iniciar();
  return { CFG, est, get avance() { return F; }, imagen() {} };
})();
