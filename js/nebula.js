/* MonsterSweeps backdrop: a slow gold-dust nebula behind every page.
   One fixed WebGL canvas: soft royal-purple clouds (fbm noise) plus three depth layers of dust
   (gold, lilac, a few bright glints) that drift upward and shift with scroll and pointer.
   No WebGL -> nothing is drawn and the CSS gradient from /css/tokens.css stays as the background.
   Reduced motion -> one still frame. Hidden tab -> paused. */
(function () {
  'use strict';
  var SAVE = !!(navigator.connection && navigator.connection.saveData);
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches || SAVE;   // data saver: one still frame too
  var SMALL = matchMedia('(max-width: 860px), (pointer: coarse)').matches;
  var cv = document.createElement('canvas');
  cv.id = 'nebula'; cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block';
  var gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return;
  document.body.insertBefore(cv, document.body.firstChild);

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
  function prog(vs, fs) { var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); return p; }

  /* clouds: full-screen triangle, two warped fbm layers in royal purple with the odd gold ember */
  var CLOUD = prog(
    'attribute vec2 aP;void main(){gl_Position=vec4(aP,0.,1.);}',
    ['precision mediump float;uniform vec2 uRes;uniform float uT;uniform float uS;uniform vec2 uM;',
     'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
     'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
     'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}',
     'void main(){vec2 uv=gl_FragCoord.xy/uRes.y;uv+=vec2(uM.x*.02,uS*.12+uM.y*.015);float t=uT*.01;',
     ' float c1=fbm(uv*1.4+vec2(t,-t*.6));float c2=fbm(uv*2.2-vec2(t*.7,t*.35)+c1*1.3);',
     ' float m=smoothstep(.42,.95,c2);',
     ' vec3 col=mix(vec3(.26,.10,.62),vec3(.52,.28,.95),c1)*m*.26+vec3(1.,.70,.22)*smoothstep(.8,1.,c2)*.045;',
     ' gl_FragColor=vec4(col,0.);}'].join('\n'));
  var tri = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  /* dust: all motion is in the vertex shader, so the CPU only updates a few uniforms per frame */
  var DUST = prog(
    ['attribute vec4 aD;attribute float aK;uniform float uT;uniform float uS;uniform vec2 uM;uniform float uA;uniform float uPx;varying vec3 vC;varying float vA;varying float vK;',
     'void main(){float z=aD.z;',
     ' float y=fract(aD.y+uT*.0035*(.35+z)+uS*.22*z);',          // drift up; nearer dust moves more with scroll
     ' vec2 p=vec2(aD.x*1.1+uM.x*.035*z,(y*2.2-1.1)+uM.y*.025*z);',
     ' p.x/=uA;gl_Position=vec4(p,0.,1.);',
     ' float tw=.55+.45*sin(uT*(.5+z)+aD.w*40.);',
     ' vK=aK;vA=tw*(.25+.75*z);',
     ' vC=aK<.5?vec3(1.,.76,.32):(aK<1.5?vec3(.74,.6,1.):vec3(1.,.96,.88));',
     ' gl_PointSize=uPx*(aK>1.5?(5.+7.*z):(1.2+3.2*z));}'].join('\n'),
    ['precision mediump float;varying vec3 vC;varying float vA;varying float vK;',
     'void main(){vec2 d=gl_PointCoord-.5;float r=length(d);float a=smoothstep(.5,0.,r);a*=a;',
     ' if(vK>1.5){a=a*.6+max(0.,1.-abs(d.x*d.y)*160.)*smoothstep(.5,0.,r)*.9;}',   // glints get a soft four-point star
     ' gl_FragColor=vec4(vC*a*vA,0.);}'].join('\n'));

  var N = SMALL ? 360 : 900, data = new Float32Array(N * 4), kind = new Float32Array(N);
  for (var i = 0; i < N; i++) {
    var r = Math.random();
    kind[i] = r < .06 ? 2 : (r < .6 ? 0 : 1);
    data[i * 4] = Math.random() * 2 - 1;                 // x across a 16:9-ish field, squeezed by aspect in the shader
    data[i * 4 + 1] = Math.random();                     // y phase
    data[i * 4 + 2] = Math.pow(Math.random(), 1.6);      // depth: most dust is far away
    data[i * 4 + 3] = Math.random();                     // twinkle seed
  }
  var dBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, dBuf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  var kBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, kBuf); gl.bufferData(gl.ARRAY_BUFFER, kind, gl.STATIC_DRAW);

  function U(p, n) { return gl.getUniformLocation(p, n); }
  var uc = { res: U(CLOUD, 'uRes'), t: U(CLOUD, 'uT'), s: U(CLOUD, 'uS'), m: U(CLOUD, 'uM') };
  var ud = { t: U(DUST, 'uT'), s: U(DUST, 'uS'), m: U(DUST, 'uM'), a: U(DUST, 'uA'), px: U(DUST, 'uPx') };
  var aP = gl.getAttribLocation(CLOUD, 'aP'), aD = gl.getAttribLocation(DUST, 'aD'), aK = gl.getAttribLocation(DUST, 'aK');

  var dpr = 1, W = 1, H = 1, scale = 1, drawN = N;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, SMALL ? 1 : 1.5) * scale;
    W = Math.max(1, Math.round(innerWidth * dpr)); H = Math.max(1, Math.round(innerHeight * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  }

  var mx = 0, my = 0, tx = 0, ty = 0;
  if (!SMALL) addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth * 2 - 1; ty = -(e.clientY / innerHeight * 2 - 1); }, { passive: true });

  var t0 = performance.now() - Math.random() * 60000, last = 0, running = false, step = SMALL ? 1000 / 30 : 0;
  function draw(now) {
    var t = (now - t0) / 1000, s = scrollY / Math.max(1, innerHeight);
    mx += (tx - mx) * .04; my += (ty - my) * .04;
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(CLOUD);
    gl.uniform2f(uc.res, W, H); gl.uniform1f(uc.t, t); gl.uniform1f(uc.s, s); gl.uniform2f(uc.m, mx, my);
    gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.disableVertexAttribArray(aP);
    gl.useProgram(DUST);
    gl.uniform1f(ud.t, t); gl.uniform1f(ud.s, s); gl.uniform2f(ud.m, mx, my); gl.uniform1f(ud.a, Math.max(.6, W / H / 1.6)); gl.uniform1f(ud.px, dpr);
    gl.bindBuffer(gl.ARRAY_BUFFER, dBuf); gl.enableVertexAttribArray(aD); gl.vertexAttribPointer(aD, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, kBuf); gl.enableVertexAttribArray(aK); gl.vertexAttribPointer(aK, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, drawN);
    gl.disableVertexAttribArray(aD); gl.disableVertexAttribArray(aK);
  }
  /* quality guard: measure the real frame interval for ~2s; a struggling device first gets half resolution and
     half the dust, and if it is still slow the nebula settles into a still frame */
  var lvl = 0, sN = 0, sT = 0, slow = SMALL ? 42 : 25;   // ms per frame: below ~24fps on phones, ~40fps on desktop
  function guard(now) {
    if (lvl > 1) return;
    if (!sT) { sT = now; sN = 0; return; }
    sN++;
    if (now - sT < 2000) return;
    var avg = (now - sT) / sN; sT = 0;
    if (avg <= slow) { lvl = 2; return; }                 // smooth enough: stop measuring
    if (lvl === 0) { lvl = 1; scale = .5; drawN = Math.round(N / 2); resize(); }
    else { lvl = 3; running = false; draw(now); }        // still too slow: freeze on a still frame
  }
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (step && now - last < step) return;
    last = now; draw(now); guard(now);
  }
  function start() { if (RM || running || document.hidden || lvl === 3) return; running = true; requestAnimationFrame(frame); }
  function still() { resize(); draw(performance.now()); }

  resize();
  addEventListener('resize', function () { resize(); if (RM) still(); }, { passive: true });
  if (RM) still();
  else start();
  document.addEventListener('visibilitychange', function () { sT = 0; if (document.hidden) running = false; else start(); });  // a hidden tab is not a slow device
  window.__nebula = { draw: draw, get running() { return running; }, get level() { return lvl; } };
})();
