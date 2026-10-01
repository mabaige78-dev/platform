import * as THREE from 'three';

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

const state={preset:'nebula',density:72,base:'#8a83ff',targetX:.1,targetY:-.12,expand:1,targetExpand:1,zoom:16,handActive:false,drag:false,lastX:0,lastY:0};
const color=new THREE.Color();
function setColor(hex){state.base=hex;color.set(hex);const hsl={h:0,s:0,l:0};color.getHSL(hsl);uniforms.uHue.value=hsl.h;document.querySelector('#baseColor').value=hex;document.querySelector('#colorValue').textContent=hex.toUpperCase();document.querySelectorAll('.swatch').forEach(el=>el.classList.toggle('selected',el.dataset.color===hex));}
function addPoint(i,x,y,z,size,hue){let j=i*3;positions[j]=x;positions[j+1]=y;positions[j+2]=z;sizes[i]=size;phases[i]=random(0,6.283);hues[i]=hue;}
function makeNebula(){for(let i=0;i<MAX;i++){const arm=i%4;const t=Math.pow(Math.random(),.66);const theta=t*8.7+arm*Math.PI/2+random(-.28,.28);const radius=t*4.7;const spread=.12+t*.38;const x=Math.cos(theta)*radius+random(-spread,spread);const y=Math.sin(theta)*radius*.62+random(-spread,spread);const z=random(-.4,.4)+Math.sin(theta*1.3)*t*.68;addPoint(i,x,y,z,random(1.2,3.4),random(-.1,.16));}}
function makeSaturn(){for(let i=0;i<MAX;i++){if(i<MAX*.35){const u=random(-1,1),a=random(0,Math.PI*2),r=Math.sqrt(1-u*u),shell=2.05+random(-.16,.16);addPoint(i,Math.cos(a)*r*shell,Math.sin(a)*r*shell, u*r*shell,random(1.5,3.5),random(-.055,.09));}else{const a=random(0,Math.PI*2),r=random(2.55,5.15),thickness=random(-.1,.1);addPoint(i,Math.cos(a)*r,Math.sin(a)*r*.31+thickness,Math.sin(a)*r*.55+thickness,random(1.2,3.1),random(-.12,.14));}}}
function makeFlower(){for(let i=0;i<MAX;i++){const petal=i%7,a=petal*Math.PI*2/7,dist=Math.pow(Math.random(),.58)*4.15,spread=(1-dist/5)*random(-.36,.36);const x=Math.cos(a+spread)*dist,y=Math.sin(a+spread)*dist,z=Math.sin(dist*1.4)*.8+Math.cos(spread*4)*.45+random(-.25,.25);addPoint(i,x,y,z,random(1.2,3.5),random(-.12,.16));}}
function makeFireworks(){const bursts=[[0,0,0],[2.3,1.5,-1],[-2.5,1.7,-1],[-1.9,-1.7,-.6],[2.1,-1.8,-.8]];for(let i=0;i<MAX;i++){const b=bursts[i%bursts.length],a=random(0,Math.PI*2),u=random(-1,1),r=Math.sqrt(1-u*u),dist=Math.pow(Math.random(),.3)*random(1.15,2.2);addPoint(i,b[0]+Math.cos(a)*r*dist,b[1]+Math.sin(a)*r*dist,b[2]+u*dist,random(1.1,3.8),random(-.12,.18));}}
const builders={nebula:makeNebula,saturn:makeSaturn,flower:makeFlower,fireworks:makeFireworks};
const names={nebula:'NEBULA / 星云',saturn:'SATURN / 土星',flower:'BLOOM / 花朵',fireworks:'FIREWORKS / 烟花'};
function updateDensity(){geometry.setDrawRange(0,Math.round(MAX*state.density/100));document.querySelector('#densityValue').textContent=state.density+'%';const slider=document.querySelector('#density');slider.style.background=`linear-gradient(90deg,#7972dd 0%,#aca5ff ${state.density}%,#30344f ${state.density}%)`;}
function setPreset(preset){state.preset=preset;builders[preset]();geometry.attributes.position.needsUpdate=true;geometry.attributes.aSize.needsUpdate=true;geometry.attributes.aPhase.needsUpdate=true;geometry.attributes.aHue.needsUpdate=true;geometry.computeBoundingSphere();updateDensity();document.querySelectorAll('.preset').forEach(el=>{const active=el.dataset.preset===preset;el.classList.toggle('active',active);el.setAttribute('aria-pressed',active)});document.querySelector('#activeName').textContent=names[preset];document.querySelector('.stage-label span:last-child').textContent=String(Object.keys(builders).indexOf(preset)+1).padStart(2,'0')+' / 04';}
document.querySelectorAll('.preset').forEach(el=>el.addEventListener('click',()=>setPreset(el.dataset.preset)));
document.querySelectorAll('.swatch').forEach(el=>el.addEventListener('click',()=>setColor(el.dataset.color)));
document.querySelector('#baseColor').addEventListener('input',e=>setColor(e.target.value));
document.querySelector('#density').addEventListener('input',e=>{state.density=Number(e.target.value);updateDensity()});
canvas.addEventListener('pointerdown',e=>{state.drag=true;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!state.drag||state.handActive)return;state.targetY+=(e.clientX-state.lastX)*.007;state.targetX+=(e.clientY-state.lastY)*.007;state.lastX=e.clientX;state.lastY=e.clientY});
canvas.addEventListener('pointerup',()=>state.drag=false);canvas.addEventListener('pointercancel',()=>state.drag=false);
canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=THREE.MathUtils.clamp(state.zoom+Math.sign(e.deltaY)*.7,10,23)},{passive:false});
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.position.z=state.zoom;camera.updateProjectionMatrix();uniforms.uPixelRatio.value=Math.min(devicePixelRatio,2)}
addEventListener('resize',resize);resize();setColor(state.base);setPreset('nebula');

