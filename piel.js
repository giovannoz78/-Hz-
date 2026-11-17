// [Hz] · PIEL — lo que está en el trigger entra por las yemas y avanza por la mano real.
// La mano no se dibuja: se recorta de la cámara, cuadro a cuadro, por el color de la piel
// (muestreado en la propia mano, dentro de la zona que marca MediaPipe). Así la materia queda
// adentro del contorno verdadero, entre los dedos, y la piel se sigue viendo debajo.
// Necesita window.HZMano (MediaPipe Hands) y una imagen: HZPiel.imagen(url).
window.HZPiel = window.HZPiel || (function () {
  const CFG = { modo: 'plancton', plancton: false, avance: 5, suelta: 1.2, olvida: 6, espera: 400, debug: false };
  const cv = document.createElement('canvas'); cv.id = 'hz-piel';
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:99991';
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const PARES=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20],[0,9],[0,13],[1,5]];
  const SEGS=PARES.map(([a,b])=>`seg(p,uL[${a}],uL[${b}],uD[${a}],uD[${b}],dmin,tt);`).join('')+[0,1,2,3,4].map(k=>`seg(p,uL[${4+k*4}],uE[${k}],0.,-.2,dmin,tt);`).join('');
  const FS = `precision highp float;
  uniform vec2 uRes; uniform float uDpr; uniform vec4 uVid; uniform sampler2D uV; uniform sampler2D uImg;
  uniform vec2 uL[21]; uniform vec2 uE[5]; uniform float uD[21]; uniform vec3 uRef; uniform float uSig; uniform float uConf;
  uniform float uF; uniform float uT; uniform float uA; uniform float uDebug; uniform float uImgOk; uniform sampler2D uPl; uniform float uPlOk;
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
    float r=palm*.30; float zona=1.-smoothstep(r*1.2,r*2.1,dmin);
    if(uDebug>.5&&dmin<1.6){ gl_FragColor=vec4(1.,.9,0.,1.); return; }
    if(zona<=0.){ gl_FragColor=vec4(0.); return; }
    // piel: parecido de color con la piel muestreada en la mano (5 muestras para suavizar el borde)
    float sk=0.;
    for(int i=0;i<5;i++){ vec2 o=i==0?vec2(0):i==1?vec2(1.5,0):i==2?vec2(-1.5,0):i==3?vec2(0,1.5):vec2(0,-1.5);
      vec3 q=ycc(vid(p+o)); vec2 dc=q.yz-uRef.yz; float yl=smoothstep(.05,.16,q.x)*(1.-smoothstep(.97,1.,q.x));
      sk+=exp(-dot(dc,dc)/(2.*uSig*uSig))*yl; }
    sk=clamp(sk/5.*1.35,0.,1.);
    sk=mix(1.-smoothstep(r*.45,r*.95,dmin),sk,uConf);   // si la muestra de piel no es confiable, cae al tubo
    float m=zona*smoothstep(.25,.7,sk);
    // La textura ya contiene el avance de las células desde las yemas.
    if (uPlOk > .5 && uImgOk < 1.5) {
      vec4 pl = texture2D(uPl, p / (uRes / uDpr));
      vec4 outColor = vec4(min(pl.rgb * 1.35, vec3(pl.a)), pl.a) * (m * uA);
      if (uDebug > .5) { outColor.rgb = mix(outColor.rgb, vec3(1.,.15,.6)*m*.6,.6); outColor.a = max(outColor.a,m*.4); }
      gl_FragColor = outColor;
      return;
    }
    // coordenadas propias de la mano: siguen su posición, giro y tamaño
    vec2 ax=normalize(uL[9]-uL[0]+vec2(1e-3)); vec2 hp=vec2(dot(p-uL[0],vec2(ax.y,-ax.x)),dot(p-uL[0],ax))/palm;
    float n=fbm(hp*2.6+vec2(0.,uT*.03));
    float fr=uF-tt+.3*n;                      // >0 donde ya entró
    float inv=smoothstep(0.,.07,fr);
    vec2 w=vec2(fbm(hp*1.7+uT*.05),fbm(hp*1.7+vec2(5.2,1.3)-uT*.04));
    // vetas de bioluminiscencia que se adelantan al frente
    float ve=1.-abs(fbm(hp*4.2+w*1.5+vec2(0.,uT*.02)));
    ve=pow(clamp(ve,0.,1.),9.);
    // polvo de plancton: miles de puntitos pegados a la piel que titilan
    vec2 cel=hp*70.; vec2 id=floor(cel); vec2 jit=hash(id)*.3; float dd=length(fract(cel)-.5-jit);
    float vive=.5+.5*sin(uT*(1.5+hash(id+3.).x)+hash(id).y*6.28);
    float polvo=(1.-smoothstep(.06,.16,dd))*(.35+.65*vive);
    float hondo=smoothstep(.0,.5,fr);
    // FITOPLANCTON: una grilla de células en la piel; cada una con tipo, giro, tamaño y deriva propios
    float pk=0., pkCol=0.;
    for(int capa=0;capa<2;capa++){
      float esc=capa==0?5.:9.;
      vec2 g=hp*esc+vec2(float(capa)*3.7,uT*.04*(1.+float(capa)));
      vec2 idc=floor(g); vec2 hh=hash(idc+float(capa)*17.); vec2 hh2=hash(idc*1.7+5.3);
      float hay=step(capa==0?-.15:.25,hh2.x);
      vec2 cen=idc+.5+hh*.22+.06*vec2(sin(uT*.6+hh.x*6.),cos(uT*.5+hh.y*6.));
      vec2 q=(g-cen); float tam=capa==0?.40+.12*hh2.y:.30+.08*hh2.y;
      q=rot(hh.x*6.28+uT*.15*hh.y)*q/tam;
      float tipo=floor((hh2.y*.5+.5)*4.999);
      float c=celula(q,tipo,uT)*hay*step(length(q),1.2);
      float aparece=smoothstep(-.05,.12,fr-.15*hh.y);         // cada célula se enciende cuando le llega el frente
      float pulso=.65+.35*sin(uT*(1.2+hh.y)+hh.x*9.);
      pk=max(pk,c*aparece*pulso); pkCol+=tipo*c;
    }
    vec3 teal=vec3(.12,.85,.78), cian=vec3(.55,.97,1.);
    // las células del fitoplancton (dibujadas por HZPlancton) recortadas por la piel real
    vec3 pl=uPlOk>.5?texture2D(uPl,vec2(p.x,p.y)/(uRes/uDpr)).rgb:vec3(0.);
    float velo=.05+.10*hondo;                        // velo tenue que tiñe toda la piel invadida
    vec3 tono=mix(vec3(.25,1.,.85),vec3(.6,.9,1.),fract(pkCol*.37));
    vec3 col=(pl*1.7 + teal*(velo+polvo*.45+ve*.45)) * inv + tono*pk*1.25;
    float delante=ve*smoothstep(-.22,0.,fr)*(1.-inv);
    float borde=exp(-pow(fr/.03,2.));
    col+=cian*(delante*.8+borde*.85);
    float al=clamp((dot(pl,vec3(.33))*.5+velo*.6+polvo*.2)*inv+pk*.75+delante*.4+borde*.35,0.,1.);
    if(uImgOk>1.5){   // modo 'imagen' (solo si se pide): la textura del trigger en lugar del plancton   // sin plancton: la imagen del trigger (modo anterior)
      vec2 iu=vec2(.5+hp.x*.42,.15+hp.y*.42)+w*.12+vec2(0.,-uT*.018);
      vec3 img=texture2D(uImg,fract(iu)).rgb; float lum=dot(img,vec3(.3,.55,.15));
      col=img*(.85+.9*lum)*inv*smoothstep(.03,.22,lum)+cian*(delante*.95+borde*.9); al=clamp(inv*.9*smoothstep(.03,.22,lum)+delante*.55+borde*.45,0.,1.); }
    col*=m*uA; al*=m*uA;
    if(uDebug>.5){ col=mix(col,vec3(1.,.15,.6)*m*.6,.6); al=max(al,m*.4); }
    gl_FragColor=vec4(col,al);
  }`;
  function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  let pr, U = {}, tV, tI, tP, imgOk = 0, ok = false;
  try {
    pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    ['uRes','uDpr','uVid','uV','uImg','uPl','uPlOk','uE','uL','uD','uRef','uSig','uConf','uF','uT','uA','uDebug','uImgOk'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
    const tex = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    gl.activeTexture(gl.TEXTURE0); tV = tex();
    gl.activeTexture(gl.TEXTURE1); tI = tex();
    gl.activeTexture(gl.TEXTURE2); tP = tex(); gl.uniform1i(U.uV, 0); gl.uniform1i(U.uImg, 1); gl.uniform1i(U.uPl, 2);
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

  let perdida = 0, F = 0, A = 0, T = 0, ult = performance.now(), visto = false, cuadro = 0;
  const E = new Float32Array(10), L = new Float32Array(42), Lp = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  function frame() {
    requestAnimationFrame(frame); if (!ok) return;
    const ahora = performance.now(), st = Math.min(.05, (ahora - ult) / 1000); ult = ahora; T += st;
    const M = window.HZMano, src = window.hzManoFuente || (M && M.src) || document.querySelector('video');
    const hay = !!(M && M.lm && src && ahora - M.t < CFG.espera);
    const reciente = !!(M && M.lm && src && ahora - M.t < 1200);   // pérdidas cortas: la mano sigue donde iba
    if (hay) { F = Math.max(F, .2); F = Math.min(1.25, F + st / CFG.avance * 1.25); A = Math.min(1, A + st * 4); perdida = 0; }
    else { perdida += st; A = Math.max(0, A - st / CFG.suelta * (reciente ? .5 : 1.5));
      if (perdida > CFG.olvida) { F = 0; visto = false; } }   // el plancton se queda en la piel aunque se pierda un rato
    if (typeof window.hzPielForzar === 'number') F = window.hzPielForzar;
    const DPR = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * DPR) || cv.height !== Math.round(H * DPR)) { cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (A <= 0 || !src || !(src.videoWidth || src.naturalWidth)) return;
    const sr = src.getBoundingClientRect();
    if (!hay && M && M.lm && M.vel && ahora - M.t < 1200) {
      const k = Math.max(0, 1 - (ahora - M.t) / 600);
      for (let i = 0; i < 21; i++) { const v = M.vel[i]; Lp[i].x += v.x * sr.width * st * 1000 * k * .6; Lp[i].y += v.y * sr.height * st * 1000 * k * .6; } }
    if (hay) {
      const adel = Math.min(80, ahora - M.t + 30);   // adelanta la mano lo que tarda MediaPipe en leerla
      for (let i = 0; i < 21; i++) { const l = M.lm[i], v = M.vel && M.vel[i];
        const x = sr.left + (l.x + (v ? v.x * adel : 0)) * sr.width, y = sr.top + (l.y + (v ? v.y * adel : 0)) * sr.height;
        if (!visto) { Lp[i].x = x; Lp[i].y = y; } else { Lp[i].x += (x - Lp[i].x) * .7; Lp[i].y += (y - Lp[i].y) * .7; } }
      visto = true;
      if ((cuadro++ & 1) === 0) muestrear(src, M.lm);
    }
    for (let i = 0; i < 21; i++) { L[i * 2] = Lp[i].x; L[i * 2 + 1] = Lp[i].y; }
    const palm = Math.hypot(Lp[9].x - Lp[0].x, Lp[9].y - Lp[0].y);
    for (let k = 0; k < 5; k++) { const t = Lp[4 + k * 4], d = Lp[3 + k * 4], len = Math.hypot(t.x - d.x, t.y - d.y) || 1;
      E[k * 2] = t.x + (t.x - d.x) / len * palm * .5; E[k * 2 + 1] = t.y + (t.y - d.y) / len * palm * .5; }
    gl.uniform2fv(U.uE, E);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tV);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src); } catch (e) { return; }
    const pc = CFG.plancton && CFG.modo === 'plancton' && document.getElementById('hz-plancton'); let plOk = 0;
    if (pc && pc.width) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tP); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pc); plOk = 1; } catch (e) {} gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); }
    gl.uniform1f(U.uPlOk, plOk);
    gl.uniform2f(U.uRes, cv.width, cv.height); gl.uniform1f(U.uDpr, DPR); gl.uniform4f(U.uVid, sr.left, sr.top, sr.width, sr.height);
    gl.uniform2fv(U.uL, L); gl.uniform3f(U.uRef, ref.y, ref.cb, ref.cr); gl.uniform1f(U.uSig, ref.sig); gl.uniform1f(U.uConf, ref.conf);
    gl.uniform1f(U.uF, F); gl.uniform1f(U.uT, T); gl.uniform1f(U.uA, A); gl.uniform1f(U.uDebug, CFG.debug ? 1 : 0); gl.uniform1f(U.uImgOk, CFG.modo === 'imagen' ? imgOk * 2 : imgOk);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function iniciar() { if (iniciar.ok) return; iniciar.ok = true; document.body.appendChild(cv); requestAnimationFrame(frame); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar); else iniciar();
  return { CFG, imagen, ref, get listo() { return ok; }, get avance() { return F; } };
})();
