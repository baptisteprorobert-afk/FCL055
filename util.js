/* util.js : fonctions pures (testées sous Node) */
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pad=(n,l)=>String(n).padStart(l,'0');
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function tok(s){return s.replace(/,/g,'').trim().split(/\s+/);}

const PH={A:'Alpha',B:'Bravo',C:'Charlie',D:'Delta',E:'Echo',F:'Foxtrot',G:'Golf',H:'Hotel',I:'India',J:'Juliett',K:'Kilo',L:'Lima',M:'Mike',N:'November',O:'Oscar',P:'Papa',Q:'Quebec',R:'Romeo',S:'Sierra',T:'Tango',U:'Uniform',V:'Victor',W:'Whiskey',X:'X-ray',Y:'Yankee',Z:'Zulu'};
const DG={'0':'zero','1':'one','2':'two','3':'tree','4':'four','5':'fife','6':'six','7':'seven','8':'eight','9':'niner'};
const OC=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
const ACR=['ILS','QNH','QFE','SID','STAR','VFR','IFR','VOR','DME','ADF','NDB','RNAV','GPS','TCAS','ATC','VMC','IMC','SVFR','RVR','FIR','ATR','APU'];
const SAY={Nice:'Neece',Lyon:'Lee-on',Toulouse:'Too-looz',Schiphol:'Skip-hol',Orly:'Or-lee',Amsterdam:'Amsterdam'};
const PHW={alpha:'a',alfa:'a',bravo:'b',charlie:'c',delta:'d',echo:'e',foxtrot:'f',golf:'g',hotel:'h',india:'i',juliett:'j',juliet:'j',kilo:'k',lima:'l',mike:'m',november:'n',oscar:'o',papa:'p',quebec:'q',romeo:'r',sierra:'s',tango:'t',uniform:'u',victor:'v',whiskey:'w',xray:'x',yankee:'y',zulu:'z'};
const NW={zero:'0',one:'1',wun:'1',two:'2',too:'2',three:'3',tree:'3',four:'4',fower:'4',five:'5',fife:'5',six:'6',seven:'7',eight:'8',ait:'8',nine:'9',niner:'9',ten:'10',eleven:'11',twelve:'12'};