let frames=0,lastFps=performance.now();
function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime(),dt=clock.getDelta();uniforms.uTime.value=t;state.expand=THREE.MathUtils.lerp(state.expand,state.targetExpand,.055);uniforms.uExpand.value=state.expand;group.rotation.x=THREE.MathUtils.lerp(group.rotation.x,state.targetX+Math.sin(t*.18)*.06,.045);group.rotation.y=THREE.MathUtils.lerp(group.rotation.y,state.targetY+t*.035,.04);group.rotation.z=Math.sin(t*.12)*.055;uniforms.uRotationHue.value=group.rotation.y/(Math.PI*2)*.42+group.rotation.x/(Math.PI*2)*.12;camera.position.z=THREE.MathUtils.lerp(camera.position.z,state.zoom,.08);bg.rotation.y=t*.0015;renderer.render(scene,camera);frames++;if(performance.now()-lastFps>1000){document.querySelector('#fps').textContent=Math.round(frames*1000/(performance.now()-lastFps))+' FPS';frames=0;lastFps=performance.now()}}
animate();

const video=document.querySelector('#camera'),overlay=document.querySelector('#handOverlay'),ctx=overlay.getContext('2d');
const cameraButton=document.querySelector('#cameraButton'),cameraStatus=document.querySelector('#cameraStatus'),handStatus=document.querySelector('#handStatus');
let stream=null,tracker=null,tracking=false,trackTimer=0;
const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function drawHand(points){overlay.width=overlay.clientWidth*2;overlay.height=overlay.clientHeight*2;ctx.clearRect(0,0,overlay.width,overlay.height);if(!points)return;ctx.strokeStyle='rgba(164,158,255,.85)';ctx.lineWidth=2;links.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(points[a].x*overlay.width,points[a].y*overlay.height);ctx.lineTo(points[b].x*overlay.width,points[b].y*overlay.height);ctx.stroke()});ctx.fillStyle='#e3dfff';[0,4,8,12,16,20].forEach(i=>{ctx.beginPath();ctx.arc(points[i].x*overlay.width,points[i].y*overlay.height,3,0,Math.PI*2);ctx.fill()})}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)}
async function track(){if(!tracking||!tracker)return;const now=performance.now();if(video.readyState>=2&&now-trackTimer>30){trackTimer=now;try{const result=tracker.detectForVideo(video,now);const hand=result.landmarks?.[0];drawHand(hand);if(hand){const palm=distance(hand[0],hand[9])||.1;const openness=([4,8,12,16,20].reduce((sum,i)=>sum+distance(hand[i],hand[0]),0)/5)/palm;state.targetExpand=THREE.MathUtils.clamp(.55+(openness-1.2)*.75,.52,1.7);const tip=hand[8];state.targetY=(.5-tip.x)*3.6;state.targetX=(tip.y-.5)*2.2;state.handActive=true;cameraStatus.textContent='手势已识别';handStatus.textContent='张合手掌调整扩散 · 移动食指旋转';document.querySelector('#gestureHint').textContent='手掌张合控制扩散 · 食指移动控制旋转'}else{state.handActive=false;state.targetExpand=1;cameraStatus.textContent='寻找手部';handStatus.textContent='将手放入摄像头画面中'}}catch(err){console.warn('手势识别暂时中断',err)}}requestAnimationFrame(track)}
async function startCamera(){cameraButton.disabled=true;cameraButton.querySelector('span:nth-child(2)').textContent='正在连接…';cameraStatus.textContent='正在连接摄像头';try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('请通过 HTTPS 或 localhost 打开，并使用支持摄像头的浏览器。');stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});video.srcObject=stream;await video.play();document.querySelector('#cameraPlaceholder').style.display='none';cameraStatus.textContent='正在加载手势识别';const vision=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');const files=await vision.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');const options={baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numHands:1};try{tracker=await vision.HandLandmarker.createFromOptions(files,options)}catch{options.baseOptions.delegate='CPU';tracker=await vision.HandLandmarker.createFromOptions(files,options)}tracking=true;track();cameraButton.disabled=false;cameraButton.querySelector('span:nth-child(2)').textContent='关闭摄像头';cameraButton.querySelector('.button-icon').textContent='◌';cameraStatus.textContent='寻找手部';handStatus.textContent='将手放入摄像头画面中'}catch(err){console.error(err);stopCamera();cameraStatus.textContent='连接失败';handStatus.textContent=err.name==='NotAllowedError'?'请在浏览器中允许摄像头权限':(err.message||'请检查网络和摄像头');cameraButton.disabled=false}}
function stopCamera(){tracking=false;state.handActive=false;state.targetExpand=1;drawHand(null);if(tracker){tracker.close();tracker=null}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}video.srcObject=null;document.querySelector('#cameraPlaceholder').style.display='flex';cameraButton.disabled=false;cameraButton.querySelector('span:nth-child(2)').textContent='开启摄像头';cameraButton.querySelector('.button-icon').textContent='◉';document.querySelector('#gestureHint').textContent='拖动画面旋转 · 滚轮缩放';if(cameraStatus.textContent!=='连接失败'){cameraStatus.textContent='等待连接';handStatus.textContent='开启摄像头，体验手势互动'}}
cameraButton.addEventListener('click',()=>stream?stopCamera():startCamera());

