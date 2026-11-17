// Service worker de Choferes: permite abrir la app sin señal.
// Los datos (Firestore) se guardan aparte en el caché propio de Firebase.
var CACHE = 'choferes-v2';
var SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  // Código de Firebase (gstatic): primero caché
  if(url.hostname==='www.gstatic.com'){
    e.respondWith(caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){ var cp=res.clone(); caches.open(CACHE).then(function(c){ c.put(req,cp); }); return res; });
    }));
    return;
  }
  // Archivos de la app: primero red (así ves los cambios apenas subís un archivo nuevo), si no hay señal, caché
  if(url.origin===location.origin){
    e.respondWith(fetch(req).then(function(res){ var cp=res.clone(); caches.open(CACHE).then(function(c){ c.put(req,cp); }); return res; })
      .catch(function(){ return caches.match(req).then(function(hit){ return hit || caches.match('index.html'); }); }));
  }
  // Todo lo demás (API de Firestore/Auth) va directo a la red
});
