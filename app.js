/* app.js : FCL.055 Trainer */
const $=(s,r=document)=>r.querySelector(s);
const V=$('#view');

/* ========== ÉTAT ========== */
const KEY='atc350v1';
const DEF={snd:true,sec:8,rate:0.95,exam:'',hide:false,fmt:'mix',level:'simple',goal:300,tdir:'fe',tmode:'norm',tcat:'all'};
let S={};
function load(){
  try{S=JSON.parse(localStorage.getItem(KEY))||{};}catch(e){S={};}
  S.xp=S.xp||0;S.days=S.days||{};S.hist=S.hist||[];S.best=S.best||{};S.weak=S.weak||{};
  S.set=Object.assign({},DEF,S.set||{});
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function dayKey(d){d=d||new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1,2)+'-'+pad(d.getDate(),2);}
function streak(){
  let n=0;const d=new Date();
  if(!(S.days[dayKey(d)]>0))d.setDate(d.getDate()-1);
  while(S.days[dayKey(d)]>0){n++;d.setDate(d.getDate()-1);}
  return n;
}
function examDays(){
  if(!S.set.exam)return null;
  const e=new Date(S.set.exam+'T00:00:00');if(isNaN(e))return null;
  const t=new Date();t.setHours(0,0,0,0);
  return Math.round((e-t)/864e5);
}
function hdr(){
  const d=examDays(),t=S.days[dayKey()]||0;
  $('#rdExam').textContent=d===null?'--':(d>0?'J-'+d:d===0?'JOUR J':'J+'+(-d));
  $('#rdPts').textContent=t;
  $('#rdStk').textContent=streak();
}

/* ========== SON & VOIX ========== */
let AC;
function beep(kind){
  if(!S.set.snd)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);
    const t=AC.currentTime;
    if(kind==='ok'){o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1175,t+.08);g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.start(t);o.stop(t+.23);}
    else{o.type='square';o.frequency.setValueAtTime(196,t);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.start(t);o.stop(t+.31);}
  }catch(e){}
}
const synth=window.speechSynthesis;let voice=null;
function pickVoice(){if(!synth)return;const vs=synth.getVoices();voice=vs.find(v=>/en[-_]GB/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null;}
if(synth){pickVoice();synth.onvoiceschanged=pickVoice;}
function speak(text,rate){
  if(!synth){toast('Synthèse vocale indisponible sur ce navigateur');return;}
  synth.cancel();
  const u=new SpeechSynthesisUtterance(toSpoken(text));
  u.lang=voice?voice.lang:'en-GB';if(voice)u.voice=voice;u.rate=rate||S.set.rate;
  synth.speak(u);
}
let toastT;
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toastT);toastT=setTimeout(()=>e.style.display='none',2400);}

