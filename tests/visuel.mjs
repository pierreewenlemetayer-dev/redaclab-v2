import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', {recursive:true});
const browser=await chromium.launch({headless:true});
try {
 for (const viewport of [{width:1366,height:900,name:'ordinateur'},{width:390,height:844,name:'mobile'}]) {
  const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/');
  await page.waitForFunction(()=>document.querySelector('#mots')?.textContent==='0');
  const input=page.locator('#input');
  await input.fill('Le chat regarde les chats. Le chat regardait les chats.\nJe suis ici et il fait beau.');
  await page.waitForTimeout(500);
  for (const [mode,id] of [['frequences','highlight-enabled'],['repetitions','repetition-enabled'],['verbes','verbs-enabled'],['phrase-longue','longest-enabled']]) {
   await page.locator('#'+id).check();
   const alignment=await page.evaluate(()=>{
    const t=document.querySelector('#input'),h=document.querySelector('#highlight');
    const a=t.getBoundingClientRect(),b=h.getBoundingClientRect();
    const ts=getComputedStyle(t),hs=getComputedStyle(h);
    return {dx:Math.abs(a.left-b.left),dy:Math.abs(a.top-b.top),width:Math.abs(a.width-b.width),font:ts.font===hs.font,padding:ts.padding===hs.padding,lineHeight:ts.lineHeight===hs.lineHeight};
   });
   assert.ok(alignment.dx<=2&&alignment.dy<=2&&alignment.width<=2,'Calque mal aligné : '+JSON.stringify(alignment));
   assert.ok(alignment.font&&alignment.padding&&alignment.lineHeight,'Typographie calque différente : '+JSON.stringify(alignment));
   await page.screenshot({path:'artifacts/'+viewport.name+'-'+mode+'.png',fullPage:true});
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=2,'Débordement horizontal sur '+viewport.name+' : '+overflow+' px');
  await page.emulateMedia({media:'print'});
  await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('#print-sheet').isVisible(),true,'Document imprimable absent');
  await page.pdf({path:'artifacts/'+viewport.name+'-impression.pdf',format:'A4',printBackground:true});
  assert.deepEqual(errors,[],'Erreurs JavaScript : '+errors.join(', '));
  await page.close();
 }
 console.log('OK : captures, calques alignés, mise en page mobile et PDF.');
} finally {await browser.close();}
