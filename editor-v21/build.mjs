import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';import {dirname,join} from 'node:path';
const root=dirname(fileURLToPath(import.meta.url)),lab=join(root,'../vrm-lab/studio-dist');let html=await readFile(join(root,'index.html'),'utf8');
const model=await readFile(join(lab,'character.vrm'));if(model.length!==18481892||createHash('sha1').update('blob '+model.length+'\0').update(model).digest('hex')!=='46e8c583ce5df3b8ee167141b59ba3ad583a2687')throw Error('Model integrity failed');
const escape=s=>s.replace(/<\/script/gi,'<\\/script');const runtime=await readFile(join(lab,'runtime.js'),'utf8');
function replace(a,b){if(html.split(a).length!==2)throw Error('Missing or duplicate marker '+a);html=html.replace(a,()=>b);}
replace('<!-- VRM_BUNDLE -->','<script>window.MANGA_VRM_OFFLINE=true;'+escape(runtime)+'</script><script type="application/octet-stream" id="vrm-embedded-model">'+model.toString('base64')+'</script>');
for(const f of ['panel-vrm.js','commands.js','web.js'])replace('<script src="./'+f+'"></script>','<script>'+escape(await readFile(join(root,f),'utf8'))+'</script>');
html=html.replace('<link rel="manifest" href="./manifest.webmanifest">','').replace(/<script type="importmap">[\s\S]*?<\/script>/,'');
await mkdir(join(root,'dist'),{recursive:true});await writeFile(join(root,'dist/Manga-Studio-Offline-v0.21.html'),html);await copyFile(join(lab,'ASSETS.md'),join(root,'dist/ASSETS.md'));console.log('PORTABLE_BUILD_OK',Buffer.byteLength(html));