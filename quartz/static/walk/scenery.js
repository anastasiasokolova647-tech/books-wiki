/* Local scenic renderer: rigid land scenery with travelling shore waves.
   No network services or response data are involved. Static-image fallback. */
(() => {
  const canvas = document.getElementById('scenery');
  const backdrop = document.getElementById('landscape');
  const files = {forest:'assets/forest.webp',field:'assets/field.webp',sea:'assets/beach.webp'};
  const kinds = {forest:0,field:1,sea:2};
  const media = path => window.TEA_MEDIA?.[path] || path;
  let gl;
  try { gl = canvas.getContext('webgl', {alpha:false, antialias:false, powerPreference:'low-power'}); } catch {}
  let moving = false, time = 0, last = 0, raf = 0, token = 0, active = null, previous = null, fade = 1;
  const cache = new Map();
  let program, uniforms, ctx2d=null;
  const viewCanvas=document.createElement("canvas"),viewContext=viewCanvas.getContext("2d",{alpha:false});
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision mediump float;
    varying vec2 uv; uniform sampler2D beforeTex; uniform sampler2D afterTex;
    uniform float beforeKind; uniform float afterKind; uniform float clock; uniform float fade;
    uniform vec2 resolution;
    vec4 scenicView(sampler2D tex, float kind, float progress) {
      vec2 p=uv;
      float aspect=resolution.x/resolution.y;
      if(aspect>1.5) p.y=(p.y-.5)*1.5/aspect+.5;
      else p.x=(p.x-.5)*aspect/1.5+.5;
      // A slow floating camera. The image always covers the viewport.
      float zoom=1.035+progress*.21;
      vec2 focus=kind>1.5?vec2(.76,.56):vec2(.5,.54);
      p=(p-focus)/zoom+focus;
      p.x+=sin(clock*1.3)*.0012;
      p.y+=sin(clock*2.6)*.00065;
      float x=p.x; float y=1.-p.y;
      float foam=0.;
      // Only water is deformed. Land, paths and trunks remain rigid.
      if(kind>1.5){
        float shore=1.48-1.83*y;
        float water=smoothstep(.424,.49,y)*(1.-smoothstep(shore-.045,shore+.055,x));
        float depth=smoothstep(.43,.96,y);
        float wave=y*64.-clock*1.65+x*6.;
        p.x+=(sin(wave)*.004+sin(y*137.-clock*2.2)*.0015)*depth*water;
        p.y+=(sin(wave)*.006+sin(x*36.+y*94.-clock*2.)*.002)*depth*water;
        float edge=x-shore;
        float surge=sin(clock*.8-y*4.)*.025;
        foam=(1.-smoothstep(.002,.011,abs(edge-surge)))*smoothstep(.47,.59,y)*(1.-smoothstep(.91,.98,y))*(.55+.45*sin(clock*.8-y*4.));
      }
      vec4 color=texture2D(tex,clamp(p,.001,.999));
      color.rgb=mix(color.rgb,vec3(.95,.91,.79),foam*.26);
      if(kind<.5){float sun=.985+.015*sin(clock*.35+uv.x*3.);color.rgb*=sun;}
      return color;
    }
    vec4 landscape(sampler2D tex,float kind){
      float phase=mod(clock,42.)/42.;
      vec4 a=scenicView(tex,kind,.18+phase*.82);
      float blend=smoothstep(.82,1.,phase);
      return mix(a,scenicView(tex,kind,max(0.,phase-.82)),blend);
    }
    void main(){gl_FragColor=mix(landscape(beforeTex,beforeKind),landscape(afterTex,afterKind),smoothstep(0.,1.,fade));}`;
  function init() {
    if (!gl) { ctx2d=canvas.getContext('2d',{alpha:false}); canvas.dataset.renderer=ctx2d?'canvas2d':'static'; if(!ctx2d)canvas.hidden=true; return false; }
    function shader(type, source) {
      const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);
      if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));
      return sh;
    }
    try {
      program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');
      gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      uniforms=Object.fromEntries(['beforeTex','afterTex','beforeKind','afterKind','clock','fade','resolution'].map(k=>[k,gl.getUniformLocation(program,k)]));
      canvas.dataset.renderer='webgl';return true;
    } catch { gl=null;canvas.hidden=true;canvas.dataset.renderer='static';return false; }
  }
  function size(){const scale=Math.min(devicePixelRatio||1,1.5,1440/innerWidth);canvas.width=Math.round(innerWidth*scale);canvas.height=Math.round(innerHeight*scale);if(gl)gl.viewport(0,0,canvas.width,canvas.height);draw();}
  function draw2d(item,alpha){
    const phase=(time%42)/42;
    const t=Math.max(0,Math.min(1,(phase-.82)/.18)),blend=t*t*(3-2*t);
    drawView2d(item,alpha,.18+phase*.82);
    if(blend>0)drawView2d(item,alpha*blend,Math.max(0,phase-.82));
  }
  function drawView2d(item,alpha,progress){
    if(!item?.image||alpha<=0)return;
    const img=item.image,w=canvas.width,h=canvas.height,ratio=w/h;
    const zoom=1.035+progress*.21;
    let sw=img.width,sh=img.height;
    if(ratio>sw/sh)sh=sw/ratio;else sw=sh*ratio;
    sw/=zoom;sh/=zoom;
    const focusX=item.kind===2?.76:.5,focusY=item.kind===2?.44:.46;
    const sx=(img.width-sw)*focusX+Math.sin(time*1.3)*img.width*.0012;
    const sy=(img.height-sh)*focusY-Math.sin(time*2.6)*img.height*.00065;
    const outputContext=ctx2d;
    if(viewCanvas.width!==w||viewCanvas.height!==h){viewCanvas.width=w;viewCanvas.height=h;}
    ctx2d=viewContext;ctx2d.globalAlpha=1;
    // Small image patches keep trunks, horizon and dry sand anchored while
    // foliage and water move independently. Work in source-image coordinates.
    const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
    if(item.kind!==2){
      ctx2d.drawImage(img,sx,sy,sw,sh,0,0,w,h);
    }else{
    const cols=24,rows=64;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const x=(sx+sw*(i+.5)/cols)/img.width,y=(sy+sh*(j+.5)/rows)/img.height;
      let dx=0,dy=0;
      {
        const shore=1.48-1.83*y;
        const water=smooth(.424,.49,y)*(1-smooth(shore-.045,shore+.055,x));
        const depth=smooth(.43,.96,y),wave=y*64-time*1.65+x*6;
        dx=(Math.sin(wave)*.004+Math.sin(y*137-time*2.2)*.0015)*depth*water;
        dy=-(Math.sin(wave)*.006+Math.sin(x*36+y*94-time*2)*.002)*depth*water;
      }
      ctx2d.drawImage(img,sx+sw*i/cols+dx*img.width,sy+sh*j/rows+dy*img.height,sw/cols,sh/rows,w*i/cols,h*j/rows,w/cols+.6,h/rows+.6);
    }
    }
    if(item.kind===2){
      // A soft foam edge advances and retreats along the existing shoreline.
      ctx2d.save();ctx2d.globalAlpha=.22;ctx2d.strokeStyle='#eee4cb';ctx2d.lineWidth=Math.max(1,w*.002);ctx2d.shadowColor='#eee4cb';ctx2d.shadowBlur=3;
      ctx2d.beginPath();
      for(let k=0;k<=80;k++){
        const y=.51+k/80*.42;
        const x=1.48-1.83*y+Math.sin(time*.8-y*4)*.025+Math.sin(y*85-time)*.002;
        const px=(x*img.width-sx)/sw*w,py=(y*img.height-sy)/sh*h;
        if(k===0)ctx2d.moveTo(px,py);else ctx2d.lineTo(px,py);
      }
      ctx2d.stroke();ctx2d.restore();
    }
    ctx2d=outputContext;ctx2d.globalAlpha=alpha;ctx2d.drawImage(viewCanvas,0,0);ctx2d.globalAlpha=1;
  }
  function draw(){if(!active)return;if(!gl){if(ctx2d){if(fade<1)draw2d(previous||active,1);draw2d(active,fade);}return;}gl.useProgram(program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,(previous||active).texture);gl.uniform1i(uniforms.beforeTex,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,active.texture);gl.uniform1i(uniforms.afterTex,1);gl.uniform1f(uniforms.beforeKind,(previous||active).kind);gl.uniform1f(uniforms.afterKind,active.kind);gl.uniform1f(uniforms.clock,time);gl.uniform1f(uniforms.fade,fade);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.drawArrays(gl.TRIANGLES,0,6);}
  function tick(now){raf=0;const delta=last?Math.min((now-last)/1000,.05):0;last=now;if(moving)time+=delta;fade=Math.min(1,fade+delta*.65);draw();if(moving||fade<1)raf=requestAnimationFrame(tick);}
  function schedule(){if(!raf){last=0;raf=requestAnimationFrame(tick);}}
  function load(scene){if(cache.has(scene))return cache.get(scene);const promise=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{if(!gl)return resolve({image:img,kind:kinds[scene]});const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);resolve({texture,image:img,kind:kinds[scene]});};img.onerror=reject;img.src=media(files[scene]);});cache.set(scene,promise);return promise;}
  async function setScene(scene){if(!files[scene])return;const request=++token;const path=media(files[scene]);canvas.dataset.scene=scene;
    if(!gl&&!ctx2d){backdrop.style.backgroundImage=`url('${path}')`;return;}
    try{const next=await load(scene);if(request!==token||!next)return;previous=active||next;active=next;fade=moving&&previous!==active?0:1;backdrop.style.backgroundImage=`url('${path}')`;draw();schedule();}
    catch {canvas.hidden=true;backdrop.style.backgroundImage=`url('${path}')`;canvas.dataset.renderer='static';}
  }
  function setMotion(enabled){moving=enabled;canvas.dataset.motion=String(enabled);if(moving)schedule();else {if(raf)cancelAnimationFrame(raf);raf=0;last=0;fade=1;draw();}}
  init();size();window.addEventListener('resize',size);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();setMotion(false);gl=null;canvas.hidden=true;canvas.dataset.renderer='static';});
  window.TeaLandscape={setScene,setMotion};
})();
