let THREE;
try{THREE=await import('./vendor/three.module.js')}
catch{THREE=await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js')}

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, .1, 100);
camera.position.z = 16;
const clock = new THREE.Clock();
const group = new THREE.Group();
scene.add(group);
const MAX = 9000;
const positions = new Float32Array(MAX*3);
const sizes = new Float32Array(MAX);
const phases = new Float32Array(MAX);
const hues = new Float32Array(MAX);
const random = (a,b)=>a+Math.random()*(b-a);
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
geometry.setAttribute('aPhase',new THREE.BufferAttribute(phases,1));
geometry.setAttribute('aHue',new THREE.BufferAttribute(hues,1));
const uniforms={uTime:{value:0},uExpand:{value:1},uHue:{value:.68},uRotationHue:{value:0},uPixelRatio:{value:Math.min(devicePixelRatio,2)}};
const material = new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`attribute float aSize; attribute float aPhase; attribute float aHue; uniform float uTime; uniform float uExpand; uniform float uPixelRatio; varying float vHue; varying float vAlpha; void main(){vec3 p=position*uExpand; p.x+=sin(uTime*.38+aPhase)*.055; p.y+=cos(uTime*.3+aPhase*1.7)*.055; vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=min(38.,aSize*uPixelRatio*(24./-mv.z)); vHue=aHue; vAlpha=clamp(1.4+mv.z*.025,.45,1.);}`,
  fragmentShader:`uniform float uHue; uniform float uRotationHue; varying float vHue; varying float vAlpha; vec3 hsl2rgb(vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);rgb=rgb*rgb*(3.-2.*rgb);return c.z+c.y*(rgb-.5)*(1.-abs(2.*c.z-1.));} void main(){float d=length(gl_PointCoord-.5)*2.; float core=exp(-d*d*19.); float halo=exp(-d*d*4.)*.42; float alpha=(core+halo)*vAlpha; if(alpha<.015)discard; vec3 color=hsl2rgb(vec3(fract(uHue+uRotationHue+vHue),.92,.68)); color+=vec3(.22,.22,.28)*core; gl_FragColor=vec4(color,alpha*.78);}`});
const particles=new THREE.Points(geometry,material); group.add(particles);

// Faint fixed stars give the viewport depth without competing with the active sculpture.
const bgCount=700,bgPositions=new Float32Array(bgCount*3),bgColors=new Float32Array(bgCount*3);
for(let i=0;i<bgCount;i++){bgPositions[i*3]=random(-20,20);bgPositions[i*3+1]=random(-12,12);bgPositions[i*3+2]=random(-17,-3);const v=random(.16,.6);bgColors.set([v*.65,v*.72,v],i*3)}
const bgGeo=new THREE.BufferGeometry();bgGeo.setAttribute('position',new THREE.BufferAttribute(bgPositions,3));bgGeo.setAttribute('color',new THREE.BufferAttribute(bgColors,3));
const bg=new THREE.Points(bgGeo,new THREE.PointsMaterial({size:.024,vertexColors:true,transparent:true,opacity:.8,depthWrite:false}));scene.add(bg);

