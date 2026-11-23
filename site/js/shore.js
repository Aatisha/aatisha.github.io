// Footer (index.html): a beach seen from above, painted with a palette knife. The sea fills the top of
// the footer and the sand the bottom. The waves behave like a real shore: a broken wave rolls in as a line
// of whitewater, runs up the sand fast, slows to a stop and slides back. As it drains it leaves glossy wet
// sand that darkens and dries, a faint line of bubbles where it stopped, and lacy foam that thins out on
// the water. No two waves are alike: some reach further, they arrive at uneven intervals and reach parts
// of the beach a moment apart.
//
// The water and sand are one WebGL shader, painted in long knife strokes with thick, lit foam. On top, an
// SVG layer holds a few things seen from above, kept sparse: two umbrellas with their shadows, two boards,
// someone sunbathing, a surfer and two swimmers. The interactions are small: umbrellas turn in the breeze
// when you hover and spin when clicked, boards shift, swimmers drift away from the cursor and duck under
// when clicked, the surfer pops up and rides in, tapping the water makes ripples, and tapping the sand
// leaves a shell.
//
// It starts only when the footer is near and stops while it's off screen. With reduced motion the
// scene is a still painting.
(() => {
  const root = document.querySelector('.shore');
  const stage = root && root.querySelector('.shore__scene');
  if (!stage) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // The shoreline, in units of the footer's height (y down from the top, x across): the same curve as
  // in the shader, so things in the water stay in the water and things on the sand stay dry.
  const shoreY = (x) => 0.56 + 0.035 * Math.sin(x * 1.7 + 0.6) + 0.018 * Math.sin(x * 4.3 + 1.1);

  // ---------- The painted sea and sand ----------
  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const FRAG = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
vec2 hash2(vec2 p){return vec2(hash(p),hash(p+19.19));}
float h1(float n){return fract(sin(n*91.345+7.13)*47453.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float shoreY(float x){return .56+.035*sin(x*1.7+.6)+.018*sin(x*4.3+1.1);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}

// Sea foam: soft blotches, and thin wandering streaks (ridges of a noise field) that read as lace.
float foamField(vec2 q){
  float b=fbm(q*vec2(9.,21.));
  float r=1.-abs(2.*fbm(q*vec2(15.,38.)+3.1)-1.);
  return max(b,r*r*.95);
}
// How much of that field is white for a given amount of foam: a few streaks when there's little, solid
// when there's a lot.
float foamOf(float dens,float e){
  return smoothstep(0.,.06,dens)*smoothstep(1.-dens,1.08-dens,e);
}

// The sea's colour at a point: turquoise, lighter over the sand, darker over deeper or weedy bottom,
// with swells rolling in.
vec3 sea(vec2 q,float t){
  float depth=clamp((shoreY(q.x)-q.y)/.48,0.,1.);
  float pat=fbm(q*vec2(2.4,4.6)+vec2(3.,0.));
  vec3 c=mix(vec3(.52,.87,.84),vec3(.17,.73,.77),smoothstep(0.,.3,depth));
  c=mix(c,vec3(.05,.56,.63),smoothstep(.3,1.,depth));
  c=mix(c,vec3(.03,.43,.52),smoothstep(.55,.78,pat)*smoothstep(.2,.6,depth)*.75);
  c=mix(c,vec3(.48,.87,.86),smoothstep(.62,.85,1.-pat)*smoothstep(.1,.5,depth)*.4);
  float sw=sin((q.y+.025*sin(q.x*2.7+1.)+.03*fbm(q*3.))*46.-t*1.15);
  c*=1.+.05*sw*smoothstep(.04,.35,depth);
  return c;
}

const float P=7.4;     // seconds between waves, on average
const float RM=.14;    // how far up the sand a big wave runs, past the low-water line
const float TB=2.6;    // seconds a broken wave takes to roll in
const float SPK=.3819; // the moment a run-up stops, as a fraction of its rush up the sand (ballistic)
// The rush up the sand: fast at first, slowing to a stop (u from 0 to 1 is the whole climb).
float runup(float u){float a=pow(u*SPK,.72)*2.-1.;return 1.-a*a;}
// The slide back: it hangs at the top, then gathers speed as it drains, easing into the sea at the end.
float drainH(float u){return 1.-u*u*(3.-2.*u);}
// When, on the way back, the water drops below a given fraction of its highest point.
float drainAt(float v){return .5-sin(asin(clamp(2.*v-1.,-1.,1.))/3.);}

void main(){
  vec2 fc=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  vec2 p=fc/uRes.y;                        // y: 0 top to 1 bottom; x in the same units
  float t=uTime;
  float sy=shoreY(p.x);
  float base=sy-.03;                       // where the water sits between waves

  // ---- The swash: waves one after another, no two alike ----
  float K=floor(t/P);
  float wl=base;                           // how far up the sand the water reaches right now
  float rim=0.,sheet=0.,wash=0.,mark=0.,wet=0.,sheen=0.,bore=0.,flow=0.,strand=0.;
  float dist=clamp((base-p.y)/.26,0.,1.);  // 0 at the water's edge, 1 where the waves break
  for(int j=-3;j<=1;j++){
    float k=K+float(j);
    // Every wave has its own timing, size, angle and break: they come in sets, some close together,
    // some after a lull, each reaching one end of the beach before the other by a different amount.
    float set=.78+.42*noise(vec2(k*.37,7.3));
    float A=mix(.4,1.,h1(k+4.7))*set*(.72+.56*noise(vec2(p.x*1.6+k*5.3,k*1.7)));
    float slant=(h1(k+2.2)-.5)*1.9;
    float tau=t-(k*P+(h1(k)-.5)*P*.62)-slant*(p.x-1.5)-.45*sin(p.x*2.1+k*1.7)
             -.5*(noise(vec2(p.x*3.3+k,k*2.1))-.5);
    float cusp=noise(vec2(p.x*7.+k*3.7,k*.9))-.5;          // it reaches up the sand in tongues
    float D=4.6*sqrt(A)+.8;
    float tU=SPK*D;                                        // the climb
    float tB=(1.-SPK)*D*(.72+.62*noise(vec2(p.x*4.2+k*2.7,k*1.3)));   // the drain: quicker in places
    float Rk=A*RM*(1.+.55*cusp);
    float lr=noise(vec2(p.x*26.,k*3.1))-.5;
    float brk=.2+.1*h1(k+9.1);                            // how far out it breaks
    // The broken wave rolling in: whitewater breaking in sections with green water between, churning
    // at the front and trailing foam behind.
    if(tau>-TB&&tau<.5){
      float g=clamp(-tau/TB,0.,1.);
      float yb=base-brk*pow(g,1.3)+.01*lr+.012*(noise(vec2(p.x*5.,k))-.5);
      float on=smoothstep(1.,.8,g)*smoothstep(.22,.62,noise(vec2(p.x*3.2+k*2.3,k*1.3+g*.6)));
      float dy=p.y-yb;
      float trail=.025+.045*noise(vec2(p.x*6.+k,k*.3));
      float front=dy>0.?exp(-dy*dy/.00004):exp(dy/trail);
      bore=max(bore,on*front*(tau<0.?1.:1.-tau/.5));
    }
    // The foam it leaves on the water, thinning out.
    float passed=tau+TB*pow(dist,1./1.3);
    if(p.y<base+.02&&passed>0.) wash=max(wash,smoothstep(0.,.5,passed)*exp(-passed/3.)*(1.-dist*.55)*(1.-smoothstep(.75,1.,dist)));
    // The run-up: a foamy edge that pushes up the sand and stalls; then the water drains back unevenly,
    // in fingers, as a thinning glassy film, its foam breaking up into lace.
    if(tau>0.&&tau<tU+tB){
      float u=clamp((tau-tU)/tB,0.,1.);
      float back=tau<tU?0.:smoothstep(0.,.9,u);
      float h=tau<tU?runup(tau/tU):drainH(u);
      float edge=base+Rk*h+smoothstep(0.,.2,h)*(.008*lr
                +back*(.026*(noise(vec2(p.x*13.+k,k*5.+u*1.4))-.5)+.01*(noise(vec2(p.x*42.,k*7.+u*2.))-.5)));
      wl=max(wl,edge);
      float dk=edge-p.y;
      if(dk>-.008){
        float vr=noise(vec2(p.x*5.5+k*1.9,k*4.+back*.8));
        float w=mix(.055,.012,back)*(.35+.9*vr)*(.75+.5*noise(vec2(p.x*20.,k*4.+back)));
        rim=max(rim,smoothstep(w,w*.15,dk)*smoothstep(-.008,.004,dk)*mix(1.,.45,back)*(.45+.55*smoothstep(.15,.5,vr)));
        sheet=max(sheet,(exp(-dk/(.02+.04*vr))*(1.-back)*.8*(.4+.6*vr)+.26*(1.-tau/(tU+tB)))*smoothstep(base-.08,base,p.y)*smoothstep(0.,.6,tau));
        flow=max(flow,back*(1.-smoothstep(.85,1.,u)));
      }
    }
    // The sand it leaves: glossy, then darker, then drying; bits of foam stranded as the water slips
    // away from under them; and a line of bubbles where it stopped.
    if(tau>0.){
      float v=(p.y-base)/Rk;
      if(v>0.&&v<1.){
        float since=tau-tU-drainAt(v)*tB;
        if(since>0.){
          wet=max(wet,exp(-since/3.6));sheen=max(sheen,exp(-since/.8));
          strand=max(strand,exp(-since/.55)*(.35+.4*noise(vec2(p.x*9.+k,k*2.7))));
        }
      }
      float m=tau-tU;
      if(m>0.) mark=max(mark,exp(-pow((p.y-base-Rk-.008*lr)/.006,2.))*smoothstep(0.,.6,m)*exp(-m/2.)*.55);
    }
  }
  float d=wl-p.y;                          // > 0 in the water
  wash=max(wash*.6,.12*(1.-dist)*step(p.y,base+.01));
  // There's usually a little foam at the water's edge, in patches that come and go.
  rim=max(rim,.6*smoothstep(.026,.004,d)*smoothstep(-.008,.004,d)*smoothstep(.3,.62,noise(vec2(p.x*8.,t*.07))));

  // ---- Paint ----
  // Long strokes of mixed paint: a smooth field, stretched along the stroke direction and stepped into a
  // few tones so neighbouring strokes read as separate passes of the knife, with fine bristle marks inside.
  // The sea's strokes run along the shore and slowly shift; the sand has broad diagonal ones.
  float ang=atan(.06*cos(p.x*1.7+.6)+.077*cos(p.x*4.3+1.1))+.1*sin(p.x*1.1+p.y*2.);
  vec2 pw=rot(-ang)*p;
  vec2 warp=vec2(fbm(p*3.+vec2(0.,t*.03)),fbm(p*3.+vec2(7.,-t*.025)));
  float F=fbm(vec2(pw.x*2.4,pw.y*12.)+warp*.7+vec2(t*.01,-t*.04));
  float bandW=(floor(F*7.)+smoothstep(.3,.7,fract(F*7.)))/7.;
  float brW=noise(vec2(pw.x*5.+warp.x*3.,pw.y*130.));
  vec2 ps=rot(.42)*p;
  float Fs=fbm(vec2(ps.x*1.8,ps.y*7.)+.6*vec2(fbm(p*2.5),fbm(p*2.5+4.)));
  float bandS=(floor(Fs*6.)+smoothstep(.3,.7,fract(Fs*6.)))/6.;
  float brS=noise(vec2(ps.x*5.,ps.y*120.+Fs*8.));

  // Sand: pale and warm, a little peachy; darker where it's been wet.
  vec3 sand=mix(vec3(.93,.83,.7),vec3(.98,.935,.87),smoothstep(.25,.75,bandS));
  sand*=.98+.035*brS;
  float damp=max(wet,.55*smoothstep(base+.05,base,p.y));
  // Grain: every grain a slightly different tone, clumped a little, with the odd dark or glinting one.
  // Dry sand shows it most; wet sand is packed smooth.
  vec2 gp=fc*(600./uRes.y);
  float clump=noise(gp*.07)*.55+noise(gp*.22)*.45;
  float g1=hash(floor(gp)),g2=hash(floor(gp*.6)+17.3),g3=hash(floor(gp*.9)+5.1);
  float gr0=(g1-.5)*.75+(g2-.5)*.25;
  float dry=1.-.65*damp;
  sand*=1.+(gr0*.11+(clump-.5)*.06)*dry;
  sand*=mix(vec3(1.),mix(vec3(1.025,.995,.95),vec3(.975,.985,1.015),g2),.7*dry);
  sand=mix(sand,sand*vec3(.74,.67,.6),step(.993,g3)*(.3+.4*clump)*dry);
  sand=mix(sand,vec3(1.,.985,.95),step(g3,.01)*.45*dry);
  vec3 col=mix(sand,sand*vec3(.82,.78,.73),damp*.9);
  col=mix(col,vec3(.9,.94,.93),sheen*.32);

  // Water: turquoise in strokes. Where a wave runs over the sand it's a thin, clear film: the sand shows
  // through, tinted, with a glassy light on it as it drains, and a dark wet line just ahead of its edge.
  vec3 water=sea(p,t);
  water=mix(water*.9,mix(water,vec3(.62,.93,.9),.28),smoothstep(.3,.75,bandW));
  water*=.975+.05*brW;
  col*=1.-.05*smoothstep(-.008,0.,d)*smoothstep(.004,0.,d)*step(base,p.y);
  if(d>0.){
    float thin=smoothstep(0.,.1,d+max(0.,base-p.y)*.6);
    vec3 under=mix(sand,sand*vec3(.82,.78,.73),.9);
    vec3 film=mix(under*vec3(.86,.97,.97),vec3(.55,.86,.84),.35);
    film=mix(film,vec3(.88,.96,.95),flow*.22*(.5+.5*brW));
    col=mix(col,mix(film,water,thin),smoothstep(0.,.005,d));
  }

  // Foam: the run-up's edge, the whitewater rolling in, lace on the water, a line of bubbles on the sand,
  // and the odd whitecap further out. As the water drains the foam is drawn out into streaks down the slope.
  float drain=flow*smoothstep(base-.06,base+.01,p.y);
  vec2 lq=vec2(p.x+.003*sin(t*.4),base+(p.y-base-.55*max(0.,wl-base))*mix(1.,.5,drain)-.006*t);
  float e=foamField(lq);
  float caps=smoothstep(.8,.9,fbm(vec2(p.x*5.,p.y*16.-t*.15)))*smoothstep(.3,.7,1.-dist)*.35*step(p.y,base-.27);
  float dens=clamp(max(max(rim,bore),max(max(sheet,wash)*.85,max(max(mark*.9,strand),caps))),0.,1.);
  float foam=foamOf(dens,e)*max(smoothstep(-.02,-.004,d),max(mark,strand));
  vec3 foamCol=vec3(.985,.985,.965);
  col=mix(col,foamCol,foam*(.7+.3*dens));

  // Impasto: thick foam catches the light from the top left and throws a blue-grey shade.
  float hgt=smoothstep(0.,.3,dens)*smoothstep(.85-dens,1.25-dens,e)*max(smoothstep(-.03,0.,d),max(mark,strand));
  vec2 gr=vec2(dFdx(hgt),dFdy(hgt))*(uRes.y/600.);
  float lit=clamp((gr.x-gr.y)*.707*1.4,-.3,.8);
  col+=lit>0.?lit*vec3(.32,.32,.3):lit*vec3(.3,.22,.15)*smoothstep(.0,.025,d);   // no hard shade on the sand side of the edge

  // The sea comes out of the page gradually: at the top of the footer it's thin, pale paint that thickens
  // into the full colour over a good stretch, with a ragged, uneven edge.
  float top=p.y+.05*(F-.5)+.06*(fbm(vec2(p.x*2.2,t*.03))-.5);
  float a=smoothstep(.0,.4,top);
  a*=a*(3.-2.*a);
  col=mix(mix(col,vec3(.45,.8,.82),.3),col,smoothstep(.04,.42,top));
  gl_FragColor=vec4(col*a,a);
}`;

  let canvas, gl, uRes, uTime, raf = 0, running = false, t0 = performance.now() - 2600;
  const frozen = 15.6;   // the still frame for reduced motion: a wave partway up the sand
  function startGL() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas);
    gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl || !gl.getExtension('OES_standard_derivatives')) { stage.classList.add('is-flat'); gl = null; return false; }
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { stage.classList.add('is-flat'); gl = null; return false; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    uRes = gl.getUniformLocation(prog, 'uRes');
    uTime = gl.getUniformLocation(prog, 'uTime');
    return true;
  }
  function sizeGL() {
    if (!gl) return;
    const r = stage.getBoundingClientRect(), k = Math.min(devicePixelRatio || 1, 1.25);   // soft brushwork needs no more
    canvas.width = Math.max(1, Math.round(r.width * k));
    canvas.height = Math.max(1, Math.round(r.height * k));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    if (!running) drawGL(reduce ? frozen : (performance.now() - t0) / 1000);
  }
  function drawGL(time) {
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop(now) {
    drawGL((now - t0) / 1000);
    raf = requestAnimationFrame(loop);
  }
  function play(on) {
    if (!gl || reduce || on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
  }

  // ---------- Things on the beach, from above ----------
  // Drawn to scale with each other (an umbrella is about 2 m across, a person 1.7 m long), lit from the
  // top left like the paint below, and passed through a filter that gives them brushed edges.
  const el = (name, attrs, parent) => {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  };
  const html = (parent, markup) => { parent.insertAdjacentHTML('beforeend', markup); return parent.lastElementChild; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`; };
  const f1 = (n) => +n.toFixed(2);
  let svg, W = 0, H = 0, u = 1;

  // Limbs are two tapering segments (upper and lower) with rounded joints.
  const seg = (a, b, w, c) => `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  const limb = (s, j, e, w1, w2, c) => seg(s, j, w1, c) + seg(j, e, w2, c);
  const TORSO = 'M-6 -12C-6.6 -8.6 -4.3 -4.4 -4 -1C-4.1 1.6 -5.3 3.2 -5.1 5.2C-4.8 7.7 -2.6 9.2 0 9.2C2.6 9.2 4.8 7.7 5.1 5.2C5.3 3.2 4.1 1.6 4 -1C4.3 -4.4 6.6 -8.6 6 -12C4.6 -14.6 -4.6 -14.6 -6 -12Z';

  // Someone lying face down, head up the page. Arms folded under the head, along the sides, or
  // reaching forward to paddle (the paddling arms are their own groups so they can move).
  function lying({ skin, suit, hair, top = false, arms = 'pillow' }) {
    const legs = limb([-2.5, 7], [-3.3, 15.6], [-3.9, 23.6], 4.9, 3.3, skin) + limb([2.5, 7], [3.1, 15.6], [3.4, 23.8], 4.9, 3.3, skin);
    let armsSvg = '';
    if (arms === 'pillow') armsSvg = limb([-5.3, -11.2], [-10, -16.4], [-2.8, -20.6], 3.3, 2.6, skin) + limb([5.3, -11.2], [10, -16.4], [2.8, -20.6], 3.3, 2.6, skin);
    if (arms === 'side') armsSvg = limb([-5.4, -11], [-7.4, -3.4], [-7.6, 4], 3.3, 2.6, skin) + limb([5.4, -11], [7.4, -3.4], [7.6, 4], 3.3, 2.6, skin);
    if (arms === 'paddle') {
      const arm = limb([0, 0], [-1.4, -7.2], [-1.8, -14], 3.3, 2.6, skin);
      armsSvg = `<g transform="translate(-5.3 -11.2)"><g class="sh-arm sh-arm--l">${arm}</g></g>
        <g transform="translate(5.3 -11.2)"><g class="sh-arm sh-arm--r"><g transform="scale(-1 1)">${arm}</g></g></g>`;
    }
    return `${legs}${armsSvg}<path d="${TORSO}" fill="${skin}"/><path d="${TORSO}" fill="url(#sh-skin)"/>
      <path d="M0 -10.5V1.5" stroke="#000" stroke-opacity=".07" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M-5.25 3.2C-5.5 6.6 -3.4 9.7 0 9.7C3.4 9.7 5.5 6.6 5.25 3.2C2 4.3 -2 4.3 -5.25 3.2Z" fill="${suit}"/>
      ${top ? `<path d="M-5.3 -6.3Q0 -5 5.3 -6.3L5.1 -4.3Q0 -3 -5.1 -4.3Z" fill="${suit}"/>` : ''}
      <rect x="-1.7" y="-16.2" width="3.4" height="4.6" rx="1.3" fill="${skin}"/>
      <ellipse cy="-18" rx="3.3" ry="3.9" fill="${hair}"/>
      <ellipse cx="-1.1" cy="-19.2" rx="1.3" ry="1.7" fill="#fff" opacity=".13"/>`;
  }
  // A surfer standing, drawn the way the paintings do: upright on the page, knees bent, arms out for
  // balance, feet planted on the board.
  function standing({ skin, suit, hair }) {
    return `${limb([-2, 2.6], [-5.6, 7.4], [-4.4, 12.6], 3.4, 2.6, skin)}${limb([2, 2.6], [5.2, 7.6], [5, 12.8], 3.4, 2.6, skin)}
      ${limb([-4, -8.4], [-9, -6.4], [-13.6, -8.6], 2.7, 2.2, skin)}${limb([4, -8.4], [8.8, -10.6], [13.4, -9.4], 2.7, 2.2, skin)}
      <path d="M-4.4 -9.4C-4.8 -5 -3.6 -1.6 -3.4 1C-1.2 1.8 1.2 1.8 3.4 1C3.6 -1.6 4.8 -5 4.4 -9.4C2 -10.8 -2 -10.8 -4.4 -9.4Z" fill="${skin}"/>
      <path d="M-4.4 -9.4C-4.8 -5 -3.6 -1.6 -3.4 1C-1.2 1.8 1.2 1.8 3.4 1C3.6 -1.6 4.8 -5 4.4 -9.4C2 -10.8 -2 -10.8 -4.4 -9.4Z" fill="url(#sh-skin)"/>
      <path d="M-3.6 .2C-3.9 2.6 -3.6 4.4 -3.3 5.4L-.4 5.4L0 3.4L.4 5.4L3.3 5.4C3.6 4.4 3.9 2.6 3.6 .2C1.2 1 -1.2 1 -3.6 .2Z" fill="${suit}"/>
      <rect x="-1.4" y="-12" width="2.8" height="3.4" rx="1" fill="${skin}"/>
      <ellipse cy="-13.8" rx="3" ry="3.3" fill="${hair}"/>
      <ellipse cx="-1" cy="-14.8" rx="1.1" ry="1.4" fill="#fff" opacity=".13"/>`;
  }
  // A surfboard from above: pointed nose, widest just ahead of the middle, a squash tail; a thin stringer
  // and a lit rail.
  function boardPath(L, Wd) {
    const a = L / 2, w = Wd / 2;
    return `M0 ${-a}C${f1(w * 0.55)} ${f1(-a + L * 0.06)} ${w} ${f1(-a + L * 0.28)} ${w} ${f1(-L * 0.02)}C${w} ${f1(a - L * 0.22)} ${f1(w * 0.8)} ${f1(a - L * 0.04)} ${f1(w * 0.42)} ${a}L${f1(-w * 0.42)} ${a}C${f1(-w * 0.8)} ${f1(a - L * 0.04)} ${-w} ${f1(a - L * 0.22)} ${-w} ${f1(-L * 0.02)}C${-w} ${f1(-a + L * 0.28)} ${f1(-w * 0.55)} ${f1(-a + L * 0.06)} 0 ${-a}Z`;
  }
  const board = (fill, L, Wd, stringer = true) => `<path d="${boardPath(L, Wd)}" fill="${fill}"/>
    ${stringer ? `<path d="M0 ${-L / 2 + 2}V${L / 2 - 0.6}" stroke="#6b4a30" stroke-opacity=".22" stroke-width=".55"/>` : ''}
    <path d="M${f1(-Wd / 2 + 1.3)} ${f1(-L * 0.16)}C${f1(-Wd / 2 + 1.1)} ${f1(L * 0.1)} ${f1(-Wd / 2 + 1.6)} ${f1(L * 0.3)} ${f1(-Wd * 0.3)} ${f1(L / 2 - 1.6)}" stroke="#fff" stroke-opacity=".5" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  // A beach umbrella from above: eight panels pulled taut between the ribs, each lit by how it faces
  // the sun.
  function umbrella(a, b, r) {
    let s = '';
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2, am = (a0 + a1) / 2;
      const lit = Math.cos(am + Math.PI * 0.75);   // 1 facing the top left
      const base = i % 2 ? b : a;
      const fill = lit > 0 ? mix(base, '#ffffff', 0.16 * lit) : mix(base, '#3a2418', -0.16 * lit);
      s += `<path d="M0 0L${f1(Math.cos(a0) * r)} ${f1(Math.sin(a0) * r)}Q${f1(Math.cos(am) * r * 1.02)} ${f1(Math.sin(am) * r * 1.02)} ${f1(Math.cos(a1) * r)} ${f1(Math.sin(a1) * r)}Z" fill="${fill}"/>`;
    }
    let ribs = '';
    for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; ribs += `M0 0L${f1(Math.cos(an) * r)} ${f1(Math.sin(an) * r)}`; }
    return `${s}<path d="${ribs}" stroke="#2a1a10" stroke-opacity=".08" stroke-width=".6"/>
      <circle r="${r}" fill="url(#sh-dome)"/><circle r="2.2" fill="#efe6d8"/><circle cx="-.5" cy="-.5" r=".9" fill="#fff" opacity=".7"/>`;
  }
  const octagon = (r) => { let d = ''; for (let i = 0; i < 8; i++) { const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2, am = (a0 + a1) / 2; d += `${i ? '' : `M${f1(r)} 0`}Q${f1(Math.cos(am) * r * 1.02)} ${f1(Math.sin(am) * r * 1.02)} ${f1(Math.cos(a1) * r)} ${f1(Math.sin(a1) * r)}`; } return `<path d="${d}Z"/>`; };

  // Where everything is: x as a fraction of the width; y measured from the shoreline in footer heights
  // (negative is out to sea).
  const THINGS = {
    umbrellaA: { fx: 0.17, dy: 0.25 }, towel: { fx: 0.205, dy: 0.28 }, umbrellaB: { fx: 0.74, dy: 0.22 },
    boardA: { fx: 0.81, dy: 0.25 }, boardB: { fx: 0.838, dy: 0.27 },
    surfer: { fx: 0.34, dy: -0.25 }, swimA: { fx: 0.57, dy: -0.165 }, swimB: { fx: 0.62, dy: -0.21 },
    ball: { fx: 0.54, dy: 0.2 },
  };
  const N = {};
  const posOf = (k) => {
    const t = THINGS[k], x = t.fx * W, y = H * (shoreY(x / H) + t.dy);
    return { x, y: t.dy > 0 ? Math.min(y, H - 84 * Math.max(u, 0.8)) : y };
  };
  // Things washed up on the sand: the same shells, starfish and sand dollars that fall out of the
  // polaroids at the top of the page, scattered where the waves don't reach. `wide` ones are left out
  // on a narrow screen.
  const FINDS = [
    { fx: 0.045, dy: 0.27, kind: 'starfish', look: 0, rot: -14, size: 29 },
    { fx: 0.3, dy: 0.305, kind: 'scallop', look: 0, rot: 16, size: 25 },
    { fx: 0.4, dy: 0.235, kind: 'moon', look: 1, rot: 40, size: 20, wide: true },
    { fx: 0.47, dy: 0.32, kind: 'sandDollar', look: 0, rot: 0, size: 26 },
    { fx: 0.6, dy: 0.255, kind: 'conch', look: 0, rot: -32, size: 26, wide: true },
    { fx: 0.655, dy: 0.32, kind: 'scallop', look: 3, rot: -22, size: 21, wide: true },
    { fx: 0.925, dy: 0.245, kind: 'nautilus', look: 0, rot: 120, size: 23 },
    { fx: 0.968, dy: 0.315, kind: 'oyster', look: 0, rot: -8, size: 25, wide: true },
  ];
  const found = [];
  const findAt = (f) => { const x = f.fx * W, y = H * (shoreY(x / H) + f.dy); return { x, y: Math.min(y, H - 64 * Math.max(u, 0.8)) }; };
  let findId = 0;
  // One find, drawn `size` units across at the origin, with a soft cool shadow on the sand.
  function findArt(kind, look, rot, size) {
    const lib = window.seaShells, k = lib && lib.SHELLS[kind];
    if (!k) return '';
    const keys = Object.keys(k.looks), l = k.looks[keys[look % keys.length]];
    findId += 1;
    return `<ellipse cx="1.6" cy="1.5" rx="${f1(size * 0.4)}" ry="${f1(size * 0.34)}" fill="#3d5257" opacity=".24" filter="url(#sh-soft)"/>
      <g transform="rotate(${f1(rot)}) scale(${f1(size / 48)}) translate(-24 -26)">${k.draw(`sf${findId}-`, l)}</g>`;
  }
  const BALL_R = 9.5;
  const SKIN = { warm: '#b97a55', deep: '#8c5638', light: '#d9a27c' };
  const HEADING = { surfer: 200, swimA: -24, swimB: 152 };

  function buildThings() {
    svg = el('svg', { class: 'shore__things', 'aria-hidden': 'true' }, stage);
    html(svg, `<defs>
      <radialGradient id="sh-dome" cx=".36" cy=".34" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#2a1a10" stop-opacity=".18"/></radialGradient>
      <linearGradient id="sh-skin" x1="0" y1="0" x2="1" y2=".35"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a1e10" stop-opacity=".14"/></linearGradient>
      <filter id="sh-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter>
      <filter id="sh-paint" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".28" numOctaves="2" seed="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale=".9" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feGaussianBlur in="d" stdDeviation="1.1" result="b"/>
        <feOffset in="b" dx="-1.2" dy="-1.2" result="o"/>
        <feComposite in="d" in2="o" operator="out" result="rim"/>
        <feFlood flood-color="#2a1a10" flood-opacity=".26"/>
        <feComposite in2="rim" operator="in" result="shade"/>
        <feTurbulence type="fractalNoise" baseFrequency=".7 .3" numOctaves="2" seed="9" result="s"/>
        <feColorMatrix in="s" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .45 0 0 0 -.2" result="sw"/>
        <feComposite in="sw" in2="d" operator="in" result="streaks"/>
        <feMerge><feMergeNode in="d"/><feMergeNode in="shade"/><feMergeNode in="streaks"/></feMerge>
      </filter>
    </defs>`);
    // shadow: [markup, dx, dy, colour, opacity]
    // `drift`: a slow wander for people in the water (CSS), moving them and their shadow together.
    const thing = (key, inner, shadow, cls = '', drift = '') => {
      const g = el('g', { class: `sh-thing ${cls}`, 'data-key': key }, svg);
      const host = drift ? el('g', { class: `sh-drift ${drift}` }, g) : g;
      if (shadow) html(host, `<g class="sh-shade" transform="translate(${shadow[1]} ${shadow[2]})" fill="${shadow[3]}" stroke="${shadow[3]}" opacity="${shadow[4]}" filter="url(#sh-soft)">${shadow[0]}</g>`);
      html(host, `<g class="sh-body" filter="url(#sh-paint)">${inner}</g>`);
      return g;
    };
    const onSand = '#3d5257';
    // On the sand: a striped umbrella with someone on a towel in its shade, a teal umbrella, two boards.
    const towel = (fill, stripe) => `<rect x="-10" y="-26" width="20" height="52" rx="1.6" fill="${fill}"/>
      <path d="M-10 -19H10M-10 -16.4H10M-10 16.4H10M-10 19H10" stroke="${stripe}" stroke-width="1.6"/>`;
    const sunbather = lying({ skin: SKIN.light, suit: '#d8634a', hair: '#3b2418', top: true });
    N.towel = thing('towel', `<g transform="rotate(-9)">${towel('#f3ede2', '#3f9aa6')}<g transform="translate(0 1)">${sunbather}</g></g>`,
      [`<g transform="rotate(-9)"><rect x="-10" y="-26" width="20" height="52" rx="1.6"/></g>`, 1.6, 1.4, onSand, 0.18]);
    N.umbrellaA = thing('umbrellaA', `<g class="sh-canopy">${umbrella('#e9714f', '#f7ebdd', 26)}</g>`,
      [`${octagon(26)}<path d="M0 0L-11 -8" stroke-width="1.6"/>`, 13, 10, onSand, 0.36], 'sh-umbrella');
    N.umbrellaB = thing('umbrellaB', `<g class="sh-canopy">${umbrella('#3b9db4', '#47a9be', 25)}</g>`,
      [`${octagon(25)}<path d="M0 0L-11 -8" stroke-width="1.6"/>`, 12.5, 9.5, onSand, 0.36], 'sh-umbrella');
    N.boardA = thing('boardA', `<g class="sh-tilt" transform="rotate(24)">${board('#f4eee3', 58, 15.5)}</g>`,
      [`<g transform="rotate(24)"><path d="${boardPath(58, 15.5)}"/></g>`, 2.6, 2.2, onSand, 0.3], 'sh-board');
    N.boardB = thing('boardB', `<g class="sh-tilt" transform="rotate(31)">${board('#86cdd2', 52, 14.5, false)}</g>`,
      [`<g transform="rotate(31)"><path d="${boardPath(52, 14.5)}"/></g>`, 2.6, 2.2, onSand, 0.3], 'sh-board');
    // A beach ball: six curved panels round a white cap, lit from the top left like everything else.
    const ballArt = () => {
      const cols = ['#e8543f', '#f8f3ea', '#2f8fc4', '#f5c541', '#f8f3ea', '#3fae8c'], R = BALL_R;
      const at = (a, r) => `${f1(Math.cos(a) * r)} ${f1(Math.sin(a) * r)}`;
      let panels = '';
      for (let i = 0; i < 6; i++) {
        const a0 = (i * Math.PI) / 3, a1 = ((i + 1) * Math.PI) / 3;
        panels += `<path d="M0 0Q${at(a0 + 0.5, R * 0.6)} ${at(a0, R)}A${R} ${R} 0 0 1 ${at(a1, R)}Q${at(a1 + 0.5, R * 0.6)} 0 0Z" fill="${cols[i]}"/>`;
      }
      return `<g class="sh-ballspin">${panels}<circle r="2.3" fill="#f8f3ea"/><circle r=".8" fill="#d9cfc0"/></g>
        <circle r="${R}" fill="url(#sh-dome)"/><circle r="${R}" fill="none" stroke="#3a2a1c" stroke-opacity=".14" stroke-width=".7"/>`;
    };
    N.ball = thing('ball', ballArt(), [`<circle r="${BALL_R}"/>`, 3.2, 2.8, onSand, 0.3], 'sh-ball');

    // In the water: a surfer on a longboard, and two swimmers with rings spreading round them. Shadows on
    // the sea floor are faint.
    const surferLook = { skin: SKIN.deep, suit: '#1f4f5a', hair: '#24170f' };
    const rider = (shadow) => `<g class="sh-heading" style="transform:rotate(${HEADING.surfer}deg)">
        ${shadow ? '' : `<g class="sh-trail"><path d="M-4 31.5Q-6.5 37 -10 41M4 31.5Q6.5 37 10 41" stroke="#fff" stroke-opacity=".22" stroke-width="1.2" stroke-dasharray="4 2 3 3" stroke-linecap="round" fill="none"/></g>
        <g class="sh-wake"><path d="M-3 32Q-8 44 -17 58M3 32Q8 44 17 58" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round" fill="none"/>
          <path d="M0 33Q-1 46 -2 60" stroke="#fff" stroke-opacity=".35" stroke-width="4.5" stroke-linecap="round" fill="none"/>
          <circle cx="-12" cy="50" r="2" fill="#fff" opacity=".7"/><circle cx="10" cy="47" r="1.6" fill="#fff" opacity=".7"/><circle cx="-6" cy="58" r="1.4" fill="#fff" opacity=".6"/></g>`}
        ${shadow ? `<path d="${boardPath(62, 16)}"/>` : board('#f5efe2', 62, 16)}
        <g class="sh-lie"><g transform="translate(0 4)">${lying(shadow ? { skin: '#000', suit: '#000', hair: '#000', arms: 'paddle' } : { ...surferLook, arms: 'paddle' })}</g></g>
        <g class="sh-stand" style="opacity:0"><g transform="translate(0 2) rotate(${-HEADING.surfer})">${standing(shadow ? { skin: '#000', suit: '#000', hair: '#000' } : surferLook)}</g></g>
      </g>`;
    N.surfer = thing('surfer', rider(false), [rider(true), 4, 3.5, '#0b4a52', 0.2], 'sh-in-water', 'sh-drift--c');

    const swimmer = (skin, hair, suit, k) => {
      const under = mix(skin, '#2aa7ad', 0.62);
      const arm = limb([0, 0], [-5.4, -3], [-7.6, -9], 2.6, 2.1, under);
      return `<g class="sh-swim"><g class="sh-heading" style="transform:rotate(${HEADING[k]}deg)">
        <ellipse rx="12" ry="9" fill="#effcfa" opacity=".07"/>
        <g class="sh-ripples">
          <ellipse class="sh-ring" rx="15" ry="12" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.1" stroke-dasharray="11 4 17 6 8 5" stroke-linecap="round"/>
          <ellipse class="sh-ring sh-ring--2" rx="15" ry="12" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1" stroke-dasharray="6 5 14 4 19 7" stroke-linecap="round" transform="rotate(70)"/>
        </g>
        <g opacity=".45" filter="url(#sh-soft)">
          <path d="M-4.4 1C-4.8 6 -3.4 10 -2.6 17L-1 18L0 11L1 18L2.6 17C3.4 10 4.8 6 4.4 1Z" fill="${under}"/>
          <path d="M-4.6 1C-4.8 6 -3 8.4 0 8.4C3 8.4 4.8 6 4.6 1Z" fill="${mix(suit, '#2aa7ad', 0.5)}"/>
          <g transform="translate(-4.6 -.4)"><g class="sh-stroke sh-stroke--l">${arm}</g></g>
          <g transform="translate(4.6 -.4)"><g class="sh-stroke sh-stroke--r"><g transform="scale(-1 1)">${arm}</g></g></g></g>
        <path d="M-5.6 -.6C-5.6 2.2 -3.2 3.6 0 3.6C3.2 3.6 5.6 2.2 5.6 -.6C3 -2.4 -3 -2.4 -5.6 -.6Z" fill="${skin}"/>
        <ellipse cy="-3.4" rx="3.1" ry="3.4" fill="${hair}"/>
        <ellipse cx="-1" cy="-4.4" rx="1.1" ry="1.4" fill="#fff" opacity=".14"/>
        <path d="M-5.6 -.6C-5.6 2.2 -3.2 3.6 0 3.6C3.2 3.6 5.6 2.2 5.6 -.6C3 -2.4 -3 -2.4 -5.6 -.6Z" fill="url(#sh-skin)"/>
        <path d="M-6.4 1.4Q0 5.4 6.4 1.4" stroke="#fff" stroke-opacity=".35" stroke-width="1" fill="none" stroke-linecap="round"/>
      </g></g>`;
    };
    N.swimA = thing('swimA', swimmer(SKIN.light, '#5a3a22', '#e46f55', 'swimA'), null, 'sh-in-water sh-swimmer', 'sh-drift--a');
    N.swimB = thing('swimB', swimmer(SKIN.warm, '#20150e', '#2c5d8a', 'swimB'), null, 'sh-in-water sh-swimmer', 'sh-drift--b');
    N.swimB.querySelectorAll('.sh-swim, .sh-ring, .sh-stroke').forEach((n) => { n.style.animationDelay = '-1.9s'; });
    FINDS.forEach((f) => {
      const g = html(svg, `<g class="sh-find">${findArt(f.kind, f.look, f.rot, f.size)}</g>`);
      if (g) found.push({ ...f, g });
    });
    layout();
  }

  // Place everything for the footer's current size. Things are scaled with the footer's height.
  const offsets = {};
  function layout() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height; u = H / 518;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // On a narrow screen, fewer things, so the beach still has room to breathe.
    ['towel', 'boardB'].forEach((k) => { if (N[k]) N[k].style.display = W < 560 ? 'none' : ''; });
    Object.keys(N).forEach((k) => {
      const p = posOf(k), o = offsets[k] || { x: 0, y: 0 };
      N[k].setAttribute('transform', `translate(${(p.x + o.x * u).toFixed(1)} ${(p.y + o.y * u).toFixed(1)}) scale(${(u * 0.94).toFixed(3)})`);
    });
    found.forEach((f) => {
      const p = findAt(f);
      f.g.style.display = f.wide && W < 560 ? 'none' : '';
      f.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${u.toFixed(3)})`);
    });
  }

  // ---------- Small interactions ----------
  const toLocal = (e) => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const near = (k, x, y, rad) => { const p = posOf(k), o = offsets[k] || { x: 0, y: 0 }; return Math.hypot(p.x + o.x * u - x, p.y + o.y * u - y) < rad * u; };
  const inWater = (x, y) => y / H < shoreY(x / H) - 0.04;
  const spin = {};

  // Rings spreading on the water: broken, uneven, like the ones in a painting.
  function rings(x, y, n = 2, size = 18) {
    for (let i = 0; i < n; i++) {
      const dash = Array.from({ length: 6 }, (_, j) => (j % 2 ? 3 + Math.random() * 5 : 6 + Math.random() * 16).toFixed(1)).join(' ');
      const c = el('ellipse', { cx: x, cy: y, rx: size * u, ry: size * u * 0.78, fill: 'none', stroke: '#fff', 'stroke-width': 1.4, 'stroke-dasharray': dash, 'stroke-linecap': 'round', style: 'transform-box:fill-box;transform-origin:center' }, svg);
      c.animate([{ transform: `scale(.15) rotate(${Math.random() * 90}deg)`, opacity: 0.85 }, { transform: 'scale(1) rotate(0deg)', opacity: 0 }], { duration: 1700, delay: i * 380, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' })
        .finished.then(() => c.remove());
    }
  }
  function moveTo(k, ox, oy, ms, easing = 'out') {
    const from = { ...(offsets[k] || { x: 0, y: 0 }) }, t1 = performance.now();
    const ease = (t) => (easing === 'linear' ? t : easing === 'inout' ? (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2) : 1 - (1 - t) ** 3);
    const step = (now) => {
      const t = Math.min(1, (now - t1) / ms), e = ease(t);
      offsets[k] = { x: from.x + (ox - from.x) * e, y: from.y + (oy - from.y) * e };
      layout();
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function turnUmbrella(k, deg, ms) {
    spin[k] = (spin[k] || 0) + deg;
    const c = N[k].querySelector('.sh-canopy');
    c.style.transition = `transform ${ms}ms cubic-bezier(.2,.7,.25,1)`;
    c.style.transform = `rotate(${spin[k]}deg)`;
  }
  const heading = (k, deg, ms) => N[k].querySelectorAll('.sh-heading').forEach((h) => {
    h.style.transition = `transform ${ms}ms cubic-bezier(.45,0,.3,1)`;
    h.style.transform = `rotate(${deg}deg)`;
  });
  const busy = {};
  // The surfer pops up and rides a little way in on the whitewater, drops back to the board, turns,
  // and paddles out again.
  function surf() {
    if (busy.surfer) return;
    busy.surfer = true;
    const s = N.surfer, all = (sel, v) => s.querySelectorAll(sel).forEach((n) => { n.style.opacity = v; });
    all('.sh-lie', 0); all('.sh-stand', 1);
    s.classList.add('is-riding');
    const a = (HEADING.surfer * Math.PI) / 180, dist = 62;
    moveTo('surfer', Math.sin(a) * dist, -Math.cos(a) * dist, 2600);
    setTimeout(() => {
      all('.sh-lie', 1); all('.sh-stand', 0);
      s.classList.remove('is-riding');
      heading('surfer', HEADING.surfer - 180, 1400);
      setTimeout(() => {
        moveTo('surfer', 0, 0, 5600, 'inout');
        setTimeout(() => { heading('surfer', HEADING.surfer, 1400); setTimeout(() => { busy.surfer = false; }, 1400); }, 5600);
      }, 1200);
    }, 2900);
  }
  function dive(k) {
    if (busy[k]) return;
    busy[k] = true;
    const p = posOf(k), o = offsets[k] || { x: 0, y: 0 }, g = N[k].querySelector('.sh-body');
    rings(p.x + o.x * u, p.y + o.y * u, 2, 15);
    g.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.7)' }], { duration: 420, easing: 'ease-in', fill: 'forwards' });
    setTimeout(() => {
      const nx = o.x + (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 16), ny = Math.max(-40, Math.min(20, o.y + (Math.random() - 0.5) * 24));
      offsets[k] = { x: nx, y: ny }; layout();
      const q = posOf(k);
      rings(q.x + nx * u, q.y + ny * u, 2, 15);
      g.animate([{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 600, easing: 'ease-out', fill: 'forwards' });
      busy[k] = false;
    }, 1500);
  }
  // The beach ball: kicked away from the pointer, it hops, then rolls along the sand, spinning, slowing
  // down and bouncing off the edges of the beach.
  const ballState = { vx: 0, vy: 0, spin: 0, raf: 0 };
  function kickBall(fromX, fromY, power = 1) {
    const p = posOf('ball'), o = offsets.ball || { x: 0, y: 0 };
    let dx = p.x + o.x * u - fromX, dy = p.y + o.y * u - fromY;
    const L = Math.hypot(dx, dy) || 1;
    dx /= L; dy = (dy / L) * 0.55;
    const sp = (200 + Math.random() * 90) * power;
    ballState.vx += dx * sp; ballState.vy += dy * sp;
    if (power > 0.6) {
      const body = N.ball.querySelector('.sh-body'), shade = N.ball.querySelector('.sh-shade');
      body.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 620, easing: 'cubic-bezier(.3,.6,.4,1)' });
      shade.animate([{ transform: 'translate(3.2px, 2.8px)', opacity: 0.3 }, { transform: 'translate(10px, 9px)', opacity: 0.18, offset: 0.4 }, { transform: 'translate(3.2px, 2.8px)', opacity: 0.3 }], { duration: 620, easing: 'cubic-bezier(.3,.6,.4,1)' });
    }
    if (ballState.raf) return;
    let last = performance.now();
    const spinEl = N.ball.querySelector('.sh-ballspin');
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const base = posOf('ball'), o2 = offsets.ball || { x: 0, y: 0 };
      let nx = o2.x + ballState.vx * dt, ny = o2.y + ballState.vy * dt;
      const X = base.x + nx * u, Y = base.y + ny * u, rr = BALL_R * u;
      const xmin = rr + 4, xmax = W - rr - 4;
      if (X < xmin) { nx = (xmin - base.x) / u; ballState.vx = Math.abs(ballState.vx) * 0.6; }
      if (X > xmax) { nx = (xmax - base.x) / u; ballState.vx = -Math.abs(ballState.vx) * 0.6; }
      const ymin = H * (shoreY(X / H) + 0.1), ymax = H - 58 * Math.max(u, 0.8);
      if (base.y + ny * u < ymin) { ny = (ymin - base.y) / u; ballState.vy = Math.abs(ballState.vy) * 0.6; }
      if (base.y + ny * u > ymax) { ny = (ymax - base.y) / u; ballState.vy = -Math.abs(ballState.vy) * 0.6; }
      offsets.ball = { x: nx, y: ny };
      const v = Math.hypot(ballState.vx, ballState.vy);
      ballState.spin += ((v * dt) / BALL_R) * 57.3 * (ballState.vx >= 0 ? 1 : -1);
      spinEl.style.transform = `rotate(${ballState.spin.toFixed(1)}deg)`;
      const f = Math.exp(-dt * 1.5);
      ballState.vx *= f; ballState.vy *= f;
      layout();
      if (v > 3) ballState.raf = requestAnimationFrame(step);
      else { ballState.raf = 0; ballState.vx = ballState.vy = 0; }
    };
    ballState.raf = requestAnimationFrame(step);
  }

  const shells = [];
  function shell(x, y) {
    const lib = window.seaShells;
    if (lib) {
      const kind = lib.pickShell(), n = Object.keys(lib.SHELLS[kind].looks).length;
      const g = html(svg, `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${u.toFixed(3)})">${findArt(kind, Math.floor(Math.random() * n), Math.random() * 360, 22 + Math.random() * 6)}</g>`);
      g.animate([{ opacity: 0, transform: `translate(${x.toFixed(1)}px, ${(y - 6).toFixed(1)}px) scale(${(u * 0.8).toFixed(3)})` }, { opacity: 1, transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${u.toFixed(3)})` }], { duration: 380, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      shells.push(g);
      if (shells.length > 6) shells.shift().remove();
      return;
    }
    const tint = ['#f4d8c4', '#f1e5d2', '#efcad1'][Math.floor(Math.random() * 3)];
    const g = html(svg, `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.random() * 60 - 30).toFixed(0)}) scale(${(u * 1.5).toFixed(3)})">
      <path d="M1.6 5.4L-3.4 0Q-3 -3.2 1.6 -3.6Q6.2 -3.2 6.6 0Z" fill="#3d5257" opacity=".22" filter="url(#sh-soft)"/>
      <g filter="url(#sh-paint)"><path d="M0 4L-5 -1.5Q-4.4 -4.6 0 -5Q4.4 -4.6 5 -1.5Z" fill="${tint}"/>
      <path d="M0 4L-3.2 -3.6M0 4L-1 -4.6M0 4L1 -4.6M0 4L3.2 -3.6" stroke="#a27258" stroke-opacity=".4" stroke-width=".5"/></g></g>`);
    g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    shells.push(g);
    if (shells.length > 6) shells.shift().remove();
  }

  const last = {};
  const once = (key, ms) => { const n = performance.now(); if (n - (last[key] || 0) < ms) return false; last[key] = n; return true; };
  function onDown(e) {
    const { x, y } = toLocal(e);
    if (near('ball', x, y, BALL_R + 6)) { kickBall(x, y); return; }
    if (near('umbrellaA', x, y, 28)) { if (once('uA', 400)) turnUmbrella('umbrellaA', 200, 1800); return; }
    if (near('umbrellaB', x, y, 27)) { if (once('uB', 400)) turnUmbrella('umbrellaB', -200, 1800); return; }
    for (const k of ['boardA', 'boardB']) if (N[k].style.display !== 'none' && near(k, x, y, 24)) {
      const tilt = N[k].querySelector('.sh-tilt'), cur = +(tilt.dataset.r || 0) + (Math.random() < 0.5 ? -7 : 7);
      tilt.dataset.r = cur; tilt.style.transition = 'transform .8s cubic-bezier(.2,.7,.3,1)'; tilt.style.transform = `rotate(${cur}deg)`;
      return;
    }
    if (near('surfer', x, y, 30)) { surf(); return; }
    for (const k of ['swimA', 'swimB']) if (near(k, x, y, 15)) { dive(k); return; }
    if (N.towel.style.display !== 'none' && near('towel', x, y, 24)) return;
    if (inWater(x, y)) { if (once('ripple', 250)) rings(x, y); return; }
    for (const f of found) {
      const q = findAt(f);
      if (f.g.style.display === 'none' || Math.hypot(q.x - x, q.y - y) > 14 * u) continue;
      const art = f.g.lastElementChild, sc = f1(f.size / 48), at = (r) => `rotate(${f1(f.rot + r)}deg) scale(${sc}) translate(-24px, -26px)`;
      art.animate([{ transform: at(0) }, { transform: at(22) }, { transform: at(-9) }, { transform: at(0) }], { duration: 700, easing: 'ease-out' });
      return;
    }
    if (y / H > shoreY(x / H) + 0.05 && y < H - 56 && once('shell', 300)) shell(x, y);
  }
  function onMove(e) {
    if (!once('move', 60)) return;
    const { x, y } = toLocal(e);
    let pointer = false;
    ['umbrellaA', 'umbrellaB'].forEach((k) => {
      const over = near(k, x, y, 28);
      if (over && !N[k].dataset.hover) { N[k].dataset.hover = 1; turnUmbrella(k, k === 'umbrellaA' ? 14 : -14, 1400); }
      if (!over && N[k].dataset.hover) { delete N[k].dataset.hover; turnUmbrella(k, k === 'umbrellaA' ? -14 : 14, 1600); }
      pointer = pointer || over;
    });
    ['swimA', 'swimB'].forEach((k) => {
      const p = posOf(k), o = offsets[k] || { x: 0, y: 0 }, sx = p.x + o.x * u, sy = p.y + o.y * u, dist = Math.hypot(sx - x, sy - y);
      if (dist < 46 * u && !busy[k] && once(`drift${k}`, 900)) {
        const nx = o.x + ((sx - x) / dist) * 12, ny = Math.max(-40, Math.min(20, o.y + ((sy - y) / dist) * 8));
        moveTo(k, Math.max(-60, Math.min(60, nx)), ny, 1600);
      }
      pointer = pointer || dist < 15 * u;
    });
    if (near('ball', x, y, BALL_R + 3)) {
      pointer = true;
      if (once('nudge', 500)) kickBall(x, y, 0.35);
    }
    pointer = pointer || near('surfer', x, y, 30) || near('boardA', x, y, 24) || (N.boardB.style.display !== 'none' && near('boardB', x, y, 24));
    stage.style.cursor = pointer ? 'pointer' : '';
  }

  // ---------- Start when near; run only while on screen ----------
  let built = false;
  function build() {
    built = true;
    if (startGL()) sizeGL();
    buildThings();
    new ResizeObserver(() => { sizeGL(); layout(); }).observe(stage);
    if (!reduce) {
      stage.addEventListener('pointerdown', onDown);
      if (finePointer) {
        stage.addEventListener('pointermove', onMove);
        stage.addEventListener('pointerleave', () => { stage.style.cursor = ''; });
      }
    }
    play(visible);
  }
  let visible = false;
  const nearby = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting) && !built) { nearby.disconnect(); build(); }
  }, { rootMargin: '600px 0px' });
  nearby.observe(root);
  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    root.classList.toggle('is-idle', !visible);
    if (built) play(visible);
  }).observe(root);
  if (reduce) root.classList.add('is-still');
})();
