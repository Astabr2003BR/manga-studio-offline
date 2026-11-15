import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
const status=document.querySelector('#status'),out=document.querySelector('#page'),ctx=out.getContext('2d');
window.labState='loading';
async function initialize(){
try{
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(1040,610);renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene();scene.background=new T.Color(0x14253e);
const camera=new T.PerspectiveCamera(35,1040/610,.03,40);
scene.add(new T.HemisphereLight(0xd1e3ff,0x453b4a,1.6));
function light(color,intensity,x,y,z){const l=new T.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);}
light(0xffcba0,2.5,3,3,5);light(0x78a7ff,2.4,-4,3,-1);
function box(w,h,d,x,y,z,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color:c,roughness:.85}));m.position.set(x,y,z);scene.add(m);return m;}
box(8,.1,8,0,-.06,0,0x283245);box(8,4,.1,0,2,-2.8,0x293b56);
box(3.6,2,.08,-1.1,2.3,-2.7,0x111f39);box(.07,2.1,.1,-1.1,2.3,-2.62,0x627b99);box(3.7,.07,.1,-1.1,2.3,-2.62,0x627b99);
for(let i=0;i<16;i++){const x=-2.7+i*.2,h=.22+(i*7%9)*.09;box(.16,h,.03,x,1.3+h/2,-2.57,0x202d45);for(let j=0;j<3;j++)if((i+j)%3===0)box(.035,.05,.02,x,1.36+j*.12,-2.54,0xf2cb8c);}
box(2.1,.28,1.15,1.2,.23,-1.65,0x353c57);box(2.1,.16,1.15,1.2,.45,-1.65,0x8a98b4);box(1.45,.09,1.08,1.5,.57,-1.65,0x384e79);box(.45,.11,.8,.39,.58,-1.65,0xc2ccdd);
box(.55,.65,.5,-2.1,.32,-1.3,0x69504d);box(.12,.4,.12,-2.1,.85,-1.3,0x8b7060);box(.36,.22,.32,-2.1,1.13,-1.3,0xe9ae78);
const lamp=new T.PointLight(0xffb36c,6,4);lamp.position.set(-2.1,1.15,-1.1);scene.add(lamp);
const loader=new GLTFLoader();loader.register(p=>new VRMLoaderPlugin(p));
const gltf=await loader.loadAsync('./character.vrm');const vrm=gltf.userData.vrm;if(!vrm)throw Error('Invalid VRM');
VRMUtils.rotateVRM0(vrm);scene.add(vrm.scene);
let meshes=0,bones=0;vrm.scene.traverse(o=>{if(o.isMesh){meshes++;o.frustumCulled=false;}if(o.isBone)bones++;});
vrm.humanoid.resetNormalizedPose();
function bone(n,x,y,z){const b=vrm.humanoid.getNormalizedBoneNode(n);if(b)b.rotation.set(x,y,z);}
bone('leftUpperArm',0,0,1.15);bone('rightUpperArm',0,0,-1.15);bone('rightLowerArm',-.6,0,0);bone('head',.04,-.12,0);
vrm.update(0);scene.updateMatrixWorld(true);
const head=vrm.humanoid.getNormalizedBoneNode('head');if(!head)throw Error('Missing head bone');
const hp=head.getWorldPosition(new T.Vector3());const bounds=new T.Box3().setFromObject(vrm.scene),height=bounds.getSize(new T.Vector3()).y;
if(!Number.isFinite(height)||height<.4||height>4)throw Error('Invalid model height '+height);
const em=vrm.expressionManager;
function expression(){const name=document.querySelector('#expression').value;em?.resetValues();if(name!=='neutral'){if(!em?.getExpression(name))throw Error('Missing expression '+name);em.setValue(name,.9);}vrm.update(0);}
function shot(close){const target=hp.clone();target.y+=close?height*.015:-height*.20;const d=height*(close?.57:1.42);camera.position.set(target.x+d*.14,target.y+height*.015,target.z+d);camera.lookAt(target);renderer.render(scene,camera);ctx.drawImage(renderer.domElement,20,close?700:55,1040,610);}
function bubble(x,y,w,s){ctx.fillStyle='#fffefa';ctx.strokeStyle='#1b2334';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,w,70,28);ctx.fill();ctx.stroke();ctx.fillStyle='#172030';ctx.font='bold 27px system-ui';ctx.textAlign='center';ctx.fillText(s,x+w/2,y+43);}
function draw(){expression();ctx.fillStyle='#eeeee9';ctx.fillRect(0,0,1080,1350);shot(false);shot(true);ctx.strokeStyle='#161d2a';ctx.lineWidth=4;ctx.strokeRect(20,55,1040,610);ctx.strokeRect(20,700,1040,610);ctx.fillStyle='#26364b';ctx.font='bold 25px system-ui';ctx.textAlign='left';ctx.fillText('MANGA STUDIO | LABORATÓRIO VRM',24,35);bubble(40,75,220,'03:00');bubble(675,1220,350,'Quem está aí?');}
draw();window.labStats={meshes,bones,height,expressions:Object.keys(em?.expressionMap||{})};window.labState='ready';status.textContent='Modelo VRM carregado e renderizado.';
document.querySelector('#expression').onchange=draw;
const btn=document.querySelector('#save');btn.disabled=false;btn.onclick=()=>out.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download='manga-vrm.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);},'image/png');
}catch(e){window.labState='error';window.labError=String(e.message||e);status.textContent='Erro: '+window.labError;console.error(e);}

}
void initialize();
