/* data-clear.js : générateur de scénarios radio (exemples pédagogiques, fréquences et points fictifs) */
const APTS=[
 {n:'Paris',r:['26L','26R','27L','27R','08L','08R','09L','09R']},
 {n:'Orly',r:['02','20','06','24','08','26']},
 {n:'Heathrow',r:['27L','27R','09L','09R']},
 {n:'Gatwick',r:['26L','08R']},
 {n:'Lyon',r:['17L','17R','35L','35R']},
 {n:'Nice',r:['04L','04R','22L','22R']},
 {n:'Toulouse',r:['14L','14R','32L','32R']},
 {n:'Schiphol',r:['18R','36L','06','24','09','27']},
 {n:'Francfort',r:['25L','25R','07L','07R']}
];
const DESTS=['Nice','Lyon','Toulouse','Amsterdam','Madrid','Rome','Geneva','Lisbon','Brussels','Barcelona','Frankfurt','Dublin'];
const WPS=['TOKAR','LUDON','BIMGO','RESMI','ADUKI','NEVOT','OKIPA','SULIM','VELIN','MAGAL','DIRAK','PONEL'];
const TWY=['Alpha','Bravo','Charlie','Delta','Echo','Golf','Hotel','Kilo','Lima','Mike','November','Papa','Romeo','Sierra','Tango','Yankee'];
const VRPS=['Whiskey','Echo','November','Sierra','Alpha','Victor','Hotel','Charlie'];
const TYPES=['Cessna 172','Piper Cherokee','Cirrus SR22','Airbus A320','Boeing 737','ATR 72','Diamond DA40'];
const LET='ABCDEFGHJKLMNPRSTUVXYZ';
const AIRL=['Speedbird','Airfrans','Lufthansa','Easy','Delta','KLM','Iberia','Swiss','Ryanair','Vueling'];
const L1=()=>LET[rint(0,LET.length-1)];
function mkcs(mode){
  if(mode==='V'||Math.random()<0.25){
    return rnd(['F-G','F-H','G-','D-E'])+L1()+L1()+L1()+L1();
  }
  const a=rnd(AIRL);
  return a+' '+(Math.random()<0.3?rint(1,9)+L1()+L1():rint(10,9999));
}
function fixReg(cs){ // garantit 4 lettres après le tiret
  const m=cs.match(/^([A-Z])-([A-Z]+)$/);
  if(!m)return cs;
  let l=m[2];while(l.length<4)l+=L1();return m[1]+'-'+l.slice(0,4);
}
function mkSq(){let s;do{s=''+rint(0,7)+rint(0,7)+rint(0,7)+rint(0,7);}while(['7500','7600','7700','7000','1200','0000'].includes(s));return s;}
function mkFreq(){return rint(118,136)+'.'+rint(0,9)+rnd(['00','25','50','75']);}
function mkctx(mode){
  const apt=rnd(APTS);
  const rwy=rnd(apt.r);
  const others=apt.r.filter(x=>x!==rwy);
  const fl=rint(5,39)*10;let fl2;do{fl2=rint(5,39)*10;}while(fl2===fl);
  const cs=fixReg(mkcs(mode));let cs2;do{cs2=fixReg(mkcs(mode));}while(cs2===cs);
  const alt=rnd([2000,2500,3000,3500,4000,5000,6000,7000]);
  let alt2;do{alt2=rnd([2000,2500,3000,3500,4000,5000,6000,7000]);}while(alt2===alt);
  const t=shuffle(TWY);
  const w=shuffle(WPS);
  const lr=rnd(['left','right']);
  const c={
    cs,cs2,A:apt.n,rwy,rwy2:others.length?rnd(others):rwy,
    dest:rnd(DESTS.filter(d=>d!==apt.n)),wp:w[0],wp2:w[1],
    sid:w[0]+' '+rint(1,6)+rnd(['A','B','C','D','E']),star:w[1]+' '+rint(1,6)+rnd(['A','B','C','D']),
    fl,fl2,alt,alt2,altLo:rnd([1000,1500,2000]),altHi:rnd([3000,4000,5000,6000]),
    hdg:pad(rint(1,36)*10,3),lr,LR:lr[0].toUpperCase()+lr.slice(1),spd:rnd([160,170,180,190,200,210,220,230,250]),spdApp:rnd([140,150,160,170,180]),
    qnh:rint(995,1035),sq:mkSq(),f1:mkFreq(),f2:mkFreq(),
    t1:t[0],t2:t[1],t3:t[2],wd:pad(rint(1,36)*10,3),ws:rint(4,28),tl:rnd([50,60,70]),
    time:pad(rint(0,23),2)+pad(rnd([0,5,10,15,20,25,30,35,40,45,50,55]),2),
    vrp:rnd(VRPS),vrp2:rnd(VRPS),type:rnd(TYPES),dir:rnd(['north','south','east','west']),dir2:rnd(['same direction','opposite direction','crossing left to right','crossing right to left']),
    n:rnd(['two','three']),h:rint(1,12),d:rint(2,8),stand:rint(1,60),
    ctl:rnd(['Paris','London','Brussels','Reims','Bordeaux','Marseille','Maastricht']),
    pob:mode==='V'?rint(1,4):rint(80,240),end:rnd(['30 minutes','45 minutes','1 hour','2 hours']),
    distn:rint(4,15)
  };
  c.pobs=c.pob===1?'1 person':c.pob+' persons';
  c.pobFr=c.pob===1?'1 personne':c.pob+' personnes';
  return c;
}

