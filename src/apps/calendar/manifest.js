// src/apps/calendar/manifest.js
// Calendar's self-description - what it is and what it can do

export const calendarManifest = {
  name: 'calendar',
  domain: 'time-based commitments and availability',
  
  capabilities: [
    'read_events',
    'check_availability', 
    'find_free_time',
    'detect_conflicts',
    'identify_patterns'
  ],
  
  actions: [
    'create_event',
    'update_event',
    'delete_event',
    'get_events',
    'check_conflicts'
  ],
  
  events: [
    'event_created',
    'event_updated',
    'event_deleted',
    'event_moved',
    'conflict_detected',
    'upcoming_soon'
  ]
};
