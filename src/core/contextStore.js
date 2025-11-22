// src/core/contextStore.js
// Local memory - patterns, preferences, profile
// All stored in IndexedDB, never leaves the device

class ContextStore {
  constructor() {
    this.dbName = 'AwareOS';
    this.db = null;
    this.cache = {
      profile: {},
      patterns: [],
      preferences: {},
      log: []
    };
  }

  // Initialize the database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[ContextStore] Database initialized');
        this.loadAll().then(resolve);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // User profile (explicit, user-controlled)
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'key' });
        }
        
        // Learned patterns (observed behavior)
        if (!db.objectStoreNames.contains('patterns')) {
          db.createObjectStore('patterns', { keyPath: 'id', autoIncrement: true });
        }
        
        // Preferences (feedback-derived)
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
        
        // Orchestrator action log (audit trail)
        if (!db.objectStoreNames.contains('log')) {
          const logStore = db.createObjectStore('log', { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  // Load all data into cache
  async loadAll() {
    this.cache.profile = await this.getAllFromStore('profile');
    this.cache.patterns = await this.getAllFromStore('patterns');
    this.cache.preferences = await this.getAllFromStore('preferences');
    console.log('[ContextStore] Loaded context from disk');
  }

  // Generic get all from a store
  getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic put to a store
  putToStore(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Generic delete from a store
  deleteFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // === PROFILE ===
  
  setProfile(key, value) {
    const entry = { key, value, updatedAt: new Date().toISOString() };
    this.cache.profile[key] = entry;
    return this.putToStore('profile', entry);
  }

  getProfile(key) {
    return this.cache.profile[key]?.value;
  }

  getAllProfile() {
    return this.cache.profile;
  }

  deleteProfile(key) {
    delete this.cache.profile[key];
    return this.deleteFromStore('profile', key);
  }

  // === PATTERNS ===
  
  addPattern(pattern) {
    const entry = {
      ...pattern,
      createdAt: new Date().toISOString(),
      confidence: pattern.confidence || 0.5
    };
    this.cache.patterns.push(entry);
    return this.putToStore('patterns', entry);
  }

  getPatterns() {
    return this.cache.patterns;
  }

  // === PREFERENCES ===
  
  setPreference(key, value) {
    const entry = { key, value, updatedAt: new Date().toISOString() };
    this.cache.preferences[key] = entry;
    return this.putToStore('preferences', entry);
  }

  getPreference(key) {
    return this.cache.preferences[key]?.value;
  }

  // === LOG ===
  
  async logAction(entry) {
    const logEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      rating: null,
      feedback: null
    };
    
    await this.putToStore('log', logEntry);
    return logEntry;
  }

  async getLog(limit = 50) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('log', 'readonly');
      const store = transaction.objectStore('log');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); // newest first
      
      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async rateAction(logId, rating, feedback = null) {
    const log = await this.getLog(100);
    const entry = log.find(l => l.id === logId);
    
    if (entry) {
      entry.rating = rating;
      entry.feedback = feedback;
      await this.putToStore('log', entry);
    }
  }

  // === FULL CONTEXT (for orchestrator) ===
  
  getFullContext() {
    return {
      profile: this.cache.profile,
      patterns: this.cache.patterns,
      preferences: this.cache.preferences
    };
  }

  // === EXPORT/IMPORT (user data ownership) ===
  
  exportAll() {
    return JSON.stringify({
      profile: this.cache.profile,
      patterns: this.cache.patterns,
      preferences: this.cache.preferences,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  async clearAll() {
    const stores = ['profile', 'patterns', 'preferences', 'log'];
    for (const store of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    this.cache = { profile: {}, patterns: [], preferences: {}, log: [] };
    console.log('[ContextStore] All data cleared');
  }
}

// Single global instance
export const contextStore = new ContextStore();
