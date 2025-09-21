// Service Worker for Analog Society - Offline Inventory Management
const CACHE_NAME = 'analog-society-v1';
const urlsToCache = [
    '/',
    '/styles/main.css',
    '/scripts/main.js',
    '/images/portalto80s.jpeg',
    '/images/salvagenes.jpeg'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response because it's a stream
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // If both cache and network fail, show offline page
                    if (event.request.destination === 'document') {
                        return caches.match('/offline.html');
                    }
                });
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'inventory-sync') {
        event.waitUntil(syncInventory());
    }
});

// Sync inventory when back online
async function syncInventory() {
    try {
        const offlineActions = await getOfflineActions();
        
        for (const action of offlineActions) {
            try {
                await performOfflineAction(action);
                await removeOfflineAction(action.id);
            } catch (error) {
                console.error('Failed to sync action:', action, error);
            }
        }
    } catch (error) {
        console.error('Inventory sync failed:', error);
    }
}

// Get offline actions from IndexedDB
async function getOfflineActions() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AnalogSocietyDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['offlineActions'], 'readonly');
            const store = transaction.objectStore('offlineActions');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
    });
}

// Perform offline action when back online
async function performOfflineAction(action) {
    const response = await fetch(action.url, {
        method: action.method,
        headers: action.headers,
        body: action.body
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
}

// Remove completed offline action
async function removeOfflineAction(actionId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AnalogSocietyDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['offlineActions'], 'readwrite');
            const store = transaction.objectStore('offlineActions');
            const deleteRequest = store.delete(actionId);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}
