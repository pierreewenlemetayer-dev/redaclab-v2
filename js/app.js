function demarrerLexiLab(LEXICON){
let hoveredRepeatKey=null;
const entries=LEXICON.entries, excluded=new Set(LEXICON.excluded);
const apostrophes=/[’‘`´]/g;
const dullForms=new Set('suis es est sommes etes sont étais était étions étiez étaient serai seras sera serons serez seront fus fut fûmes fûtes furent ai as a avons avez ont avais avait avions aviez avaient aurai auras aura aurons aurez auront eus eut eûmes eûtes eurent fais fait faisons faites font faisais faisait faisions faisiez faisaient ferai feras fera ferons ferez feront fis fit fîmes fîtes firent dis dit disons dites disent disais disait disions disiez disaient dirai diras dira dirons direz diront dîmes dîtes dirent'.split(' '));
const tokenize=s=>s.match(/[\\p{L}]+(?:[-'][\\p{L}]+)*/gu)||[];
function analyze(){
 const original=document.getElementById('input').value;
 renderHighlights(original);
 // Diversité : aucune exclusion ; les formes inconnues ou exclues restent comptées.
 // Le découpage est indépendant de celui de l'indice de fréquence, qui reste inchangé.
 const formes=original.toLocaleLowerCase('fr').replace(apostrophes,"'").match(/[\p{L}]+(?:[-'][\p{L}]+)*/gu)||[];
 const unitesDiversite=[];
 for(const forme of formes){
   const parties=(entries[forme]||excluded.has(forme))?[forme]:forme.split("'");
   for(const partie of parties){
     if(!partie)continue;
     const hit=excluded.has(partie)?null:entries[partie];
     unitesDiversite.push(hit?'lemme:'+hit[0]+'|'+hit[1]:'forme:'+partie);
   }
 }
 const diversite=unitesDiversite.length?new Set(unitesDiversite).size/unitesDiversite.length*100:0;
 document.getElementById('diversity-score').textContent=unitesDiversite.length?diversite.toLocaleString('fr-FR',{maximumFractionDigits:1,minimumFractionDigits:1})+' %':'—';
 updateRedacStats(original,diversite);
 const raw=original.toLocaleLowerCase('fr').replace(apostrophes,"'");
 const tokens=raw.match(/[\p{L}]+(?:[-'][\p{L}]+)*/gu)||[];
 const records=[], unknown=[], dropped=[];const unique=new Map();
 for(const token of tokens){
   // full word first; if absent, split at apostrophe (l'enfant -> l' + enfant)
   const parts=(entries[token]||excluded.has(token))?[token]:token.split("'");
   for(const part of parts){if(!part)continue;
     if(excluded.has(part)){dropped.push(part);records.push({form:part,status:'Exclu',lemma:'',pos:'',freq:null});continue;}
     const hit=entries[part];
     if(!hit){unknown.push(part);records.push({form:part,status:'Inconnu',lemma:'',pos:'',freq:null});continue;}
     const [lemma,pos,freq]=hit;const key=lemma+'|'+pos;
     if(!unique.has(key))unique.set(key,{lemma,pos,freq});
     records.push({form:part,status:'Retenu',lemma,pos,freq});
   }
 }
 const items=[...unique.values()], ifraw=items.length?items.reduce((s,x)=>s-Math.log10(x.freq),0)/items.length:null;
 const recognized=records.filter(x=>x.status==='Retenu').length;
 const fmt=v=>v===null?'—':v.toLocaleString('fr-FR',{maximumFractionDigits:3,minimumFractionDigits:3});
 const low=-2.660986,high=-1.074392;
 const note10=ifraw===null?null:Math.max(1,Math.min(10,1+9*(ifraw-low)/(high-low)));
 document.getElementById('score').textContent=note10===null?'—':note10.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1});
 const marker=document.getElementById('marker');
 const pct=note10===null?0:(note10-1)/9*100;
 marker.style.left=pct+'%';
 document.getElementById('raw-index').textContent=fmt(ifraw);
 document.getElementById('lemmas').textContent=items.length;
 document.getElementById('coverage').textContent=records.length?Math.round(100*recognized/records.length)+' %':'—';
 document.getElementById('detail').textContent=`${tokens.length} unités initiales · ${records.length} unités après séparation des apostrophes · ${dropped.length} exclusions · ${unknown.length} non reconnues`;
 document.getElementById('table').innerHTML=records.map(x=>`<tr><td>${esc(x.form)}</td><td>${esc(x.status)}</td><td>${esc(x.lemma)}</td><td>${esc(x.pos)}</td><td class="num">${x.freq===null?'':fmt(x.freq)}</td></tr>`).join('');
 document.getElementById('uniques').textContent=items.sort((a,b)=>a.lemma.localeCompare(b.lemma,'fr')).map(x=>`${x.lemma} (${x.pos})`).join(' · ')||'—';
}
function updateRedacStats(original,diversite){
 const words=original.trim()?original.trim().split(/\\s+/):[];
 const sentences=original.split(/[.!?]+/).filter(x=>x.trim());
 const avg=sentences.length?words.length/sentences.length:0;
 const max=Math.max(0,...sentences.map(x=>x.trim().split(/\\s+/).filter(Boolean).length));
 const dull=words.filter(w=>dullForms.has(w.toLocaleLowerCase('fr'))).length;
 const set=(id,v)=>document.getElementById(id).textContent=v;
 set('mots',words.length);set('moyenne',avg.toFixed(1));set('paragraphes',original.split(/\\n+/).filter(x=>x.trim()).length);
 set('phrases',sentences.length);set('longue',max);set('verbes',dull);
 const color=(v,target,min)=>min?(v>=target?'🟢':v>=target*.8?'🟠':'🔴'):(v<=target?'🟢':v<=target*1.2?'🟠':'🔴');
 set('motsCouleur',color(words.length,Number(document.getElementById('objMots').value),true));
 set('moyenneCouleur',color(avg,Number(document.getElementById('objMoyenne').value),false));
 set('densiteCouleur',color(diversite,Number(document.getElementById('objDensite').value),true));
}
function renderHighlights(original){
 const layer=document.getElementById('highlight');
 const normalized=original.toLocaleLowerCase('fr').replace(apostrophes,"'");
 const pattern=/[\p{L}]+(?:[-'][\p{L}]+)*/gu;
 const units=[],matches=[...normalized.matchAll(pattern)];
 // Construire les unités et leurs positions exactes pour conserver chaque espace et ponctuation.
 for(const match of matches){
   const token=match[0],parts=(entries[token]||excluded.has(token))?[token]:token.split("'");
   let offset=0;
   for(const part of parts){
     if(!part)continue;
     const index=token.indexOf(part,offset);
     if(index<0)continue;
     const hit=excluded.has(part)?null:entries[part];
     const key=hit?'lemme:'+hit[0]+'|'+hit[1]:'forme:'+part;
     const freq=hit?Number(hit[2]):NaN;
     const frequencyClass=Number.isFinite(freq)&&freq>0?(freq>=100?'freq-very-common':freq>=10?'freq-common':freq>=1?'freq-uncommon':'freq-rare'):'';
     units.push({start:match.index+index,end:match.index+index+part.length,key,frequencyClass});
     offset=index+part.length;
   }
 }
 const counts=new Map();
 for(const unit of units)counts.set(unit.key,(counts.get(unit.key)||0)+1);
 const mode=document.getElementById('repetition-enabled').checked?'repetition':document.getElementById('verbs-enabled').checked?'verbs':document.getElementById('longest-enabled').checked?'longest':'frequency';
 document.getElementById('repetitions').textContent=units.filter(unit=>counts.get(unit.key)>1).length;
 const sentences=[...original.matchAll(/[^.!?]+(?:[.!?]+|$)/g)].filter(m=>m[0].trim());
 let longest=null,longestCount=0;
 for(const m of sentences){const n=(m[0].match(/[\\p{L}]+(?:[-'][\\p{L}]+)*/gu)||[]).length;if(n>longestCount){longest=m;longestCount=n;}}
 const repeatedKeys=[...counts].filter(([,count])=>count>1).map(([key])=>key);
 const colorByKey=new Map(repeatedKeys.map((key,index)=>[key,index%16]));
 let result='',last=0;
 for(const unit of units){
   result+=esc(original.slice(last,unit.start));
   const cls=mode==='repetition'?(counts.get(unit.key)>1?'repeat-color-'+colorByKey.get(unit.key):''):mode==='verbs'?(dullForms.has(normalized.slice(unit.start,unit.end))?'dull-verb':''):mode==='frequency'?unit.frequencyClass:'';
   const visible=esc(original.slice(unit.start,unit.end));
   result+=cls?'<span class="'+cls+'"'+(mode==='frequency'?' data-frequency="'+(cls==='freq-very-common'?'Très fréquent':cls==='freq-common'?'Fréquent':cls==='freq-uncommon'?'Peu fréquent':'Rare')+'"':' data-repeat-key="'+esc(unit.key)+'"')+'>'+visible+'</span>':visible;
   last=unit.end;
 }
 result+=esc(original.slice(last));
 if(mode==='longest'&&longest){result='<span class="longest-sentence">'+esc(original.slice(longest.index,longest.index+longest[0].length))+'</span>';result=esc(original.slice(0,longest.index))+result+esc(original.slice(longest.index+longest[0].length));}
 layer.innerHTML=result+'\n';
 hoveredRepeatKey=null;
 syncHighlightScroll();
}
function syncHighlightScroll(){
 const input=document.getElementById('input'),layer=document.getElementById('highlight');
 layer.scrollTop=input.scrollTop;layer.scrollLeft=input.scrollLeft;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const input=document.getElementById('input');
input.addEventListener('scroll',()=>{syncHighlightScroll();document.getElementById('word-tooltip').hidden=true;});
const tooltip=document.getElementById('word-tooltip');
input.addEventListener('mousemove',event=>{
 if(repetitionToggle.checked){tooltip.hidden=true;highlightHoveredGroup(event);return;}
 clearHoveredGroup();
 if(!frequencyToggle.checked){tooltip.hidden=true;return;}
 const layer=document.getElementById('highlight');
 let found=null;
 for(const span of layer.querySelectorAll('[data-frequency]')){
   for(const rect of span.getClientRects()){
     if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom){
       found=span.dataset.frequency;break;
     }
   }
   if(found)break;
 }
 if(!found){tooltip.hidden=true;return;}
 tooltip.textContent=found;tooltip.hidden=false;
 const bounds=input.getBoundingClientRect();
 tooltip.style.left=Math.min(event.clientX-bounds.left+12,bounds.width-tooltip.offsetWidth-4)+'px';
 tooltip.style.top=Math.max(0,event.clientY-bounds.top-34)+'px';
});
input.addEventListener('mouseleave',()=>{tooltip.hidden=true;clearHoveredGroup();});
function clearHoveredGroup(){
 const layer=document.getElementById('highlight');
 layer.classList.remove('repeat-focus');
 for(const span of layer.querySelectorAll('.repeat-selected'))span.classList.remove('repeat-selected');
}
function highlightHoveredGroup(event){
 const layer=document.getElementById('highlight');
 let found=null;
 for(const span of layer.querySelectorAll('[data-repeat-key]')){
   for(const rect of span.getClientRects()){
     if(event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom){found=span.dataset.repeatKey;break;}
   }
   if(found!==null)break;
 }
 if(found===hoveredRepeatKey)return;
 hoveredRepeatKey=found;
 layer.classList.toggle('repeat-focus',found!==null);
 for(const span of layer.querySelectorAll('[data-repeat-key]'))span.classList.toggle('repeat-selected',found!==null&&span.dataset.repeatKey===found);
}
const frequencyToggle=document.getElementById('highlight-enabled');
const repetitionToggle=document.getElementById('repetition-enabled');
const verbsToggle=document.getElementById('verbs-enabled');
const longestToggle=document.getElementById('longest-enabled');
function updateMode(changed){
 const toggles={frequency:frequencyToggle,repetition:repetitionToggle,verbs:verbsToggle,longest:longestToggle};
 if(changed&&toggles[changed].checked)for(const [name,toggle] of Object.entries(toggles))if(name!==changed)toggle.checked=false;
 const enabled=Object.values(toggles).some(toggle=>toggle.checked);
 input.classList.toggle('highlight-on',enabled);
 document.getElementById('word-tooltip').hidden=true;
 hoveredRepeatKey=null;
 clearHoveredGroup();
 document.getElementById('highlight').hidden=!enabled;
 document.querySelector('.frequency-legend').hidden=!frequencyToggle.checked;
 if(enabled)renderHighlights(input.value);
}
frequencyToggle.addEventListener('change',()=>updateMode('frequency'));
repetitionToggle.addEventListener('change',()=>updateMode('repetition'));
verbsToggle.addEventListener('change',()=>updateMode('verbs'));
longestToggle.addEventListener('change',()=>updateMode('longest'));
let pending; input.addEventListener('input',()=>{
 clearTimeout(pending);
 // Ne jamais masquer le texte tant que le calque n'a pas été actualisé.
 input.classList.remove('highlight-on');
 pending=setTimeout(()=>{try{analyze();updateMode();}catch(error){console.error(error);input.classList.remove('highlight-on');}
document.querySelectorAll('.sidebar input').forEach(el=>el.addEventListener('input',()=>analyze()));
document.getElementById('save').addEventListener('click',()=>{const name=document.getElementById('nom').value.trim();if(!name){alert('Entre ton nom');return;}localStorage.setItem('redac_v2_'+name,input.value);alert('Texte sauvegardé !');});
document.getElementById('load').addEventListener('click',()=>{const name=document.getElementById('nom').value.trim();const saved=localStorage.getItem('redac_v2_'+name);if(saved===null){alert('Aucun texte trouvé');return;}input.value=saved;analyze();updateMode();});
document.getElementById('print').addEventListener('click',()=>window.print());},220);
});
try{analyze();updateMode();}catch(error){console.error(error);input.classList.remove('highlight-on');}

}