/* ========== CONSTRUCTEURS DE QUESTIONS ========== */
const VMAP={};VOC.forEach(v=>VMAP[v.fr+'|'+v.en]=v);
let lastVocab='';
function vocabQ(dir,pool){
  pool=pool&&pool.length?pool:VOC;
  let it,t=0;do{it=rnd(pool);}while(it.fr+it.en===lastVocab&&pool.length>1&&t++<6);
  lastVocab=it.fr+it.en;
  const d=dir==='mix'?rnd(['fe','ef']):dir;
  const bad=v=>v!==it&&(d==='fe'?v.en!==it.en:v.fr!==it.fr);
  const txt=v=>d==='fe'?v.en:v.fr;
  const seen=new Set([txt(it)]),picked=[];
  for(const v of shuffle(VOC.filter(x=>x.cat===it.cat&&bad(x))).concat(shuffle(VOC.filter(bad)))){
    if(!seen.has(txt(v))){seen.add(txt(v));picked.push(v);}
    if(picked.length===3)break;
  }
  const opts=shuffle([it].concat(picked));
  return {type:'mcq',prompt:d==='fe'?it.fr:it.en,sub:d==='fe'?'Traduisez en anglais':'Traduisez en français',options:opts.map(txt),answer:opts.indexOf(it),
    explain:`<b>${esc(it.fr)}</b> = <b>${esc(it.en)}</b>`,key:it.fr+'|'+it.en,cat:'Vocabulaire',big:true};
}
function ffQ(){
  const f=rnd(FF);
  if(Math.random()<0.5){
    const others=shuffle(FF.filter(x=>x!==f).map(x=>x.tru)).filter(o=>o!==f.tru&&o!==f.trap);
    const opts=shuffle([f.tru,f.trap,others[0],others[1]]);
    return {type:'mcq',prompt:f.en,sub:'Que signifie ce mot en anglais ? Attention au piège.',options:opts,answer:opts.indexOf(f.tru),
      explain:`<b>${esc(f.en)}</b> = ${esc(f.tru)} (et non « ${esc(f.trap)} »).<br><i>${esc(f.ex)}</i><br>${esc(f.exfr)}`,cat:'Faux amis',big:true};
  }
  const others=shuffle(FF.filter(x=>x!==f).map(x=>x.enFor)).filter(o=>o!==f.enFor&&o!==f.en);
  const opts=shuffle([f.enFor,f.en,others[0],others[1]]);
  return {type:'mcq',prompt:f.fr,sub:'Comment le dit-on en anglais ?',options:opts,answer:opts.indexOf(f.enFor),
    explain:`« ${esc(f.fr)} » se dit <b>${esc(f.enFor)}</b>. Le mot <b>${esc(f.en)}</b> signifie ${esc(f.tru)}.<br><i>${esc(f.ex)}</i>`,cat:'Faux amis',big:true};
}
function errQ(){
  const it=rnd(FRANG);
  const m=it[0].match(/\[\[(.+?)\]\]/);
  const split=s=>s.trim().split(/\s+/).filter(Boolean);
  const words=split(it[0].slice(0,m.index)).map(w=>({w,e:false}))
    .concat(split(m[1]).map(w=>({w,e:true})),split(it[0].slice(m.index+m[0].length)).map(w=>({w,e:false})));
  return {type:'err',words,good:it[1],rule:it[2],cat:'Franglais'};
}
function clearQ(mode,o){
  o=o||{};
  const sc=genScenario(mode,{groups:o.groups,combo:o.combo,kind:o.kind});
  const hide=!!o.hide;
  if(sc.call){
    return {type:'chips',tokens:tok(sc.rb),ctxFr:sc.ctx,sub:'Construisez votre appel dans le bon ordre.',tip:sc.tip,cat:sc.cat,answerText:sc.rb};
  }
  const fmt=o.fmt==='mix'?rnd(['click','words']):(o.fmt||'click');
  if(fmt==='words'){
    return {type:'chips',tokens:tok(sc.rb),audio:sc.atc,atcText:sc.atc,hide,sub:'Reconstruisez la relecture correcte.',tip:sc.tip,cat:sc.cat,answerText:sc.rb};
  }
  const opts=shuffle([sc.rb].concat(mkOptions(sc.rb,sc.cs,sc.cs2)));
  return {type:'mcq',audio:sc.atc,prompt:sc.atc,hide,sub:'Quelle est la bonne relecture ?',options:opts,answer:opts.indexOf(sc.rb),
    explain:`Relecture correcte : <b>${esc(sc.rb)}</b><br>${esc(sc.tip)}`,cat:sc.cat};
}
function numQ(){
  const n=genNumbers();
  return {type:'value',audio:n.text,hide:true,prompt:`Quel est ${n.label} ?`,expected:n.val,fullText:n.text,cat:'Chiffres'};
}
function dictQ(combo){
  let sc;do{sc=genScenario(rnd(['I','V']),{kind:'c',combo:!!combo});}while(!sc.atc);
  return {type:'dict',audio:sc.atc,expected:sc.atc,prompt:'Écrivez le message que vous entendez.',cat:'Dictée'};
}
const PHOTO_CRIT=["J'ai situé la scène (où, quand, météo)","J'ai nommé les objets et les personnes principales","J'ai décrit ce qui se passe maintenant (-ing)","J'ai donné des détails et des positions (on the left, behind…)","J'ai fait une hypothèse sur la suite (will, might)"];
function photoQ(p){
  p=p||rnd(PHOTOS);
  const voc=p.vocab.map(v=>`<li><b>${esc(v[0])}</b> : ${esc(v[1])}</li>`).join('');
  const fol=p.follow.map(f=>`<li>${esc(f)}</li>`).join('');
  return {type:'self',kind:'photo',svg:p.svg,prompt:"Décrivez cette image en anglais, à voix haute ou par écrit. Où sommes-nous ? Qui est là ? Que se passe-t-il ? Que va-t-il se passer ?",
    reveal:`<h4>Description modèle</h4><p class="en">${esc(p.model)}</p><h4>Vocabulaire utile</h4><ul>${voc}</ul><h4>Questions de l'examinateur</h4><ul>${fol}</ul>`,
    speakText:p.model,crit:PHOTO_CRIT,cat:'Photo'};
}
const REF_CRIT=["J'ai dit à quoi ça sert","J'ai décrit ce que c'est (forme, matière, lieu)","Je n'ai pas prononcé le mot lui-même","J'ai fait des phrases complètes"];
function reformQ(){
  const r=rnd(REFORM);
  return {type:'self',kind:'reform',prompt:`Vous ne connaissez pas le mot anglais de « ${r.fr} ». Expliquez en anglais ce que c'est, sans dire le mot.`,
    reveal:`<h4>Le mot</h4><p class="en"><b>${esc(r.en)}</b></p><h4>Explication modèle</h4><p class="en">${esc(r.def)}</p><h4>Débuts de phrases utiles</h4><p>${REFORM_STARTERS.map(esc).join(' · ')}</p>`,
    speakText:r.def,crit:REF_CRIT,cat:'Reformule'};
}
function maydayQ(){
  const m=rnd(MAYDAY);
  return {type:'chips',tokens:m.blocks,ctxFr:m.ctx,sub:"Remettez les éléments dans l'ordre : station et indicatif, nature, intention, position, autres informations.",
    tip:"Ordre standard : Mayday ou Pan-Pan x3, station appelée et indicatif, nature de l'urgence, intention du commandant, position / niveau / cap, autres informations (personnes à bord, autonomie).",cat:'Mayday',blocks:true,answerText:m.blocks.join(' › ')};
}