const state={preset:'nebula',density:72,base:'#8a83ff',targetX:.24,targetY:.3,expand:1,targetExpand:1,manualExpand:1,zoom:16,handActive:false,drag:false,lastX:0,lastY:0};
const color=new THREE.Color();
function setColor(hex){state.base=hex;color.set(hex);const hsl={h:0,s:0,l:0};color.getHSL(hsl);uniforms.uHue.value=hsl.h;document.querySelector('#baseColor').value=hex;document.querySelector('#colorValue').textContent=hex.toUpperCase();document.querySelectorAll('.swatch').forEach(el=>el.classList.toggle('selected',el.dataset.color===hex));}
function addPoint(i,x,y,z,size,hue){let j=i*3;positions[j]=x;positions[j+1]=y;positions[j+2]=z;sizes[i]=size;phases[i]=random(0,6.283);hues[i]=hue;}
function makeNebula(){
  for(let i=0;i<MAX;i++){
    let x,y,z,hue;
    if(i%10<6){
      // Volume-filling gas: every depth slice contains particles, not just a flat spiral.
      const a=random(0,Math.PI*2),u=random(-1,1),r=4.2*Math.cbrt(Math.random()),flat=Math.sqrt(1-u*u);
      x=Math.cos(a)*flat*r;
      y=Math.sin(a)*flat*r*.86;
      z=u*r*.83;
      hue=random(-.13,.15);
    }else{
      // Bright filaments curl through the gas in all three dimensions.
      const arm=i%4,t=Math.pow(Math.random(),.7),a=t*9+arm*Math.PI/2+random(-.23,.23),r=.35+t*4;
      x=Math.cos(a)*r+random(-.22,.22);
      y=Math.sin(a)*r*.78+random(-.3,.3);
      z=Math.sin(a*.68+arm)*1.8*t+random(-.65,.65);
      hue=random(-.07,.19);
    }
    addPoint(i,x,y,z,random(1.15,3.4),hue);
  }
}
function makeSaturn(){for(let i=0;i<MAX;i++){if(i<MAX*.35){const u=random(-1,1),a=random(0,Math.PI*2),r=Math.sqrt(1-u*u),shell=2.05+random(-.16,.16);addPoint(i,Math.cos(a)*r*shell,Math.sin(a)*r*shell, u*r*shell,random(1.5,3.5),random(-.055,.09));}else{const a=random(0,Math.PI*2),r=random(2.55,5.15),thickness=random(-.1,.1);addPoint(i,Math.cos(a)*r,Math.sin(a)*r*.31+thickness,Math.sin(a)*r*.55+thickness,random(1.2,3.1),random(-.12,.14));}}}
function makeFlower(){for(let i=0;i<MAX;i++){const petal=i%7,a=petal*Math.PI*2/7,dist=Math.pow(Math.random(),.58)*4.15,spread=(1-dist/5)*random(-.36,.36);const x=Math.cos(a+spread)*dist,y=Math.sin(a+spread)*dist,z=Math.sin(dist*1.4)*.8+Math.cos(spread*4)*.45+random(-.25,.25);addPoint(i,x,y,z,random(1.2,3.5),random(-.12,.16));}}
function makeFireworks(){const bursts=[[0,0,0],[2.3,1.5,-1],[-2.5,1.7,-1],[-1.9,-1.7,-.6],[2.1,-1.8,-.8]];for(let i=0;i<MAX;i++){const b=bursts[i%bursts.length],a=random(0,Math.PI*2),u=random(-1,1),r=Math.sqrt(1-u*u),dist=Math.pow(Math.random(),.3)*random(1.15,2.2);addPoint(i,b[0]+Math.cos(a)*r*dist,b[1]+Math.sin(a)*r*dist,b[2]+u*dist,random(1.1,3.8),random(-.12,.18));}}
function makeHeart(){
  // Rejection sampling fills the implicit 3D heart volume, including its centre.
  for(let i=0;i<MAX;i++){
    let x,y,z,f;
    do{
      x=random(-1.3,1.3);y=random(-.9,.9);z=random(-1.2,1.25);
      const q=x*x+2.25*y*y+z*z-1;
      f=q*q*q-x*x*z*z*z-.1125*y*y*z*z*z;
    }while(f>0);
    addPoint(i,x*3.4,z*3.4,y*3.4,random(1.2,3.35),random(-.045,.12));
  }
}
const builders={nebula:makeNebula,saturn:makeSaturn,flower:makeFlower,fireworks:makeFireworks,heart:makeHeart};
const names={nebula:'NEBULA / 星云',saturn:'SATURN / 土星',flower:'BLOOM / 花朵',fireworks:'FIREWORKS / 烟花',heart:'HEART / 爱心'};
function updateDensity(){geometry.setDrawRange(0,Math.round(MAX*state.density/100));document.querySelector('#densityValue').textContent=state.density+'%';const slider=document.querySelector('#density');slider.style.background=`linear-gradient(90deg,#7972dd 0%,#aca5ff ${state.density}%,#30344f ${state.density}%)`;}
function setPreset(preset){state.preset=preset;builders[preset]();if(preset==='heart'&&!state.handActive){state.targetX=0;state.targetY=0}geometry.attributes.position.needsUpdate=true;geometry.attributes.aSize.needsUpdate=true;geometry.attributes.aPhase.needsUpdate=true;geometry.attributes.aHue.needsUpdate=true;geometry.computeBoundingSphere();updateDensity();document.querySelectorAll('.preset').forEach(el=>{const active=el.dataset.preset===preset;el.classList.toggle('active',active);el.setAttribute('aria-pressed',active)});document.querySelector('#activeName').textContent=names[preset];document.querySelector('.stage-label span:last-child').textContent=String(Object.keys(builders).indexOf(preset)+1).padStart(2,'0')+' / 05';}
document.querySelectorAll('.preset').forEach(el=>el.addEventListener('click',()=>setPreset(el.dataset.preset)));
document.querySelectorAll('.swatch').forEach(el=>el.addEventListener('click',()=>setColor(el.dataset.color)));
document.querySelector('#baseColor').addEventListener('input',e=>setColor(e.target.value));
document.querySelector('#density').addEventListener('input',e=>{state.density=Number(e.target.value);updateDensity()});
const spreadSlider=document.querySelector('#spread');
function updateSpread(){
  const value=Number(spreadSlider.value);
  state.manualExpand=value/100;
  if(!state.handActive)state.targetExpand=state.manualExpand;
  document.querySelector('#spreadValue').textContent=value+'%';
  const fill=(value-55)/(430-55)*100;
  spreadSlider.style.background=`linear-gradient(90deg,#7972dd 0%,#aca5ff ${fill}%,#30344f ${fill}%)`;
}
spreadSlider.addEventListener('input',updateSpread);
updateSpread();
canvas.addEventListener('pointerdown',e=>{state.drag=true;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!state.drag||state.handActive)return;state.targetY+=(e.clientX-state.lastX)*.007;state.targetX+=(e.clientY-state.lastY)*.007;state.lastX=e.clientX;state.lastY=e.clientY});
canvas.addEventListener('pointerup',()=>state.drag=false);canvas.addEventListener('pointercancel',()=>state.drag=false);
canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=THREE.MathUtils.clamp(state.zoom+Math.sign(e.deltaY)*.7,10,23)},{passive:false});
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=state.zoom;camera.updateProjectionMatrix();uniforms.uPixelRatio.value=Math.min(devicePixelRatio,2)}
addEventListener('resize',resize);resize();setColor(state.base);setPreset('nebula');

