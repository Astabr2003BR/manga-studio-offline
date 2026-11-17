import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const mime={'index.html':'text/html','runtime.js':'text/javascript','character.vrm':'application/octet-stream'};
const server=createServer(async(req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
  if(!Object.hasOwn(mime,name)){res.writeHead(404);return res.end();}
  try{res.setHeader('Content-Type',mime[name]);res.end(await readFile('studio-dist/'+name));}
  catch{res.writeHead(500);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>window.ready||window.failure,{},{timeout:120000});
  assert.equal(await page.evaluate('window.failure'),null);
  const shots=[];
  for(const [label,yaw] of [['left',-25],['front',0],['right',25]]){
    const result=await page.evaluate(yaw=>{
      const data=studio.draw({pose:'sit',expression:'neutral',shot:'close',direction:'story2',finish:'film',yaw,focus:'phone',background:'room',aspect:1.6});
      return {data,diagnostics:studio.diagnostics()};
    },yaw);
    const d=result.diagnostics;
    assert.equal(d.direction,'story2');assert.equal(d.seated,true);assert.equal(d.phoneFocus,true);
    assert.equal(d.fingerCurls.length,4);assert.equal(d.fingerIK.length,4);
    assert.ok(Number.isFinite(d.contactMean));assert.ok(Number.isFinite(d.gripError));
    assert.ok(d.phoneScreen&&Math.abs(d.phoneScreen[0])<.15&&Math.abs(d.phoneScreen[1])<.15);
    assert.ok(shots.every(previous=>previous.data!==result.data),'Camera angles must render distinct images');
    shots.push({label,yaw,data:result.data,diagnostics:d});
    await mkdir('studio-evidence/grip-fast',{recursive:true});
    await writeFile('studio-evidence/grip-fast/'+label+'.png',Buffer.from(result.data.split(',')[1],'base64'));
  }
  assert.equal(errors.length,0,errors.join(';'));
  await writeFile('studio-evidence/grip-fast/report.json',JSON.stringify({
    model:await page.evaluate('window.stats'),
    views:shots.map(({data,...shot})=>shot),
    pixelDistinct:shots.every((shot,index)=>index===0||shot.data!==shots[index-1].data),
    errors
  },null,2));
  console.log('FAST_GRIP_VISUAL_GATE_PASS',JSON.stringify(shots.map(({data,...s})=>({label:s.label,yaw:s.yaw,contactMean:s.diagnostics.contactMean,gripError:s.diagnostics.gripError,wristRoll:s.diagnostics.wristRoll,fingerCurls:s.diagnostics.fingerCurls}))));
}finally{await browser?.close();server.close();}
