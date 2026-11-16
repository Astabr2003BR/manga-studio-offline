import * as T from 'three';
import {refineHairSurface} from './hair-geometry.js';
import {solveGripFinger} from './grip-ik.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
export function validateVRM(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>32*1024*1024)throw Error('VRM inválido ou maior que 32 MiB.');
 const d=new DataView(buffer),n=d.getUint32(12,true);
 if(d.getUint32(0,true)!==0x46546c67||d.getUint32(4,true)!==2||d.getUint32(8,true)!==buffer.byteLength||n>4*1024*1024||n<4||n%4||20+n>buffer.byteLength||d.getUint32(16,true)!==0x4e4f534a)throw Error('Cabeçalho GLB inválido.');
 const j=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(buffer,20,n)));
 if(j.asset?.version!=='2.0'||!(j.extensions?.VRM||j.extensions?.VRMC_vrm))throw Error('Avatar VRM inválido.');
 for(const k of ['buffers','images','nodes','meshes','accessors','textures','skins','materials'])if(j[k]!==undefined&&!Array.isArray(j[k]))throw Error('Estrutura inválida.');
 if((j.nodes?.length||0)>2048||(j.images?.length||0)>48||(j.accessors?.length||0)>4096)throw Error('Limite mobile excedido.');
 for(const a of [...(j.buffers||[]),...(j.images||[])])if(!a||typeof a!=='object'||'uri' in a)throw Error('Recursos externos proibidos.');
 if((j.extensionsRequired||[]).some(x=>['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'].includes(x)))throw Error('Compressão não suportada.');
 let vertices=0,indices=0,primitives=0;const seen=new Set();
 for(const m of j.meshes||[])for(const p of m.primitives||[]){const id=p.attributes?.POSITION,c=j.accessors?.[id]?.count;if(!Number.isInteger(c)||c<1)throw Error('Malha inválida.');if(!seen.has(id)){seen.add(id);vertices+=c;}const k=p.indices===undefined?c:j.accessors?.[p.indices]?.count;if(!Number.isInteger(k)||k<1)throw Error('Índices inválidos.');indices+=k;primitives++;}
 if(vertices>350000||indices>1500000||primitives>512)throw Error('Complexidade excede limite mobile.');
 return {vertices,indices,primitives};
}
export function createStudio(canvas){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});}catch{throw Error('WebGL 2 indisponível.');}
 renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0,0);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(35,1,.03,40);
 const ambient=new T.HemisphereLight(0xa4c3ef,0x393046,.85);scene.add(ambient);
 const light=(color,intensity,x,y,z)=>{const l=new T.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);return l;};
 const key=light(0xffcba0,1.6,3,3,5),rim=light(0x78a7ff,1.5,-4,3,-1),fill=light(0x9bbfff,.35,-2,1,3);
 const room=new T.Group();scene.add(room);
 const box=(w,h,d,x,y,z,color,parent=room)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);parent.add(m);return m;};

 // All decorative resources are procedural, local and deterministic.
 const round=(w,h,d,x,y,z,color,parent=room,r=.025)=>{const m=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w*.45,h*.45,d*.45)),new T.MeshStandardMaterial({color,roughness:.86}));m.position.set(x,y,z);parent.add(m);return m;};
 const texture=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'));const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;};
 const wallTex=texture(256,256,c=>{c.fillStyle='#293a55';c.fillRect(0,0,256,256);for(let i=0;i<1300;i++){const x=(i*73)%256,y=(i*127)%256;c.fillStyle=i%2?'#ffffff08':'#0000000b';c.fillRect(x,y,1,2);}});
 const floor=box(8,.1,8,0,-.06,0,0x3a4052);floor.material.map=texture(512,512,c=>{c.fillStyle='#414959';c.fillRect(0,0,512,512);for(let i=0;i<12;i++){c.fillStyle=i%2?'#394151':'#495061';c.fillRect(i*43,0,41,512);c.fillStyle='#252d3c';c.fillRect(i*43,0,2,512);for(let j=0;j<28;j++){c.fillStyle='#ffffff09';c.fillRect(i*43+5,(j*43+i*17)%512,25,1);}}});floor.material.color.set(0xffffff);
 const wall=box(8,4,.1,0,2,-2.8,0xffffff);wall.material.map=wallTex;
 box(.13,4,5,-3.7,2,-.4,0x283d54);box(8,.12,.13,0,.07,-2.7,0x536070);
 const win=new T.Group();win.position.set(-.85,2.13,-2.69);room.add(win);
 const city=texture(1024,600,c=>{const g=c.createLinearGradient(0,0,0,600);g.addColorStop(0,'#0d1935');g.addColorStop(.6,'#355375');g.addColorStop(1,'#101b32');c.fillStyle=g;c.fillRect(0,0,1024,600);for(let layer=0;layer<3;layer++){for(let i=0;i<22;i++){const x=i*51+(layer*19),h=70+(i*53+layer*73)%235,y=600-h-layer*24;c.fillStyle=['#263d5b','#182e48','#101d35'][layer];c.fillRect(x,y,43,h+40);for(let j=0;j<8;j++)for(let k=0;k<3;k++)if((i+j*3+k*7+layer)%5===0){c.fillStyle=layer===2?'#e6b77e':'#6d9dbb';c.fillRect(x+5+k*12,y+13+j*20,5,8);}}}c.lineWidth=1.5;for(let i=0;i<200;i++){const x=i*79%1024,y=i*137%600,l=10+i%28;c.strokeStyle=i%4===0?'#d1edff80':'#b5d9f52e';c.beginPath();c.moveTo(x,y);c.lineTo(x-7,y+l);c.stroke();}c.fillStyle='#b5e1ff12';c.beginPath();c.moveTo(75,0);c.lineTo(260,0);c.lineTo(450,600);c.lineTo(330,600);c.closePath();c.fill();});
 // Original atmospheric skyline: deterministic, local, no generated or external assets.
 const storyCity=texture(1024,600,c=>{const W=1024,H=600;let g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a142b');g.addColorStop(.55,'#283d58');g.addColorStop(1,'#657582');c.fillStyle=g;c.fillRect(0,0,W,H);const glow=c.createRadialGradient(740,405,10,740,405,340);glow.addColorStop(0,'#aabdc02d');glow.addColorStop(1,'#aabdc000');c.fillStyle=glow;c.fillRect(0,0,W,H);
 for(let layer=0;layer<3;layer++){let x=-18;for(let i=0;i<32&&x<W;i++){const q=(i*71+layer*113)%103,w=26+q*.65+layer*7,h=65+(i*61+layer*97)%205+layer*35,y=H-h-layer*24;const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,['#40536a','#263c52','#172a42'][layer]);g.addColorStop(1,['#314358','#203145','#0d1a30'][layer]);c.fillStyle=g;c.fillRect(x,y,w,h+80);c.fillStyle=['#43566b','#34485e','#243950'][layer];c.fillRect(x,y-4,w,5);if(i%4===0){c.fillRect(x+w*.54,y-14,w*.27,12);c.fillRect(x+w*.67,y-34,1.5,20);}for(let row=0;row<Math.ceil(h/17);row++)for(let col=0;col<Math.floor(w/13);col++){if((i*17+row*7+col*11+layer)%9>2)continue;const xx=x+6+col*13,yy=y+12+row*17;if(yy>H-5)continue;c.fillStyle=layer===2?'#d8b78d':'#7794ad';c.globalAlpha=.24+((i+row*3+col)%5)*.12;c.fillRect(xx,yy,4+layer,6+layer);c.globalAlpha=1;}x+=w+4+(i*13%13);}}
 c.lineWidth=1;for(let i=0;i<150;i++){const x=(i*137+13)%W,y=(i*71+25)%H,len=8+i%24;c.strokeStyle=i%5===0?'#d7e7f56a':'#aec7df28';c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y+len);c.stroke();}
 for(let i=0;i<32;i++){const x=(i*193+37)%W,y=(i*101+11)%H;c.fillStyle='#c4e0f235';c.beginPath();c.ellipse(x,y,1.2,2.6,-.22,0,Math.PI*2);c.fill();}const fog=c.createLinearGradient(0,360,0,H);fog.addColorStop(0,'#8196a500');fog.addColorStop(1,'#8196a526');c.fillStyle=fog;c.fillRect(0,360,W,240);});
 const pane=new T.Mesh(new T.PlaneGeometry(3.9,2.15),new T.MeshBasicMaterial({map:city}));pane.position.z=.065;win.add(pane);
 for(const x of [-2,0,2])box(.065,2.25,.12,x,0,.11,0x64758c,win);
 for(const y of [-1.11,0,1.11])box(4.08,.065,.12,0,y,.11,0x64758c,win);
 box(4.22,.13,.33,0,-1.15,.16,0x525d73,win);
 const bed=new T.Group();room.add(bed);
 round(1.72,.28,2.05,0,.19,0,0x292c40,bed);
 round(1.75,.19,2.05,0,.425,0,0x8390a6,bed,.075);
 const legacyBlanket=round(1.79,.13,1.63,0,.54,.19,0x304669,bed,.055);
 round(1.79,.85,.13,0,.67,-1.03,0x453c4c,bed,.045);
 const bedPillows=[];for(const xx of [-.45,.45]){const p=round(.74,.16,.44,xx,.57,-.72,0xb3bccd,bed,.075);p.rotation.x=-.12;bedPillows.push(p);}
 const seams=new T.Group();bed.add(seams);for(let i=0;i<7;i++){box(1.68,.007,.012,0,.608,-.55+i*.23,0x536483,seams);box(.012,.007,1.54,-.72+i*.24,.608,.19,0x536483,seams);}
 // A continuous cloth surface with shallow folds and draped edges, not separate rectangular strips.
 const editorialBed=new T.Group();bed.add(editorialBed);editorialBed.visible=false;
 function surface(nx,ny,point,material,parent){const positions=[],uv=[],indices=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const u=i/nx,v=j/ny;positions.push(...point(u,v));uv.push(u,v);}for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const m=new T.Mesh(g,material);parent.add(m);return m;}
 const quiltTex=texture(512,512,c=>{c.fillStyle='#40516c';c.fillRect(0,0,512,512);for(let i=0;i<512;i+=3){c.fillStyle=i%2?'#ffffff0b':'#101d3520';c.fillRect(i,0,1,512);}for(let j=0;j<512;j+=4){c.fillStyle='#151e3914';c.fillRect(0,j,512,1);}for(let i=0;i<8;i++){c.strokeStyle='#9ca8c53b';c.lineWidth=1.5;c.beginPath();c.moveTo(0,i*64);c.lineTo(512,i*64);c.stroke();}});
 const quiltMat=new T.MeshStandardMaterial({color:0xb9c5dd,map:quiltTex,roughness:.98,side:T.DoubleSide});
 surface(48,28,(u,v)=>{const x=(u-.5)*2.02,z=-.625+v*1.63,edge=Math.max(0,(Math.abs(x)-.90)/.11),fold=.007*Math.sin(x*35+z*7)+.005*Math.sin(z*16-x*12);return [x,.628+fold-.22*edge*edge,z];},quiltMat,editorialBed);
 const storyBed=new T.Group();storyBed.visible=false;bed.add(storyBed);
 // Replace intersecting sheet with a rounded, solid quilt and low-amplitude draped edge.
 const storyQuilt=round(1.78,.13,1.63,0,.54,.19,0x304669,storyBed,.055);storyQuilt.material.map=quiltTex;storyQuilt.material.color.set(0x9fadc9);
 const oldDrape=surface(48,28,(u,v)=>{const x=(u-.5)*1.99,z=-.625+v*1.63,edge=Math.max(0,(Math.abs(x)-.84)/.155),fold=(.006*Math.sin(x*17+z*5)+.003*Math.sin(z*19-x*7))*(1-edge);return[x,.625+fold-.18*edge*edge,z];},quiltMat,storyBed);
 // A single closed quilt replaces the overlapping top/solid pair in story2.
 // Deform only the dedicated mesh, retaining the classic/story geometry and its UVs.
 const detailQuiltGeometry=new RoundedBoxGeometry(2.02,.145,1.50,6,.05);
 const detailPositions=detailQuiltGeometry.getAttribute('position');
 for(let i=0;i<detailPositions.count;i++){
  const x=detailPositions.getX(i),y=detailPositions.getY(i),z=detailPositions.getZ(i),edge=T.MathUtils.smoothstep(Math.abs(x),.84,1.01);
  const top=T.MathUtils.clamp((y+.0725)/.145,0,1),fold=(.005*Math.sin(x*11+z*5)+.003*Math.sin(z*13-x*5))*top*(1-edge);
  detailPositions.setY(i,y+fold-.115*edge);
 }
 detailPositions.needsUpdate=true;detailQuiltGeometry.computeVertexNormals();detailQuiltGeometry.computeBoundingBox();detailQuiltGeometry.computeBoundingSphere();
 const detailDrape=new T.Mesh(detailQuiltGeometry,quiltMat);detailDrape.position.set(0,.56,.255);storyBed.add(detailDrape);detailDrape.visible=false;
 // Curtains with modeled pleats. Keep the central window and the clock visible.
 const curtains=new T.Group();room.add(curtains);curtains.visible=false;const curtainMat=new T.MeshStandardMaterial({color:0x314058,roughness:1,side:T.DoubleSide});
 for(const side of [-1,1])surface(32,20,(u,v)=>{const x=-.85+side*(1.88+u*.48),y=3.32-v*2.44,z=-2.43+.055*Math.sin(u*Math.PI*8)+.035*Math.sin(v*2.5+u*4);return [x,y,z];},curtainMat,curtains);
 // Soft contact shadows, local and deterministic; below the shoes and furniture.
 const shadowTex=texture(128,128,c=>{const g=c.createRadialGradient(64,64,5,64,64,62);g.addColorStop(0,'rgba(9,13,25,.72)');g.addColorStop(.45,'rgba(9,13,25,.42)');g.addColorStop(1,'rgba(9,13,25,0)');c.fillStyle=g;c.fillRect(0,0,128,128);});
 const shadows=new T.Group();room.add(shadows);shadows.visible=false;
 function softShadow(w,h){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));m.rotation.x=-Math.PI/2;shadows.add(m);return m;}
 const footShadows=[softShadow(.34,.46),softShadow(.34,.46)],bedShadow=softShadow(2.35,2.8);
 // The sitting edge is the front of the mattress, not a cube hiding the legs.
 bed.position.set(1.28,0,-1.42);
 const table=new T.Group();table.position.set(-1.47,0,-1.56);room.add(table);
 round(.64,.075,.52,0,.66,0,0x7c5b4e,table);round(.59,.52,.46,0,.35,0,0x59434a,table);
 for(let i=0;i<2;i++){box(.5,.19,.025,0,.25+i*.23,.245,0x876658,table);round(.13,.025,.045,0,.26+i*.23,.27,0xc1a584,table);}
 const stem=new T.Mesh(new T.CylinderGeometry(.025,.04,.35,16),new T.MeshStandardMaterial({color:0x94704c,metalness:.4}));stem.position.y=.87;table.add(stem);
 const shade=new T.Mesh(new T.CylinderGeometry(.16,.25,.29,32,1,true),new T.MeshStandardMaterial({color:0xffcf95,emissive:0xffb66a,emissiveIntensity:.48,side:T.DoubleSide}));shade.position.y=1.14;table.add(shade);
 const clock=round(.27,.12,.13,.16,.76,.12,0x1d293a,table);const clockMap=texture(256,96,c=>{c.fillStyle='#091420';c.fillRect(0,0,256,96);c.font='bold 58px monospace';c.fillStyle='#a8ddff';c.textAlign='center';c.fillText('03:00',128,67);});const clockFace=new T.Mesh(new T.PlaneGeometry(.235,.09),new T.MeshBasicMaterial({map:clockMap}));clockFace.position.set(.16,.76,.19);table.add(clockFace);
 const lamp=new T.PointLight(0xffb36c,8,5,2);lamp.position.set(-1.47,1.09,-1.4);room.add(lamp);
 const phone=new T.Group();scene.add(phone);round(.071,.145,.012,0,0,0,0x151b25,phone,.009);
 const screen=texture(256,512,c=>{c.fillStyle='#101c32';c.fillRect(0,0,256,512);c.fillStyle='#d2e9ff';c.font='bold 38px sans-serif';c.fillText('03:00',72,70);c.fillStyle='#355778';c.fillRect(18,117,220,100);c.fillStyle='#e2eefc';c.font='22px sans-serif';c.fillText('Quem está aí?',27,157);c.fillStyle='#80b3e4';c.fillRect(90,473,76,5);});
 const screenMesh=new T.Mesh(new T.PlaneGeometry(.061,.129),new T.MeshBasicMaterial({map:screen}));screenMesh.position.z=.007;phone.add(screenMesh);phone.visible=false;
 const phoneDetails=new T.Group();phone.add(phoneDetails);phoneDetails.visible=false;round(.030,.035,.004,-.014,.044,-.008,0x283143,phoneDetails,.005);for(const y of [.051,.037]){const lens=new T.Mesh(new T.CylinderGeometry(.005,.005,.002,16),new T.MeshStandardMaterial({color:0x182331,metalness:.35,roughness:.24}));lens.rotation.x=Math.PI/2;lens.position.set(-.014,y,-.011);phoneDetails.add(lens);}round(.004,.011,.003,.036,.018,0,0x465366,phoneDetails,.001);
 const screenLight=new T.PointLight(0x8dbdff,.0015,.32,2);scene.add(screenLight);screenLight.visible=false;
 const materialDefaults=new Map(),fabricMaps=new Map(),portraitMaps=new Map();let headRest=null,hairSurface=null;
 let vrm=null,height=0,disposed=false,lost=false,busy=false;const lostFn=e=>{e.preventDefault();lost=true;};const restoreFn=()=>{lost=false;};canvas.addEventListener('webglcontextlost',lostFn);canvas.addEventListener('webglcontextrestored',restoreFn);
 const check=()=>{if(disposed||lost)throw Error('Motor gráfico indisponível.');};
 async function load(buffer){check();if(busy)throw Error('Carregamento em andamento.');busy=true;let candidate;try{const stats=validateVRM(buffer);const manager=new T.LoadingManager();manager.setURLModifier(u=>{if(!u.startsWith('blob:')&&!u.startsWith('data:'))throw Error('Recurso externo bloqueado.');return u;});const loader=new GLTFLoader(manager);loader.register(p=>new VRMLoaderPlugin(p));const g=await loader.parseAsync(buffer,'');candidate=g.userData.vrm;if(!candidate){VRMUtils.deepDispose(g.scene);throw Error('Avatar sem humanoide.');}check();VRMUtils.rotateVRM0(candidate);candidate.scene.updateMatrixWorld(true);const size=new T.Box3().setFromObject(candidate.scene).getSize(new T.Vector3());if(!Number.isFinite(size.y)||size.y<.4||size.y>4)throw Error('Altura inválida.');candidate.scene.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});if(vrm){setHairSurface(false);hairSurface=null;restoreFabric();scene.remove(vrm.scene);VRMUtils.deepDispose(vrm.scene);}vrm=candidate;candidate=null;height=size.y;scene.add(vrm.scene);scene.updateMatrixWorld(true);headRest=vrm.humanoid.getRawBoneNode('head')?.getWorldQuaternion(new T.Quaternion())??null;materialDefaults.clear();vrm.scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m?.shadeColorFactor||materialDefaults.has(m))continue;materialDefaults.set(m,{map:m.map,color:m.color?.clone(),shade:m.shadeColorFactor.clone(),toony:m.shadingToonyFactor,shift:m.shadingShiftFactor,gi:m.giEqualizationFactor,rim:m.parametricRimColorFactor?.clone(),rimMix:m.rimLightingMixFactor,outlineWidth:m.outlineWidthFactor,outlineColor:m.outlineColorFactor?.clone(),outlineMix:m.outlineLightingMixFactor});}});hairSurface=prepareHairSurface(stats);return stats;}finally{if(candidate)VRMUtils.deepDispose(candidate.scene);busy=false;}}

 function bone(n,x=0,y=0,z=0){const b=vrm.humanoid.getNormalizedBoneNode(n);if(b)b.rotation.set(x,y,z);}
 function raw(n){return vrm.humanoid.getRawBoneNode(n)?.getWorldPosition(new T.Vector3());}
 function aim(n,child,target){const b=vrm.humanoid.getNormalizedBoneNode(n),c=vrm.humanoid.getNormalizedBoneNode(child);if(!b||!c||!b.parent)return; b.updateWorldMatrix(true,false);c.updateWorldMatrix(true,false);const p=b.getWorldPosition(new T.Vector3()),q=c.getWorldPosition(new T.Vector3());const from=q.sub(p).normalize(),to=target.clone().sub(p).normalize();if(from.lengthSq()<.9||to.lengthSq()<.9)return;const delta=new T.Quaternion().setFromUnitVectors(from,to),world=b.getWorldQuaternion(new T.Quaternion());const parent=b.parent.getWorldQuaternion(new T.Quaternion()).invert();b.quaternion.copy(parent.multiply(delta.multiply(world)));b.updateWorldMatrix(true,true);}
 // Align the actual head forward axis in world space. VRM0 normalization can invert local Euler signs.
 function orientHead(target){
  const b=vrm.humanoid.getNormalizedBoneNode('head'),r=vrm.humanoid.getRawBoneNode('head');
  if(!b||!r||!headRest||!b.parent)return {headAngleBefore:null,headAngleAfter:null};
  const forward=()=>new T.Vector3(0,0,1).applyQuaternion(r.getWorldQuaternion(new T.Quaternion()).multiply(headRest.clone().invert())).normalize();
  const direction=()=>{const l=raw('leftEye'),rr=raw('rightEye'),origin=l&&rr?l.add(rr).multiplyScalar(.5):raw('head');return target.clone().sub(origin).normalize();};
  const before=forward().angleTo(direction());
  // Bounded corrections use world quaternions, retaining the original neck and body pose.
  for(let i=0;i<3;i++){const from=forward(),to=direction(),angle=from.angleTo(to);if(angle<.025)break;const q=new T.Quaternion().setFromUnitVectors(from,to);const delta=new T.Quaternion().slerp(q,Math.min(.85,.32/angle));const world=b.getWorldQuaternion(new T.Quaternion()),parent=b.parent.getWorldQuaternion(new T.Quaternion()).invert();b.quaternion.copy(parent.multiply(delta.multiply(world)));updatePose();}
  return {headAngleBefore:T.MathUtils.radToDeg(before),headAngleAfter:T.MathUtils.radToDeg(forward().angleTo(direction()))};
 }
 // A grip is articulated with existing humanoid finger bones, never with replacement geometry.
 function updatePose(){vrm.update(0);scene.updateMatrixWorld(true);}
 // A seated free hand rests with a gentle palm-directed curl instead of straight fingers.
 function relaxLeftHand(){
  const hand=raw('leftHand'),middle=raw('leftMiddleProximal'),index=raw('leftIndexProximal'),little=raw('leftLittleProximal'),hip=raw('leftUpperLeg');
  if(!hand||!middle||!index||!little||!hip)return 0;
  const forward=middle.clone().sub(hand).normalize(),span=index.clone().sub(little).normalize(),normal=new T.Vector3().crossVectors(forward,span);
  if(normal.lengthSq()<.01)return 0;normal.normalize();if(normal.dot(hip.clone().sub(hand))<0)normal.negate();
  let joints=0;
  for(const [i,name] of ['Index','Middle','Ring','Little'].entries()){
   const prefix='left'+name,base=raw(prefix+'Proximal'),mid=raw(prefix+'Intermediate'),tip=raw(prefix+'Distal');
   if(!base||!mid||!tip)continue;
   const first=mid.clone().sub(base).normalize(),next=tip.clone().sub(mid).normalize();if(first.lengthSq()<.9||next.lengthSq()<.9)continue;
   aim(prefix+'Proximal',prefix+'Intermediate',base.clone().add(first.addScaledVector(normal,.12+i*.035).normalize()));updatePose();joints++;
   const m=raw(prefix+'Intermediate'),d=raw(prefix+'Distal');if(!m||!d)continue;
   const bend=d.clone().sub(m).normalize().addScaledVector(normal,.20+i*.04).normalize();
   aim(prefix+'Intermediate',prefix+'Distal',m.clone().add(bend));updatePose();joints++;
  }
  return joints;
 }
 // Articulate the final phalanx toward the back of the handset. A VRM often
 // has no fingertip node, so the endpoint is explicitly an estimate, not a collision mesh.
 function refineFingerTips(right,up,normal,half){
  let count=0,beforeSum=0,afterSum=0,maxAngle=0;
  const depth=.006*phone.scale.z,halfHeight=.145*phone.scale.y*.5;
  for(const name of ['Index','Middle','Ring','Little']){
   const prefix='right'+name,mid=raw(prefix+'Intermediate'),tip=raw(prefix+'Distal'),bone=vrm.humanoid.getNormalizedBoneNode(prefix+'Distal'),rawBone=vrm.humanoid.getRawBoneNode(prefix+'Distal');
   if(!mid||!tip||!bone?.parent||!rawBone)continue;
   const segment=tip.clone().sub(mid),length=segment.length();if(!Number.isFinite(length)||length<.002||length>.09)continue;
   const from=segment.normalize(),estimatedLength=length*.65,endpoint=tip.clone().addScaledVector(from,estimatedLength),rel=endpoint.clone().sub(phone.position);
   // Stay near the closest point on the rear surface, just outside the case.
   const target=phone.position.clone().addScaledVector(right,T.MathUtils.clamp(rel.dot(right),-half+.002,half-.002)).addScaledVector(up,T.MathUtils.clamp(rel.dot(up),-halfHeight+.004,halfHeight-.004)).addScaledVector(normal,-depth-.003);
   const desired=target.clone().sub(tip);if(desired.lengthSq()<1e-10)continue;desired.normalize();
   const angle=from.angleTo(desired);if(angle<.015||!Number.isFinite(angle))continue;
   const before=endpoint.distanceTo(target),original=bone.quaternion.clone(),oldRaw=rawBone.getWorldQuaternion(new T.Quaternion());
   const delta=new T.Quaternion().slerp(new T.Quaternion().setFromUnitVectors(from,desired),Math.min(1,.30/angle));
   const world=bone.getWorldQuaternion(new T.Quaternion()),parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();
   bone.quaternion.copy(parent.multiply(delta.multiply(world)));updatePose();
   const moved=raw(prefix+'Distal'),newRaw=rawBone.getWorldQuaternion(new T.Quaternion()),actualDelta=newRaw.multiply(oldRaw.invert());
   const after=moved?moved.clone().addScaledVector(from.clone().applyQuaternion(actualDelta),estimatedLength).distanceTo(target):Infinity;
   if(!Number.isFinite(after)||after>=before-1e-6){bone.quaternion.copy(original);updatePose();continue;}
   count++;beforeSum+=before;afterSum+=after;maxAngle=Math.max(maxAngle,Math.min(.30,angle));
  }
  return {tipJoints:count,tipBefore:count?beforeSum/count:null,tipAfter:count?afterSum/count:null,tipMaxAngle:maxAngle};
 }
 function gripPhone(head,rh,refined=false){
  let middle=raw('rightMiddleProximal'),index=raw('rightIndexProximal'),little=raw('rightLittleProximal');if(!middle||!index||!little)return {gripJoints:0,gripError:null};
  let up=middle.clone().sub(rh).normalize(),toward=head.clone().sub(middle);const normal=toward.addScaledVector(up,-toward.dot(up)).normalize();if(normal.lengthSq()<.9)return {gripJoints:0,gripError:null};
  const right=new T.Vector3().crossVectors(up,normal).normalize();normal.crossVectors(right,up).normalize();
  let wristRoll=0;if(refined){const hand=vrm.humanoid.getNormalizedBoneNode('rightHand'),span=index.clone().sub(little);span.addScaledVector(up,-span.dot(up)).normalize();if(hand&&span.lengthSq()>.9){const desired=right.clone().multiplyScalar(span.dot(right)<0?-1:1),angle=Math.atan2(up.dot(span.clone().cross(desired)),span.dot(desired));wristRoll=T.MathUtils.clamp(angle,-.75,.75);const world=hand.getWorldQuaternion(new T.Quaternion()),q=new T.Quaternion().setFromAxisAngle(up,wristRoll),parent=hand.parent.getWorldQuaternion(new T.Quaternion()).invert();hand.quaternion.copy(parent.multiply(q.multiply(world)));updatePose();middle=raw('rightMiddleProximal')??middle;index=raw('rightIndexProximal')??index;little=raw('rightLittleProximal')??little;}}
  phone.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,normal));
  phone.position.copy(middle).addScaledVector(up,refined?.011:.017).addScaledVector(normal,refined?-.007:.023);
  const width=.071*phone.scale.x,half=width*.5;let joints=0,distances=[],contacts=[],thumbJoints=0,thumbTipGap=null;const curls=[],fingerTargets=[],fingerIK=[];
  for(const name of ['Index','Middle','Ring','Little']){const prefix='right'+name,base=raw(prefix+'Proximal'),mid=raw(prefix+'Intermediate'),tip=raw(prefix+'Distal');if(!base||!mid||!tip)continue;
   const side=base.clone().sub(phone.position).dot(right)>=0?1:-1,edge=phone.position.clone().addScaledVector(right,side*(half+.008));
   // Curl first phalanx toward the side of the handset; the next folds over the edge.
   const preferredY=T.MathUtils.clamp(base.clone().sub(phone.position).dot(up)*.68,-.051,.051);
   const sideGap=name==='Index'?.005:name==='Middle'?.004:name==='Ring'?.003:.002;
   const bendHint=mid.clone().sub(base).addScaledVector(normal,-.020);
   // Search reachable contact positions on the *existing* phone edge rather than
   // exceeding a natural curl angle to reach an unreachable center target.
   // Small deterministic vertical variations separate individual fingers.
   const preferredOffset=name==='Index'?.012:name==='Middle'?.004:name==='Ring'?-.004:-.012;
   const desiredY=T.MathUtils.clamp(preferredY+preferredOffset,-.060,.060);
   let best=null;
   if(refined)for(let k=-10;k<=10;k++){
    const candidateY=k*.006;
    const target=phone.position.clone().addScaledVector(right,side*(half+sideGap)).addScaledVector(up,candidateY).addScaledVector(normal,-.003);
    const ik=solveGripFinger(base,mid,tip,target,bendHint,1.70);
    if(!ik)continue;
    const score=ik.reachError*20+Math.abs(candidateY-desiredY)*.14+Math.abs(ik.bend-1.1)*.0008;
    if(!best||score<best.score)best={score,ik,target,candidateY};
   }
   const edgeY=best?.candidateY??preferredY;
   const contactTarget=best?.target??phone.position.clone().addScaledVector(right,side*(half+sideGap)).addScaledVector(up,edgeY).addScaledVector(normal,-.003);
   const solution=refined?(best?.ik??solveGripFinger(base,mid,tip,contactTarget,bendHint,1.70)):null;
   const direction=mid.clone().sub(base).normalize().multiplyScalar(refined?.72:.55).add(normal.clone().multiplyScalar(refined?-.24:.75)).add(right.clone().multiplyScalar(refined?side*.12:-side*.19)).normalize();
   aim(prefix+'Proximal',prefix+'Intermediate',solution?solution.joint:base.clone().add(direction));updatePose();joints++;
   const m=raw(prefix+'Intermediate');
   if(m){
    const towardEdge=solution?solution.end:(refined?contactTarget:edge.clone().addScaledVector(up,(base.clone().sub(middle).dot(up))*.6).addScaledVector(normal,.018));
    if(refined){fingerTargets.push({name,height:edgeY,sideGap});fingerIK.push({name,solved:!!solution,bend:solution?.bend??null,reachError:solution?.reachError??null,edgeY});}
    aim(prefix+'Intermediate',prefix+'Distal',towardEdge);updatePose();joints++;
    const d=raw(prefix+'Distal');if(d){distances.push(d.distanceTo(edge));if(refined){
     const midNow=raw(prefix+'Intermediate'),baseNow=raw(prefix+'Proximal');
     if(midNow&&baseNow){const a=midNow.clone().sub(baseNow).normalize(),b=d.clone().sub(midNow).normalize();curls.push({name,angle:a.angleTo(b)});}
     const rel=d.clone().sub(phone.position),dx=Math.max(0,Math.abs(rel.dot(right))-half),dy=Math.max(0,Math.abs(rel.dot(up))-.145*phone.scale.y*.5),dz=Math.max(0,Math.abs(rel.dot(normal))-.006*phone.scale.z);
     contacts.push(Math.hypot(dx,dy,dz));
    }}
   }
  }
  const thumb=raw('rightThumbMetacarpal'),thumbMid=raw('rightThumbProximal'),thumbDistal=raw('rightThumbDistal');
  if(refined&&thumb&&thumbMid&&thumbDistal){
   const side=thumb.clone().sub(phone.position).dot(right)>=0?1:-1;
   const baseTarget=phone.position.clone().addScaledVector(right,side*(half+.012)).addScaledVector(up,-.039).addScaledVector(normal,-.006);
   aim('rightThumbMetacarpal','rightThumbProximal',baseTarget);updatePose();joints++;thumbJoints++;
   const mid=raw('rightThumbProximal');
   if(mid){const tipTarget=phone.position.clone().addScaledVector(right,side*(half+.002)).addScaledVector(up,-.025).addScaledVector(normal,-.008);
    aim('rightThumbProximal','rightThumbDistal',tipTarget);updatePose();joints++;thumbJoints++;
    const tip=raw('rightThumbDistal');if(tip)thumbTipGap=tip.distanceTo(tipTarget);
   }
  }else if(thumbMid&&thumbDistal){const side=thumbMid.clone().sub(phone.position).dot(right)>=0?1:-1;aim('rightThumbProximal','rightThumbDistal',phone.position.clone().addScaledVector(right,side*(refined?.027:.024)).addScaledVector(up,refined?-.034:-.025).addScaledVector(normal,refined?.008:.013));updatePose();joints++;}
  const tips=refined?refineFingerTips(right,up,normal,half):{tipJoints:0,tipBefore:null,tipAfter:null,tipMaxAngle:0};
  return {gripJoints:joints,gripError:distances.length?Math.max(...distances):null,refinedGrip:refined,wristRoll,thumbJoints,thumbTipGap,phonePalmOffset:phone.position.clone().sub(middle).dot(normal),contactMean:contacts.length?contacts.reduce((a,b)=>a+b,0)/contacts.length:null,fingerCurls:curls,fingerTargets,fingerIK,...tips};
 }
 // Textile overlay retains the avatar's existing UV layout and alpha, with bounded memory.
 // Only the known bundled model topology is eligible. Imported/custom meshes
 // keep their own geometry, including morphs, UVs and skin weights.
 function prepareHairSurface(stats){
  if(stats.vertices!==18145||stats.primitives!==131)return null;
  const geometries=new Set(),all=new Set();vrm.scene.traverse(o=>{if(!o.isMesh||!o.geometry)return;all.add(o.geometry);if((Array.isArray(o.material)?o.material:[o.material]).some(m=>/^F00_000_Hair_00_HAIR/.test(m?.name||'')))geometries.add(o.geometry);});
  if(geometries.size!==114)return null;const first=geometries.values().next().value,p=first.getAttribute('position'),n=first.getAttribute('normal');
  if(!p||!n||p.count!==7775||n.count!==7775||p.isInterleavedBufferAttribute||n.isInterleavedBufferAttribute||!(p.array instanceof Float32Array)||!(n.array instanceof Float32Array))return null;
  const indices=[];for(const g of geometries){if(g.getAttribute('position')!==p||g.getAttribute('normal')!==n||!g.index||g.morphAttributes.position?.length||g.morphAttributes.normal?.length)return null;for(let i=0;i<g.index.count;i++)indices.push(g.index.getX(i));}
  for(const g of all)if(!geometries.has(g)&&(g.getAttribute('position')===p||g.getAttribute('normal')===n))return null;
  if(indices.length!==9196*3)return null;
  const result=refineHairSurface(p.array,n.array,new Uint32Array(indices));if(!result||!result.moved)return null;
  return {p,n,baseP:p.array.slice(),baseN:n.array.slice(),result,active:false};
 }
 function setHairSurface(active){
  if(!hairSurface||hairSurface.active===active)return;
  const h=hairSurface;h.p.array.set(active?h.result.position:h.baseP);h.n.array.set(active?h.result.normal:h.baseN);h.p.needsUpdate=true;h.n.needsUpdate=true;h.active=active;
 }
 function restoreFabric(){for(const [m,d] of materialDefaults)if(m.map!==d.map){m.map=d.map;m.needsUpdate=true;}for(const t of fabricMaps.values())t.dispose();fabricMaps.clear();for(const maps of portraitMaps.values())for(const t of maps.values())t.dispose();portraitMaps.clear();}
 function fabricTexture(original){if(!original?.image)return null;if(fabricMaps.has(original))return fabricMaps.get(original);const src=original.image,w=src.width||src.naturalWidth,h=src.height||src.naturalHeight;if(!w||!h)return null;const scale=Math.min(1,1024/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));const x=c.getContext('2d');try{x.drawImage(src,0,0,c.width,c.height);}catch{return null;}
 x.globalCompositeOperation='source-atop';x.lineWidth=1;
 for(let i=0;i<c.width;i+=4){x.strokeStyle=i%8===0?'#11192e22':'#e2e8ff12';x.beginPath();x.moveTo(i,0);x.lineTo(i,c.height);x.stroke();}
 for(let i=0;i<c.height;i+=5){x.strokeStyle='#d4d9ee14';x.beginPath();x.moveTo(0,i);x.lineTo(c.width,i);x.stroke();}
 const t=new T.CanvasTexture(c);t.colorSpace=original.colorSpace;t.flipY=original.flipY;t.wrapS=original.wrapS;t.wrapT=original.wrapT;t.magFilter=original.magFilter;t.minFilter=original.minFilter;t.generateMipmaps=original.generateMipmaps;t.anisotropy=original.anisotropy;t.channel=original.channel;t.offset.copy(original.offset);t.repeat.copy(original.repeat);t.center.copy(original.center);t.rotation=original.rotation;t.matrixAutoUpdate=original.matrixAutoUpdate;t.matrix.copy(original.matrix);t.needsUpdate=true;fabricMaps.set(original,t);return t;}
 // UV-aware retouch of the licensed bundled avatar: preserve all original alpha and painted folds.
 function portraitTexture(original,kind){if(!original?.image)return null;let cache=portraitMaps.get(original);if(cache?.has(kind))return cache.get(kind);const src=original.image,w=src.width||src.naturalWidth,h=src.height||src.naturalHeight;if(!w||!h)return null;const factor=Math.min(1,1024/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*factor));c.height=Math.max(1,Math.round(h*factor));const x=c.getContext('2d',{willReadFrequently:true});let img;try{x.drawImage(src,0,0,c.width,c.height);img=x.getImageData(0,0,c.width,c.height);}catch{return null;}
 const d=img.data,limit=v=>Math.max(0,Math.min(255,v)),gauss=(u,v,cx,cy,rx,ry)=>Math.exp(-(((u-cx)/rx)**2+((v-cy)/ry)**2));
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(!d[i+3])continue;const r=d[i],g=d[i+1],b=d[i+2],l=.2126*r+.7152*g+.0722*b,u=x/(c.width-1||1),v=y/(c.height-1||1);let rr=r,gg=g,bb=b;
 if(kind==='hair'){const ridge=Math.max(0,(l-20)/80),strand=(Math.sin(u*177+Math.sin(v*8+u*14)*2.1)+Math.sin(u*311-v*4))*.75;const q=limit(8+l*.82+ridge*11+strand);rr=q*.95;gg=q*.98;bb=q*1.11+2;}
 else if(kind==='hair-refined'){const ridge=T.MathUtils.smoothstep(l,18,120),shadow=1-ridge,flow=u+Math.sin(v*8+u*11)*.012,phase=flow*225+v*4.8;const strand=Math.pow(Math.max(0,Math.cos(phase)),10)*7.5+Math.sin(flow*487-v*3.1)*1.25,band=Math.sin(v*15+u*7)*1.5;const q=limit(7+l*.82+ridge*9+strand*(.30+.70*ridge)+band);rr=q*.95+ridge*1.3;gg=q*.99;bb=q*1.12+2+shadow*1.8;}
 else if(kind==='top'){const fold=Math.max(0,Math.min(1,(l-65)/190)),fine=((x*13+y*7)%11-5)*.42;rr=19+fold*43+fine;gg=25+fold*53+fine;bb=39+fold*66+fine;}
 else if(kind==='bottom'){const q=limit((l-25)*1.20+25);rr=r*.55+q*.45;gg=g*.55+q*.45;bb=b*.65+q*.35;}
 else if(kind==='face'){const warm=gauss(u,v,.40,.58,.15,.12)+gauss(u,v,.60,.58,.15,.12),jaw=gauss(u,v,.5,.80,.25,.14),nose=gauss(u,v,.49,.63,.035,.085);rr=r+warm*2-jaw*2+nose*2;gg=g-warm*3-jaw*5+nose*1;bb=b-warm*2-jaw*5+nose*1;}
 else if(kind==='eye'){rr=r*.72+l*.28;gg=g*.72+l*.28;bb=b*.72+l*.28;}
 d[i]=limit(rr);d[i+1]=limit(gg);d[i+2]=limit(bb);}
 x.putImageData(img,0,0);const t=original.clone();t.source=new T.Source(c);t.needsUpdate=true;t.name='Studio portrait '+kind;cache??=new Map();cache.set(kind,t);portraitMaps.set(original,cache);return t;}
 // Preserve each imported avatar's own material values. Only the bundled sample's top is recolored.
 function artMaterials(finish,detail=false){let count=0;for(const [m,d] of materialDefaults){if(m.map!==d.map){m.map=d.map;m.needsUpdate=true;}if(d.color&&m.color)m.color.copy(d.color);m.shadeColorFactor.copy(d.shade);m.shadingToonyFactor=d.toony;m.shadingShiftFactor=d.shift;m.giEqualizationFactor=d.gi;if(d.rim&&m.parametricRimColorFactor)m.parametricRimColorFactor.copy(d.rim);m.rimLightingMixFactor=d.rimMix;if(Number.isFinite(d.outlineWidth))m.outlineWidthFactor=d.outlineWidth;if(d.outlineColor&&m.outlineColorFactor)m.outlineColorFactor.copy(d.outlineColor);if(Number.isFinite(d.outlineMix))m.outlineLightingMixFactor=d.outlineMix;if(!['cinema','ink','studio','film'].includes(finish))continue;count++;const name=m.name||'';const face=/Face_00_SKIN|Body_00_SKIN/.test(name),cloth=/CLOTH/.test(name),hair=/HAIR/.test(name);if(face||cloth||hair){m.shadingToonyFactor=.82;m.shadingShiftFactor=-.12;m.giEqualizationFactor=hair?.50:.32;m.shadeColorFactor.multiplyScalar(face?.79:.68);if(m.parametricRimColorFactor)m.parametricRimColorFactor.set(hair?0x202c40:0x263447);m.rimLightingMixFactor=.85;}if(/M00_006_01_Tops_01_CLOTH/.test(name)&&m.color){m.color.multiply(new T.Color(0x596c92));m.shadeColorFactor.multiply(new T.Color(0x7189bd));}if(['ink','studio','film'].includes(finish)&&cloth){const t=fabricTexture(d.map);if(t){m.map=t;m.needsUpdate=true;}m.shadingToonyFactor=.88;m.shadingShiftFactor=-.20;m.giEqualizationFactor=.24;}if(['ink','studio','film'].includes(finish)&&face){m.shadingToonyFactor=.76;m.shadingShiftFactor=-.06;}if(finish==='studio'||finish==='film'){const kind=/^F00_000_Hair_00_HAIR/.test(name)?'hair':/^M00_006_01_Tops_01_CLOTH/.test(name)?'top':/^M00_001_01_Bottoms_01_CLOTH/.test(name)?'bottom':/^M00_000_00_Face_00_SKIN/.test(name)?'face':/^M00_000_00_EyeIris_00_EYE/.test(name)?'eye':null;if(kind){const tex=portraitTexture(d.map,kind==='hair'&&finish==='film'&&detail?'hair-refined':kind);if(tex){m.map=tex;m.needsUpdate=true;if(kind==='top'&&d.color&&m.color)m.color.copy(d.color);if(kind==='hair'){m.shadingToonyFactor=.74;m.shadingShiftFactor=-.04;m.giEqualizationFactor=.66;}if(kind==='face'){m.shadingToonyFactor=.63;m.shadingShiftFactor=-.02;m.giEqualizationFactor=.48;}}}
 if(finish==='film'){
  // Actual MToon outline geometry is softened only for skin, never for eyelash/iris meshes.
  if(face){m.shadingToonyFactor=.36;m.shadingShiftFactor=.08;m.giEqualizationFactor=.72;m.shadeColorFactor.copy(d.shade).lerp(new T.Color(0xb57d86),.22);if(Number.isFinite(d.outlineWidth))m.outlineWidthFactor=d.outlineWidth*.38;if(m.outlineColorFactor)m.outlineColorFactor.set(0x885867);m.outlineLightingMixFactor=.62;}
  if(hair){m.shadingToonyFactor=detail?.50:.58;m.shadingShiftFactor=.03;m.giEqualizationFactor=.60;m.shadeColorFactor.copy(d.shade).lerp(new T.Color(0x1c2337),.38);if(detail&&Number.isFinite(d.outlineWidth))m.outlineWidthFactor=d.outlineWidth*.88;}
  if(cloth){m.shadingToonyFactor=.62;m.shadingShiftFactor=-.09;m.giEqualizationFactor=.42;if(Number.isFinite(d.outlineWidth))m.outlineWidthFactor=d.outlineWidth*.72;}
 }
 }}return count;}
 // Non-generative, bounded image finishing. Alpha remains unchanged for compositing.
 const finishCanvas=document.createElement('canvas'),finishCtx=finishCanvas.getContext('2d',{willReadFrequently:true});
 const maskCanvas=document.createElement('canvas'),maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true});
 function silhouette(width,h){maskCanvas.width=width;maskCanvas.height=h;const bg=scene.background,visible=room.visible,states=new Map();try{scene.background=null;if(visible){room.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m&&!states.has(m)){states.set(m,{colorWrite:m.colorWrite,depthWrite:m.depthWrite});m.colorWrite=false;m.depthWrite=true;}});}if(visible){const avatarVisible=vrm.scene.visible,phoneVisible=phone.visible,auto=renderer.autoClear;try{vrm.scene.visible=false;phone.visible=false;renderer.render(scene,camera);vrm.scene.visible=avatarVisible;phone.visible=phoneVisible;room.visible=false;renderer.autoClear=false;renderer.render(scene,camera);}finally{vrm.scene.visible=avatarVisible;phone.visible=phoneVisible;room.visible=visible;renderer.autoClear=auto;}}else renderer.render(scene,camera);maskCtx.drawImage(canvas,0,0);return maskCtx.getImageData(0,0,width,h).data;}finally{for(const [m,v] of states){m.colorWrite=v.colorWrite;m.depthWrite=v.depthWrite;}room.visible=visible;scene.background=bg;}}
 function finishFrame(width,h,style,opaque,mask){if(!['cinema','ink','studio','film'].includes(style))return canvas.toDataURL('image/png');finishCanvas.width=width;finishCanvas.height=h;finishCtx.drawImage(canvas,0,0);const image=finishCtx.getImageData(0,0,width,h),p=image.data,source=new Uint8ClampedArray(p);
 const lum=i=>.2126*source[i]+.7152*source[i+1]+.0722*source[i+2],clamp=v=>Math.max(0,Math.min(255,v));
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<width;xx++){const i=(yy*width+xx)*4;if(!source[i+3])continue;const l=lum(i),left=i-4,right=i+4,up=i-width*4,down=i+width*4;
 let edge=0;if(xx>0&&xx<width-1&&yy>0&&yy<h-1&&source[left+3]&&source[right+3]&&source[up+3]&&source[down+3])edge=Math.min(.24,Math.max(0,(Math.abs(lum(left)-lum(right))+Math.abs(lum(up)-lum(down))-46)/230));
 const nx=(xx-width*.5)/(width*.5),ny=(yy-h*.46)/(h*.65),v=opaque?1-.18*Math.min(1,nx*nx+ny*ny):1,shadow=1-l/255,contrast=(l-110)*.065;
 p[i]=clamp((source[i]+contrast-5*shadow)*(1-edge)*v);p[i+1]=clamp((source[i+1]+contrast-2*shadow)*(1-edge)*v);p[i+2]=clamp((source[i+2]+contrast+7*shadow)*(1-edge)*v);
 if((style==='ink'||style==='studio'||style==='film')&&mask&&mask[i+3]>170){const border=xx<2||yy<2||xx>=width-2||yy>=h-2;let outline=0;if(!border){const stride=width*4;const near=Math.min(mask[i-4+3],mask[i+4+3],mask[i-stride+3],mask[i+stride+3]);const far=Math.min(mask[i-8+3],mask[i+8+3],mask[i-2*stride+3],mask[i+2*stride+3]);outline=near<80?.72:far<80?.24:0;}
 // Slight tonal banding adds painted shadow planes without posterizing the whole room.
 const band=Math.round(l/22)*22-l,detail=(xx>0&&xx<width-1&&yy>0&&yy<h-1)?Math.min(.28,Math.max(0,(Math.abs(lum(left)-lum(right))+Math.abs(lum(up)-lum(down))-32)/210)):0;
 const ink=Math.max(outline*(style==='film'?.52:style==='studio'?.82:1),detail*(style==='film'?.36:style==='studio'?.72:1));const noise=((xx*17+yy*31)%13-6)*.17;
 const tone=style==='film'?.16:.38;p[i]=clamp((p[i]+band*tone+noise)*(1-ink)+15*ink);p[i+1]=clamp((p[i+1]+band*tone+noise)*(1-ink)+19*ink);p[i+2]=clamp((p[i+2]+band*tone+noise)*(1-ink)+32*ink);
 }} 
 finishCtx.putImageData(image,0,0);return finishCanvas.toDataURL('image/png');}
 function draw({pose='stand',expression='neutral',shot='medium',yaw=0,pitch=0,zoom=1,x=0,y=0,light='dramatic',background='room',aspect=1.6,finish='original',direction='classic',focus='subject'}={}){
 check();if(!vrm)throw Error('Importe um avatar.');const a=Math.max(.8,Math.min(3,Number(aspect)||1.6)),width=1024,h=Math.round(width/a);renderer.setSize(width,h,false);camera.aspect=width/h;camera.updateProjectionMatrix();vrm.humanoid.resetNormalizedPose();vrm.scene.position.set(0,0,0);
 const detail=direction==='story2',story=direction==='story'||detail;let relaxedHandJoints=0;setHairSurface(detail&&finish==='film');const artCount=artMaterials(finish,detail);const seated=pose==='sit';const holding=pose==='phone'||seated;const acting=['cinema','ink','studio','film'].includes(finish),film=finish==='film';let grip={gripJoints:0,gripError:null,tipJoints:0,tipBefore:null,tipAfter:null,tipMaxAngle:0},gaze={gazeYaw:0,gazePitch:0,gazeApplied:false},headAim={headAngleBefore:null,headAngleAfter:null};if(vrm.lookAt){vrm.lookAt.target=null;vrm.lookAt.reset();}
 bone('leftUpperArm',0,0,1.15);bone('rightUpperArm',0,0,-1.15);bone('leftLowerArm',-.08,0,0);bone('rightLowerArm',-.10,0,0);
 if(seated){bone('spine',.12,0,0);vrm.update(0);scene.updateMatrixWorld(true);for(const side of ['left','right']){const hip=raw(side+'UpperLeg');if(!hip)continue;aim(side+'UpperLeg',side+'LowerLeg',hip.clone().add(new T.Vector3(0,-height*.035,height*.30)));vrm.update(0);scene.updateMatrixWorld(true);const knee=raw(side+'LowerLeg');if(knee)aim(side+'LowerLeg',side+'Foot',knee.clone().add(new T.Vector3(0,-height*.30,height*.015)));}}
 if(pose==='walk'){bone('leftUpperLeg',-.32,0,0);bone('rightUpperLeg',.32,0,0);bone('rightLowerLeg',.25,0,0);bone('leftUpperArm',.24,0,1.15);bone('rightUpperArm',-.24,0,-1.15);}
 if(holding){
  bone('head',acting?.32:.18,acting?-.14:-.08,acting?.035:0);vrm.update(0);scene.updateMatrixWorld(true);
  // One-handed phone pose: elbow remains close to the side, not across the chest.
  const shoulder=raw('rightUpperArm'),other=raw('leftUpperArm');
  if(shoulder&&other){const inward=other.clone().sub(shoulder).normalize();
   const elbow=shoulder.clone().addScaledVector(inward,-height*.018).add(new T.Vector3(0,-height*.16,height*.055));
   aim('rightUpperArm','rightLowerArm',elbow);vrm.update(0);scene.updateMatrixWorld(true);
   const wrist=shoulder.clone().addScaledVector(inward,height*.045).add(new T.Vector3(0,-height*.105,height*.22));
   aim('rightLowerArm','rightHand',wrist);vrm.update(0);scene.updateMatrixWorld(true);
   const hand=raw('rightHand');if(hand)aim('rightHand','rightMiddleProximal',hand.clone().add(new T.Vector3(0,height*.07,height*.015)).addScaledVector(inward,height*.01));
  }
  if(seated){const sh=raw('leftUpperArm');if(sh){aim('leftUpperArm','leftLowerArm',sh.clone().add(new T.Vector3(height*.025,-height*.15,height*.045)));vrm.update(0);scene.updateMatrixWorld(true);const hip=raw('leftUpperLeg');if(hip)aim('leftLowerArm','leftHand',hip.clone().add(new T.Vector3(height*.055,-height*.015,height*.18)));}}

 }
 vrm.update(0);scene.updateMatrixWorld(true);
 if(seated){const feet=['leftFoot','rightFoot'].map(raw).filter(Boolean);if(feet.length){vrm.scene.position.y+=.065-Math.min(...feet.map(v=>v.y));vrm.update(0);scene.updateMatrixWorld(true);}}
 if(detail&&seated)relaxedHandJoints=relaxLeftHand();
 const em=vrm.expressionManager;em?.resetValues();const set=(n,v)=>{if(em?.getExpression(n))em.setValue(n,v);};const names={surprise:['surprised','Surprised','aa'],sad:['sad'],worry:['sad','oh'],happy:['happy']};if(acting){if(expression==='worry'){set('sad',film?.25:.42);set('angry',film?.08:.16);set('oh',film?.07:.12);}else if(expression==='surprise'){set(em?.getExpression('Surprised')?'Surprised':'surprised',.58);set('aa',.24);}else if(expression==='sad'){set('sad',.68);set('blink',.08);}else if(expression==='happy'){set('happy',.65);}else if(holding){set('blink',.075);}}else for(const n of names[expression]||[])set(n,n==='oh'?.22:.65);updatePose();

 room.visible=background==='room';scene.background=room.visible?new T.Color(0x182b48):null;const editorial=['ink','studio','film'].includes(finish);seams.visible=!editorial&&!story;editorialBed.visible=editorial&&!story;legacyBlanket.visible=!story;storyBed.visible=story;storyQuilt.visible=!detail;oldDrape.visible=!detail;detailDrape.visible=detail;for(const pillow of bedPillows)pillow.position.y=detail?.60:.57;curtains.visible=editorial||story;shadows.visible=(editorial||story)&&room.visible;pane.material.map=story?storyCity:city;
 const hips=raw('hips'),head=raw('head'),rh=raw('rightHand'),lh=raw('leftHand');
 if(seated&&hips){bed.position.set(hips.x,hips.y-.70,hips.z-.98);}else bed.position.set(1.28,0,-1.42);if(editorial||story){bedShadow.position.set(bed.position.x,.002,bed.position.z);for(const [i,n] of ['leftFoot','rightFoot'].entries()){const p=raw(n);footShadows[i].visible=!!p;if(p)footShadows[i].position.set(p.x,.004,p.z+.07);}}
 phone.visible=holding&&!!rh&&!!head;phone.scale.setScalar(detail?.94:1);phoneDetails.visible=detail&&phone.visible;
 if(phone.visible){phone.position.copy(rh);const palm=raw('rightMiddleProximal');if(palm)phone.position.lerp(palm,.76);else phone.position.y+=height*.022;phone.position.z+=.018;phone.lookAt(head);if(acting){grip=gripPhone(head,rh,detail);headAim=orientHead(phone.position);if(vrm.lookAt){vrm.lookAt.lookAt(phone.position);vrm.lookAt.yaw=T.MathUtils.clamp(vrm.lookAt.yaw,-28,28);vrm.lookAt.pitch=T.MathUtils.clamp(vrm.lookAt.pitch,-30,30);gaze={gazeYaw:vrm.lookAt.yaw,gazePitch:vrm.lookAt.pitch,gazeApplied:true};updatePose();}}}
 screenLight.visible=acting&&phone.visible;if(screenLight.visible){screenLight.position.copy(phone.position).add(new T.Vector3(0,.045,.10).applyQuaternion(phone.quaternion));}
 key.color.set(light==='cool'?0xaccbff:0xffcba0);key.intensity=light==='warm'?2.1:1.65;rim.intensity=light==='warm'?.5:2.0;fill.intensity=light==='cool'?.8:.45;if(acting){key.intensity*=.72;fill.intensity*=.60;rim.intensity*=.98;}ambient.intensity=.85;key.position.set(3,3,5);rim.position.set(-4,3,-1);fill.position.set(-2,1,3);fill.color.set(0x9bbfff);rim.color.set(0x78a7ff);if(film){ambient.intensity=.62;key.position.set(-3.2,2.8,2.8);key.color.set(light==='cool'?0xd4dfff:0xffd2aa);key.intensity=1.12;rim.position.set(3.0,2.4,-2.0);rim.intensity=light==='warm'?.7:1.35;fill.position.set(2,1.1,3);fill.intensity=.36;fill.color.set(0xb3cbf8);}
 const hp=vrm.humanoid.getRawBoneNode('head')?.getWorldPosition(new T.Vector3());if(!hp)throw Error('Cabeça ausente.');const phoneFocus=focus==='phone'&&phone.visible;const target=phoneFocus?phone.position.clone():hp.clone(),z=Math.max(1,Math.min(2.8,Number(zoom)||1)),clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||0));
 if(!phoneFocus){target.y+=height*(shot==='close'?.015:shot==='wide'?(seated?-.29:-.39):-.19)+clamp(y,-1,1)*height*.25;target.x+=clamp(x,-1,1)*height*.25;if(story){target.x+=height*(shot==='close'?-.105:.13);if(shot==='close')target.y-=height*.045;}}
 const d=height*(phoneFocus?.38:shot==='close'?(film?.56:acting?.48:.63):shot==='wide'?(seated?(acting?1.55:1.45):1.85):1.25)/z,angle=T.MathUtils.degToRad(clamp((Number(yaw)||0)+(story?(shot==='close'?-12:12):0),-65,65)),tilt=T.MathUtils.degToRad(clamp((Number(pitch)||0)+(story&&shot==='close'?-4:0),-30,30));
 camera.position.set(target.x+Math.sin(angle)*d,target.y+Math.sin(tilt)*d,target.z+Math.cos(angle)*Math.cos(tilt)*d);camera.lookAt(target);camera.updateMatrixWorld(true);const headScreen=hp.clone().project(camera);const mask=editorial?silhouette(width,h):null;renderer.render(scene,camera);lastDiagnostics={finish,direction:detail?'story2':story?'story':'classic',detailDrape:detail&&room.visible,relaxedHandJoints,pillowHeight:bedPillows[0].position.y,quiltLayers:story?Number(storyQuilt.visible)+Number(oldDrape.visible)+Number(detailDrape.visible):0,phoneDetails:phoneDetails.visible,headScreenX:headScreen.x,phoneFocus,phoneScreen:phoneFocus?phone.position.clone().project(camera).toArray().slice(0,2):null,storyRoom:story&&room.visible,artCount,...grip,...gaze,...headAim,screenIntensity:screenLight.visible?screenLight.intensity:0,inkMask:!!mask,fabricTextures:fabricMaps.size,portraitTextures:Array.from(portraitMaps.values()).reduce((n,m)=>n+m.size,0),hairGeometry:hairSurface?.active?{moved:hairSurface.result.moved,boundary:hairSurface.result.boundary,maxDelta:hairSurface.result.maxDelta,normalsChanged:hairSurface.result.normalsChanged,vertices:hairSurface.result.vertices,triangles:hairSurface.result.triangles}:null,hairRefined:detail&&film&&Array.from(materialDefaults.keys()).some(m=>m.map?.name==='Studio portrait hair-refined'),filmLighting:film,skinOutlineRatio:film?.38:1,editorialRoom:editorial&&room.visible,contactShadows:editorial&&room.visible?footShadows.filter(x=>x.visible).length:0,seated,phoneVisible:phone.visible,hipY:hips?.y??null,bedTop:bed.position.y+.608,handDistance:rh&&phone.visible?rh.distanceTo(phone.position):null,footY:raw('leftFoot')?.y??null,kneeForward:(raw('leftLowerLeg')?.z??0)-(raw('leftUpperLeg')?.z??0)};return finishFrame(width,h,finish,room.visible,mask);
 }
 let lastDiagnostics=null;
 function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lostFn);canvas.removeEventListener('webglcontextrestored',restoreFn);if(vrm){setHairSurface(false);hairSurface=null;restoreFabric();scene.remove(vrm.scene);VRMUtils.deepDispose(vrm.scene);vrm=null;}room.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.map?.dispose();o.material.dispose();}});phone.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.map?.dispose();o.material.dispose();}});materialDefaults.clear();city.dispose();storyCity.dispose();finishCanvas.width=1;finishCanvas.height=1;maskCanvas.width=1;maskCanvas.height=1;renderer.dispose();}
 return {load,draw,dispose,diagnostics:()=>lastDiagnostics&&{...lastDiagnostics}};
}
window.MangaVRM={createStudio,validateVRM};
