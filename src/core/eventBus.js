// src/core/eventBus.js
// The nervous system - apps publish events, orchestrator listens

class EventBus {
  constructor() {
    this.listeners = {};
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  // Publish an event
  emit(event, data) {
    console.log(`[EventBus] ${event}`, data);
    
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
    
    // Also emit to wildcard listeners (they hear everything)
    if (this.listeners['*']) {
      this.listeners['*'].forEach(callback => callback(event, data));
    }
  }

  // One-time listener
  once(event, callback) {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
  }
}

// Single global instance
export const eventBus = new EventBus();