const TPL=[];
const add=(m,g,k,cat,f)=>TPL.push({m,g:[].concat(g),k,cat,f});

/* ---- Clairance / prévol ---- */
add('I','delivery','c','Clairance IFR',c=>({a:`cleared to ${c.dest} via ${c.sid} departure, initial climb altitude ${c.alt} feet, squawk ${c.sq}`,r:`Cleared to ${c.dest} via ${c.sid} departure, initial climb altitude ${c.alt} feet, squawk ${c.sq}`,tip:"Destination, SID, altitude initiale et code transpondeur se relisent en entier."}));
add('I','delivery','c','Clairance IFR',c=>({a:`cleared to ${c.dest}, ${c.sid} departure, climb flight level ${c.fl}, squawk ${c.sq}`,r:`Cleared to ${c.dest}, ${c.sid} departure, climb flight level ${c.fl}, squawk ${c.sq}`,tip:"Le niveau de vol et le code SSR font partie de la relecture obligatoire."}));
add('I','delivery','p','Premier appel',c=>({ctx:`Vous êtes au parking à ${c.A}, avec l'ATIS Information Charlie. Appelez Delivery pour demander votre clairance vers ${c.dest}.`,r:`${c.A} Delivery, ${c.cs}, request IFR clearance to ${c.dest}, information Charlie`,tip:"Structure : station appelée, indicatif, demande, information ATIS."}));
/* ---- Mise en route ---- */
add('B','startup','c','Mise en route',c=>({a:`start-up approved, QNH ${c.qnh}`,r:`Start-up approved, QNH ${c.qnh}`,tip:"Le QNH se relit toujours."}));
add('I','startup','c','Repoussage',c=>({a:`pushback approved, face ${c.dir}`,r:`Pushback approved, face ${c.dir}`,tip:"Relisez l'autorisation de repoussage et l'orientation demandée."}));
add('I','startup','p','Premier appel',c=>({ctx:`Vous êtes au poste ${c.stand} à ${c.A}, passagers embarqués, ATIS Information Delta. Demandez la mise en route.`,r:`${c.A} Ground, ${c.cs}, stand ${c.stand}, request start-up, information Delta`,tip:"On donne le poste de stationnement pour que le contrôleur vous situe."}));
add('V','startup','c','Mise en route VFR',c=>({a:`start-up at your discretion, QNH ${c.qnh}`,r:`Start-up at my discretion, QNH ${c.qnh}`,tip:"« At your discretion » devient « at my discretion » dans la relecture."}));
/* ---- Roulage ---- */
add('B','taxi','c','Roulage',c=>({a:`taxi to holding point runway ${c.rwy} via ${c.t1}, ${c.t2}`,r:`Taxi to holding point runway ${c.rwy} via ${c.t1}, ${c.t2}`,tip:"Piste, point d'arrêt et itinéraire : tout se relit."}));
add('B','taxi','c','Roulage',c=>({a:`hold short of runway ${c.rwy}`,r:`Hold short of runway ${c.rwy}`,tip:"Toute instruction qui concerne une piste se relit en entier."}));
add('B','taxi','c','Roulage',c=>({a:`cross runway ${c.rwy}, taxi via ${c.t1}`,r:`Cross runway ${c.rwy}, taxi via ${c.t1}`,tip:"Ne traversez jamais sans avoir relu et reçu l'autorisation."}));
add('B','taxi','c','Roulage',c=>({a:`hold position`,r:`Hold position`,tip:"Court et immédiat : relisez puis arrêtez-vous."}));
add('B','taxi','c','Roulage',c=>({a:`taxi to holding point runway ${c.rwy} via ${c.t1}, report ready`,r:`Taxi to holding point runway ${c.rwy} via ${c.t1}, wilco`,tip:"Une demande de compte rendu se confirme par « wilco »."}));
add('V','taxi','c','Roulage VFR',c=>({a:`runway ${c.rwy} in use, QNH ${c.qnh}, taxi to holding point ${c.t1}`,r:`Taxi to holding point ${c.t1}, runway ${c.rwy}, QNH ${c.qnh}`,tip:"Piste en service, QNH et point d'arrêt sont relus."}));
add('V','taxi','p','Premier appel VFR',c=>({ctx:`Vous êtes à l'aire de stationnement avec votre avion léger, ATIS Information Echo. Vous partez en VFR vers ${c.dest} avec ${c.pobFr} à bord. Demandez le roulage.`,r:`${c.A} Ground, ${c.cs}, at the apron, VFR to ${c.dest}, ${c.pobs} on board, request taxi, information Echo`,tip:"Indicatif, position, type de vol, destination, nombre de personnes, demande."}));
add('B','taxi','p','Point d\'arrêt',c=>({ctx:`Vous êtes au point d'arrêt de la piste ${c.rwy}, prêt à partir. Appelez la Tour.`,r:`${c.A} Tower, ${c.cs}, holding point runway ${c.rwy}, ready for departure`,tip:"Donnez la position et « ready for departure »."}));
/* ---- Décollage ---- */
add('B','takeoff','c','Décollage',c=>({a:`line up runway ${c.rwy} and wait`,r:`Line up runway ${c.rwy} and wait`,tip:"« Line up and wait » ne vous autorise PAS à décoller."}));
add('B','takeoff','c','Décollage',c=>({a:`wind ${c.wd} degrees ${c.ws} knots, runway ${c.rwy}, cleared for take-off`,r:`Cleared for take-off runway ${c.rwy}`,tip:"Le vent est une information, on ne le relit pas."}));
add('B','takeoff','c','Décollage',c=>({a:`behind the landing ${c.type}, line up behind`,r:`Behind the landing ${c.type}, line up behind`,tip:"Autorisation conditionnelle : relisez la condition."}));
add('B','takeoff','c','Décollage',c=>({a:`runway ${c.rwy}, cleared for immediate take-off`,r:`Cleared for immediate take-off runway ${c.rwy}`,tip:"« Immediate » : vous devez libérer la piste très vite."}));
add('B','takeoff','c','Décollage',c=>({a:`stop immediately, stop immediately`,r:`Stopping`,tip:"Réponse courte, action immédiate."}));
add('V','takeoff','c','Départ VFR',c=>({a:`after take-off, left turn approved, leave the control zone via ${c.vrp}, not above altitude ${c.altHi} feet`,r:`Left turn approved, leave control zone via ${c.vrp}, not above altitude ${c.altHi} feet`,tip:"Point de sortie et limite d'altitude se relisent."}));
add('I','takeoff','c','Départ IFR',c=>({a:`contact Departure ${c.f1} when airborne`,r:`Contact Departure ${c.f1} when airborne`,tip:"La fréquence se relit."}));
/* ---- Montée ---- */
add('I','climb','c','Montée',c=>({a:`climb flight level ${c.fl}`,r:`Climb flight level ${c.fl}`,tip:"« Flight level » puis les chiffres un par un."}));
add('I','climb','c','Montée',c=>({a:`climb altitude ${c.alt} feet, QNH ${c.qnh}`,r:`Climb altitude ${c.alt} feet, QNH ${c.qnh}`,tip:"En altitude, le QNH accompagne la relecture."}));
add('I','climb','c','Montée',c=>({a:`radar contact, climb flight level ${c.fl}`,r:`Climb flight level ${c.fl}`,tip:"« Radar contact » est une information : pas de relecture."}));
add('I','climb','c','Montée',c=>({a:`maintain ${c.spd} knots`,r:`Maintain ${c.spd} knots`,tip:"Vitesse : relecture obligatoire."}));
add('I','climb','p','Premier appel',c=>({ctx:`Vous montez avec la SID ${c.sid}, vous passez ${c.altLo} pieds vers ${c.altHi} pieds. Appelez Departure.`,r:`${c.A} Departure, ${c.cs}, passing altitude ${c.altLo} feet, climbing altitude ${c.altHi} feet, ${c.sid} departure`,tip:"Altitude actuelle, altitude cible, procédure."}));
add('I',['climb','cruise','descent','approach'],'c','Cap',c=>({a:`turn ${c.lr} heading ${c.hdg}`,r:`${c.LR} heading ${c.hdg}`,tip:"Sens de virage + cap."}));
add('I',['climb','cruise'],'c','Direct',c=>({a:`proceed direct ${c.wp}`,r:`Direct ${c.wp}`,tip:"Le point se relit tel quel."}));
add('B',['climb','cruise','descent','approach','pattern'],'c','Code transpondeur',c=>({a:`squawk ${c.sq}`,r:`Squawk ${c.sq}`,tip:"Code transpondeur : chiffre par chiffre."}));
/* ---- Croisière ---- */
add('I','cruise','c','Croisière',c=>({a:`maintain flight level ${c.fl}, report passing ${c.wp}`,r:`Maintain flight level ${c.fl}, wilco`,tip:"Niveau relu puis « wilco » pour le compte rendu."}));
add('I','cruise','c','Changement de fréquence',c=>({a:`contact ${c.ctl} Control ${c.f1}`,r:`Contact ${c.ctl} Control ${c.f1}`,tip:"Station et fréquence se relisent."}));
add('I','cruise','c','Niveau refusé',c=>({a:`unable flight level ${c.fl}, maintain flight level ${c.fl2}`,r:`Maintain flight level ${c.fl2}`,tip:"Ne relisez que l'instruction : le niveau à maintenir."}));
add('I',['cruise','weather'],'c','Déviation météo',c=>({a:`deviation approved, report clear of weather`,r:`Deviation approved, wilco`,tip:"Approuvé + compte rendu demandé : « wilco »."}));
add('I','cruise','p','Demande de niveau',c=>({ctx:`Vous êtes au niveau ${c.fl}, et vous voulez le niveau ${c.fl2} pour éviter des turbulences. Appelez ${c.ctl} Control.`,r:`${c.ctl} Control, ${c.cs}, request flight level ${c.fl2}`,tip:"« Request » + niveau demandé."}));
add('B',['climb','cruise','descent','approach','pattern'],'c','Trafic',c=>({a:`traffic ${c.h} o'clock, ${c.d} miles, ${c.dir2}, ${c.type}, altitude ${c.alt} feet`,r:`Looking out`,tip:"Si vous ne voyez pas le trafic : « looking out ». Sinon : « traffic in sight »."}));
/* ---- Descente ---- */
add('I','descent','c','Descente',c=>({a:`descend flight level ${c.fl}`,r:`Descend flight level ${c.fl}`,tip:"Même structure qu'en montée."}));
add('I','descent','c','Descente',c=>({a:`descend altitude ${c.alt} feet, QNH ${c.qnh}`,r:`Descend altitude ${c.alt} feet, QNH ${c.qnh}`,tip:"Passage en altitude : n'oubliez pas le QNH."}));
add('I','descent','c','Niveau de transition',c=>({a:`transition level ${c.tl}, QNH ${c.qnh}, descend altitude ${c.alt} feet`,r:`Transition level ${c.tl}, QNH ${c.qnh}, descend altitude ${c.alt} feet`,tip:"Le niveau de transition est un élément à relire."}));
add('I','descent','c','Descente rapide',c=>({a:`expedite descent to flight level ${c.fl}`,r:`Expediting descent flight level ${c.fl}`,tip:"« Expedite » : descente aussi rapide que possible."}));
add('I',['descent','approach'],'c','Vitesse',c=>({a:`reduce speed ${c.spd} knots`,r:`Reduce speed ${c.spd} knots`,tip:"Vitesse imposée : relecture."}));
add('I','descent','c','Arrivée',c=>({a:`cleared ${c.star} arrival, expect ILS runway ${c.rwy}, QNH ${c.qnh}`,r:`Cleared ${c.star} arrival, expect ILS runway ${c.rwy}, QNH ${c.qnh}`,tip:"Arrivée, approche attendue et QNH."}));
add('I','descent','p','Contact Approach',c=>({ctx:`Vous descendez vers le niveau ${c.fl}, ATIS Information Charlie. Appelez ${c.A} Approach.`,r:`${c.A} Approach, ${c.cs}, descending flight level ${c.fl}, information Charlie`,tip:"Niveau en descente + information ATIS."}));
/* ---- Approche ---- */
add('I','approach','c','Vecteurs',c=>({a:`turn ${c.lr} heading ${c.hdg}, descend altitude ${c.alt} feet, vectors for ILS runway ${c.rwy}`,r:`${c.LR} heading ${c.hdg}, descend altitude ${c.alt} feet, vectors ILS runway ${c.rwy}`,tip:"Cap, altitude et piste : trois éléments à relire."}));
add('I','approach','c','ILS',c=>({a:`cleared ILS approach runway ${c.rwy}`,r:`Cleared ILS approach runway ${c.rwy}`,tip:"Autorisation d'approche : relecture obligatoire."}));
add('I','approach','c','ILS',c=>({a:`turn ${c.lr} heading ${c.hdg}, intercept the localiser, cleared ILS approach runway ${c.rwy}`,r:`${c.LR} heading ${c.hdg}, intercept localiser, cleared ILS approach runway ${c.rwy}`,tip:"Cap, interception du localizer et autorisation."}));
add('I','approach','c','ILS',c=>({a:`report established on the localiser`,r:`Wilco`,tip:"Compte rendu demandé : « wilco »."}));
add('I','approach','c','Vitesse',c=>({a:`maintain ${c.spdApp} knots until 4 miles final`,r:`Maintain ${c.spdApp} knots until 4 miles final`,tip:"Vitesse et point de fin de restriction."}));
add('I','approach','c','Fréquence',c=>({a:`contact Tower ${c.f1}`,r:`Contact Tower ${c.f1}`,tip:"Fréquence relue."}));
add('I',['approach'],'c','Attente',c=>({a:`hold at ${c.wp} as published, expect further clearance at ${c.time}`,r:`Hold at ${c.wp} as published, expect further clearance at ${c.time}`,tip:"Point, procédure et heure se relisent."}));
add('I',['approach','landing'],'c','Approche interrompue',c=>({a:`climb straight ahead altitude ${c.alt} feet, contact Approach ${c.f1}`,r:`Climb straight ahead altitude ${c.alt} feet, contact Approach ${c.f1}`,tip:"Trajectoire, altitude et fréquence."}));
add('I','approach','c','Approche à vue',c=>({a:`cleared visual approach runway ${c.rwy}, report runway in sight`,r:`Cleared visual approach runway ${c.rwy}, wilco`,tip:"Autorisation relue, puis « wilco »."}));
add('I','approach','p','Contact Tower',c=>({ctx:`Vous êtes établi sur l'ILS de la piste ${c.rwy}, 4 milles de la finale. Appelez la Tour.`,r:`${c.A} Tower, ${c.cs}, established ILS runway ${c.rwy}, 4 miles final`,tip:"Piste, procédure suivie et distance."}));
/* ---- Atterrissage ---- */
add('B','landing','c','Atterrissage',c=>({a:`wind ${c.wd} degrees ${c.ws} knots, runway ${c.rwy}, cleared to land`,r:`Cleared to land runway ${c.rwy}`,tip:"Seule la formule « cleared to land » est une autorisation."}));
add('B','landing','c','Remise de gaz',c=>({a:`go around`,r:`Going around`,tip:"Réponse très courte, puis action."}));
add('B','landing','c','Dégagement',c=>({a:`vacate right via ${c.t1}, contact Ground ${c.f1}`,r:`Vacate right via ${c.t1}, contact Ground ${c.f1}`,tip:"Voie de dégagement et fréquence suivante."}));
add('V',['landing','pattern'],'c','Posé-décollé',c=>({a:`runway ${c.rwy}, cleared touch-and-go`,r:`Cleared touch-and-go runway ${c.rwy}`,tip:"Ne confondez pas avec « cleared to land »."}));
add('B','landing','c','Séquence',c=>({a:`continue approach, number ${c.n}, follow the ${c.type} on final`,r:`Continue approach, number ${c.n}, will follow the ${c.type}`,tip:"Numéro d'ordre + trafic à suivre."}));
/* ---- Circuit / VFR ---- */
add('V','pattern','c','Entrée circuit',c=>({a:`join ${c.lr} downwind runway ${c.rwy}, QNH ${c.qnh}, report downwind`,r:`Join ${c.lr} downwind runway ${c.rwy}, QNH ${c.qnh}, wilco`,tip:"Main du circuit, piste, QNH, puis « wilco »."}));
add('V','pattern','c','Séquence',c=>({a:`number ${c.n}, follow the ${c.type}, report base`,r:`Number ${c.n}, will follow the ${c.type}, wilco`,tip:"Numéro, trafic à suivre et compte rendu."}));
add('V','pattern','c','Espacement',c=>({a:`extend downwind, I will call you for base`,r:`Extending downwind`,tip:"Vous prolongez la vent arrière jusqu'à nouvel ordre."}));
add('V','pattern','c','Compte rendu',c=>({a:`report final runway ${c.rwy}`,r:`Wilco`,tip:"Court : « wilco » suffit pour un simple compte rendu."}));
add('V','pattern','c','Orbite',c=>({a:`orbit ${c.lr}`,r:`Orbit ${c.lr}`,tip:"Un tour complet pour créer de l'espacement."}));
add('V','pattern','c','Entrée de zone',c=>({a:`enter control zone via ${c.vrp}, not above altitude ${c.altHi} feet, QNH ${c.qnh}, squawk ${c.sq}`,r:`Enter control zone via ${c.vrp}, not above altitude ${c.altHi} feet, QNH ${c.qnh}, squawk ${c.sq}`,tip:"Point d'entrée, limite d'altitude, QNH et code."}));
add('V','pattern','c','VFR spécial',c=>({a:`cleared to enter control zone, special VFR, not above altitude ${c.altHi} feet, QNH ${c.qnh}`,r:`Cleared to enter control zone, special VFR, not above altitude ${c.altHi} feet, QNH ${c.qnh}`,tip:"Le « special VFR » fait partie de l'autorisation."}));
add('V','pattern','c','Transit',c=>({a:`cleared to transit control zone via ${c.vrp} then ${c.vrp2}, maintain altitude ${c.alt} feet`,r:`Cleared to transit control zone via ${c.vrp} then ${c.vrp2}, maintain altitude ${c.alt} feet`,tip:"Les deux points et l'altitude à maintenir."}));
add('V','pattern','p','Premier appel',c=>({ctx:`Vous êtes à ${c.distn} milles au ${c.dir} de ${c.A}, altitude 2000 pieds, ATIS Information Delta. Vous arrivez pour atterrir. Appelez la Tour.`,r:`${c.A} Tower, ${c.cs}, ${c.distn} miles ${c.dir}, altitude 2000 feet, information Delta, inbound for landing`,tip:"Position, altitude, information, intention."}));
add('V','pattern','p','Compte rendu de position',c=>({ctx:`Vous êtes en vent arrière main ${c.lr === 'left' ? 'gauche' : 'droite'} de la piste ${c.rwy}. Faites votre compte rendu.`,r:`${c.cs}, downwind runway ${c.rwy}`,tip:"Indicatif, position dans le circuit, piste."}));
add('V',['pattern','cruise'],'p','Position VFR',c=>({ctx:`Vous êtes à la verticale du point ${c.vrp}, altitude ${c.alt} pieds, QNH ${c.qnh}. L'ATC vous demande votre position.`,r:`${c.cs}, over ${c.vrp}, altitude ${c.alt} feet, QNH ${c.qnh}`,tip:"« Over » + point + altitude."}));
/* ---- Météo ---- */
add('B','weather','c','Météo',c=>({a:`caution windshear on final runway ${c.rwy}`,r:`Roger`,tip:"Information de sécurité : « roger » suffit."}));
add('B','weather','c','Météo',c=>({a:`new QNH ${c.qnh}`,r:`QNH ${c.qnh}`,tip:"Un nouveau QNH se relit."}));
add('I','weather','c','ATIS',c=>({a:`runway in use ${c.rwy}, wind ${c.wd} degrees ${c.ws} knots, QNH ${c.qnh}`,r:`Runway ${c.rwy}, QNH ${c.qnh}`,tip:"Relisez piste et QNH, pas le vent."}));
add('I','weather','p','Orage devant',c=>({ctx:`Un orage (cumulonimbus) se développe à 20 milles devant vous. Demandez à ${c.ctl} Control une déviation de 20 degrés à droite.`,r:`${c.ctl} Control, ${c.cs}, request deviation 20 degrees right due to weather`,tip:"Demande + valeur + raison."}));
add('I','weather','p','Givrage',c=>({ctx:`Vous givrez au niveau ${c.fl}. Demandez la descente au niveau ${c.fl2} à ${c.ctl} Control.`,r:`${c.ctl} Control, ${c.cs}, request descent flight level ${c.fl2}, icing`,tip:"Demande + raison."}));
add('V','weather','p','Visibilité',c=>({ctx:`La visibilité se dégrade et vous voulez revenir vers ${c.A}. Appelez la Tour.`,r:`${c.A} Tower, ${c.cs}, visibility deteriorating, request return to ${c.A}`,tip:"Raison, puis intention."}));
/* ---- Urgences ---- */
add('B','emergency','c','Urgence',c=>({a:`roger Mayday, squawk 7700, turn ${c.lr} heading ${c.hdg}`,r:`Squawk 7700, ${c.LR} heading ${c.hdg}`,tip:"Code de détresse 7700, puis cap."}));
add('B','emergency','c','Urgence',c=>({a:`say persons on board and fuel endurance`,r:`${c.pobs} on board, endurance ${c.end}`,tip:"Nombre de personnes et autonomie."}));
add('B','emergency','c','Urgence',c=>({a:`emergency services standing by, wind ${c.wd} degrees ${c.ws} knots, runway ${c.rwy}, cleared to land`,r:`Cleared to land runway ${c.rwy}`,tip:"Concentrez-vous sur l'autorisation."}));
add('B','emergency','p','Mayday moteur',c=>({ctx:`Panne moteur à 3000 pieds, 10 milles au ${c.dir} de ${c.A}. Passez le message de détresse à Approach (nature, intentions, position, personnes à bord).`,r:`Mayday, Mayday, Mayday, ${c.A} Approach, ${c.cs}, engine failure, request immediate landing, 10 miles ${c.dir}, altitude 3000 feet, ${c.pobs} on board`,tip:"Mayday x3, station, indicatif, nature, intention, position, personnes à bord."}));
add('B','emergency','p','Pan-Pan médical',c=>({ctx:`Un passager est malade pendant la croisière. Informez ${c.A} Approach que vous voulez vous dérouter vers ${c.A}.`,r:`Pan-Pan, Pan-Pan, Pan-Pan, ${c.A} Approach, ${c.cs}, medical emergency, request diversion to ${c.A}, ${c.pobs} on board`,tip:"Pan-Pan pour une urgence sans danger immédiat."}));
add('B','emergency','p','Mayday incendie',c=>({ctx:`Incendie dans le cockpit, vous revenez au terrain. Appelez la Tour.`,r:`Mayday, Mayday, Mayday, ${c.A} Tower, ${c.cs}, fire in the cockpit, returning to the field, ${c.pobs} on board`,tip:"Nature, intention, personnes à bord."}));
add('B','emergency','p','Carburant',c=>({ctx:`Votre carburant devient très bas, vous demandez une approche directe sur la piste ${c.rwy}.`,r:`${c.A} Approach, ${c.cs}, minimum fuel, request direct approach runway ${c.rwy}`,tip:"« Minimum fuel » annonce un état de carburant critique, sans être encore une détresse."}));
add('V','emergency','p','Position incertaine',c=>({ctx:`Vous êtes perdu, altitude ${c.alt} pieds. Faites un appel d'urgence et demandez des vecteurs radar à ${c.A} Approach.`,r:`Pan-Pan, Pan-Pan, Pan-Pan, ${c.A} Approach, ${c.cs}, uncertain of position, altitude ${c.alt} feet, request radar vectors`,tip:"« Uncertain of position » puis demande d'aide."}));
/* ---- Pannes ---- */
add('B','failure','p','Transpondeur',c=>({ctx:`Votre transpondeur est en panne. Prévenez ${c.ctl} Control et demandez à continuer vers ${c.dest}.`,r:`${c.ctl} Control, ${c.cs}, transponder failure, request to continue to ${c.dest}`,tip:"Panne puis demande."}));
add('B','failure','p','Instruments',c=>({ctx:`Panne de l'horizon artificiel en nuage. Faites un appel d'urgence et demandez des vecteurs radar.`,r:`Pan-Pan, Pan-Pan, Pan-Pan, ${c.A} Approach, ${c.cs}, attitude indicator failure, request radar vectors`,tip:"Panne + besoin d'assistance."}));
add('B','failure','p','Panne électrique',c=>({ctx:`Panne électrique générale. Vous demandez un atterrissage prioritaire à ${c.A} Approach.`,r:`Pan-Pan, Pan-Pan, Pan-Pan, ${c.A} Approach, ${c.cs}, electrical failure, request priority landing`,tip:"Pan-Pan puis demande de priorité."}));
add('B','failure','p','Train',c=>({ctx:`À l'approche, le train d'atterrissage ne se verrouille pas. Informez la Tour et remettez les gaz.`,r:`${c.A} Tower, ${c.cs}, landing gear unsafe, going around`,tip:"Annoncez la panne, puis votre action."}));
add('B','failure','c','Transpondeur',c=>({a:`confirm you are squawking ${c.sq}`,r:`Squawking ${c.sq}`,tip:"Répondez par la forme progressive."}));
add('B','failure','c','Essai radio',c=>({a:`radio check, how do you read?`,r:`Reading you five`,tip:"Échelle de lisibilité de 1 à 5 : cinq signifie parfait."}));
/* ---- Moteur ---- */
add('B','engine','p','Pression d\'huile',c=>({ctx:`La pression d'huile chute en croisière. Prévenez Approach et demandez un déroutement vers ${c.A}.`,r:`Pan-Pan, Pan-Pan, Pan-Pan, ${c.A} Approach, ${c.cs}, oil pressure dropping, request diversion to ${c.A}`,tip:"Symptôme puis intention."}));
add('B','engine','p','Moteur irrégulier',c=>({ctx:`Le moteur tourne irrégulièrement. Demandez des vecteurs vers l'aérodrome le plus proche.`,r:`Pan-Pan, Pan-Pan, Pan-Pan, ${c.A} Approach, ${c.cs}, engine running rough, request vectors to nearest aerodrome`,tip:"« Running rough » : moteur qui tourne mal."}));
add('B','engine','p','Feu moteur',c=>({ctx:`Incendie moteur. Passez le message de détresse à la Tour et revenez au terrain.`,r:`Mayday, Mayday, Mayday, ${c.A} Tower, ${c.cs}, engine fire, returning to the field, ${c.pobs} on board`,tip:"Mayday x3, nature, intention, personnes à bord."}));
add('V','engine','p','Givrage carburateur',c=>({ctx:`Vous avez du givrage carburateur et vous voulez descendre vers ${c.alt2} pieds. Demandez-le à Approach.`,r:`${c.A} Approach, ${c.cs}, carburettor icing, request descent altitude ${c.alt2} feet`,tip:"Problème + demande."}));
add('B','engine','c','Autonomie',c=>({a:`report fuel remaining`,r:`Fuel endurance ${c.end}`,tip:"Répondez par l'autonomie, pas par la quantité."}));

