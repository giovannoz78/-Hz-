// [Hz] · CONTAGIO — el fitoplancton invade solo lo que tapa el glaciar: los dedos, la mano.
// La obra aprende cómo se ve el glaciar EN ESTA CÁMARA (esta pantalla o este papel, esta luz) apenas MindAR lo encuentra,
// y desde ahí compara cada cuadro contra ese aprendizaje, en las coordenadas de la propia tarjeta.
// Lo que difiere es lo que está delante: ahí, y solo ahí, aparece el plancton.
// El aprendizaje se actualiza solo donde no hay nada delante, así se adapta a cambios de luz sin "tragarse" la mano.
window.HZPiel = window.HZPiel || (function () {
  const CFG = { umbral: 0.16, aprende: 0.06, debug: false };
  const cv = document.createElement('canvas'); cv.id = 'hz-piel';
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:99991';
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  const VS = 'attribute vec2 p;varying vec2 vu;void main(){vu=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const COMUN = `precision highp float; varying vec2 vu;
  vec3 ycc(vec3 c){float y=dot(c,vec3(.299,.587,.114));return vec3(y,(c.b-y)*.564,(c.r-y)*.713);}`;
  // 1) la tarjeta "enderezada": cada texel toma de la cámara el punto de la tarjeta que le corresponde
  const FS_RECT = COMUN + `uniform sampler2D uV; uniform mat3 uHuv; uniform vec4 uVid;
  void main(){ vec2 uv=vec2(vu.x,1.-vu.y); vec3 h=uHuv*vec3(uv,1.); vec2 s=h.xy/h.z; vec2 t=(s-uVid.xy)/uVid.zw;
    gl_FragColor=vec4(texture2D(uV,t).rgb,1.); }`;
  // 2) qué tapa la tarjeta: diferencia con lo aprendido, tolerando que MindAR tiemble un par de texels
  const FS_OCC = COMUN + `uniform sampler2D uCur; uniform sampler2D uRef; uniform vec2 uTx; uniform float uUmbral; uniform sampler2D uOccPrev;
  float dif(vec3 c,vec3 r){ vec3 a=ycc(c), b=ycc(r); return max(0.,b.x-a.x)*1.6+abs(a.x-b.x)*.6+length(a.yz-b.yz)*2.5; }
  void main(){
    vec3 c=(texture2D(uCur,vu).rgb*4.+texture2D(uCur,vu+vec2(uTx.x,0)).rgb+texture2D(uCur,vu-vec2(uTx.x,0)).rgb+texture2D(uCur,vu+vec2(0,uTx.y)).rgb+texture2D(uCur,vu-vec2(0,uTx.y)).rgb)/8.;
    float d=1e3;
    for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 o=vec2(float(i),float(j))*uTx*1.5; d=min(d,dif(c,texture2D(uRef,vu+o).rgb)); }
    float o=smoothstep(uUmbral,uUmbral+.1,d);
    float prev=texture2D(uOccPrev,vu).r;
    gl_FragColor=vec4(mix(prev,o,.55),0.,0.,1.); }`;
  // 3) aprender: donde no hay nada delante, el glaciar aprendido se acerca a lo que se ve ahora
  const FS_APR = COMUN + `uniform sampler2D uCur; uniform sampler2D uRef; uniform sampler2D uOcc; uniform float uRate; uniform float uInicio;
  void main(){ vec3 c=texture2D(uCur,vu).rgb, r=texture2D(uRef,vu).rgb; float o=texture2D(uOcc,vu).r;
    float k=uInicio>.5?1.:uRate*(1.-smoothstep(.2,.5,o))+.002;
    gl_FragColor=vec4(mix(r,c,k),1.); }`;
  // 4) en pantalla: el plancton sobre lo que tapa
  const FS_VER = COMUN + `uniform vec2 uRes; uniform float uDpr; uniform mat3 uHi; uniform float uAsp; uniform sampler2D uOcc; uniform vec2 uTx;
  uniform float uT; uniform float uA; uniform float uF; uniform float uDebug;
  vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return -1.+2.*fract(sin(p)*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
    return mix(mix(dot(hash(i),f),dot(hash(i+vec2(1,0)),f-vec2(1,0)),u.x),mix(dot(hash(i+vec2(0,1)),f-vec2(0,1)),dot(hash(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);}
  float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
%%CELULA%%
  float occ(vec2 uv){ vec2 t=vec2(uv.x,1.-uv.y); return (texture2D(uOcc,t).r*2.+texture2D(uOcc,t+vec2(uTx.x,0)).r+texture2D(uOcc,t-vec2(uTx.x,0)).r+texture2D(uOcc,t+vec2(0,uTx.y)).r+texture2D(uOcc,t-vec2(0,uTx.y)).r)/6.; }
  void main(){
    vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;
    vec3 h=uHi*vec3(p,1.); vec2 uv=h.xy/h.z;
    if(h.z<=0.||uv.x<0.||uv.y<0.||uv.x>1.||uv.y>1.){ gl_FragColor=vec4(0.); return; }
    float m=smoothstep(.35,.7,occ(uv));                 // lo que está delante del glaciar
    if(uDebug>.5){ gl_FragColor=vec4(vec3(1.,.15,.6)*m*.7,m*.6); return; }
    if(m<=0.){ gl_FragColor=vec4(0.); return; }
    vec2 hp=vec2(uv.x,uv.y*uAsp);
    float n=fbm(hp*6.+vec2(0.,uT*.05));
    float fr=uF+.25*n-.1, inv=smoothstep(0.,.1,fr);
    vec2 w=vec2(fbm(hp*4.+uT*.05),fbm(hp*4.+vec2(5.2,1.3)-uT*.04));
    float ve=pow(clamp(1.-abs(fbm(hp*11.+w*1.5+vec2(0.,uT*.02))),0.,1.),9.);
    vec2 cel=hp*120.; vec2 id=floor(cel); float dd=length(fract(cel)-.5-hash(id)*.3);
    float vive=.5+.5*sin(uT*(1.5+hash(id+3.).x)+hash(id).y*6.28);
    float polvo=(1.-smoothstep(.06,.16,dd))*(.35+.65*vive);
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
    vec3 teal=vec3(.12,.85,.78);
    vec3 tono=mix(vec3(.25,1.,.85),vec3(.6,.9,1.),fract(pkCol*.37));
    float velo=.08+.12*smoothstep(0.,.5,fr);
    vec3 col=teal*(velo+polvo*.45+ve*.45)*inv + tono*pk*1.3;
    float al=clamp((velo*.7+polvo*.2)*inv+pk*.8,0.,1.);
    gl_FragColor=vec4(col*m*uA,al*m*uA);
  }`;
  const RW = 128; let RH = 96;
  let ok = false, P = {}, tV, tCur, tOcc = [], tRef = [], fCur, fOcc = [], fRef = [], io = 0, ir = 0, buf;
  function sh(t, s) { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  function prog(fs, names) { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; names.forEach(n => u[n] = gl.getUniformLocation(p, n)); return { p, u, a: gl.getAttribLocation(p, 'p') }; }
  const tex = (w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (w) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); return t; };
  const fbo = t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; };
  function armarBuffers(h) { RH = h; tCur = tex(RW, RH); fCur = fbo(tCur);
    tOcc = [tex(RW, RH), tex(RW, RH)]; fOcc = tOcc.map(fbo); tRef = [tex(RW, RH), tex(RW, RH)]; fRef = tRef.map(fbo);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
  try {
    const CEL = "  mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}\n  float anillo(float d,float r,float w){return 1.-smoothstep(0.,w,abs(d-r));}\n  // una c\u00e9lula de fitoplancton en q (radio ~1). tipo 0 diatomea c\u00e9ntrica, 1 pennada, 2 cadena, 3 dinoflagelado, 4 cocolitof\u00f3rido\n  float celula(vec2 q,float tipo,float t){\n    float d=length(q), a=atan(q.y,q.x), v=0.;\n    if(tipo<.5){ v=anillo(d,.8,.07)+anillo(d,.45,.05)*.6; v+=(1.-smoothstep(.75,.8,d))*smoothstep(.12,.0,abs(sin(a*9.)))*.55*step(.45,d); v+=(1.-smoothstep(.0,.18,d))*.8; }\n    else if(tipo<1.5){ vec2 e=q*vec2(.45,1.3); float de=length(e); v=anillo(de,.42,.035); v+=(1.-smoothstep(.38,.42,de))*smoothstep(.25,.0,abs(sin(q.x*14.)))*.5; v+=(1.-smoothstep(.0,.06,abs(q.y)))*(1.-smoothstep(.3,.4,de))*.6; }\n    else if(tipo<2.5){ for(int i=-2;i<=2;i++){ vec2 c=q-vec2(float(i)*.42,0.); float dc=length(c); v+=anillo(dc,.18,.04)+(1.-smoothstep(.0,.08,dc))*.7; } v+=(1.-smoothstep(.0,.02,abs(q.y)))*step(abs(q.x),.95)*.4; }\n    else if(tipo<3.5){ vec2 e=q*vec2(1.,.8); float de=length(e); v=anillo(de,.6,.05); v+=(1.-smoothstep(.0,.035,abs(q.y-.08*sin(q.x*6.))))*(1.-smoothstep(.5,.62,de))*.8;\n      vec2 f=q-vec2(.55,-.3); v+=(1.-smoothstep(.0,.025,abs(f.y+.15*sin(f.x*10.-t*6.))))*step(0.,f.x)*step(f.x,.6)*.6; v+=(1.-smoothstep(.55,.62,de))*.18; }\n    else { v=anillo(d,.55,.05); for(int i=0;i<7;i++){ float b=float(i)*.8976; vec2 c=q-.55*vec2(cos(b),sin(b)); v+=anillo(length(c),.18,.035); } v+=(1.-smoothstep(.0,.2,d))*.4; }\n    return clamp(v,0.,1.);\n  }\n";
    P.rect = prog(FS_RECT, ['uV', 'uHuv', 'uVid']);
    P.occ = prog(FS_OCC, ['uCur', 'uRef', 'uTx', 'uUmbral', 'uOccPrev']);
    P.apr = prog(FS_APR, ['uCur', 'uRef', 'uOcc', 'uRate', 'uInicio']);
    P.ver = prog(FS_VER.replace('%%CELULA%%', CEL), ['uRes', 'uDpr', 'uHi', 'uAsp', 'uOcc', 'uTx', 'uT', 'uA', 'uF', 'uDebug']);
    buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    tV = tex(); armarBuffers(96); ok = true;
  } catch (e) { console.warn('[Hz] contagio', e); }
  function usar(pp) { gl.useProgram(pp.p); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(pp.a); gl.vertexAttribPointer(pp.a, 2, gl.FLOAT, false, 0, 0); }
  function textura(unit, t, loc) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc, unit); }
  const m3 = H => [H[0], H[3], H[6], H[1], H[4], H[7], H[2], H[5], H[8]];   // por filas -> por columnas (GLSL)

  function homografia(s, d) {
    const A = [], B = [];
    for (let i = 0; i < 4; i++) { const [x, y] = s[i], [u, v] = d[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v); }
    for (let c = 0; c < 8; c++) { let m = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      [A[c], A[m]] = [A[m], A[c]]; [B[c], B[m]] = [B[m], B[c]];
      for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; B[r] -= f * B[c]; } }
    const h = B.map((b, i) => b / A[i][i]); return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }
  let V3 = null, asp = .75, idxAct = null;
  function tarjeta() {
    const sc = document.querySelector('a-scene'), cam = sc && sc.camera, T = window.AFRAME && AFRAME.THREE; if (!cam || !T || !sc.renderer) return null;
    if (!V3) V3 = new T.Vector3();
    const cr = sc.renderer.domElement.getBoundingClientRect();
    for (const an of document.querySelectorAll('.hz-ancla')) { const o = an.object3D; if (!o || !o.visible) continue;
      const mm = (an.id || '').match(/(\d+)$/), i = mm ? mm[1] : null, D = window.HZ_DATOS || {};
      const a = (D.aspectos && D.aspectos[i]) || .75;
      const Pt = [[-.5, a / 2], [.5, a / 2], [.5, -a / 2], [-.5, -a / 2]].map(([x, y]) => {
        V3.set(x, y, 0).applyMatrix4(o.matrixWorld).project(cam); return [cr.left + (V3.x * .5 + .5) * cr.width, cr.top + (-V3.y * .5 + .5) * cr.height]; });
      if (Pt.some(q => !isFinite(q[0]))) continue;
      return { P: Pt, idx: i, asp: a };
    }
    return null;
  }
  const lect = new Uint8Array(RW * 256 * 4); let tapado = 0;
  let A = 0, F = 0, T = 0, ult = performance.now(), ultT = null, ultVisto = 0, inicio = 0, cuadro = 0, sinTapar = 0;
  function frame() {
    requestAnimationFrame(frame); if (!ok) return;
    const ahora = performance.now(), st = Math.min(.05, (ahora - ult) / 1000); ult = ahora; T += st;
    const DPR = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
    if (cv.width !== Math.round(W * DPR) || cv.height !== Math.round(H * DPR)) { cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    const src = window.hzManoFuente || document.querySelector('video'); if (!src || !(src.videoWidth || src.naturalWidth)) return;
    const t = tarjeta();
    if (t) { if (!ultT || ahora - ultVisto > 1500 || t.idx !== idxAct) { inicio = 10; idxAct = t.idx; F = 0; A = 0;   // tarjeta nueva o recuperada: aprender de cero
        const rh = Math.max(32, Math.round(RW * t.asp)); if (rh !== RH) armarBuffers(rh); }
      ultT = t; ultVisto = ahora; asp = t.asp; }
    if (!ultT || ahora - ultVisto > 1200) { A = 0; F = 0; return; }
    const sr = src.getBoundingClientRect();
    const Huv = homografia([[0, 0], [1, 0], [1, 1], [0, 1]], ultT.P), Hi = homografia(ultT.P, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    gl.disable(gl.BLEND);
    if (t) {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tV);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src); } catch (e) { return; }
      gl.viewport(0, 0, RW, RH);
      // 1 enderezar
      gl.bindFramebuffer(gl.FRAMEBUFFER, fCur); usar(P.rect); textura(0, tV, P.rect.u.uV);
      gl.uniformMatrix3fv(P.rect.u.uHuv, false, m3(Huv)); gl.uniform4f(P.rect.u.uVid, sr.left, sr.top, sr.width, sr.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      // 2 qué tapa
      const io2 = 1 - io;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fOcc[io2]); usar(P.occ); textura(0, tCur, P.occ.u.uCur); textura(1, tRef[ir], P.occ.u.uRef); textura(2, tOcc[io], P.occ.u.uOccPrev);
      gl.uniform2f(P.occ.u.uTx, 1 / RW, 1 / RH); gl.uniform1f(P.occ.u.uUmbral, inicio > 0 ? 9 : CFG.umbral);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); io = io2;
      // 3 aprender
      const ir2 = 1 - ir;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fRef[ir2]); usar(P.apr); textura(0, tCur, P.apr.u.uCur); textura(1, tRef[ir], P.apr.u.uRef); textura(2, tOcc[io], P.apr.u.uOcc);
      gl.uniform1f(P.apr.u.uRate, CFG.aprende); gl.uniform1f(P.apr.u.uInicio, inicio > 0 ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); ir = ir2; if (inicio > 0) inicio--;
      // cuánto está tapado (lectura chica cada 4 cuadros)
      if ((cuadro++ & 3) === 0) { gl.bindFramebuffer(gl.FRAMEBUFFER, fOcc[io]); gl.readPixels(0, 0, RW, RH, gl.RGBA, gl.UNSIGNED_BYTE, lect);
        let n = 0; for (let i = 0; i < RW * RH; i++) if (lect[i * 4] > 128) n++; tapado = n / (RW * RH); }
    }
    const hay = tapado > .004 && tapado < .6;
    if (hay) { sinTapar = 0; A = Math.min(1, A + st * 4); F = Math.min(1.3, F + st * .9); }
    else { sinTapar += st; if (sinTapar > .4) { A = Math.max(0, A - st * 2); if (A <= 0) F = 0; } }
    if (CFG.debug) A = 1;
    if (A <= 0) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    usar(P.ver); textura(0, tOcc[io], P.ver.u.uOcc);
    gl.uniform2f(P.ver.u.uRes, cv.width, cv.height); gl.uniform1f(P.ver.u.uDpr, DPR); gl.uniformMatrix3fv(P.ver.u.uHi, false, m3(Hi));
    gl.uniform1f(P.ver.u.uAsp, asp); gl.uniform2f(P.ver.u.uTx, 1 / RW, 1 / RH); gl.uniform1f(P.ver.u.uT, T); gl.uniform1f(P.ver.u.uA, A);
    gl.uniform1f(P.ver.u.uF, F); gl.uniform1f(P.ver.u.uDebug, CFG.debug ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function iniciar() { if (iniciar.ok) return; iniciar.ok = true; document.body.appendChild(cv); requestAnimationFrame(frame); }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar); else iniciar();
  return { CFG, get tapado() { return tapado; }, get avance() { return F; }, est: { get tapado() { return tapado; } }, imagen() {} };
})();
