// src/main.js
// AwareOS - Main entry point

import { eventBus } from './core/eventBus.js';
import { registry } from './core/registry.js';
import { contextStore } from './core/contextStore.js';
import { orchestrator } from './core/orchestrator.js';

// Apps
import calendarApp from './apps/calendar/CalendarApp.js';

class AwareOS {
  constructor() {
    this.isInitialized = false;
  }

  async init(config = {}) {
    console.log('[AwareOS] Starting up...');

    // Initialize context store (local memory)
    await contextStore.init();
    this.updateStatus('contextStatus', 'contextLabel', true, 'Active');
    console.log('[AwareOS] Context store ready');

    // Register apps
    registry.register(calendarApp);
    this.updateStatus('registryStatus', 'registryLabel', true, 'Active');
    console.log('[AwareOS] Apps registered');

    // Initialize apps
    calendarApp.init();
    this.updateStatus('calendarStatus', 'calendarLabel', true, 'Registered');
    console.log('[AwareOS] Apps initialized');

    // Initialize orchestrator (pass API key if provided)
    await orchestrator.init(config.apiKey || null);
    const hasApiKey = !!config.apiKey;
    this.updateStatus('orchestratorStatus', 'orchestratorLabel', hasApiKey, hasApiKey ? 'Active' : 'Active (no API key)');
    console.log('[AwareOS] Orchestrator ready');

    // Event bus is always ready
    this.updateStatus('eventBusStatus', 'eventBusLabel', true, 'Active');

    // Setup live event log
    this.setupEventLog();

    // Listen for orchestrator suggestions
    eventBus.on('orchestrator_suggestion', (data) => {
      console.log('[AwareOS] Suggestion:', data.message);
      console.log('[AwareOS] Actions:', data.actions);
    });

    this.isInitialized = true;
    console.log('[AwareOS] System ready!');
    console.log('');
    console.log('Try these in the console:');
    console.log('  AwareOS.calendar.dispatch("create_event", { title: "Test Meeting", start: "2025-11-22T14:00:00" })');
    console.log('  AwareOS.calendar.getState()');
    console.log('  AwareOS.registry.getAllManifests()');

    return this;
  }

  // Update status panel in UI
  updateStatus(dotId, labelId, active, text) {
    const dot = document.getElementById(dotId);
    const label = document.getElementById(labelId);
    
    if (dot) {
      dot.classList.toggle('inactive', !active);
    }
    if (label) {
      label.textContent = text;
    }
  }

  // Setup live event log in UI
  setupEventLog() {
    const container = document.getElementById('eventLogContainer');
    if (!container) return;

    // Clear waiting message
    container.innerHTML = '';

    // Listen to all events
    eventBus.on('*', (event, data) => {
      const item = document.createElement('div');
      item.className = 'event-item';
      
      const time = new Date().toLocaleTimeString();
      item.innerHTML = `
        <span class="event-time">${time}</span>
        <span class="event-name">${event}</span>
      `;
      
      // Add to top
      container.insertBefore(item, container.firstChild);
      
      // Keep only last 20 events
      while (container.children.length > 20) {
        container.removeChild(container.lastChild);
      }
    });
  }

  // Expose pieces for console testing
  get calendar() {
    return calendarApp;
  }

  get registry() {
    return registry;
  }

  get eventBus() {
    return eventBus;
  }

  get context() {
    return contextStore;
  }

  get orchestrator() {
    return orchestrator;
  }
}

// Create and expose global instance
const awareOS = new AwareOS();
window.AwareOS = awareOS;

// Auto-initialize
awareOS.init().catch(console.error);

export default awareOS;
