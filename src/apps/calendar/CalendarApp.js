// src/apps/calendar/CalendarApp.js
// Main calendar app - ties manifest, state, and actions together

import { calendarManifest } from './manifest.js';
import { calendarState } from './state.js';
import { calendarActions } from './actions.js';
import { eventBus } from '../../core/eventBus.js';

class CalendarApp {
  constructor() {
    this.manifest = calendarManifest;
    this.checkUpcomingInterval = null;
  }

  // Initialize the app
  init() {
    console.log('[Calendar] Initializing...');
    
    // Start checking for upcoming events
    this.startUpcomingChecker();
    
    console.log('[Calendar] Ready');
  }

  // Get current state snapshot (for orchestrator)
  getState() {
    return calendarState.getSnapshot();
  }

  // Dispatch an action
  dispatch(action, params) {
    if (!calendarActions[action]) {
      throw new Error(`Unknown action: ${action}`);
    }
    
    return calendarActions[action](params);
  }

  // Subscribe to calendar events
  subscribe(callback) {
    const events = [
      'calendar_event_created',
      'calendar_event_updated',
      'calendar_event_deleted',
      'calendar_event_moved',
      'calendar_conflict_detected',
      'calendar_upcoming_soon'
    ];
    
    const unsubscribers = events.map(event => 
      eventBus.on(event, (data) => callback(event, data))
    );
    
    // Return function to unsubscribe from all
    return () => unsubscribers.forEach(unsub => unsub());
  }

  // Check for upcoming events (runs every minute)
  startUpcomingChecker() {
    // Check immediately
    this.checkUpcoming();
    
    // Then check every minute
    this.checkUpcomingInterval = setInterval(() => {
      this.checkUpcoming();
    }, 60 * 1000);
  }

  checkUpcoming() {
    const now = new Date();
    const in15min = new Date(now.getTime() + 15 * 60 * 1000);
    
    const upcoming = calendarState.getInRange(now, in15min);
    
    for (const event of upcoming) {
      // Only notify if we haven't already
      if (!event._notifiedUpcoming) {
        eventBus.emit('calendar_upcoming_soon', {
          event,
          minutesUntil: Math.round((new Date(event.start) - now) / (1000 * 60)),
          source: 'calendar'
        });
        
        // Mark as notified (in memory only)
        event._notifiedUpcoming = true;
      }
    }
  }

  // Cleanup
  destroy() {
    if (this.checkUpcomingInterval) {
      clearInterval(this.checkUpcomingInterval);
    }
  }
}

// Export singleton instance
export const calendarApp = new CalendarApp();

// Also export the full app object for registry
export default {
  manifest: calendarManifest,
  getState: () => calendarApp.getState(),
  dispatch: (action, params) => calendarApp.dispatch(action, params),
  subscribe: (callback) => calendarApp.subscribe(callback),
  init: () => calendarApp.init()
};
