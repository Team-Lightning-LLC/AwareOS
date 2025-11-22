// src/core/registry.js
// App registration - apps tell the system what they can do

class Registry {
  constructor() {
    this.apps = new Map();
  }

  // Register an app with its manifest
  register(app) {
    if (!app.manifest || !app.manifest.name) {
      throw new Error('App must have a manifest with a name');
    }

    const name = app.manifest.name;
    
    console.log(`[Registry] Registering app: ${name}`);
    console.log(`[Registry] Capabilities:`, app.manifest.capabilities);
    console.log(`[Registry] Actions:`, app.manifest.actions);
    
    this.apps.set(name, app);
  }

  // Get a specific app
  get(name) {
    return this.apps.get(name);
  }

  // Get all registered apps
  getAll() {
    return Array.from(this.apps.values());
  }

  // Get all app manifests (for orchestrator to know what's possible)
  getAllManifests() {
    return this.getAll().map(app => app.manifest);
  }

  // Find apps that have a specific capability
  findByCapability(capability) {
    return this.getAll().filter(app => 
      app.manifest.capabilities?.includes(capability)
    );
  }

  // Find apps that can perform a specific action
  findByAction(action) {
    return this.getAll().filter(app => 
      app.manifest.actions?.includes(action)
    );
  }

  // Get current state from all apps
  getAllState() {
    const state = {};
    
    for (const [name, app] of this.apps) {
      if (typeof app.getState === 'function') {
        state[name] = app.getState();
      }
    }
    
    return state;
  }

  // Dispatch an action to a specific app
  dispatch(appName, action, params) {
    const app = this.apps.get(appName);
    
    if (!app) {
      throw new Error(`App not found: ${appName}`);
    }
    
    if (typeof app.dispatch !== 'function') {
      throw new Error(`App ${appName} doesn't support actions`);
    }
    
    console.log(`[Registry] Dispatching to ${appName}:`, action, params);
    return app.dispatch(action, params);
  }
}

// Single global instance
export const registry = new Registry();
