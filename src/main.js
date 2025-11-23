// src/main.js
// Entry point - initializes core, registers apps, mounts Shell

import React from 'react';
import ReactDOM from 'react-dom/client';
import { eventBus } from './core/eventBus.js';
import { registry } from './core/registry.js';
import { contextStore } from './core/contextStore.js';
import { orchestrator } from './core/orchestrator.js';
import calendarApp from './apps/calendar/CalendarApp.js';
import Shell from './shell/Shell.jsx';

async function init() {
  console.log('[AwareOS] Initializing...');

  // 1. Initialize context store (local memory)
  await contextStore.init();
  console.log('[AwareOS] ✓ Context store ready');

  // 2. Register apps
  registry.register(calendarApp);
  console.log('[AwareOS] ✓ Apps registered:', registry.getAll().length);

  // 3. Initialize registered apps
  const apps = registry.getAll();
  for (const app of apps) {
    if (app.init) {
      app.init();
    }
  }
  console.log('[AwareOS] ✓ Apps initialized');

  // 4. Initialize orchestrator (optional - requires API key)
  // User can call: orchestrator.init('your-api-key') later
  // For now, orchestrator listens but won't call Claude
  orchestrator.init();
  console.log('[AwareOS] ✓ Orchestrator ready (no API key)');
  console.log('[AwareOS] To enable AI: orchestrator.init("your-claude-api-key")');

  // 5. Mount the Shell UI
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<Shell />);
  console.log('[AwareOS] ✓ Shell mounted');

  // 6. Expose to window for debugging
  window.AwareOS = {
    eventBus,
    registry,
    contextStore,
    orchestrator,
    calendarApp
  };

  console.log('[AwareOS] Ready! 🧠');
  console.log('[AwareOS] Try: AwareOS.calendarApp.dispatch("create_event", { title: "Test", start: new Date().toISOString() })');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
