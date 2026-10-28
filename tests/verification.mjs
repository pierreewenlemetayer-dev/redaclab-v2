import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({headless:true});
const page = await browser.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try {
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.waitForFunction(()=>document.querySelector('#mots')?.textContent==='0' && document.querySelector('#input')?.value==='',{timeout:30000});
 const input=page.locator('#input');
 await input.fill('Le chat regarde les chats. Le chat regardait les chats.');
 await page.waitForTimeout(500);
 assert.equal(await page.locator('#repetitions').textContent(),'4','Le regroupement lexical doit compter les quatre occurrences de chat/chats');
 await page.locator('#repetition-enabled').check();
 assert.equal(await page.locator('#highlight-enabled').isChecked(),false,'Modes exclusifs');
 assert.equal(await page.locator('#highlight [data-repeat-key]').count(),4,'Les quatre occurrences doivent être colorées');
 await page.locator('#verbs-enabled').check();
 assert.equal(await page.locator('#repetition-enabled').isChecked(),false,'Le mode verbes remplace répétitions');
 await input.fill('Je suis ici. Tu es là. Il fait beau.');
 await page.waitForTimeout(500);
 assert.equal(await page.locator('#verbes').textContent(),'3','Les trois formes ternes sont comptées');
 assert.equal(await page.locator('#highlight .dull-verb').count(),3,'Les trois formes sont surlignées');
 await page.locator('#longest-enabled').check();
 assert.equal(await page.locator('#verbs-enabled').isChecked(),false);
 assert.equal(await page.locator('#highlight .longest-sentence').count(),1);
 await page.locator('#nom').fill('Test');
 page.once('dialog',d=>d.accept());
 await page.locator('#save').click();
 await input.fill('Texte différent.');
 page.once('dialog',d=>d.accept());
 await page.locator('#load').click();
 assert.equal(await input.inputValue(),'Je suis ici. Tu es là. Il fait beau.','Sauvegarde et chargement');
 assert.deepEqual(errors,[],'Aucune erreur JavaScript');
 console.log('OK : répétitions, modes exclusifs, verbes ternes, phrase longue, sauvegarde.');
} finally {await browser.close();}
