import * as T from 'three';
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
 scene.add(new T.HemisphereLight(0xa4c3ef,0x393046,.85));
 const light=(color,intensity,x,y,z)=>{const l=new T.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);return l;};
 const key=light(0xffcba0,1.6,3,3,5),rim=light(0x78a7ff,1.5,-4,3,-1),fill=light(0x9bbfff,.35,-2,1,3);
 const room=new T.Group();scene.add(room);
 const box=(w,h,d,x,y,z,color,parent=room)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);parent.add(m);return m;};
 box(8,.1,8,0,-.06,0,0x283245);box(8,4,.1,0,2,-2.8,0x293b56);
 box(3.6,2,.08,-1.1,2.3,-2.7,0x111f39);box(.07,2.1,.1,-1.1,2.3,-2.62,0x627b99);box(3.7,.07,.1,-1.1,2.3,-2.62,0x627b99);
 for(let i=0;i<16;i++){const x=-2.7+i*.2,h=.22+(i*7%9)*.09;box(.16,h,.03,x,1.3+h/2,-2.57,0x202d45);for(let j=0;j<3;j++)if((i+j)%3===0)box(.035,.05,.02,x,1.36+j*.12,-2.54,0xf2cb8c);}
 box(2.1,.28,1.15,1.2,.23,-1.65,0x353c57);box(2.1,.16,1.15,1.2,.45,-1.65,0x8a98b4);box(1.45,.09,1.08,1.5,.57,-1.65,0x384e79);box(.45,.11,.8,.39,.58,-1.65,0xc2ccdd);
 box(.55,.65,.5,-2.1,.32,-1.3,0x69504d);box(.12,.4,.12,-2.1,.85,-1.3,0x8b7060);box(.36,.22,.32,-2.1,1.13,-1.3,0xe9ae78);
 const lamp=new T.PointLight(0xffb36c,3,4);lamp.position.set(-2.1,1.15,-1.1);room.add(lamp);
 const seat=box(.56,.44,.55,0,.22,-.12,0x4a5067);seat.visible=false;
 const phone=new T.Group();scene.add(phone);box(.073,.145,.012,0,0,0,0x17202c,phone);box(.062,.13,.003,0,0,.007,0x729dc3,phone);phone.visible=false;
 let vrm=null,height=0,disposed=false,lost=false,busy=false;const lostFn=e=>{e.preventDefault();lost=true;};const restoreFn=()=>{lost=false;};canvas.addEventListener('webglcontextlost',lostFn);canvas.addEventListener('webglcontextrestored',restoreFn);
 const check=()=>{if(disposed||lost)throw Error('Motor gráfico indisponível.');};
 async function load(buffer){check();if(busy)throw Error('Carregamento em andamento.');busy=true;let candidate;try{const stats=validateVRM(buffer);const manager=new T.LoadingManager();manager.setURLModifier(u=>{if(!u.startsWith('blob:')&&!u.startsWith('data:'))throw Error('Recurso externo bloqueado.');return u;});const loader=new GLTFLoader(manager);loader.register(p=>new VRMLoaderPlugin(p));const g=await loader.parseAsync(buffer,'');candidate=g.userData.vrm;if(!candidate){VRMUtils.deepDispose(g.scene);throw Error('Avatar sem humanoide.');}check();VRMUtils.rotateVRM0(candidate);candidate.scene.updateMatrixWorld(true);const size=new T.Box3().setFromObject(candidate.scene).getSize(new T.Vector3());if(!Number.isFinite(size.y)||size.y<.4||size.y>4)throw Error('Altura inválida.');candidate.scene.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});if(vrm){scene.remove(vrm.scene);VRMUtils.deepDispose(vrm.scene);}vrm=candidate;candidate=null;height=size.y;scene.add(vrm.scene);return stats;}finally{if(candidate)VRMUtils.deepDispose(candidate.scene);busy=false;}}
 function bone(n,x=0,y=0,z=0){const b=vrm.humanoid.getNormalizedBoneNode(n);if(b)b.rotation.set(x,y,z);}
 function draw({pose='stand',expression='neutral',shot='medium',yaw=0,pitch=0,zoom=1,x=0,y=0,light='dramatic',background='room',aspect=1.6}={}){
 check();if(!vrm)throw Error('Importe um avatar.');const a=Math.max(.8,Math.min(3,Number(aspect)||1.6)),width=768,h=Math.round(width/a);renderer.setSize(width,h,false);camera.aspect=width/h;camera.updateProjectionMatrix();vrm.humanoid.resetNormalizedPose();vrm.scene.position.set(0,pose==='sit'?-.43:0,0);
 bone('leftUpperArm',0,0,1.15);bone('rightUpperArm',0,0,-1.15);bone('leftLowerArm',-.08,0,0);bone('rightLowerArm',-.10,0,0);
 if(pose==='phone'){bone('rightUpperArm',-.38,0,-1.04);bone('rightLowerArm',-1.22,0,-.1);bone('head',.14,-.1,0);}
 if(pose==='sit'){bone('leftUpperLeg',-1.4,0,0);bone('rightUpperLeg',-1.4,0,0);bone('leftLowerLeg',1.4,0,0);bone('rightLowerLeg',1.4,0,0);bone('spine',.10,0,0);}
 if(pose==='walk'){bone('leftUpperLeg',-.32,0,0);bone('rightUpperLeg',.32,0,0);bone('rightLowerLeg',.25,0,0);bone('leftUpperArm',.24,0,1.15);bone('rightUpperArm',-.24,0,-1.15);}
 const em=vrm.expressionManager;em?.resetValues();const names={surprise:['surprised','Surprised','aa'],sad:['sad'],worry:['sad','oh'],happy:['happy']};for(const n of names[expression]||[])if(em?.getExpression(n))em.setValue(n,n==='oh'?.22:.65);vrm.update(0);scene.updateMatrixWorld(true);
 room.visible=background==='room';seat.visible=room.visible&&pose==='sit';scene.background=room.visible?new T.Color(0x182b48):null;phone.visible=pose==='phone';if(phone.visible){const hand=vrm.humanoid.getRawBoneNode('rightHand');if(hand){hand.getWorldPosition(phone.position);phone.position.y+=.035;phone.position.z+=.035;phone.rotation.set(-.15,-.1,.14);}else phone.visible=false;}
 key.color.set(light==='cool'?0xaccbff:0xffcba0);key.intensity=light==='warm'?1.8:1.45;rim.intensity=light==='warm'?.4:1.5;fill.intensity=light==='cool'?.65:.35;
 const hp=vrm.humanoid.getRawBoneNode('head')?.getWorldPosition(new T.Vector3());if(!hp)throw Error('Cabeça ausente.');const target=hp.clone(),z=Math.max(1,Math.min(2.8,Number(zoom)||1)),clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||0));
 target.y+=height*(shot==='close'?.015:shot==='wide'?-.39:-.19)+clamp(y,-1,1)*height*.25;target.x+=clamp(x,-1,1)*height*.25;
 const d=height*(shot==='close'?.63:shot==='wide'?2.05:1.33)/z,angle=T.MathUtils.degToRad(clamp(yaw,-65,65)),tilt=T.MathUtils.degToRad(clamp(pitch,-30,30));
 camera.position.set(target.x+Math.sin(angle)*d,target.y+Math.sin(tilt)*d,target.z+Math.cos(angle)*Math.cos(tilt)*d);camera.lookAt(target);renderer.render(scene,camera);return canvas.toDataURL('image/png');
 }
 function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lostFn);canvas.removeEventListener('webglcontextrestored',restoreFn);if(vrm){scene.remove(vrm.scene);VRMUtils.deepDispose(vrm.scene);vrm=null;}room.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});phone.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});renderer.dispose();}
 return {load,draw,dispose};
}
window.MangaVRM={createStudio,validateVRM};
