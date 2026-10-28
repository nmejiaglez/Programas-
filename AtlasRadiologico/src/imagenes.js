/* ---------- Imágenes: Wikimedia Commons (licencias libres) ---------- */
const cache={};
async function commons(q,offset=0){
 const k=q+'|'+offset;if(cache[k])return cache[k];
 const u='https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=30&gsroffset='+offset+
  '&gsrsearch='+encodeURIComponent(q+' filetype:bitmap')+'&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1600';
 const r=await fetch(u);const j=await r.json();
 const pages=Object.values(j.query?.pages||{}).sort((a,b)=>a.index-b.index);
 const out=pages.filter(p=>p.imageinfo&&/jpeg|png|gif|webp/.test(p.imageinfo[0].mime)).map(p=>{const ii=p.imageinfo[0],m=ii.extmetadata||{};
  return{t:p.title.replace(/^File:/,'').replace(/\.[a-z]+$/i,'').replace(/_/g,' '),src:ii.thumburl||ii.url,th:(ii.thumburl||ii.url).replace(/\/\d+px-/,'/400px-'),page:ii.descriptionurl,
   desc:strip(m.ImageDescription?.value).slice(0,400),aut:strip(m.Artist?.value).slice(0,120),lic:m.LicenseShortName?.value||''};});
 return cache[k]={items:out,next:j.continue?.gsroffset};
}
const LAB=/label|annotat|anatomy|diagram|arrow/i;

/* ---------- Mi atlas (imágenes propias / guardadas) ---------- */
let db;
function idb(){return new Promise((ok,ko)=>{if(db)return ok(db);const r=indexedDB.open('atlas-rad',1);r.onupgradeneeded=()=>r.result.createObjectStore('img',{keyPath:'id'});r.onsuccess=()=>ok(db=r.result);r.onerror=()=>ko(r.error);});}
async function dbAll(){const d=await idb();return new Promise(ok=>{const r=d.transaction('img').objectStore('img').getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>ok([]);});}
async function dbPut(o){const d=await idb();return new Promise(ok=>{const t=d.transaction('img','readwrite');t.objectStore('img').put(o);t.oncomplete=ok;});}
async function dbDel(id){const d=await idb();return new Promise(ok=>{const t=d.transaction('img','readwrite');t.objectStore('img').delete(id);t.oncomplete=ok;});}