/* groupes <-> phases */
const COMBO_OK=['taxi','climb','cruise','descent','approach','pattern'];

function pickTpl(mode,groups,kind){
  let L=TPL.filter(t=>(t.m==='B'||t.m===mode)&&(!groups||t.g.some(g=>groups.includes(g)))&&(!kind||t.k===kind));
  if(!L.length)L=TPL.filter(t=>(t.m==='B'||t.m===mode)&&(!kind||t.k===kind));
  return rnd(L);
}
/* Scénario complet : {atc, rb, ctx, call, tip, cat, cs, cs2} */
function genScenario(mode,opts){
  opts=opts||{};
  const c=mkctx(mode);
  let t=pickTpl(mode,opts.groups,opts.kind);
  if(opts.kind!=='p'&&t.k==='c'&&opts.combo&&t.g.some(g=>COMBO_OK.includes(g))){
    const pool=TPL.filter(x=>x!==t&&x.k==='c'&&(x.m==='B'||x.m===mode)&&x.g.some(g=>t.g.includes(g)&&COMBO_OK.includes(g)));
    if(pool.length){
      const t2=rnd(pool),p1=t.f(c),p2=t2.f(c);
      return {atc:`${c.cs}, ${p1.a}, ${p2.a}`,rb:`${p1.r}, ${p2.r}, ${c.cs}`,tip:p1.tip+' '+p2.tip,cat:t.cat+' + '+t2.cat,cs:c.cs,cs2:c.cs2,call:false,c};
    }
  }
  const p=t.f(c);
  if(t.k==='p')return {atc:'',rb:p.r,ctx:p.ctx,tip:p.tip,cat:t.cat,cs:c.cs,cs2:c.cs2,call:true,c};
  return {atc:`${c.cs}, ${p.a}`,rb:`${p.r}, ${c.cs}`,tip:p.tip,cat:t.cat,cs:c.cs,cs2:c.cs2,call:false,c};
}