/* ========== MOTEUR DE SESSION ========== */
let R=null;
function stopTmr(){if(R&&R.tint){clearInterval(R.tint);R.tint=null;}if(R&&R.autoT){clearTimeout(R.autoT);R.autoT=null;}}
function stopRun(){stopTmr();R=null;if(synth)synth.cancel();}
function startRun(cfg){
  stopRun();
  R={cfg,i:0,pts:0,ok:0,n:0,streak:0,maxS:0,lives:cfg.lives==null?null:cfg.lives,sec:cfg.sec||0,log:[],tMax:0,tLeft:0,ans:false,q:null,c:null};
  nextQ();
}
function nextQ(){
  const c=R.cfg;
  if((c.n&&R.i>=c.n)||(R.lives!==null&&R.lives<=0))return endRun();
  R.q=c.qs?c.qs[R.i]:c.gen(R.i);
  if(!R.q)return endRun();
  R.ans=false;
  R.tMax=(c.timed&&R.q.type==='mcq')?Math.round(R.sec*10)/10:0;R.tLeft=R.tMax;
  renderQ();
  if(R.tMax)tmrStart();
  if(R.q.audio)speak(R.q.audio);
}
function hud(){
  const c=R.cfg;
  return `<div class="hud"><button class="pb sm" onclick="quit()"><span>QUITTER</span></button>
  <div class="rd"><b>${c.n?Math.min(R.i+1,c.n)+'/'+c.n:R.i+1}</b><small>QUESTION</small></div>
  <div class="rd"><b>${R.pts}</b><small>POINTS</small></div>
  <div class="rd"><b>${R.streak}</b><small>SÉRIE</small></div>
  ${R.lives!==null?`<div class="rd"><b class="${R.lives<=1?'amb':'grn'}">${R.lives}</b><small>VIES</small></div>`:''}</div>
  ${R.tMax?`<div class="tape"><i id="tb"></i><span id="tt"></span></div>`:''}`;
}
function aud(q){
  return q.audio?`<div class="row"><button class="pb sm" onclick="say()"><span>ÉCOUTER</span></button><button class="pb sm" onclick="say(.7)"><span>LENT</span></button></div>`:'';
}
function say(r){if(R&&R.q&&R.q.audio)speak(R.q.audio,r);}
function renderQ(){
  const q=R.q;
  const body={mcq:rMcq,chips:rChips,value:rType,dict:rType,self:rSelf,err:rErr}[q.type](q);
  V.innerHTML=hud()+`<div class="panel q">${q.section?`<div class="sec">${esc(q.section)}</div>`:(q.cat?`<div class="sec">${esc(q.cat)}</div>`:'')}${body}</div><div id="fb"></div>`;
  if(q.type==='chips')drawChips();
  const ti=$('#ti');if(ti&&q.type==='value')ti.focus();
}
function rMcq(q){
  return `${aud(q)}<div class="prompt ${q.big?'big':''}" id="pr">${q.hide?'<i>Écoutez le message…</i>':esc(q.prompt)}</div>${q.sub?`<div class="sub">${esc(q.sub)}</div>`:''}
  <div class="opts">${q.options.map((o,k)=>`<button class="opt" id="o${k}" onclick="pickMcq(${k})"><i class="lamp"></i><span>${esc(o)}</span></button>`).join('')}</div>`;
}
function pickMcq(k){
  if(!R||R.ans)return;
  const q=R.q,ok=k===q.answer;
  markMcq(k,ok);
  finish(ok,{explain:q.explain});
}
function markMcq(k,ok){
  const q=R.q;
  document.querySelectorAll('.opt').forEach(b=>b.disabled=true);
  const c=$('#o'+q.answer);if(c)c.classList.add('ok');
  if(!ok&&k>=0){const w=$('#o'+k);if(w)w.classList.add('ko');}
  if(q.hide){const p=$('#pr');if(p)p.textContent=q.prompt;}
}
/* chips (relecture, appel, mayday) */
function rChips(q){
  let pool=shuffle(q.tokens.map((w,i)=>({w,id:i})));
  let t=0;while(pool.length>1&&pool.map(x=>x.w).join('|')===q.tokens.join('|')&&t++<10)pool=shuffle(pool);
  R.c={pool,ans:[]};
  return `${aud(q)}${q.audio?`<div class="strip atc"><div class="cs">ATC</div><div class="msg" id="atcm">${q.hide?'<i>Écoutez le message…</i>':esc(q.atcText)}</div></div>`:''}
  ${q.ctxFr?`<div class="ctx">${esc(q.ctxFr)}</div>`:''}${q.sub?`<div class="sub">${esc(q.sub)}</div>`:''}<div id="chipbox"></div>`;
}
function drawChips(){
  const q=R.q,c=R.c,done=R.ans;
  const cls=q.blocks?'chip blk':'chip';
  $('#chipbox').innerHTML=`<div class="strip pilot ${done?(c.ok?'okx':'kox'):''}"><div class="cs">VOUS</div><div class="msg">${c.ans.length?c.ans.map(x=>`<button class="${cls}" onclick="unpick(${x.id})" ${done?'disabled':''}>${esc(x.w)}</button>`).join(''):'<span class="ph">Touchez les éléments ci-dessous…</span>'}</div></div>
  ${done?'':`<div class="chips">${c.pool.map(x=>`<button class="${cls}" onclick="pick(${x.id})">${esc(x.w)}</button>`).join('')}</div>
  <div class="row"><button class="pb wide" onclick="chipCheck()" ${c.ans.length?'':'disabled'}><span>VALIDER</span></button><button class="pb sm" onclick="chipReset()"><span>EFFACER</span></button></div>`}`;
}
function pick(id){if(R.ans)return;const i=R.c.pool.findIndex(x=>x.id===id);if(i<0)return;R.c.ans.push(R.c.pool.splice(i,1)[0]);drawChips();}
function unpick(id){if(R.ans)return;const i=R.c.ans.findIndex(x=>x.id===id);if(i<0)return;R.c.pool.push(R.c.ans.splice(i,1)[0]);drawChips();}
function chipReset(){if(R.ans)return;R.c.pool=R.c.pool.concat(R.c.ans);R.c.ans=[];drawChips();}
function chipCheck(){
  if(R.ans||!R.c.ans.length)return;
  const q=R.q,got=R.c.ans.map(x=>x.w);
  const ok=got.length===q.tokens.length&&got.every((w,i)=>w===q.tokens[i]);
  R.c.ok=ok;
  if(q.hide){const a=$('#atcm');if(a)a.textContent=q.atcText;}
  finish(ok,{explain:(ok?'':`Réponse attendue : <b>${esc(q.answerText)}</b><br>`)+esc(q.tip||'')}, true);
}
/* saisie : chiffres et dictée */
function rType(q){
  const area=q.type==='dict'
    ?`<textarea id="ti" placeholder="Écrivez ici…" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>`
    :`<input id="ti" type="text" placeholder="Votre réponse" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" onkeydown="if(event.key==='Enter')typeCheck()">`;
  return `${aud(q)}<div class="prompt">${esc(q.prompt)}</div>${q.type==='value'?'<div class="sub">Chiffres ou mots acceptés (tree = 3, niner = 9).</div>':'<div class="sub">Chiffres ou mots acceptés. L\'indicatif peut être écrit en lettres.</div>'}${area}
  <div class="row"><button class="pb wide" onclick="typeCheck()"><span>VALIDER</span></button></div>`;
}
function typeCheck(){
  if(!R||R.ans)return;
  const q=R.q,el=$('#ti'),txt=el.value;
  if(!txt.trim()){toast('Écrivez votre réponse');return;}
  el.readOnly=true;
  if(q.type==='value'){
    const ok=normValue(txt)===normValue(q.expected);
    finish(ok,{explain:`Réponse : <b>${esc(q.expected)}</b><br>Message : <i>${esc(q.fullText)}</i>`});
  }else{
    const e=norm(q.expected),g=norm(txt),hit=lcsMask(e,g),sc=hit.filter(Boolean).length/e.length;
    const ok=sc>=0.85;
    finish(ok,{explain:`<b>${Math.round(sc*100)} %</b> des éléments retrouvés.<div class="toks">${e.map((t,i)=>`<span class="tok ${hit[i]?'ok':'ko'}">${esc(t)}</span>`).join('')}</div>Texte : <i>${esc(q.expected)}</i>`});
  }
}
/* auto-évaluation : photo et reformule */
function rSelf(q){
  return `<div class="ctx">${esc(q.prompt)}</div>${q.svg?`<div class="art">${q.svg}</div>`:''}
  <textarea id="si" placeholder="Votre réponse en anglais (écrite, ou dites-la à voix haute)…" autocapitalize="sentences" spellcheck="false"></textarea>
  <div id="rv"></div><div class="row" id="rvb"><button class="pb wide" onclick="selfReveal()"><span>VOIR LA CORRECTION</span></button></div>`;
}
function selfReveal(){
  const q=R.q;
  $('#rvb').style.display='none';
  $('#rv').innerHTML=`<div class="model">${q.reveal}<div class="row"><button class="pb sm" onclick="speak(R.q.speakText,.9)"><span>ÉCOUTER</span></button></div></div>
  <div class="sub">Cochez ce que vous avez réussi :</div>${q.crit.map(c=>`<label class="chk"><input type="checkbox" class="cc"><span>${esc(c)}</span></label>`).join('')}
  <div class="row"><button class="pb wide" onclick="selfDone()"><span>VALIDER MON AUTO-ÉVALUATION</span></button></div>`;
  $('#rv').scrollIntoView({behavior:'smooth',block:'start'});
}
function selfDone(){
  if(R.ans)return;
  const all=[...document.querySelectorAll('.cc')],n=all.filter(x=>x.checked).length;
  const ok=n/all.length>=0.6;
  finish(ok,{explain:`Critères validés : <b>${n}/${all.length}</b>. ${ok?'Bonne description.':'Relisez le modèle et recommencez en vous enregistrant.'}`});
}
/* chasse à l'erreur */
function rErr(q){
  return `<div class="ctx">Cette phrase contient une erreur typique de francophone. Touchez le mot fautif.</div>
  <div class="sentence">${q.words.map((w,i)=>`<button class="wd" id="w${i}" onclick="pickErr(${i})">${esc(w.w)}</button>`).join(' ')}</div>`;
}
function pickErr(i){
  if(!R||R.ans)return;
  const q=R.q,ok=q.words[i].e;
  q.words.forEach((w,k)=>{const b=$('#w'+k);b.disabled=true;if(w.e)b.classList.add('fault');});
  if(!ok)$('#w'+i).classList.add('wrong');
  finish(ok,{explain:`Correction : <b>${esc(q.good)}</b><br>${esc(q.rule)}`});
}
/* correction commune */
function tmrStart(){
  R.tint=setInterval(()=>{
    R.tLeft=Math.max(0,R.tLeft-0.1);
    const b=$('#tb'),t=$('#tt');
    if(b){b.style.width=(100*R.tLeft/R.tMax)+'%';b.className=R.tLeft/R.tMax<0.3?'low':'';}
    if(t)t.textContent=R.tLeft.toFixed(1)+' s';
    if(R.tLeft<=0){stopTmr();timeout();}
  },100);
}
function timeout(){
  if(!R||R.ans)return;
  markMcq(-1,false);
  finish(false,{explain:R.q.explain,timeout:true});
}
function finish(ok,info,isChips){
  if(R.ans)return;
  R.ans=true;stopTmr();
  const q=R.q;let pts=0;
  if(ok){R.streak++;R.maxS=Math.max(R.maxS,R.streak);pts=10+Math.min(R.streak-1,5)+(R.tMax?Math.round(R.tLeft/R.tMax*10):0);}
  else{R.streak=0;if(R.lives!==null)R.lives--;}
  R.pts+=pts;R.n++;if(ok)R.ok++;
  R.log.push({s:q.section||q.cat||'',ok});
  if(q.key){
    const w=(S.weak[q.key]||0)+(ok?-1:1);
    if(w>0)S.weak[q.key]=w;else delete S.weak[q.key];
  }
  beep(ok?'ok':'ko');
  if(R.cfg.survival&&ok)R.sec=Math.max(2,R.sec-0.25);
  if(isChips)drawChips();
  const c=R.cfg,last=(c.n&&R.i+1>=c.n)||(R.lives!==null&&R.lives<=0);
  $('#fb').innerHTML=`<div class="fb ${ok?'ok':'ko'}"><b>${ok?'CORRECT':(info.timeout?'TEMPS ÉCOULÉ':'À REVOIR')}</b><span>+${pts} pt</span></div>
  ${info.explain?`<div class="expl">${info.explain}</div>`:''}
  <div class="row"><button class="pb wide" onclick="advance()"><span>${last?'VOIR LE RÉSULTAT':'SUIVANT'}</span></button></div>`;
  [[3,R.pts],[4,R.streak],[5,R.lives]].forEach(([n,v])=>{const e=$('.hud .rd:nth-child('+n+') b');if(e&&v!==null)e.textContent=v;});
  if(c.auto&&ok&&!last)R.autoT=setTimeout(advance,650);
  else $('#fb').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function advance(){
  if(!R)return;
  if(R.autoT){clearTimeout(R.autoT);R.autoT=null;}
  if(!R.ans)return;
  R.i++;nextQ();
}
function quit(){
  if(!R)return;
  if(R.n>0)endRun();else{const b=R.cfg.back||'home',a=R.cfg.backArg;nav(b,a);}
}
function endRun(){
  stopTmr();
  const c=R.cfg;
  const acc=R.n?Math.round(100*R.ok/R.n):0;
  let newBest=false;
  if(R.n>0){
    S.hist.push({t:Date.now(),g:c.id,n:R.n,ok:R.ok,pts:R.pts});
    if(S.hist.length>600)S.hist=S.hist.slice(-600);
    S.xp+=R.pts;const dk=dayKey();S.days[dk]=(S.days[dk]||0)+R.pts;
    if(R.pts>(S.best[c.id]||0)){S.best[c.id]=R.pts;newBest=true;}
    save();hdr();
  }
  const secs={};
  R.log.forEach(l=>{const k=l.s||'Général';(secs[k]=secs[k]||{n:0,ok:0});secs[k].n++;if(l.ok)secs[k].ok++;});
  const secKeys=Object.keys(secs);
  const msg=acc>=90?'Excellent niveau, continuez comme ça.':acc>=75?'Très bon travail, il reste quelques points à fixer.':acc>=55?'Base solide. Rejouez pour consolider.':'Normal au début : relisez les corrections et recommencez.';
  const exam=c.id==='mock';
  const stk=c.survival?`<div class="rd big"><b>${R.maxS}</b><small>SÉRIE MAX</small></div>`:'';
  V.innerHTML=`<div class="panel res"><h2 class="ttl">${exam?'RÉSULTAT DE L\'EXAMEN BLANC':'RÉSULTAT'}</h2>
  <div class="reads"><div class="rd big"><b>${acc}%</b><small>RÉUSSITE</small></div><div class="rd big"><b>${R.pts}</b><small>POINTS</small></div><div class="rd big"><b>${R.ok}/${R.n}</b><small>JUSTES</small></div>${stk}</div>
  ${newBest?'<div class="fb ok"><b>NOUVEAU RECORD</b><span>meilleur score</span></div>':''}
  <p>${msg}</p>
  ${secKeys.length>1?`<table class="tbl">${secKeys.map(k=>`<tr><td>${esc(k)}</td><td>${secs[k].ok}/${secs[k].n}</td><td><div class="mini"><i style="width:${Math.round(100*secs[k].ok/secs[k].n)}%"></i></div></td></tr>`).join('')}</table>`:''}
  ${exam?`<p class="note">Cet indice mesure votre préparation à ces exercices. Il ne remplace pas l'évaluation officielle, qui note aussi la prononciation, l'aisance et l'interaction orale : entraînez-vous aussi à voix haute.</p>`:''}
  <div class="row"><button class="pb wide" onclick="again()"><span>REJOUER</span></button><button class="pb wide" onclick="back()"><span>RETOUR</span></button></div></div>`;
  window.scrollTo(0,0);
}
function again(){const f=R&&R.cfg.again;if(f)f();else nav('home');}
function back(){const b=R&&R.cfg.back||'home',a=R&&R.cfg.backArg;nav(b,a);}

/* ========== LANCEMENT DES JEUX ========== */
const GN={daily:'Défi du jour',timer:'Timer Quiz',timers:'Timer Quiz (survie)',ifr:'Clairances IFR',vfr:'Clairances VFR',photo:'Description de photo',reform:'Reformule',mayday:'Mayday builder',num:'Chrono chiffres',dict:'Dictée radio',ff:'Faux amis',err:"Chasse à l'erreur",review:'Révision des erreurs',mock:'Examen blanc',flash:'Flash vocabulaire',call:'Appels pilote'};
function seg(name,opts,cur){return `<div class="seg">${opts.map(o=>`<button class="pb sm ${o[0]===cur?'on':''}" onclick="setS('${name}','${o[0]}')"><span>${o[1]}</span><i class="ind"></i></button>`).join('')}</div>`;}
let SETUP=null;
function setS(k,v){S.set[k]=v;save();if(SETUP)SETUP();}
function timerSetup(){
  SETUP=timerSetup;
  const st=S.set;
  V.innerHTML=`<div class="panel"><h2 class="ttl">TIMER QUIZ</h2><p class="lead">Un mot s'affiche, cliquez la bonne traduction le plus vite possible. Plus vous répondez vite, plus vous marquez.</p>
  <div class="fld"><label>Catégorie</label><select onchange="setS('tcat',this.value)"><option value="all">Toutes les catégories (${VOC.length} mots)</option>${Object.keys(CATNAME).map(k=>`<option value="${k}" ${st.tcat===k?'selected':''}>${CATNAME[k]} (${VOC.filter(v=>v.cat===k).length})</option>`).join('')}</select></div>
  <div class="fld"><label>Sens</label>${seg('tdir',[['fe','FR → EN'],['ef','EN → FR'],['mix','MIXTE']],st.tdir)}</div>
  <div class="fld"><label>Temps par mot : <b>${st.sec} s</b></label><input type="range" min="3" max="15" step="1" value="${st.sec}" oninput="S.set.sec=+this.value;save();this.previousElementSibling.querySelector('b').textContent=this.value+' s'"></div>
  <div class="fld"><label>Mode</label>${seg('tmode',[['norm','NORMAL 20 MOTS'],['surv','SURVIE']],st.tmode)}</div>
  <p class="note">${st.tmode==='surv'?'Survie : 3 vies. À chaque bonne réponse, le temps diminue un peu. Une erreur ou un temps écoulé coûte une vie.':'Normal : 20 mots, la vitesse rapporte des points bonus.'}</p>
  <div class="row"><button class="pb wide go" onclick="startTimer()"><span>DÉMARRER</span></button></div></div>`;
}
function startTimer(){
  SETUP=null;
  const st=S.set,pool=st.tcat!=='all'?VOC.filter(v=>v.cat===st.tcat):VOC,surv=st.tmode==='surv';
  startRun({id:surv?'timers':'timer',title:'Timer Quiz',timed:true,sec:st.sec,survival:surv,lives:surv?3:null,n:surv?0:20,auto:true,gen:()=>vocabQ(st.tdir,pool),again:timerSetup,back:'home'});
}
function clearSetup(mode,groups,title,back,backArg){
  SETUP=()=>clearSetup(mode,groups,title,back,backArg);
  const st=S.set;
  V.innerHTML=`<div class="panel"><h2 class="ttl">${esc(title)}</h2><p class="lead">L'ATC parle, vous répondez comme un pilote : relecture exacte ou appel complet.</p>
  <div class="fld"><label>Format de réponse</label>${seg('fmt',[['click','CLIC'],['words','MOT À MOT'],['mix','MIXTE']],st.fmt)}</div>
  <div class="fld"><label>Niveau</label>${seg('level',[['simple','SIMPLE'],['combo','COMBINÉ']],st.level)}</div>
  <div class="fld"><label>Texte de la clairance</label>${seg('hide',[['false','VISIBLE'],['true','MASQUÉ (OREILLE)']],String(st.hide))}</div>
  <p class="note">Combiné : deux instructions dans le même message. Masqué : vous ne voyez le texte qu'après votre réponse, comme à l'oral.</p>
  <div class="row"><button class="pb wide go" onclick="startClear('${mode}',${groups?JSON.stringify(groups).replace(/"/g,"'"):'null'},'${esc(title).replace(/'/g,"\\'")}','${back||'home'}','${backArg||''}')"><span>DÉMARRER</span></button></div></div>`;
}
function startClear(mode,groups,title,back,backArg){
  SETUP=null;
  const st=S.set;
  const o={fmt:st.fmt,combo:st.level==='combo',groups,hide:st.hide===true||st.hide==='true'};
  startRun({id:mode==='I'?'ifr':'vfr',title,n:10,gen:()=>clearQ(mode,o),again:()=>clearSetup(mode,groups,title,back,backArg),back,backArg:backArg||undefined});
}
function startSimple(id,n,gen,back){startRun({id,title:GN[id],n,gen,again:()=>startSimple(id,n,gen,back),back:back||'home'});}
function startReview(){
  const keys=Object.keys(S.weak).filter(k=>VMAP[k]).sort((a,b)=>S.weak[b]-S.weak[a]);
  if(!keys.length){V.innerHTML=`<div class="panel"><h2 class="ttl">RÉVISION DES ERREURS</h2><p>Aucune erreur à revoir pour l'instant. Jouez au Timer Quiz : les mots ratés apparaîtront ici.</p><div class="row"><button class="pb wide" onclick="nav('home')"><span>RETOUR</span></button></div></div>`;return;}
  const pool=keys.slice(0,40).map(k=>VMAP[k]);
  startRun({id:'review',title:'Révision des erreurs',n:Math.min(15,Math.max(8,pool.length)),timed:false,gen:()=>vocabQ('mix',pool),again:startReview,back:'home'});
}
function tagged(qs,section){return qs.map(q=>Object.assign(q,{section}));}
function dailyQs(){
  const wp=Object.keys(S.weak).filter(k=>VMAP[k]).map(k=>VMAP[k]);
  const qs=[];
  for(let i=0;i<4;i++)qs.push(Object.assign(vocabQ('mix',i<2&&wp.length>=4?wp:null),{section:'Vocabulaire'}));
  qs.push(Object.assign(numQ(),{section:'Chiffres'}),Object.assign(numQ(),{section:'Chiffres'}));
  qs.push(Object.assign(clearQ('I',{fmt:'click'}),{section:'Clairances'}),Object.assign(clearQ('V',{fmt:'words'}),{section:'Clairances'}),Object.assign(clearQ('I',{kind:'p'}),{section:'Clairances'}));
  qs.push(Object.assign(ffQ(),{section:'Faux amis'}),Object.assign(errQ(),{section:'Faux amis'}));
  qs.push(Object.assign(dictQ(false),{section:'Dictée'}));
  return qs;
}
function startDaily(){startRun({id:'daily',title:'Défi du jour',qs:dailyQs(),n:12,again:startDaily,back:'home'});}
function mockQs(){
  const qs=[];
  for(let i=0;i<4;i++)qs.push(Object.assign(numQ(),{section:'Écoute : chiffres'}));
  for(let i=0;i<2;i++)qs.push(Object.assign(dictQ(i===1),{section:'Écoute : dictée'}));
  for(let i=0;i<3;i++)qs.push(Object.assign(clearQ('I',{fmt:'mix',combo:i===2,hide:true}),{section:'Clairances IFR'}));
  for(let i=0;i<3;i++)qs.push(Object.assign(clearQ('V',{fmt:'mix',combo:i===2,hide:true}),{section:'Clairances VFR'}));
  for(let i=0;i<5;i++)qs.push(Object.assign(vocabQ('mix'),{section:'Vocabulaire'}));
  for(let i=0;i<2;i++)qs.push(Object.assign(ffQ(),{section:'Faux amis'}));
  for(let i=0;i<2;i++)qs.push(Object.assign(errQ(),{section:'Franglais'}));
  qs.push(Object.assign(maydayQ(),{section:'Urgence'}),Object.assign(clearQ('I',{kind:'p',groups:['emergency','engine','failure']}),{section:'Urgence'}));
  qs.push(Object.assign(photoQ(),{section:'Description de photo'}),Object.assign(reformQ(),{section:'Reformule'}));
  return qs;
}
function startMock(){const qs=mockQs();startRun({id:'mock',title:'Examen blanc',qs,n:qs.length,again:startMock,back:'home'});}
function mockIntro(){
  V.innerHTML=`<div class="panel"><h2 class="ttl">EXAMEN BLANC</h2><p class="lead">25 questions dans l'ordre d'une vraie épreuve : écoute, clairances IFR et VFR (texte masqué), vocabulaire, faux amis, urgence, photo et reformulation.</p>
  <p class="note">Faites-le au calme, avec le son, sans aide. Comptez 20 à 30 minutes. À la fin, vous verrez le détail par section.</p>
  <div class="row"><button class="pb wide go" onclick="startMock()"><span>DÉMARRER L'EXAMEN</span></button></div></div>`;
}
function launch(id){
  SETUP=null;
  ({
    daily:startDaily,
    timer:timerSetup,
    num:()=>startSimple('num',12,()=>numQ()),
    dict:()=>startSimple('dict',8,()=>dictQ(Math.random()<0.4)),
    review:startReview,
    ifr:()=>clearSetup('I',null,'CLAIRANCES IFR'),
    vfr:()=>clearSetup('V',null,'CLAIRANCES VFR'),
    mayday:()=>startSimple('mayday',6,()=>maydayQ()),
    photo:()=>{const ps=shuffle(PHOTOS);startSimple('photo',5,i=>photoQ(ps[i%ps.length]));},
    reform:()=>startSimple('reform',6,()=>reformQ()),
    ff:()=>startSimple('ff',12,()=>ffQ(),'ff'),
    err:()=>startSimple('err',12,()=>errQ(),'ff'),
    mock:mockIntro
  })[id]();
}

