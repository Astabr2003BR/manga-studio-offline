import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const mime={'index.html':'text/html','main.js':'text/javascript','character.vrm':'application/octet-stream'};
const server=createServer(async(req,res)=>{const n=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!Object.hasOwn(mime,n)){res.writeHead(404);return res.end();}try{res.setHeader('Content-Type',mime[n]);res.end(await readFile('dist/'+n));}catch{res.writeHead(500);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:'+server.address().port);
await page.waitForFunction(()=>['ready','error'].includes(window.labState),{},{timeout:120000});
const s=await page.evaluate(()=>({state:window.labState,error:window.labError,stats:window.labStats}));
assert.equal(s.state,'ready',s.error);assert.ok(s.stats.meshes>0&&s.stats.bones>10);
const canvas=page.locator('#page'),before=await canvas.evaluate(c=>c.toDataURL());
await page.locator('#expression').selectOption('happy');
const after=await canvas.evaluate(c=>c.toDataURL());
assert.notEqual(before,after,'Expression must change actual rendered pixels');
assert.equal(errors.length,0,errors.join(';'));
await page.locator('#expression').selectOption('neutral');
await mkdir('evidence',{recursive:true});
await writeFile('evidence/page-vrm.png',Buffer.from((await canvas.evaluate(c=>c.toDataURL())).split(',')[1],'base64'));
const downloadPromise=page.waitForEvent('download');await page.locator('#save').click();const download=await downloadPromise;await download.saveAs('evidence/exported.png');
const a=await readFile('evidence/page-vrm.png'),b=await readFile('evidence/exported.png');assert.deepEqual(a,b);
await writeFile('evidence/report.json',JSON.stringify({...s,expressionChanged:true,exportIdentical:true,errors},null,2));
console.log('REAL_RENDER_PASS',JSON.stringify(s));
}finally{if(browser)await browser.close();server.close();}
