const CACHE_NAME = 'sds-finder-cache-v1';
const APP_SHELL_URLS = [
    '/index.html',
    '/styles/site.css',
    '/scripts/app.js',
    '/assets/logo.svg',
    '/manifest.webmanifest'
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(APP_SHELL_URLS);
            })
    );
});

// Fetch event: serve from cache first, with network fallback.
// Excludes specific files from caching.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Always fetch the data file from the network to ensure it's fresh
    if (url.pathname === '/data/sds.csv') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Do not cache PDF files
    if (url.pathname.endsWith('.pdf')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For app shell and other requests, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response; // Serve from cache
                }
                return fetch(event.request); // Fetch from network
            })
    );
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