/* ========== VUES ========== */
function nav(v,arg){
  SETUP=null;stopRun();VIEW=v;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===({home:'home',cours:'cours',phase:'cours',ff:'ff',prog:'prog',set:'set'})[v]));
  ({home:vHome,cours:vCours,phase:vPhase,ff:vFF,prog:vProg,set:vSet})[v](arg);
  window.scrollTo(0,0);
}
let VIEW='home';
function tile(id,t,s,wide){
  const b=S.best[id]||S.best[id+'s'];
  return `<button class="tile pb ${wide?'wide2':''}" onclick="launch('${id}')"><b>${t}</b><small>${s}</small><span class="ind ${b?'ok':''}">${b?'RECORD '+b:'NOUVEAU'}</span></button>`;
}
function vHome(){
  const t=S.days[dayKey()]||0,g=S.set.goal,pc=Math.min(100,Math.round(100*t/g)),d=examDays();
  const msg=d===null?'Réglez la date de votre examen dans RÉGL. pour activer le compte à rebours.':d>1?`Plus que ${d} jours. Visez le défi du jour et un examen blanc chaque jour.`:d===1?'Examen demain. Révisez les points faibles, dormez bien.':d===0?'C\'est le grand jour. Respirez, vous êtes prêt.':'Examen passé. Continuez à vous entraîner.';
  V.innerHTML=`<div class="panel"><h2 class="ttl">OBJECTIF DU JOUR</h2><div class="gauge"><i style="width:${pc}%"></i></div><div class="gl"><span>${t} / ${g} points</span><span>${pc}%</span></div><p class="note">${msg}</p></div>
  <div class="grid">${tile('daily','DÉFI DU JOUR','12 questions · 5 min',true)}</div>
  <h3 class="sub2">Vocabulaire et oreille</h3>
  <div class="grid">${tile('timer','TIMER QUIZ','Mot FR → EN, chrono')}${tile('num','CHRONO CHIFFRES','QNH, fréquences, codes')}${tile('dict','DICTÉE RADIO','Écrivez ce que vous entendez')}${tile('review','MES ERREURS','Mots à revoir')}</div>
  <h3 class="sub2">Clairances et urgences</h3>
  <div class="grid">${tile('ifr','CLAIRANCES IFR','Relecture et appels')}${tile('vfr','CLAIRANCES VFR','Circuit, zone, transit')}${tile('mayday','MAYDAY BUILDER','Remettre dans l\'ordre')}</div>
  <h3 class="sub2">Oral</h3>
  <div class="grid">${tile('photo','DESCRIPTION DE PHOTO','Décrire, puis corriger')}${tile('reform','REFORMULE','Expliquer un mot inconnu')}</div>
  <h3 class="sub2">Faux amis</h3>
  <div class="grid">${tile('ff','FAUX AMIS','Pièges FR ↔ EN')}${tile('err','CHASSE À L\'ERREUR','Franglais à corriger')}</div>
  <h3 class="sub2">Simulation</h3>
  <div class="grid">${tile('mock','EXAMEN BLANC','25 questions, texte masqué',true)}</div>`;
}
function vCours(){
  V.innerHTML=`<div class="panel"><h2 class="ttl">COURS PAR PHASE DE VOL</h2><p class="lead">Choisissez une phase : vocabulaire, phrases types avec réponse cachée, puis mini-jeux.</p></div>
  <div class="grid">${PHASES.map((p,i)=>`<button class="tile pb" onclick="nav('phase',${i})"><b>${esc(p.n.toUpperCase())}</b><small>${esc(p.en)}</small><span class="ind">${VOC.filter(v=>p.cats.includes(v.cat)).length} MOTS</span></button>`).join('')}</div>`;
}
let PV=[],PS=[];
function hasTpl(mode,groups){return TPL.some(t=>(t.m==='B'||t.m===mode)&&t.g.some(g=>groups.includes(g)));}
function vPhase(i){
  const p=PHASES[i];
  PV=VOC.filter(v=>p.cats.includes(v.cat));
  PS=[];
  const modes=p.modes||['I','V'];
  modes.forEach(m=>{if(hasTpl(m,p.groups)){for(let k=0;k<3;k++)PS.push({m,sc:genScenario(m,{groups:p.groups})});}});
  const play=[];
  play.push(`<button class="tile pb" onclick="startFlash(${i})"><b>FLASH VOCAB</b><small>${PV.length} mots de la phase</small><span class="ind">20 MOTS</span></button>`);
  if(modes.includes('I')&&hasTpl('I',p.groups))play.push(`<button class="tile pb" onclick="clearSetup('I',${JSON.stringify(p.groups).replace(/"/g,"'")},'${p.n.toUpperCase()} · IFR','phase','${i}')"><b>CLAIRANCES IFR</b><small>${esc(p.n)}</small><span class="ind">10 QUESTIONS</span></button>`);
  if(modes.includes('V')&&hasTpl('V',p.groups))play.push(`<button class="tile pb" onclick="clearSetup('V',${JSON.stringify(p.groups).replace(/"/g,"'")},'${p.n.toUpperCase()} · VFR','phase','${i}')"><b>CLAIRANCES VFR</b><small>${esc(p.n)}</small><span class="ind">10 QUESTIONS</span></button>`);
  V.innerHTML=`<div class="panel"><button class="pb sm" onclick="nav('cours')"><span>← PHASES</span></button><h2 class="ttl">${esc(p.n.toUpperCase())} <small>${esc(p.en)}</small></h2><p class="lead">${esc(p.desc)}</p></div>
  <h3 class="sub2">Jouer</h3><div class="grid">${play.join('')}</div>
  <h3 class="sub2">Phrases types (touchez pour voir la réponse)</h3>
  ${PS.length?PS.map((x,k)=>`<div class="panel ph"><div class="mode">${x.m==='I'?'IFR':'VFR'} · ${esc(x.sc.cat)}</div>${x.sc.call?`<div class="ctx">${esc(x.sc.ctx)}</div>`:`<div class="strip atc"><div class="cs">ATC</div><div class="msg">${esc(x.sc.atc)}</div></div><div class="row"><button class="pb sm" onclick="speak(PS[${k}].sc.atc)"><span>ÉCOUTER</span></button></div>`}
  <button class="pb wide" onclick="this.nextElementSibling.style.display='block';this.style.display='none'"><span>${x.sc.call?'VOIR L\'APPEL TYPE':'VOIR LA RÉPONSE'}</span></button>
  <div class="strip pilot" style="display:none"><div class="cs">VOUS</div><div class="msg">${esc(x.sc.rb)}<div class="tipx">${esc(x.sc.tip)}</div><div class="row"><button class="pb sm" onclick="speak(PS[${k}].sc.rb)"><span>ÉCOUTER</span></button></div></div></div></div>`).join(''):'<p class="note">Cette phase est surtout lexicale : travaillez le vocabulaire ci-dessous.</p>'}
  <h3 class="sub2">Vocabulaire (touchez pour écouter)</h3>
  <div class="panel vl">${PV.map((v,k)=>`<button class="vr" onclick="speak(PV[${k}].en.replace(/^to /,''),.85)"><span class="f">${esc(v.fr)}</span><span class="e">${esc(v.en)}</span></button>`).join('')}</div>`;
}
function startFlash(i){
  const p=PHASES[i],pool=VOC.filter(v=>p.cats.includes(v.cat));
  startRun({id:'flash',title:'Flash '+p.n,timed:true,sec:S.set.sec,n:20,auto:true,gen:()=>vocabQ('fe',pool),again:()=>startFlash(i),back:'phase',backArg:i});
}
function vFF(){
  V.innerHTML=`<div class="panel"><h2 class="ttl">FAUX AMIS ET FRANGLAIS</h2><p class="lead">Les erreurs de francophones sont une cause fréquente de points perdus à l'oral. Travaillez-les en jouant, puis relisez les fiches.</p></div>
  <div class="grid">${tile('ff','QUIZ FAUX AMIS','12 questions')}${tile('err','CHASSE À L\'ERREUR','Franglais à corriger')}</div>
  <h3 class="sub2">Fiches (${FF.length} faux amis)</h3>
  <div class="panel">${FF.map(f=>`<details class="ffd"><summary><b>${esc(f.en)}</b><span>${esc(f.tru)}</span></summary><p><span class="amb">Piège :</span> ${esc(f.trap)}<br><span class="grn">Vrai sens :</span> ${esc(f.tru)}<br>Pour dire « ${esc(f.fr)} » : <b>${esc(f.enFor)}</b><br><i>${esc(f.ex)}</i><br>${esc(f.exfr)}</p></details>`).join('')}</div>`;
}
function vProg(){
  const days=[];const d=new Date();d.setDate(d.getDate()-13);
  for(let i=0;i<14;i++){days.push({k:dayKey(d),v:S.days[dayKey(d)]||0,l:d.getDate()});d.setDate(d.getDate()+1);}
  const mx=Math.max(S.set.goal,...days.map(x=>x.v),1);
  const bars=days.map((x,i)=>{const h=Math.round(100*x.v/mx),gx=10+i*24;return `<rect x="${gx}" y="${110-h}" width="16" height="${h}" fill="${x.v>=S.set.goal?'#3dff86':'#19d3ff'}" opacity="${x.v?1:.25}"/><text x="${gx+8}" y="124" font-size="9" fill="#8a97a3" text-anchor="middle">${x.l}</text>${x.v?`<text x="${gx+8}" y="${106-h}" font-size="8" fill="#e9eef2" text-anchor="middle">${x.v}</text>`:''}`;}).join('');
  const gy=110-Math.round(100*S.set.goal/mx);
  const byG={};S.hist.forEach(h=>{const k=h.g==='timers'?'timer':h.g;const o=byG[k]=byG[k]||{s:0,n:0,ok:0,best:0};o.s++;o.n+=h.n;o.ok+=h.ok;});
  Object.keys(byG).forEach(k=>byG[k].best=Math.max(S.best[k]||0,S.best[k+'s']||0));
  const rows=Object.keys(byG).map(k=>`<tr><td>${esc(GN[k]||k)}</td><td>${byG[k].s}</td><td>${byG[k].n?Math.round(100*byG[k].ok/byG[k].n):0}%</td><td>${byG[k].best}</td></tr>`).join('');
  const weak=Object.keys(S.weak).filter(k=>VMAP[k]).sort((a,b)=>S.weak[b]-S.weak[a]).slice(0,12);
  const ex=examDays();
  const week=days.slice(-7).reduce((a,x)=>a+x.v,0);
  V.innerHTML=`<div class="panel"><h2 class="ttl">PROGRESSION</h2>
  <div class="reads"><div class="rd big"><b>${ex===null?'--':(ex>0?'J-'+ex:ex===0?'J':'J+'+(-ex))}</b><small>EXAMEN</small></div><div class="rd big"><b>${streak()}</b><small>JOURS DE SÉRIE</small></div><div class="rd big"><b>${S.xp}</b><small>POINTS TOTAUX</small></div><div class="rd big"><b>${week}</b><small>7 DERNIERS JOURS</small></div></div></div>
  <div class="panel"><h2 class="ttl">POINTS PAR JOUR (14 JOURS)</h2><svg viewBox="0 0 350 130" class="chart"><line x1="0" y1="${gy}" x2="350" y2="${gy}" stroke="#ffb000" stroke-dasharray="4 3"/><text x="346" y="${gy-3}" font-size="8" fill="#ffb000" text-anchor="end">objectif ${S.set.goal}</text>${bars}</svg></div>
  <div class="panel"><h2 class="ttl">PAR JEU</h2>${rows?`<table class="tbl"><tr><th>Jeu</th><th>Parties</th><th>Réussite</th><th>Record</th></tr>${rows}</table>`:'<p class="note">Aucune partie jouée. Lancez le défi du jour.</p>'}</div>
  <div class="panel"><h2 class="ttl">MOTS À REVOIR</h2>${weak.length?`<div class="vl">${weak.map(k=>`<div class="vr"><span class="f">${esc(VMAP[k].fr)}</span><span class="e">${esc(VMAP[k].en)}</span></div>`).join('')}</div><div class="row"><button class="pb wide" onclick="launch('review')"><span>LES TRAVAILLER</span></button></div>`:'<p class="note">Aucun mot en difficulté.</p>'}</div>`;
}
function vSet(){
  SETUP=vSet;
  const st=S.set;
  V.innerHTML=`<div class="panel"><h2 class="ttl">RÉGLAGES</h2>
  <div class="fld"><label>Date de l'examen</label><input type="date" value="${esc(st.exam)}" onchange="S.set.exam=this.value;save();hdr()"></div>
  <div class="fld"><label>Objectif quotidien : <b>${st.goal} points</b></label><input type="range" min="100" max="1000" step="50" value="${st.goal}" oninput="S.set.goal=+this.value;save();this.previousElementSibling.querySelector('b').textContent=this.value+' points'"></div>
  <div class="fld"><label>Sons de validation et d'erreur</label>${seg('snd',[['true','ACTIVÉS'],['false','COUPÉS']],String(st.snd))}</div>
  <div class="fld"><label>Vitesse de la voix : <b>${st.rate.toFixed(2)}</b></label><input type="range" min="0.6" max="1.2" step="0.05" value="${st.rate}" oninput="S.set.rate=+this.value;save();this.previousElementSibling.querySelector('b').textContent=(+this.value).toFixed(2)"></div>
  <div class="row"><button class="pb sm" onclick="speak('Speedbird 452, descend flight level 80, QNH 1013')"><span>TESTER LA VOIX</span></button></div>
  <div class="fld"><label>Temps par mot du Timer Quiz : <b>${st.sec} s</b></label><input type="range" min="3" max="15" step="1" value="${st.sec}" oninput="S.set.sec=+this.value;save();this.previousElementSibling.querySelector('b').textContent=this.value+' s'"></div>
  <p class="note">La progression est enregistrée sur cet appareil uniquement. Les messages radio sont des exemples pédagogiques : fréquences et points fictifs, à ne pas utiliser pour voler.</p>
  <div class="row"><button class="pb wide" onclick="if(confirm('Effacer toute la progression ?')){S={};try{localStorage.removeItem(KEY)}catch(e){};load();hdr();vSet();}"><span>RÉINITIALISER</span></button></div></div>`;
}
/* snd est booléen : conversion */
const _setS=setS;
setS=function(k,v){if(k==='hide'||k==='snd')v=(v==='true');_setS(k,v);};

load();hdr();nav('home');
