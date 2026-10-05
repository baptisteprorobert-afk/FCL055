/* data-courses.js : 14 phases de vol -> catégories de vocabulaire + groupes de clairances */
const PHASES=[
 {id:'prevol',n:'Prévol',en:'Pre-flight',cats:['prevol','avion'],groups:['delivery'],desc:"Inspection de l'avion, documents, avitaillement, puis demande de clairance. Ici, le vocabulaire des parties de l'avion et des vérifications compte autant que la radio."},
 {id:'startup',n:'Mise en route',en:'Start-up',cats:['cockpit','moteur'],groups:['startup'],desc:"Démarrage des moteurs, repoussage et premiers contacts avec Delivery et Ground. Apprenez les commandes du poste et les phrases de mise en route."},
 {id:'taxi',n:'Roulage',en:'Taxi',cats:['aeroport','radio'],groups:['taxi'],desc:"Déplacement au sol : voies de circulation, points d'arrêt, traversées de piste. Les « hold short » se relisent toujours."},
 {id:'takeoff',n:'Décollage',en:'Take-off',cats:['commandes','actions'],groups:['takeoff'],desc:"Alignement, autorisation de décollage et départ. Retenez la différence entre « line up and wait » et « cleared for take-off »."},
 {id:'climb',n:'Montée',en:'Climb',cats:['commandes','nav'],groups:['climb'],desc:"Montée initiale, contact avec Departure, caps, directs et niveaux. Le QNH accompagne les altitudes, pas les niveaux de vol."},
 {id:'cruise',n:'Croisière',en:'Cruise',cats:['nav','meteo'],groups:['cruise'],desc:"Navigation en route, changements de fréquence, déviations météo et demandes de niveau."},
 {id:'descent',n:'Descente',en:'Descent',cats:['actions','nav'],groups:['descent'],desc:"Mise en descente, niveau de transition, arrivée, premier contact avec Approach."},
 {id:'approach',n:'Approche',en:'Approach',cats:['circuit','radio'],groups:['approach'],desc:"Vecteurs radar, interception de l'ILS, attente, approche interrompue."},
 {id:'landing',n:'Atterrissage',en:'Landing',cats:['circuit','aeroport'],groups:['landing'],desc:"Autorisation d'atterrir, remise de gaz et dégagement de piste. Ne confondez pas « cleared to land » et « cleared touch-and-go »."},
 {id:'pattern',n:'Circuit (pattern)',en:'Traffic pattern',cats:['circuit'],groups:['pattern'],modes:['V'],desc:"Circuit d'aérodrome et procédures VFR : entrée de zone, transit, VFR spécial, comptes rendus de position."},
 {id:'emergency',n:'Urgences',en:'Emergencies',cats:['urgence','radio'],groups:['emergency'],desc:"Messages Mayday et Pan-Pan, code 7700, personnes à bord et autonomie. Gardez l'ordre : station, indicatif, nature, intention, position."},
 {id:'weather',n:'Météo',en:'Weather',cats:['meteo'],groups:['weather'],desc:"Comprendre et annoncer la météo : vent, visibilité, nuages, orages, givrage, cisaillement."},
 {id:'failure',n:'Pannes',en:'Failures',cats:['urgence','cockpit'],groups:['failure'],desc:"Pannes de transpondeur, d'instruments, électriques ou de train. Annoncez la panne, puis votre intention."},
 {id:'engine',n:'Moteur',en:'Engine',cats:['moteur','urgence'],groups:['engine'],desc:"Problèmes moteur : pression d'huile, régime irrégulier, incendie, givrage carburateur."}
];
if(typeof module!=='undefined')module.exports={PHASES};