function spellDigits(s){return s.split('').map(c=>c==='.'?'decimal':(DG[c]||c)).join(' ');}
function letters(l){return l.split('').map(c=>PH[c]||c).join(' ');}
function toSpoken(t){
  t=t.replace(/\b([A-Z])-([A-Z]{4})\b/g,(m,a,l)=>PH[a]+' '+letters(l));
  t=t.replace(/\bN(\d{1,3})([A-Z]{0,2})\b/g,(m,d,l)=>'November '+spellDigits(d)+(l?' '+letters(l):''));
  t=t.replace(/\bFL ?(\d{2,3})\b/g,(m,d)=>'flight level '+spellDigits(d));
  t=t.replace(/\b(\d{2})([LRC])\b/g,(m,d,s)=>spellDigits(d)+' '+({L:'left',R:'right',C:'centre'})[s]);
  t=t.replace(/\b(\d{1,2})([A-Z]{1,2})\b/g,(m,d,l)=>spellDigits(d)+' '+letters(l));
  t=t.replace(/\b(\d{1,2}) o'clock/g,(m,n)=>(OC[+n]||n)+" o'clock");
  t=t.replace(/\bCAVOK\b/g,'Cav okay');
  t=t.replace(new RegExp('\\b('+ACR.join('|')+')\\b','g'),m=>m.split('').join(' '));
  t=t.replace(/\b(Nice|Lyon|Toulouse|Schiphol|Orly)\b/g,m=>SAY[m]);
  t=t.replace(/\b(\d+(?:\.\d+)?)( feet)?/g,(m,n,f)=>{
    if(f&&/^\d{4}$/.test(n)&&+n%100===0){
      const th=Math.floor(+n/1000),h=(+n%1000)/100;
      return DG[th]+' thousand'+(h?' '+DG[h]+' hundred':'')+f;
    }
    return spellDigits(n)+(f||'');
  });
  return t;
}

function norm(s){
  s=s.toLowerCase()
    .replace(/\bfl\s?(\d)/g,'flight level $1')
    .replace(/\b(\d{2})([lrc])\b/g,(m,d,x)=>d+' '+({l:'left',r:'right',c:'centre'})[x])
    .replace(/\bcenter\b/g,'centre')
    .replace(/\b(\d{1,2})([a-z]{1,2})\b/g,(m,d,l)=>d+' '+l.split('').join(' '))
    .replace(/x[\s-]ray/g,'xray').replace(/['’]/g,'').replace(/kilometers/g,'kilometres').replace(/meters/g,'metres')
    .replace(/\b([a-z]{1,2})-([a-z]{4})\b/g,'$1$2').replace(/takeoff/g,'take off').replace(/startup/g,'start up')
    .replace(/-/g,' ').replace(/[,;:!?"()\/]/g,' ').replace(/\.(?!\d)/g,' ');
  const raw=s.split(/\s+/).filter(Boolean),out=[];
  for(let t of raw){
    if(PHW[t])t=PHW[t];else if(NW[t])t=NW[t];
    if(t==='decimal'){out.push('.');continue;}
    if(t==='thousand'&&out.length&&/^\d+$/.test(out[out.length-1])){out.push(out.pop()+'000');continue;}
    if(t==='hundred'&&out.length&&/^\d+$/.test(out[out.length-1])){
      const val=+out.pop()*100;
      if(out.length&&/^\d+000$/.test(out[out.length-1]))out.push(String(+out.pop()+val));else out.push(String(val));
      continue;
    }
    out.push(t);
  }
  const res=[];let buf='';
  const flush=()=>{if(buf){res.push(buf);buf='';}};
  for(let i=0;i<out.length;i++){
    const t=out[i];
    if(/^[a-z]$/.test(t)||/^\d+$/.test(t)||(t==='.'&&buf&&/^\d/.test(out[i+1]||''))){buf+=t;}
    else{flush();res.push(t);}
  }
  flush();
  return res;
}
function normValue(s){return norm(String(s).replace(/,/g,'.')).join('');}

function lcsMask(exp,got){
  const n=exp.length,m=got.length;
  const d=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)d[i][j]=exp[i]===got[j]?d[i+1][j+1]+1:Math.max(d[i+1][j],d[i][j+1]);
  const hit=new Array(n).fill(false);let i=0,j=0;
  while(i<n&&j<m){if(exp[i]===got[j]){hit[i]=true;i++;j++;}else if(d[i+1][j]>=d[i][j+1])i++;else j++;}
  return hit;
}

/* options de relecture : 1 bonne + 3 fausses plausibles */
const SWAPS=[['Left','Right'],['Right','Left'],['left','right'],['right','left'],['Climb','Descend'],['Descend','Climb'],['climb','descend'],['descend','climb'],
 ['Cleared for take-off','Line up and wait'],['Line up runway','Cleared for take-off runway'],['Cleared to land','Go around'],['Cleared ILS approach','Cleared visual approach'],
 ['Reduce','Increase'],['Hold short of','Cross'],['Cross runway','Hold short of runway'],['Hold position','Taxi'],['Cleared touch-and-go','Cleared to land'],['Maintain','Descend to'],['Wilco','Unable'],['Contact','Leave']];
function mutateNum(s){
  const k=s.lastIndexOf(', ');const body=k>0?s.slice(0,k):s,tail=k>0?s.slice(k):'';
  const toks=body.split(' ');
  const idx=toks.map((t,i)=>/\d/.test(t)?i:-1).filter(i=>i>=0);
  if(!idx.length)return null;
  const i=rnd(idx);
  toks[i]=toks[i].replace(/\d+/,d=>{const n=d.split('');const p=rint(0,n.length-1);let nd;do{nd=String(rint(0,9));}while(nd===n[p]);n[p]=nd;return n.join('');});
  return toks.join(' ')+tail;
}
function swapWord(s){
  const c=shuffle(SWAPS);
  for(const [a,b] of c){if(s.includes(a))return s.replace(a,b);}
  return null;
}
function omitPart(s){
  const parts=s.split(', ');
  if(parts.length<3)return null;
  const i=rint(0,parts.length-2);
  return parts.filter((_,k)=>k!==i).join(', ');
}
const GENR=['Roger','Wilco','Negative','Unable','Standby','Say again'];
function mkOptions(correct,cs,cs2){
  const cands=[];
  const push=v=>{if(v&&v!==correct&&!cands.includes(v))cands.push(v);};
  const hasCs=!!cs&&correct.endsWith(cs);
  const body=hasCs?correct.slice(0,-cs.length).replace(/,\s*$/,''):null;
  const tries=[()=>mutateNum(correct),()=>swapWord(correct),()=>omitPart(correct),()=>hasCs&&cs2?correct.slice(0,-cs.length)+cs2:null,()=>body];
  for(const f of shuffle(tries)){push(f());if(cands.length===3)break;}
  let g=0;
  while(cands.length<3&&g++<40){
    const f=rnd([()=>mutateNum(correct),()=>swapWord(mutateNum(correct)||correct),()=>hasCs?rnd(GENR)+', '+cs:rnd(GENR),()=>hasCs&&cs2?rnd(GENR)+', '+cs2:null]);
    push(f());
  }
  return cands.slice(0,3);
}
if(typeof module!=='undefined')module.exports={rnd,rint,pad,shuffle,esc,tok,toSpoken,norm,normValue,lcsMask,mkOptions,mutateNum,swapWord,omitPart};
