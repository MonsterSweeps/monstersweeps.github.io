/* MonsterSweeps — tiny WebGL engine and the 3D demo Fortune Wheel.
   No dependencies. Without WebGL the wheel section simply shows no canvas. */
(function () {
  'use strict';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COARSE = matchMedia('(pointer: coarse)').matches;

  /* ---------------- math ---------------- */
  var M4 = {
    id: function () { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; },
    mul: function (a, b) {
      var o = new Array(16);
      for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
        o[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
      }
      return o;
    },
    persp: function (fov, asp, n, f) {
      var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f);
      return [t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0];
    },
    look: function (e, c, u) {
      var z = norm([e[0]-c[0], e[1]-c[1], e[2]-c[2]]), x = norm(cross(u, z)), y = cross(z, x);
      return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,e),-dot(y,e),-dot(z,e),1];
    },
    trs: function (p, r, s) { // euler XYZ applied as Rz*Ry*Rx
      var cx = Math.cos(r[0]), sx = Math.sin(r[0]), cy = Math.cos(r[1]), sy = Math.sin(r[1]), cz = Math.cos(r[2]), sz = Math.sin(r[2]);
      var m00 = cy*cz, m01 = sx*sy*cz - cx*sz, m02 = cx*sy*cz + sx*sz;
      var m10 = cy*sz, m11 = sx*sy*sz + cx*cz, m12 = cx*sy*sz - sx*cz;
      var m20 = -sy, m21 = sx*cy, m22 = cx*cy;
      return [m00*s[0],m10*s[0],m20*s[0],0, m01*s[1],m11*s[1],m21*s[1],0, m02*s[2],m12*s[2],m22*s[2],0, p[0],p[1],p[2],1];
    },
    nrm: function (m) { // inverse-transpose of upper 3x3
      var a = m[0],b = m[1],c = m[2],d = m[4],e = m[5],f = m[6],g = m[8],h = m[9],i = m[10];
      var A = e*i - f*h, B = -(d*i - f*g), C = d*h - e*g, det = a*A + b*B + c*C || 1e-6;
      return [A/det, B/det, C/det, -(b*i - c*h)/det, (a*i - c*g)/det, -(a*h - b*g)/det, (b*f - c*e)/det, -(a*f - c*d)/det, (a*e - b*d)/det];
    }
  };
  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function cross(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0]/l, a[1]/l, a[2]/l]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function hex(h) { var n = parseInt(h.slice(1), 16); return [(n>>16&255)/255, (n>>8&255)/255, (n&255)/255]; }
  function srgb(h) { return hex(h).map(function (c) { return Math.pow(c, 2.2); }); }

  /* ---------------- geometry ---------------- */
  function finish(pos, idx, uv) {
    var n = new Float32Array(pos.length);
    for (var i = 0; i < idx.length; i += 3) {
      var a = idx[i]*3, b = idx[i+1]*3, c = idx[i+2]*3;
      var e1 = [pos[b]-pos[a], pos[b+1]-pos[a+1], pos[b+2]-pos[a+2]], e2 = [pos[c]-pos[a], pos[c+1]-pos[a+1], pos[c+2]-pos[a+2]];
      var f = cross(e1, e2);
      for (var k = 0; k < 3; k++) { var j = idx[i+k]*3; n[j] += f[0]; n[j+1] += f[1]; n[j+2] += f[2]; }
    }
    for (var q = 0; q < n.length; q += 3) { var l = Math.hypot(n[q], n[q+1], n[q+2]) || 1; n[q] /= l; n[q+1] /= l; n[q+2] /= l; }
    return { pos: new Float32Array(pos), nrm: n, idx: new Uint16Array(idx), uv: uv ? new Float32Array(uv) : null };
  }
  function sphere(r, ws, hs, disp, t0, tl) {
    t0 = t0 || 0; tl = tl || Math.PI;
    var pos = [], idx = [], uv = [];
    for (var y = 0; y <= hs; y++) for (var x = 0; x <= ws; x++) {
      var u = x / ws, v = y / hs, th = t0 + v * tl, ph = u * Math.PI * 2;
      var px = -Math.cos(ph) * Math.sin(th), py = Math.cos(th), pz = Math.sin(ph) * Math.sin(th);
      var rr = r * (disp ? disp(px, py, pz) : 1);
      pos.push(px*rr, py*rr, pz*rr); uv.push(u, v);
    }
    for (var j = 0; j < hs; j++) for (var i = 0; i < ws; i++) {
      var a = j*(ws+1)+i, b = a+ws+1;
      idx.push(a, b, a+1, b, b+1, a+1);
    }
    weld(pos, ws, hs);
    return finish(pos, idx, uv);
  }
  function weld(pos, ws, hs) { // close the seam so normals are smooth
    for (var y = 0; y <= hs; y++) { var a = y*(ws+1)*3, b = (y*(ws+1)+ws)*3; pos[b] = pos[a]; pos[b+1] = pos[a+1]; pos[b+2] = pos[a+2]; }
  }
  function cyl(rt, rb, h, seg, caps) {
    var pos = [], idx = [], uv = [];
    for (var y = 0; y <= 1; y++) for (var i = 0; i <= seg; i++) {
      var a = i / seg * Math.PI * 2, r = y ? rt : rb;
      pos.push(Math.cos(a)*r, (y - .5) * h, Math.sin(a)*r); uv.push(i/seg, y);
    }
    for (var k = 0; k < seg; k++) { var p = k, q = k + seg + 1; idx.push(p, q, p+1, q, q+1, p+1); }
    if (caps) {
      [[-.5, rb], [.5, rt]].forEach(function (cp, ci) {
        if (cp[1] <= 0) return;
        var c0 = pos.length / 3; pos.push(0, cp[0]*h, 0); uv.push(.5, .5);
        for (var i = 0; i <= seg; i++) { var a = i/seg*Math.PI*2; pos.push(Math.cos(a)*cp[1], cp[0]*h, Math.sin(a)*cp[1]); uv.push(.5+Math.cos(a)*.5, .5+Math.sin(a)*.5); }
        for (var j = 0; j < seg; j++) ci ? idx.push(c0, c0+j+2, c0+j+1) : idx.push(c0, c0+j+1, c0+j+2);
      });
    }
    return finish(pos, idx, uv);
  }
  function torus(R, r, sR, sT) {
    var pos = [], idx = [];
    for (var j = 0; j <= sR; j++) for (var i = 0; i <= sT; i++) {
      var u = i / sT * Math.PI * 2, v = j / sR * Math.PI * 2;
      pos.push((R + r*Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r*Math.cos(v)) * Math.sin(u));
    }
    for (var b = 0; b < sR; b++) for (var a = 0; a < sT; a++) {
      var p = b*(sT+1)+a, q = p+sT+1; idx.push(p, q, p+1, q, q+1, p+1);
    }
    return finish(pos, idx);
  }
  function disc(r, seg) { // flat disc in XY facing +Z, uv planar
    var pos = [0,0,0], uv = [.5,.5], idx = [];
    for (var i = 0; i <= seg; i++) { var a = i/seg*Math.PI*2; pos.push(Math.cos(a)*r, Math.sin(a)*r, 0); uv.push(.5+Math.cos(a)*.5, .5-Math.sin(a)*.5); }
    for (var j = 1; j <= seg; j++) idx.push(0, j, j+1);
    return finish(pos, idx, uv);
  }

  /* ---------------- renderer ---------------- */
  var VS = 'attribute vec3 aP;attribute vec3 aN;attribute vec2 aU;uniform mat4 uM;uniform mat4 uVP;uniform mat3 uNM;varying vec3 vW;varying vec3 vN;varying vec3 vO;varying vec3 vNo;varying vec2 vU;void main(){vec4 w=uM*vec4(aP,1.);vW=w.xyz;vN=normalize(uNM*aN);vO=aP;vNo=aN;vU=aU;gl_Position=uVP*w;}';
  var FS = [
    'precision highp float;',
    'varying vec3 vW;varying vec3 vN;varying vec3 vO;varying vec3 vNo;varying vec2 vU;uniform sampler2D uS2;uniform float uDual;uniform float uFlat;',
    'uniform vec3 uCol;uniform vec3 uEye;uniform float uRough;uniform float uMetal;uniform float uSheen;uniform vec3 uSheenCol;uniform float uEmit;uniform float uFur;uniform float uTex;uniform sampler2D uS;uniform float uAlpha;uniform vec3 uRim;',
    'float h(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}',
    'float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}',
    'vec3 env(vec3 r){float y=r.y;vec3 c=mix(vec3(.05,.02,.10),vec3(.30,.18,.55),smoothstep(-.4,.6,y));',
    ' c+=vec3(1.4,1.15,.8)*smoothstep(.55,.85,y)*smoothstep(.2,.6,r.z+.3);',          // overhead softbox
    ' c+=vec3(1.1,.75,.3)*smoothstep(.75,.98,r.x)*.9;',                               // gold strip right
    ' c+=vec3(.55,.35,1.2)*smoothstep(.72,.98,-r.x)*.8;return c;}',                  // violet strip left
    'vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
    'uniform float uCut;uniform float uShine;uniform vec2 uEdge;',
    'void main(){',
    ' if(uCut>.5){vec4 t=texture2D(uS,vU);float sh=smoothstep(.07,0.,abs(vU.x*.8+vU.y*.45-uShine))*.55;vec3 c=t.rgb+sh*t.a;',
    '  if(uEdge.x>0.){float aL=texture2D(uS,vU-vec2(uEdge.x,0.)).a,aR=texture2D(uS,vU+vec2(uEdge.x,0.)).a,aT=texture2D(uS,vU-vec2(0.,uEdge.y)).a;',
    '   c+=t.a*(vec3(.62,.36,1.)*(1.-aL)*.5+vec3(1.,.74,.3)*(1.-aR)*.34+vec3(1.,.86,.6)*(1.-aT)*.22);}',   // violet back-rim left, gold key right, soft top light
    '  gl_FragColor=vec4(c*uAlpha,t.a*uAlpha);return;}',
    ' vec3 N=normalize(vN);vec3 V=normalize(uEye-vW);if(dot(N,V)<0.)N=-N;',
    ' vec3 base=uCol;',
    ' if(uTex>.5){vec4 t=texture2D(uS,vU);base=pow(t.rgb,vec3(2.2));if(uDual>.5){vec3 bk=pow(texture2D(uS2,vU).rgb,vec3(2.2));float fw=smoothstep(.05,.55,normalize(vNo).z);base=mix(bk,base,fw);}}',
    ' if(uFur>0.){float f=n3(vO*38.)*.6+n3(vO*90.)*.4;base*=mix(1.,.78+.38*f,uFur);',
    '   vec3 g=vec3(n3(vO*55.+1.3),n3(vO*55.+7.1),n3(vO*55.+3.7))-.5;N=normalize(N+g*.22*uFur);}',
    ' vec3 L1=normalize(vec3(.55,.85,.65)),L2=normalize(vec3(-.8,.2,.4)),L3=normalize(vec3(.1,.35,-1.));',
    ' float w=.45;float d1=max((dot(N,L1)+w)/(1.+w),0.),d2=max((dot(N,L2)+w)/(1.+w),0.);',
    ' vec3 diff=base*(d1*vec3(1.15,1.0,.9)*1.25+d2*vec3(.45,.35,.9)*.65+vec3(.07,.05,.12));',
    ' float sh=mix(220.,10.,uRough);vec3 H1=normalize(L1+V),H2=normalize(L2+V);',
    ' float sp=pow(max(dot(N,H1),0.),sh)*(sh+8.)/40.+pow(max(dot(N,H2),0.),sh)*(sh+8.)/120.;',
    ' float fr=pow(1.-max(dot(N,V),0.),3.);',
    ' vec3 R=reflect(-V,N);vec3 e=env(R);',
    ' vec3 col=mix(diff,base*e*1.6,uMetal)+sp*mix(vec3(1.),base*1.8,uMetal)*(1.-uRough*.8);',
    ' col+=mix(vec3(.04),base,uMetal)*e*fr*(1.-uRough)*.9;',
    ' col+=uSheenCol*pow(1.-max(dot(N,V),0.),2.2)*uSheen;',
    ' float rim=pow(1.-max(dot(N,V),0.),4.)*max(dot(N,L3)*.5+.6,0.);col+=uRim*rim;',
    ' col+=base*uEmit;',
    ' col=mix(col,base*(.78+.42*d1)+sp*.25+uRim*rim,uFlat);col=aces(col*1.05);gl_FragColor=vec4(pow(col,vec3(1./2.2))*uAlpha,uAlpha);}'
  ].join('\n');
  var PVS = 'attribute vec3 aP;attribute float aS;attribute vec3 aC;uniform mat4 uVP;uniform float uPx;varying vec3 vC;void main(){vec4 p=uVP*vec4(aP,1.);gl_Position=p;gl_PointSize=aS*uPx/p.w;vC=aC;}';
  var PFS = 'precision mediump float;varying vec3 vC;void main(){vec2 d=gl_PointCoord-.5;float r=length(d);float a=smoothstep(.5,0.,r);a=a*a;float star=max(0.,1.-abs(d.x*d.y)*90.)*smoothstep(.5,.0,r);gl_FragColor=vec4(vC*(a+star*.8),0.);}';

  function Engine(canvas, opts) {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('nogl');
    this.gl = gl; this.cv = canvas; this.nodes = []; this.fov = opts.fov || .62; this.eye = opts.eye || [0, .3, 7.2]; this.target = opts.target || [0, .2, 0];
    this.prog = prog(gl, VS, FS); this.pprog = prog(gl, PVS, PFS);
    var p = this.prog, u = {}; ['uM','uVP','uNM','uCol','uEye','uRough','uMetal','uSheen','uSheenCol','uEmit','uFur','uTex','uS','uAlpha','uRim','uS2','uDual','uFlat','uCut','uShine','uEdge'].forEach(function (n) { u[n] = gl.getUniformLocation(p, n); });
    this.u = u; this.a = { P: gl.getAttribLocation(p, 'aP'), N: gl.getAttribLocation(p, 'aN'), U: gl.getAttribLocation(p, 'aU') };
    this.dprMax = opts.dpr || 1.75; this.resize();
    gl.enable(gl.DEPTH_TEST);
    this.blank = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.blank); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255,255]));
  }
  function prog(gl, vs, fs) {
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
    var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p;
  }
  Engine.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, this.dprMax);
    var w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    this.asp = r.width / Math.max(1, r.height); this.px = h; this.cssH = r.height;
  };
  Engine.prototype.mesh = function (g) {
    var gl = this.gl, m = { n: g.idx.length };
    m.p = buf(gl, g.pos); m.nb = buf(gl, g.nrm); m.ub = g.uv ? buf(gl, g.uv) : null;
    m.i = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.i); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.idx, gl.STATIC_DRAW);
    return m;
  };
  Engine.prototype.sub = function (m, idx) { var gl = this.gl, o = { n: idx.length, p: m.p, nb: m.nb, ub: m.ub }; o.i = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.i); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); return o; };
  function buf(gl, d) { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); return b; }
  Engine.prototype.texture = function (canvas2d, premult) {
    var gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!premult);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    var w = canvas2d.width || canvas2d.naturalWidth, h = canvas2d.height || canvas2d.naturalHeight, pot = !(w & (w - 1)) && !(h & (h - 1));
    if (pot) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
    return t;
  };
  // node: {mesh, mat, p, r, s, parent, visible}
  Engine.prototype.add = function (mesh, mat, parent, p, r, s) {
    var n = { mesh: mesh, mat: mat || null, parent: parent || null, p: p || [0,0,0], r: r || [0,0,0], s: s || [1,1,1], visible: true };
    this.nodes.push(n); return n;
  };
  Engine.prototype.group = function (parent, p, r, s) { return this.add(null, null, parent, p, r, s); };
  function world(n) {
    if (n._f === world.f) return n._w;
    var l = M4.trs(n.p, n.r, n.s); n._w = n.parent ? M4.mul(world(n.parent), l) : l; n._f = world.f; return n._w;
  }
  world.f = 0;
  function visible(n) { while (n) { if (!n.visible) return false; n = n.parent; } return true; }
  Engine.prototype.render = function (points) {
    var gl = this.gl; this.resize(); world.f++;
    gl.viewport(0, 0, this.cv.width, this.cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var VP = this.cam();
    gl.useProgram(this.prog); gl.disable(gl.BLEND); gl.depthMask(true);
    gl.uniformMatrix4fv(this.u.uVP, false, VP); gl.uniform3fv(this.u.uEye, this.eye); gl.uniform1i(this.u.uS, 0); gl.uniform1i(this.u.uS2, 1);
    var a = this.a, self = this, cuts = [];
    function draw(n) {
      var m = n.mesh, mt = n.mat, W = world(n);
      gl.uniformMatrix4fv(self.u.uM, false, W); gl.uniformMatrix3fv(self.u.uNM, false, M4.nrm(W));
      gl.uniform3fv(self.u.uCol, mt.col || [1,1,1]); gl.uniform1f(self.u.uRough, mt.rough || .5); gl.uniform1f(self.u.uMetal, mt.metal || 0);
      gl.uniform1f(self.u.uSheen, mt.sheen || 0); gl.uniform3fv(self.u.uSheenCol, mt.sheenCol || [0,0,0]); gl.uniform1f(self.u.uEmit, mt.emit || 0);
      gl.uniform1f(self.u.uFur, mt.fur || 0); gl.uniform1f(self.u.uAlpha, mt.alpha == null ? 1 : mt.alpha); gl.uniform3fv(self.u.uRim, mt.rim || [.0,.0,.0]);
      gl.uniform1f(self.u.uCut, mt.cut ? 1 : 0); gl.uniform1f(self.u.uShine, mt.shine == null ? -9 : mt.shine); gl.uniform2fv(self.u.uEdge, mt.edge || [0, 0]);
      gl.uniform1f(self.u.uTex, mt.tex ? 1 : 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, mt.tex || self.blank);
      gl.uniform1f(self.u.uDual, mt.tex2 ? 1 : 0); gl.uniform1f(self.u.uFlat, mt.flat || 0); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mt.tex2 || self.blank); gl.activeTexture(gl.TEXTURE0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.enableVertexAttribArray(a.P); gl.vertexAttribPointer(a.P, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.nb); gl.enableVertexAttribArray(a.N); gl.vertexAttribPointer(a.N, 3, gl.FLOAT, false, 0, 0);
      if (a.U >= 0) { if (m.ub) { gl.bindBuffer(gl.ARRAY_BUFFER, m.ub); gl.enableVertexAttribArray(a.U); gl.vertexAttribPointer(a.U, 2, gl.FLOAT, false, 0, 0); } else { gl.disableVertexAttribArray(a.U); gl.vertexAttrib2f(a.U, 0, 0); } }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.i); gl.drawElements(gl.TRIANGLES, m.n, gl.UNSIGNED_SHORT, 0);
    }
    for (var i = 0; i < this.nodes.length; i++) {
      var n = this.nodes[i]; if (!n.mesh || !visible(n)) continue;
      if (n.mat.cut) { cuts.push(n); continue; }
      draw(n);
    }
    if (cuts.length) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      cuts.forEach(draw);
      gl.depthMask(true); gl.disable(gl.BLEND); gl.uniform1f(this.u.uCut, 0);
    }
    if (points && points.count) this.drawPoints(points, VP);
  };
  Engine.prototype.points = function (max) {
    var gl = this.gl, o = { max: max, count: 0, pos: new Float32Array(max*3), size: new Float32Array(max), col: new Float32Array(max*3) };
    o.bp = gl.createBuffer(); o.bs = gl.createBuffer(); o.bc = gl.createBuffer(); return o;
  };
  Engine.prototype.drawPoints = function (o, VP) {
    var gl = this.gl, p = this.pprog; gl.useProgram(p);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
    gl.uniformMatrix4fv(gl.getUniformLocation(p, 'uVP'), false, VP); gl.uniform1f(gl.getUniformLocation(p, 'uPx'), this.px * .5);
    [['aP', o.bp, o.pos, 3], ['aS', o.bs, o.size, 1], ['aC', o.bc, o.col, 3]].forEach(function (b) {
      var l = gl.getAttribLocation(p, b[0]); gl.bindBuffer(gl.ARRAY_BUFFER, b[1]); gl.bufferData(gl.ARRAY_BUFFER, b[2], gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, b[3], gl.FLOAT, false, 0, 0);
    });
    gl.drawArrays(gl.POINTS, 0, o.count);
    ['aS', 'aC'].forEach(function (n) { gl.disableVertexAttribArray(gl.getAttribLocation(p, n)); });
    gl.depthMask(true); gl.disable(gl.BLEND);
  };
  Engine.prototype.cam = function () { var P = M4.persp(this.fov, this.asp, .1, 60), V = M4.look(this.eye, this.target, [0, 1, 0]); this.VP = M4.mul(P, V); return this.VP; };
  Engine.prototype.project = function (w) { // world -> css px in canvas
    var m = this.VP || this.cam(), x = m[0]*w[0]+m[4]*w[1]+m[8]*w[2]+m[12], y = m[1]*w[0]+m[5]*w[1]+m[9]*w[2]+m[13], ww = m[3]*w[0]+m[7]*w[1]+m[11]*w[2]+m[15];
    var r = this.cv.getBoundingClientRect(); return [(x/ww*.5+.5)*r.width, (1-(y/ww*.5+.5))*r.height];
  };
  Engine.prototype.halfH = function () { return Math.tan(this.fov / 2) * Math.hypot(this.eye[0]-this.target[0], this.eye[1]-this.target[1], this.eye[2]-this.target[2]); };

  /* ---------------- materials ---------------- */
  var MAT = {
    gold:  { col: srgb('#ffc23d'), rough: .22, metal: 1, emit: .03 },
    goldD: { col: srgb('#e0a020'), rough: .3, metal: 1 }
  };

  function coinTexture() { // gold coin face: reeded rim, raised border and an embossed crown
    var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'), P = Math.PI * 2;
    function disc(r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(128, 128, r, 0, P); g.fill(); }
    function grad(x0, y0, x1, y1, stops) { var gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); return gr; }
    disc(128, grad(30, 20, 226, 236, [[0, '#fff0b0'], [.35, '#ffc23d'], [.7, '#d8901a'], [1, '#7a4508']]));
    g.strokeStyle = 'rgba(90,48,0,.55)'; g.lineWidth = 3;
    for (var i = 0; i < 72; i++) { var a = i / 72 * P; g.beginPath(); g.moveTo(128 + Math.cos(a) * 116, 128 + Math.sin(a) * 116); g.lineTo(128 + Math.cos(a) * 127, 128 + Math.sin(a) * 127); g.stroke(); }
    disc(110, grad(220, 230, 40, 30, [[0, '#ffe58a'], [.5, '#e7a628'], [1, '#9a5a0a']]));     // bevel, lit from the opposite side
    disc(98, grad(40, 30, 220, 230, [[0, '#ffe9a0'], [.45, '#ffc23d'], [1, '#c27c12']]));     // field
    var cr = [[-52, 30], [-60, -26], [-28, 2], [0, -40], [28, 2], [60, -26], [52, 30]];
    function crown(dx, dy, fill) {
      g.fillStyle = fill; g.beginPath(); cr.forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](128 + p[0] + dx, 122 + p[1] + dy); }); g.closePath(); g.fill();
      g.fillRect(128 - 54 + dx, 122 + 34 + dy, 108, 14);
      [[-60, -26], [0, -40], [60, -26]].forEach(function (p) { g.beginPath(); g.arc(128 + p[0] + dx, 122 + p[1] - 6 + dy, 8, 0, P); g.fill(); });
    }
    crown(3, 3, 'rgba(110,60,0,.6)'); crown(-2, -2, 'rgba(255,248,214,.85)'); crown(0, 0, '#f2b230');
    g.fillStyle = '#7b3fe4'; g.beginPath(); g.moveTo(128, 104); g.lineTo(138, 116); g.lineTo(128, 128); g.lineTo(118, 116); g.closePath(); g.fill();   // violet gem
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(92, 78, 34, 14, -.7, 0, P); g.fill();                                             // glint
    return c;
  }

  /* ---------------- Fortune Wheel ---------------- */
  var SEG = [['+25 XP', '#ffc23d', '#3a1d00'], ['Free play', '#6d33e6', '#fff'], ['+50 XP', '#ffd76e', '#3a1d00'], ['Voucher', '#4a1fb8', '#fff'],
             ['+10 XP', '#ffc23d', '#3a1d00'], ['Free play', '#6d33e6', '#fff'], ['+100 XP', '#ffd76e', '#3a1d00'], ['Voucher', '#4a1fb8', '#fff']];
  function wheelTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 1024; var g = c.getContext('2d'), R = 512, n = SEG.length;
    for (var i = 0; i < n; i++) {
      var a0 = (i / n) * Math.PI * 2 - Math.PI / 2 - Math.PI / n, a1 = a0 + Math.PI * 2 / n;
      var gr = g.createRadialGradient(R, R, 60, R, R, R); gr.addColorStop(0, SEG[i][1]); gr.addColorStop(1, shade(SEG[i][1], -.25));
      g.fillStyle = gr; g.beginPath(); g.moveTo(R, R); g.arc(R, R, R, a0, a1); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(20,6,40,.55)'; g.lineWidth = 6; g.stroke();
      g.save(); g.translate(R, R); g.rotate((a0 + a1) / 2); g.fillStyle = SEG[i][2];
      g.font = 'bold 62px Adventor, "Arial Black", sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(SEG[i][0], R - 70, 4); g.restore();
    }
    var ig = g.createRadialGradient(R, R, 0, R, R, R); ig.addColorStop(.0, 'rgba(255,255,255,.18)'); ig.addColorStop(.45, 'rgba(255,255,255,0)'); ig.addColorStop(1, 'rgba(0,0,0,.25)');
    g.fillStyle = ig; g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.fill();
    return c;
  }
  function shade(h, a) { var c = hex(h).map(function (v) { return Math.round(clamp(v + a, 0, 1) * 255); }); return 'rgb(' + c.join(',') + ')'; }

  function initWheel() {
    var cv = document.getElementById('wheel3d'); if (!cv) return;
    var E; try { E = new Engine(cv, { fov: .5, eye: [0, .55, 8.4], target: [0, .05, 0], dpr: COARSE ? 1.5 : 2 }); } catch (e) { return; }
    var tilt = E.group(null, [0, 0, 0], [-.22, 0, 0]), spin = E.group(tilt);
    var tex = E.texture(wheelTexture());
    E.add(E.mesh(disc(1.62, 96)), { col: [1, 1, 1], rough: .45, tex: tex }, spin, [0, 0, .07]);
    E.add(E.mesh(cyl(1.7, 1.7, .16, 96, false)), { col: srgb('#2a1160'), rough: .5 }, spin, [0, 0, 0], [Math.PI/2, 0, 0]);
    E.add(E.mesh(torus(1.68, .1, 18, 120)), MAT.gold, tilt, [0, 0, .06], [Math.PI/2, 0, 0]);
    var pegG = E.mesh(cyl(.035, .035, .16, 12, true));
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 + Math.PI / 8; E.add(pegG, MAT.gold, spin, [Math.cos(a) * 1.5, Math.sin(a) * 1.5, .14], [Math.PI/2, 0, 0]); }
    var bulbs = [], bG = E.mesh(sphere(.055, 14, 10));
    for (var j = 0; j < 24; j++) { var b = j / 24 * Math.PI * 2, m = { col: srgb('#fff1c2'), rough: .1, emit: .2 }; E.add(bG, m, tilt, [Math.cos(b) * 1.68, Math.sin(b) * 1.68, .17]); bulbs.push(m); }
    // hub = a gold crown coin
    var hub = E.group(tilt, [0, 0, .12]);
    E.add(E.mesh(cyl(.34, .38, .1, 48, true)), MAT.gold, hub, [0, 0, 0], [Math.PI/2, 0, 0]);
    E.add(E.mesh(disc(.33, 48)), { col: [1, 1, 1], rough: .3, metal: .4, emit: .16, tex: E.texture(coinTexture()) }, hub, [0, 0, .056]);
    // pointer
    var ptr = E.group(tilt, [0, 1.82, .22]);
    E.add(E.mesh(cyl(0, .17, .38, 4, true)), { col: srgb('#ff3b6b'), rough: .25, emit: .1 }, ptr, [0, -.05, 0], [Math.PI, Math.PI/4, 0], [1, 1, .5]);
    E.add(E.mesh(sphere(.12, 20, 14)), MAT.gold, ptr, [0, .17, 0]);
    var P = E.points(90), sp = []; P.count = 0;

    var btn = document.getElementById('spinBtn'), out = document.getElementById('spinOut');
    var ang = 0, from = 0, to = 0, t0 = 0, dur = 4600, busy = false, tick = 0, lastPeg = 0, mx = 0, my = 0, vis = true;
    cv.parentNode.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1); my = clamp(-((e.clientY - r.top) / r.height * 2 - 1), -1, 1); });
    function go() {
      if (busy) return; busy = true; btn.disabled = true; out.textContent = 'Spinning…';
      var k = Math.floor(Math.random() * SEG.length), cur = ((ang % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
      var target = k * (Math.PI * 2 / SEG.length); // segment k sits at the top when spin angle == k*step
      from = ang; to = ang + (Math.PI * 2) * (RM ? 1 : 6) + ((target - cur) + Math.PI*2) % (Math.PI*2) + (Math.random() - .5) * .35;
      t0 = performance.now(); dur = RM ? 10 : 4600; spin.k = k;
    }
    btn && btn.addEventListener('click', go); cv.addEventListener('click', go);
    var running = true, last = performance.now();
    function frame(now) {
      if (!running) return;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      if (busy) {
        var t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 4); ang = lerp(from, to, e);
        var peg = Math.floor((ang + Math.PI / 8) / (Math.PI / 4)); if (peg !== lastPeg) { lastPeg = peg; tick = 1; }
        if (t >= 1) {
          busy = false; btn.disabled = false; var s = SEG[spin.k][0];
          out.textContent = 'Demo result: ' + s + '. Claim your real daily spin after you sign up.';
          sp = []; for (var q = 0; q < P.max; q++) { var a2 = Math.random() * Math.PI * 2, v = .02 + Math.random() * .05; sp.push({ x: 0, y: 1.6, z: .5, vx: Math.cos(a2) * v, vy: Math.sin(a2) * v + .03, life: 0, c: Math.random() < .6 ? [1, .75, .25] : [.75, .5, 1] }); }
        }
      }
      tick = Math.max(0, tick - dt * 6);
      spin.r = [0, 0, ang];
      ptr.r = [0, 0, Math.sin(tick * Math.PI) * -.35];
      tilt.r = [-.22 - my * .08, mx * .18, 0];
      var tt = now / 1000; bulbs.forEach(function (m, i) { var on = busy ? ((i + Math.floor(tt * 14)) % 3 === 0) : (Math.sin(tt * 2 + i * .7) > .2); m.emit = on ? 2.4 : .25; });
      P.count = sp.length;
      for (var i = 0; i < sp.length; i++) { var s2 = sp[i]; s2.life += dt; s2.vy -= .0018; s2.x += s2.vx; s2.y += s2.vy; P.pos[i*3] = s2.x; P.pos[i*3+1] = s2.y; P.pos[i*3+2] = s2.z; P.size[i] = .14 * Math.max(0, 1 - s2.life / 1.8); P.col[i*3] = s2.c[0]; P.col[i*3+1] = s2.c[1]; P.col[i*3+2] = s2.c[2]; }
      if (sp.length && sp[0].life > 1.8) sp = [];
      E.render(P);
      if (vis || busy) requestAnimationFrame(frame); else running = false;
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }).observe(cv);
    requestAnimationFrame(frame);
    window.__wheel = { go: go };
  }

  function boot() { initWheel(); }
  if (document.fonts && document.fonts.load) Promise.race([document.fonts.load('bold 40px Adventor'), new Promise(function (r) { setTimeout(r, 1200); })]).then(boot, boot);
  else boot();
})();
