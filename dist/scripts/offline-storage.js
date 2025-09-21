// Offline Storage Manager for Analog Society
class OfflineStorage {
    constructor() {
        this.dbName = 'AnalogSocietyDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('inventory')) {
                    const inventoryStore = db.createObjectStore('inventory', { keyPath: '_id' });
                    inventoryStore.createIndex('userId', 'userId', { unique: false });
                    inventoryStore.createIndex('category', 'category', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('offlineActions')) {
                    const actionsStore = db.createObjectStore('offlineActions', { keyPath: 'id', autoIncrement: true });
                    actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('userData')) {
                    db.createObjectStore('userData', { keyPath: 'key' });
                }
            };
        });
    }

    // Save inventory item locally
    async saveInventoryItem(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['inventory'], 'readwrite');
            const store = transaction.objectStore('inventory');
            const request = store.put(item);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all inventory items for a user
    async getInventoryItems(userId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['inventory'], 'readonly');
            const store = transaction.objectStore('inventory');
            const index = store.index('userId');
            const request = index.getAll(userId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete inventory item
    async deleteInventoryItem(itemId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['inventory'], 'readwrite');
            const store = transaction.objectStore('inventory');
            const request = store.delete(itemId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Save offline action for later sync
    async saveOfflineAction(action) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['offlineActions'], 'readwrite');
            const store = transaction.objectStore('offlineActions');
            const offlineAction = {
                ...action,
                timestamp: new Date().toISOString()
            };
            const request = store.add(offlineAction);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Save user data locally
    async saveUserData(key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['userData'], 'readwrite');
            const store = transaction.objectStore('userData');
            const request = store.put({ key, data });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get user data
    async getUserData(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['userData'], 'readonly');
            const store = transaction.objectStore('userData');
            const request = store.get(key);
            
            request.onsuccess = () => {
                resolve(request.result ? request.result.data : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Export all local data
    async exportLocalData() {
        const inventory = await this.getInventoryItems();
        const userData = await this.getUserData('profile');
        
        return {
            inventory,
            userData,
            exportDate: new Date().toISOString(),
            version: this.version
        };
    }

    // Clear all local data
    async clearLocalData() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['inventory', 'offlineActions', 'userData'], 'readwrite');
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            
            transaction.objectStore('inventory').clear();
            transaction.objectStore('offlineActions').clear();
            transaction.objectStore('userData').clear();
        });
    }
}

// Network status manager
class NetworkManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.handleOffline();
        });
    }

    handleOnline() {
        console.log('Back online - syncing data');
        this.syncOfflineData();
    }

    handleOffline() {
        console.log('Gone offline - enabling offline mode');
        this.showOfflineIndicator();
    }

    async syncOfflineData() {
        try {
            // Trigger background sync
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('inventory-sync');
            }
        } catch (error) {
            console.error('Failed to register sync:', error);
        }
    }

    showOfflineIndicator() {
        // Create or show offline indicator
        let indicator = document.getElementById('offline-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: var(--warning);
                    color: var(--text-primary);
                    padding: 0.5rem;
                    text-align: center;
                    font-weight: 600;
                    z-index: 1000;
                    box-shadow: var(--shadow-medium);
                ">
                    📡 You're offline - changes will sync when connection is restored
                </div>
            `;
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block';
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
}

// Offline form handler
class OfflineFormHandler {
    constructor(storage) {
        this.storage = storage;
        this.networkManager = new NetworkManager();
    }

    async handleFormSubmission(formData, url, method = 'POST') {
        if (this.networkManager.isOnline) {
            try {
                const response = await fetch(url, {
                    method: method,
                    body: formData
                });
                
                if (response.ok) {
                    return await response.json();
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('Network request failed:', error);
                // Fall back to offline storage
                return await this.saveOfflineAction(formData, url, method);
            }
        } else {
            // Save for later sync
            return await this.saveOfflineAction(formData, url, method);
        }
    }

    async saveOfflineAction(formData, url, method) {
        const action = {
            url: url,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Object.fromEntries(formData))
        };

        await this.storage.saveOfflineAction(action);
        
        // Show offline confirmation
        this.showOfflineConfirmation();
        
        return {
            success: true,
            offline: true,
            message: 'Changes saved locally - will sync when online'
        };
    }

    showOfflineConfirmation() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                background: var(--success);
                color: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: var(--shadow-medium);
                z-index: 1000;
                max-width: 300px;
            ">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">📱 Saved Offline</div>
                <div style="font-size: 0.9rem;">Your changes will sync when you're back online</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize offline capabilities
let offlineStorage, offlineFormHandler;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize offline storage
        offlineStorage = new OfflineStorage();
        offlineFormHandler = new OfflineFormHandler(offlineStorage);
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            await navigator.serviceWorker.register('/scripts/service-worker.js');
            console.log('Service Worker registered');
        }
        
        // Load offline data if online
        if (navigator.onLine) {
            await syncOfflineInventory();
        }
        
    } catch (error) {
        console.error('Failed to initialize offline capabilities:', error);
    }
});

// Sync offline inventory with server
async function syncOfflineInventory() {
    try {
        const offlineItems = await offlineStorage.getInventoryItems();
        const userId = getCurrentUserId();
        
        if (offlineItems.length > 0 && userId) {
            // Here you would sync with server
            console.log('Syncing offline inventory:', offlineItems.length, 'items');
        }
    } catch (error) {
        console.error('Failed to sync offline inventory:', error);
    }
}

// Get current user ID from session
function getCurrentUserId() {
    // This would be populated from the server session
    const userElement = document.querySelector('[data-user-id]');
    return userElement ? userElement.dataset.userId : null;
}

// Export for use in other scripts
window.OfflineStorage = OfflineStorage;
window.NetworkManager = NetworkManager;
window.OfflineFormHandler = OfflineFormHandler;
