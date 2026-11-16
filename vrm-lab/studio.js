import * as T from 'three';
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
 scene.add(new T.HemisphereLight(0xa4c3ef,0x393046,.85));
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
 const pane=new T.Mesh(new T.PlaneGeometry(3.9,2.15),new T.MeshBasicMaterial({map:city}));pane.position.z=.065;win.add(pane);
 for(const x of [-2,0,2])box(.065,2.25,.12,x,0,.11,0x64758c,win);
 for(const y of [-1.11,0,1.11])box(4.08,.065,.12,0,y,.11,0x64758c,win);
 box(4.22,.13,.33,0,-1.15,.16,0x525d73,win);
 const bed=new T.Group();room.add(bed);
 round(1.72,.28,2.05,0,.19,0,0x292c40,bed);
 round(1.75,.19,2.05,0,.425,0,0x8390a6,bed,.075);
 round(1.79,.13,1.63,0,.54,.19,0x304669,bed,.055);
 round(1.79,.85,.13,0,.67,-1.03,0x453c4c,bed,.045);
 for(const xx of [-.45,.45]){const p=round(.74,.16,.44,xx,.57,-.72,0xb3bccd,bed,.075);p.rotation.x=-.12;}
 for(let i=0;i<7;i++){box(1.68,.007,.012,0,.608,-.55+i*.23,0x536483,bed);box(.012,.007,1.54,-.72+i*.24,.608,.19,0x536483,bed);}
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
 const screenLight=new T.PointLight(0x8dbdff,.16,.42,2);scene.add(screenLight);screenLight.visible=false;
 const materialDefaults=new Map();
 let vrm=null,height=0,disposed=false,lost=false,busy=false;const lostFn=e=>{e.preventDefault();lost=true;};const restoreFn=()=>{lost=false;};canvas.addEventListener('webglcontextlost',lostFn);canvas.addEventListener('webglcontextrestored',restoreFn);
 const check=()=>{if(disposed||lost)throw Error('Motor gráfico indisponível.');};
 async function load(buffer){check();if(busy)throw Error('Carregamento em andamento.');busy=true;let candidate;try{const stats=validateVRM(buffer);const manager=new T.LoadingManager();manager.setURLModifier(u=>{if(!u.startsWith('blob:')&&!u.startsWith('data:'))throw Error('Recurso externo bloqueado.');return u;});const loader=new GLTFLoader(manager);loader.register(p=>new VRMLoaderPlugin(p));const g=await loader.parseAsync(buffer,'');candidate=g.userData.vrm;if(!candidate){VRMUtils.deepDispose(g.scene);throw Error('Avatar sem humanoide.');}check();VRMUtils.rotateVRM0(candidate);candidate.scene.updateMatrixWorld(true);const size=new T.Box3().setFromObject(candidate.scene).getSize(new T.Vector3());if(!Number.isFinite(size.y)||size.y<.4||size.y>4)throw Error('Altura inválida.');candidate.scene.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});if(vrm){scene.remove(vrm.scene);VRMUtils.deepDispose(vrm.scene);}vrm=candidate;candidate=null;height=size.y;scene.add(vrm.scene);materialDefaults.clear();vrm.scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m?.shadeColorFactor||materialDefaults.has(m))continue;materialDefaults.set(m,{color:m.color?.clone(),shade:m.shadeColorFactor.clone(),toony:m.shadingToonyFactor,shift:m.shadingShiftFactor,gi:m.giEqualizationFactor,rim:m.parametricRimColorFactor?.clone(),rimMix:m.rimLightingMixFactor});}});return stats;}finally{if(candidate)VRMUtils.deepDispose(candidate.scene);busy=false;}}

 function bone(n,x=0,y=0,z=0){const b=vrm.humanoid.getNormalizedBoneNode(n);if(b)b.rotation.set(x,y,z);}
 function raw(n){return vrm.humanoid.getRawBoneNode(n)?.getWorldPosition(new T.Vector3());}
 function aim(n,child,target){const b=vrm.humanoid.getNormalizedBoneNode(n),c=vrm.humanoid.getNormalizedBoneNode(child);if(!b||!c||!b.parent)return; b.updateWorldMatrix(true,false);c.updateWorldMatrix(true,false);const p=b.getWorldPosition(new T.Vector3()),q=c.getWorldPosition(new T.Vector3());const from=q.sub(p).normalize(),to=target.clone().sub(p).normalize();if(from.lengthSq()<.9||to.lengthSq()<.9)return;const delta=new T.Quaternion().setFromUnitVectors(from,to),world=b.getWorldQuaternion(new T.Quaternion());const parent=b.parent.getWorldQuaternion(new T.Quaternion()).invert();b.quaternion.copy(parent.multiply(delta.multiply(world)));b.updateWorldMatrix(true,true);}
 // A grip is articulated with existing humanoid finger bones, never with replacement geometry.
 function updatePose(){vrm.update(0);scene.updateMatrixWorld(true);}
 function gripPhone(head,rh){
  const middle=raw('rightMiddleProximal'),index=raw('rightIndexProximal'),little=raw('rightLittleProximal');if(!middle||!index||!little)return {gripJoints:0,gripError:null};
  const up=middle.clone().sub(rh).normalize(),toward=head.clone().sub(middle);const normal=toward.addScaledVector(up,-toward.dot(up)).normalize();if(normal.lengthSq()<.9)return {gripJoints:0,gripError:null};
  const right=new T.Vector3().crossVectors(up,normal).normalize();normal.crossVectors(right,up).normalize();phone.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(right,up,normal));
  phone.position.copy(middle).addScaledVector(up,.017).addScaledVector(normal,.023);
  const width=.071,half=width*.5;let joints=0,distances=[];
  for(const name of ['Index','Middle','Ring','Little']){const prefix='right'+name,base=raw(prefix+'Proximal'),mid=raw(prefix+'Intermediate'),tip=raw(prefix+'Distal');if(!base||!mid||!tip)continue;
   const side=base.clone().sub(phone.position).dot(right)>=0?1:-1,edge=phone.position.clone().addScaledVector(right,side*(half+.008));
   // Curl first phalanx toward the side of the handset; the next folds over the edge.
   const direction=mid.clone().sub(base).normalize().multiplyScalar(.55).add(normal.clone().multiplyScalar(.75)).add(right.clone().multiplyScalar(-side*.19)).normalize();
   aim(prefix+'Proximal',prefix+'Intermediate',base.clone().add(direction));updatePose();joints++;
   const m=raw(prefix+'Intermediate');if(m){const towardEdge=edge.clone().addScaledVector(up,(base.clone().sub(middle).dot(up))*.6).addScaledVector(normal,.018);aim(prefix+'Intermediate',prefix+'Distal',towardEdge);updatePose();joints++;const d=raw(prefix+'Distal');if(d)distances.push(d.distanceTo(edge));}
  }
  const thumb=raw('rightThumbProximal');if(thumb&&raw('rightThumbDistal')){const side=thumb.clone().sub(phone.position).dot(right)>=0?1:-1;aim('rightThumbProximal','rightThumbDistal',phone.position.clone().addScaledVector(right,side*.024).addScaledVector(up,-.025).addScaledVector(normal,.013));updatePose();joints++;}
  return {gripJoints:joints,gripError:distances.length?Math.max(...distances):null};
 }
 // Preserve each imported avatar's own material values. Only the bundled sample's top is recolored.
 function artMaterials(finish){let count=0;for(const [m,d] of materialDefaults){if(d.color&&m.color)m.color.copy(d.color);m.shadeColorFactor.copy(d.shade);m.shadingToonyFactor=d.toony;m.shadingShiftFactor=d.shift;m.giEqualizationFactor=d.gi;if(d.rim&&m.parametricRimColorFactor)m.parametricRimColorFactor.copy(d.rim);m.rimLightingMixFactor=d.rimMix;if(finish!=='cinema')continue;count++;const name=m.name||'';const face=/Face_00_SKIN|Body_00_SKIN/.test(name),cloth=/CLOTH/.test(name),hair=/HAIR/.test(name);if(face||cloth||hair){m.shadingToonyFactor=.82;m.shadingShiftFactor=-.12;m.giEqualizationFactor=hair?.50:.32;m.shadeColorFactor.multiplyScalar(face?.79:.68);if(m.parametricRimColorFactor)m.parametricRimColorFactor.set(hair?0x202c40:0x263447);m.rimLightingMixFactor=.85;}if(/M00_006_01_Tops_01_CLOTH/.test(name)&&m.color){m.color.multiply(new T.Color(0x596c92));m.shadeColorFactor.multiply(new T.Color(0x7189bd));}}return count;}
 // Non-generative, bounded image finishing. Alpha remains unchanged for compositing.
 const finishCanvas=document.createElement('canvas'),finishCtx=finishCanvas.getContext('2d',{willReadFrequently:true});
 function finishFrame(width,h,style,opaque){if(style!=='cinema')return canvas.toDataURL('image/png');finishCanvas.width=width;finishCanvas.height=h;finishCtx.drawImage(canvas,0,0);const image=finishCtx.getImageData(0,0,width,h),p=image.data,source=new Uint8ClampedArray(p);
 const lum=i=>.2126*source[i]+.7152*source[i+1]+.0722*source[i+2],clamp=v=>Math.max(0,Math.min(255,v));
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<width;xx++){const i=(yy*width+xx)*4;if(!source[i+3])continue;const l=lum(i),left=i-4,right=i+4,up=i-width*4,down=i+width*4;
 let edge=0;if(xx>0&&xx<width-1&&yy>0&&yy<h-1&&source[left+3]&&source[right+3]&&source[up+3]&&source[down+3])edge=Math.min(.24,Math.max(0,(Math.abs(lum(left)-lum(right))+Math.abs(lum(up)-lum(down))-46)/230));
 const nx=(xx-width*.5)/(width*.5),ny=(yy-h*.46)/(h*.65),v=opaque?1-.18*Math.min(1,nx*nx+ny*ny):1,shadow=1-l/255,contrast=(l-110)*.065;
 p[i]=clamp((source[i]+contrast-5*shadow)*(1-edge)*v);p[i+1]=clamp((source[i+1]+contrast-2*shadow)*(1-edge)*v);p[i+2]=clamp((source[i+2]+contrast+7*shadow)*(1-edge)*v);}
 finishCtx.putImageData(image,0,0);return finishCanvas.toDataURL('image/png');}
 function draw({pose='stand',expression='neutral',shot='medium',yaw=0,pitch=0,zoom=1,x=0,y=0,light='dramatic',background='room',aspect=1.6,finish='original'}={}){
 check();if(!vrm)throw Error('Importe um avatar.');const a=Math.max(.8,Math.min(3,Number(aspect)||1.6)),width=1024,h=Math.round(width/a);renderer.setSize(width,h,false);camera.aspect=width/h;camera.updateProjectionMatrix();vrm.humanoid.resetNormalizedPose();vrm.scene.position.set(0,0,0);
 const artCount=artMaterials(finish);const seated=pose==='sit';const holding=pose==='phone'||seated;const acting=finish==='cinema';let grip={gripJoints:0,gripError:null},gaze={gazeYaw:0,gazePitch:0,gazeApplied:false};if(vrm.lookAt){vrm.lookAt.target=null;vrm.lookAt.reset();}
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
 const em=vrm.expressionManager;em?.resetValues();const set=(n,v)=>{if(em?.getExpression(n))em.setValue(n,v);};const names={surprise:['surprised','Surprised','aa'],sad:['sad'],worry:['sad','oh'],happy:['happy']};if(acting){if(expression==='worry'){set('sad',.42);set('angry',.16);set('oh',.12);}else if(expression==='surprise'){set(em?.getExpression('Surprised')?'Surprised':'surprised',.58);set('aa',.24);}else if(expression==='sad'){set('sad',.68);set('blink',.08);}else if(expression==='happy'){set('happy',.65);}else if(holding){set('blink',.075);}}else for(const n of names[expression]||[])set(n,n==='oh'?.22:.65);updatePose();

 room.visible=background==='room';scene.background=room.visible?new T.Color(0x182b48):null;
 const hips=raw('hips'),head=raw('head'),rh=raw('rightHand'),lh=raw('leftHand');
 if(seated&&hips){bed.position.set(hips.x,hips.y-.70,hips.z-.98);}else bed.position.set(1.28,0,-1.42);
 phone.visible=holding&&!!rh&&!!head;
 if(phone.visible){phone.position.copy(rh);const palm=raw('rightMiddleProximal');if(palm)phone.position.lerp(palm,.76);else phone.position.y+=height*.022;phone.position.z+=.018;phone.lookAt(head);if(acting){grip=gripPhone(head,rh);if(vrm.lookAt){vrm.lookAt.lookAt(phone.position);vrm.lookAt.yaw=T.MathUtils.clamp(vrm.lookAt.yaw,-28,28);vrm.lookAt.pitch=T.MathUtils.clamp(vrm.lookAt.pitch,-30,30);gaze={gazeYaw:vrm.lookAt.yaw,gazePitch:vrm.lookAt.pitch,gazeApplied:true};updatePose();}}}
 screenLight.visible=acting&&phone.visible;if(screenLight.visible){screenLight.position.copy(phone.position).add(new T.Vector3(0,.025,.035).applyQuaternion(phone.quaternion));}
 key.color.set(light==='cool'?0xaccbff:0xffcba0);key.intensity=light==='warm'?2.1:1.65;rim.intensity=light==='warm'?.5:2.0;fill.intensity=light==='cool'?.8:.45;if(finish==='cinema'){key.intensity*=.78;fill.intensity*=.7;rim.intensity*=1.18;}
 const hp=vrm.humanoid.getRawBoneNode('head')?.getWorldPosition(new T.Vector3());if(!hp)throw Error('Cabeça ausente.');const target=hp.clone(),z=Math.max(1,Math.min(2.8,Number(zoom)||1)),clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||0));
 target.y+=height*(shot==='close'?.015:shot==='wide'?(seated?-.29:-.39):-.19)+clamp(y,-1,1)*height*.25;target.x+=clamp(x,-1,1)*height*.25;
 const d=height*(shot==='close'?.63:shot==='wide'?(seated?(acting?1.55:1.45):1.85):1.25)/z,angle=T.MathUtils.degToRad(clamp(yaw,-65,65)),tilt=T.MathUtils.degToRad(clamp(pitch,-30,30));
 camera.position.set(target.x+Math.sin(angle)*d,target.y+Math.sin(tilt)*d,target.z+Math.cos(angle)*Math.cos(tilt)*d);camera.lookAt(target);renderer.render(scene,camera);lastDiagnostics={finish,artCount,...grip,...gaze,seated,phoneVisible:phone.visible,hipY:hips?.y??null,bedTop:bed.position.y+.608,handDistance:rh&&phone.visible?rh.distanceTo(phone.position):null,footY:raw('leftFoot')?.y??null,kneeForward:(raw('leftLowerLeg')?.z??0)-(raw('leftUpperLeg')?.z??0)};return finishFrame(width,h,finish,room.visible);
 }
 let lastDiagnostics=null;
 function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lostFn);canvas.removeEventListener('webglcontextrestored',restoreFn);if(vrm){scene.remove(vrm.scene);VRMUtils.deepDispose(vrm.scene);vrm=null;}room.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.map?.dispose();o.material.dispose();}});phone.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});materialDefaults.clear();finishCanvas.width=1;finishCanvas.height=1;renderer.dispose();}
 return {load,draw,dispose,diagnostics:()=>lastDiagnostics&&{...lastDiagnostics}};
}
window.MangaVRM={createStudio,validateVRM};