let frames=0,lastFps=performance.now();
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();uniforms.uTime.value=t;state.expand=THREE.MathUtils.lerp(state.expand,state.targetExpand,.055);uniforms.uExpand.value=state.expand;const autoX=state.preset==='heart'?.025*Math.sin(t*.2):Math.sin(t*.18)*.06;const autoY=state.preset==='heart'?.08*Math.sin(t*.18):t*.035;group.rotation.x=THREE.MathUtils.lerp(group.rotation.x,state.targetX+autoX,.045);group.rotation.y=THREE.MathUtils.lerp(group.rotation.y,state.targetY+autoY,.04);group.rotation.z=state.preset==='heart'?0:Math.sin(t*.12)*.055;uniforms.uRotationHue.value=group.rotation.y/(Math.PI*2)*.42+group.rotation.x/(Math.PI*2)*.12;camera.position.z=THREE.MathUtils.lerp(camera.position.z,state.zoom,.08);bg.rotation.y=t*.0015;renderer.render(scene,camera);frames++;if(performance.now()-lastFps>1000){document.querySelector('#fps').textContent=Math.round(frames*1000/(performance.now()-lastFps))+' FPS';frames=0;lastFps=performance.now()}}
animate();

const video=document.querySelector('#camera'),overlay=document.querySelector('#handOverlay'),ctx=overlay.getContext('2d');
const cameraButton=document.querySelector('#cameraButton'),cameraStatus=document.querySelector('#cameraStatus'),handStatus=document.querySelector('#handStatus');
let stream=null,tracker=null,tracking=false,trackTimer=0,trackingErrors=0;
const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function drawHand(points){overlay.width=overlay.clientWidth*2;overlay.height=overlay.clientHeight*2;ctx.clearRect(0,0,overlay.width,overlay.height);if(!points)return;ctx.strokeStyle='rgba(164,158,255,.85)';ctx.lineWidth=2;links.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(points[a].x*overlay.width,points[a].y*overlay.height);ctx.lineTo(points[b].x*overlay.width,points[b].y*overlay.height);ctx.stroke()});ctx.fillStyle='#e3dfff';[0,4,8,12,16,20].forEach(i=>{ctx.beginPath();ctx.arc(points[i].x*overlay.width,points[i].y*overlay.height,3,0,Math.PI*2);ctx.fill()})}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)}
function failCamera(error){
  console.error('摄像头或手势识别失败',error);
  stopCamera();
  cameraStatus.textContent='连接失败';
  cameraButton.querySelector('span:nth-child(2)').textContent='重试摄像头';
  const messages={NotAllowedError:'请允许浏览器使用摄像头后重试',NotFoundError:'未找到摄像头设备',NotReadableError:'摄像头正被其他应用占用',OverconstrainedError:'当前摄像头不支持所需设置'};
  handStatus.textContent=error?.name==='NotAllowedError'&&/system/i.test(error.message)
    ?'系统已禁止摄像头，请在隐私设置中允许浏览器访问'
    :messages[error?.name]||error?.message||'请检查摄像头后重试';
}
async function waitForVideo(){
  if(video.readyState>=2&&video.videoWidth>0)return;
  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{cleanup();reject(new Error('摄像头没有返回画面，请检查设备后重试'))},10000);
    const onFrame=()=>{if(video.videoWidth>0){cleanup();resolve()}};
    const onError=()=>{cleanup();reject(new Error('无法播放摄像头画面'))};
    const cleanup=()=>{clearTimeout(timeout);video.removeEventListener('loadeddata',onFrame);video.removeEventListener('error',onError)};
    video.addEventListener('loadeddata',onFrame);video.addEventListener('error',onError);
  });
}
async function createHandTracker(bundle,wasmPath,modelPath){
  const vision=await import(bundle);
  const files=await vision.FilesetResolver.forVisionTasks(wasmPath);
  const options={baseOptions:{modelAssetPath:modelPath,delegate:'GPU'},runningMode:'VIDEO',numHands:1};
  try{return await vision.HandLandmarker.createFromOptions(files,options)}
  catch(gpuError){
    console.warn('GPU 手势识别不可用，改用 CPU',gpuError);
    options.baseOptions.delegate='CPU';
    return await vision.HandLandmarker.createFromOptions(files,options);
  }
}
async function startCamera(){
  cameraButton.disabled=true;
  cameraButton.querySelector('span:nth-child(2)').textContent='正在准备…';
  cameraStatus.textContent='正在加载手势识别';
  handStatus.textContent='首次启动可能需要几秒钟';
  try{
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('请通过 HTTPS 或 localhost 打开此页面');
    try{
      tracker=await createHandTracker(
        './vendor/vision_bundle.js',
        new URL('./vendor/wasm',import.meta.url).href,
        new URL('./vendor/hand_landmarker.task',import.meta.url).href
      );
    }catch(localError){
      console.warn('本地手势资源不可用，改用在线资源',localError);
      tracker=await createHandTracker(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/+esm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
      );
    }
    cameraStatus.textContent='等待摄像头授权';
    cameraButton.querySelector('span:nth-child(2)').textContent='正在连接…';
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:640},height:{ideal:480}},audio:false});
    const track=stream.getVideoTracks()[0];
    if(!track||track.readyState!=='live')throw new Error('摄像头未能启动');
    track.addEventListener('ended',()=>{if(tracking)failCamera(new Error('摄像头已断开，请重试'))},{once:true});
    video.srcObject=stream;
    await video.play();
    await waitForVideo();
    // A decoded frame must pass through the model before connection is reported as ready.
    tracker.detectForVideo(video,performance.now());
    trackTimer=performance.now();trackingErrors=0;tracking=true;
    document.querySelector('#cameraPlaceholder').style.display='none';
    cameraButton.disabled=false;
    cameraButton.querySelector('span:nth-child(2)').textContent='关闭摄像头';
    cameraButton.querySelector('.button-icon').textContent='◌';
    cameraStatus.textContent='已连接 · 寻找手部';
    handStatus.textContent='将手放入摄像头画面中';
    requestAnimationFrame(trackHand);
  }catch(error){failCamera(error)}
}
function trackHand(){
  if(!tracking||!tracker)return;
  const now=performance.now();
  if(video.readyState>=2&&now-trackTimer>33){
    trackTimer=now;
    try{
      const hand=tracker.detectForVideo(video,now).landmarks?.[0];
      trackingErrors=0;drawHand(hand);
      if(hand){
        const fingerTips=[8,12,16,20],knuckles=[5,9,13,17];
        const openness=fingerTips.reduce((sum,tip,i)=>sum+distance(hand[tip],hand[0])/Math.max(.001,distance(hand[knuckles[i]],hand[0])),0)/4;
        const fullSpread=Math.max(3.2,camera.aspect*2.4);
        state.targetExpand=.55+(fullSpread-.55)*THREE.MathUtils.smoothstep(openness,1.05,1.75);
        state.targetY=(.5-hand[8].x)*3.6;
        state.targetX=(hand[8].y-.5)*2.2;
        state.handActive=true;
        cameraStatus.textContent='手势已识别';
        handStatus.textContent='张合手掌调整扩散 · 移动食指旋转';
        document.querySelector('#gestureHint').textContent='张开手掌使粒子扩散至整个画面';
      }else{
        state.handActive=false;state.targetExpand=state.manualExpand;
        cameraStatus.textContent='已连接 · 寻找手部';
        handStatus.textContent='将手放入摄像头画面中';
      }
    }catch(error){
      if(++trackingErrors>=3){failCamera(new Error('手势识别中断，请重试'));return}
      console.warn('手势识别暂时中断',error);
    }
  }
  requestAnimationFrame(trackHand);
}
function stopCamera(){
  tracking=false;state.handActive=false;state.targetExpand=state.manualExpand;drawHand(null);
  if(tracker){tracker.close();tracker=null}
  if(stream){stream.getTracks().forEach(track=>track.stop());stream=null}
  video.srcObject=null;
  document.querySelector('#cameraPlaceholder').style.display='flex';
  cameraButton.disabled=false;
  cameraButton.querySelector('span:nth-child(2)').textContent='开启摄像头';
  cameraButton.querySelector('.button-icon').textContent='◉';
  cameraStatus.textContent='等待连接';
  handStatus.textContent='开启摄像头，体验手势互动';
  document.querySelector('#gestureHint').textContent='拖动画面旋转 · 滚轮缩放';
}
cameraButton.addEventListener('click',()=>stream?stopCamera():startCamera());

