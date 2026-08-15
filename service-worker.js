// Service Worker de Tempo-Concetto
// Habilita instalación (Add to Home Screen) y funcionamiento offline básico.

const CACHE_NAME = "tempo-concetto-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

// Instalación: precachear los archivos base de la app
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación: limpiar cachés antiguas si cambia la versión
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Estrategia: cache-first para los assets locales, con fallback a red
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Solo interceptamos peticiones al mismo origen (nuestros propios archivos)
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Guardamos una copia en caché para futuras visitas offline
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Si no hay red ni caché, al menos devolvemos el index como fallback
          return caches.match("./index.html");
        });
    })
  );
});
