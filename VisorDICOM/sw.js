// Guarda la aplicación en la tablet para que funcione sin internet.
const CACHE='VisorDICOM-v'+'202611110304';
const ARCHIVOS=['./VisorDICOM.html','./manifest.json','./icono192.png','./icono512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARCHIVOS))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
// primero internet (para recibir actualizaciones); sin internet, la copia guardada
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET') return;
  e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(CACHE).then(x=>x.put(e.request,c)); return r; }).catch(()=>caches.match(e.request,{ignoreSearch:true}))); });
