/* ================= ESTADO ================= */
function fresh(){return{name:"",created:false,money:80,mc:30,
 look:{skin:0,hair:0,hstyle:"corto",shirt:"s1",pants:"p1",hat:"none",acc:"none",face:"none",neck:"none"},
 owned:{s1:1,s2:1,s3:1,p1:1,p2:1,f1:1,none:1},vehicle:null,riding:false,perm:{},turboUntil:0,furn:{},
 daily:{last:"",streak:0},used:{},pin:"",gen:[],stats:{jobs:0,coins:0,fires:0,earned:0,thieves:0,mysteries:0,catwalks:0,monsters:0,survived:0,obby:0,fish:0,harvest:0},quality:"normal",started:Date.now(),
 role:null,
 pets:[],petActive:null,petSlots:12,petUid:1,
 plots:[],crops:{},fishBag:{},fishBook:{},rod:"basica",rods:{basica:1},seeds:{},
 obby:{best:0,daily:""},
 surv:{shield:0,wins:0},
 adv:{lvl:1,xp:0,sword:"madera",swords:{madera:1},potions:2,chests:{}},
 park:{rides:{},bank:0,last:Date.now(),boostUntil:0,manager:false},
 fashion:{wins:0,last:""},
 house:{big:false},
 offersDay:"",offersBought:{},starter:false
};}
let S=fresh();
function deepMerge(base,d){for(const k in d){if(d[k]&&typeof d[k]==="object"&&!Array.isArray(d[k])&&base[k]&&typeof base[k]==="object"&&!Array.isArray(base[k]))deepMerge(base[k],d[k]);else base[k]=d[k];}return base;}
function load(){try{const r=localStorage.getItem(SAVE);if(r){const d=JSON.parse(r);S=deepMerge(fresh(),d);
 if(d.pet&&!d.pets){S.pets.push({uid:S.petUid++,type:d.pet,lvl:1,xp:0,food:80,joy:80,t:Date.now(),name:""});S.petActive=S.pets[0].uid;}
 delete S.pet;}}catch(e){console.error(e);}}
function save(){try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){}}
function fmt(n){n=Math.floor(n);if(n<10000)return n.toLocaleString("es");const u=["K","M","B","T"];let i=-1;let v=n;while(v>=1000&&i<3){v/=1000;i++;}return (v<10?v.toFixed(2):v<100?v.toFixed(1):Math.floor(v))+" "+u[i];}
const turboOn=()=>S.turboUntil>Date.now();
function roleMult(job){if(!job||!S.role)return 1;const r=ROLES.find(x=>x.id===S.role);return r&&r.jobs.includes(job)?1.5:1;}
function petBonus(){return typeof activePetBonus==="function"?activePetBonus():0;}
function payMult(job){return (S.perm.x2?2:1)*(S.perm.vip?1.5:1)*(turboOn()?3:1)*(1+0.03*Object.keys(S.furn).length+petBonus())*roleMult(job);}
function earn(base,job){const v=Math.round(base*payMult(job));S.money+=v;S.stats.earned+=v;hud();return v;}
function priceHTML(it){return it.cur==="mc"?'<span class="coin sm"></span> '+fmt(it.p):"$ "+fmt(it.p);}
function canPay(it){return it.cur==="mc"?S.mc>=it.p:S.money>=it.p;}
function pay(it){if(!canPay(it)){if(it.cur==="mc"){toast("Le faltan MediCoins");openShop("paquetes");}else toast("Le falta dinero. ¡Trabaje en la ciudad!");return false;}
 if(it.cur==="mc")S.mc-=it.p;else S.money-=it.p;hud();save();return true;}
function giveMC(n,why){S.mc+=n;hud();if(why)toast("🪙 +"+n+" MediCoins · "+why);}
function todayStr(){const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
function yStr(){const d=new Date(Date.now()-864e5);return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();}
function rnd(a,b){return a+Math.random()*(b-a);}
function pick(a){return a[Math.floor(Math.random()*a.length)];}
function weighted(list){let t=0;list.forEach(x=>t+=x.w);let r=Math.random()*t;for(const x of list){r-=x.w;if(r<=0)return x;}return list[list.length-1];}