/* Chiffres : messages avec valeurs à retrouver */
function genNumbers(){
  const c=mkctx(rnd(['I','V']));
  const msgs=[
    ()=>({text:`${c.cs}, ${c.A} Approach, descend altitude ${c.alt} feet, QNH ${c.qnh}, squawk ${c.sq}`,items:[['le QNH',String(c.qnh)],['le code transpondeur',c.sq],['l\'altitude en pieds',String(c.alt)]]}),
    ()=>({text:`${c.cs}, turn ${c.lr} heading ${c.hdg}, reduce speed ${c.spd} knots, contact Tower ${c.f1}`,items:[['le cap',c.hdg],['la vitesse en nœuds',String(c.spd)],['la fréquence',c.f1]]}),
    ()=>({text:`${c.cs}, wind ${c.wd} degrees ${c.ws} knots, runway ${c.rwy}, QNH ${c.qnh}`,items:[['la direction du vent',c.wd],['la force du vent en nœuds',String(c.ws)],['le QNH',String(c.qnh)]]}),
    ()=>({text:`${c.cs}, climb flight level ${c.fl}, squawk ${c.sq}, contact ${c.ctl} Control ${c.f1}`,items:[['le niveau de vol',String(c.fl)],['le code transpondeur',c.sq],['la fréquence',c.f1]]}),
    ()=>({text:`${c.cs}, hold at ${c.wp}, expect further clearance at ${c.time}, maintain ${c.alt} feet`,items:[['l\'heure (UTC, 4 chiffres)',c.time],['l\'altitude en pieds',String(c.alt)]]}),
    ()=>({text:`${c.cs}, visibility ${rnd([800,1200,2000,3000,5000,8000])} metres, temperature ${rint(5,34)}, QNH ${c.qnh}`,items:[['le QNH',String(c.qnh)]]}),
    ()=>({text:`${c.cs}, transition level ${c.tl}, QNH ${c.qnh}, taxi runway ${c.rwy}`,items:[['le niveau de transition',String(c.tl)],['le QNH',String(c.qnh)]]})
  ];
  const m=rnd(msgs)();
  const it=rnd(m.items);
  return {text:m.text,label:it[0],val:it[1]};
}
if(typeof module!=='undefined')module.exports={TPL,mkctx,genScenario,genNumbers,APTS};
