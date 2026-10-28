import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const samples=[
 '',
 'Le chat regarde les chats. Le chat regardait les chats.',
 "L’enfant s’éveille ; l'enfant s'éveille. Aujourd’hui, c’est l’automne.",
 'Ils étaient partis, elles partaient et nous partirons demain.',
 'Un xylophoniste observe des motsinconnus et des motsinconnus.',
 'Bonjour ! Bonjour ? BONJOUR… « Bonjour ».',
 'Éléphant, éléphants ; château, châteaux ; porte-monnaie.',
 'Les oiseaux volent. Les oiseaux volaient. Les oiseaux voleront.',
 '« Il a dit : je suis là ! » répondit-elle.',
 'Un mot. Un autre mot. Une troisième phrase, un peu plus longue.'
];
const browser=await chromium.launch({headless:true});
try {
 const a=await browser.newPage(),b=await browser.newPage();
 await Promise.all([a.goto('http://127.0.0.1:8765/'),b.goto('http://127.0.0.1:8766/')]);
 await Promise.all([a.waitForFunction(()=>document.querySelector('#diversity-score')?.textContent==='—'),b.waitForFunction(()=>document.querySelector('#diversity-score')?.textContent==='—')]);
 for(const sample of samples){
  await Promise.all([a.locator('#input').fill(sample),b.locator('#input').fill(sample)]);
  await a.waitForTimeout(350);await b.waitForTimeout(350);
  for(const id of ['diversity-score','coverage','detail','lemmas','uniques']){
   const [x,y]=await Promise.all([a.locator('#'+id).textContent(),b.locator('#'+id).textContent()]);
   assert.equal(x,y,'Écart entre Redac Lab v2 et Lexi Lab pour '+id+' sur '+JSON.stringify(sample));
  }
  const [r1,r2]=await Promise.all([a.locator('#table').innerHTML(),b.locator('#table').innerHTML()]);
  assert.equal(r1,r2,'Écart dans les unités lexicales sur '+JSON.stringify(sample));
 }
 console.log('OK : '+samples.length+' textes identiques, diversité, couverture, segmentation, lemmes et catégories.');
}finally{await browser.close();}
