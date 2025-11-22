// src/apps/calendar/actions.js
// Calendar action handlers

import { calendarState } from './state.js';
import { eventBus } from '../../core/eventBus.js';

export const calendarActions = {
  
  // Create a new event
  create_event(params) {
    const { title, start, end, location, description, attendees } = params;
    
    if (!title || !start) {
      throw new Error('Event requires at least title and start time');
    }
    
    // Default end time to 1 hour after start if not provided
    const eventEnd = end || new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();
    
    // Check for conflicts
    const conflicts = calendarState.checkConflicts(start, eventEnd);
    
    const newEvent = calendarState.add({
      title,
      start,
      end: eventEnd,
      location,
      description,
      attendees: attendees || []
    });
    
    // Emit event
    eventBus.emit('calendar_event_created', {
      event: newEvent,
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts,
      source: 'calendar'
    });
    
    // If conflicts detected, emit that too
    if (conflicts.length > 0) {
      eventBus.emit('calendar_conflict_detected', {
        newEvent,
        conflictsWith: conflicts,
        source: 'calendar'
      });
    }
    
    return newEvent;
  },
  
  // Update an existing event
  update_event(params) {
    const { id, ...updates } = params;
    
    if (!id) {
      throw new Error('Event ID required for update');
    }
    
    const { oldEvent, newEvent } = calendarState.update(id, updates);
    
    // Check if time changed (was it moved?)
    const timeMoved = oldEvent.start !== newEvent.start || oldEvent.end !== newEvent.end;
    
    eventBus.emit('calendar_event_updated', {
      oldEvent,
      newEvent,
      timeMoved,
      source: 'calendar'
    });
    
    if (timeMoved) {
      eventBus.emit('calendar_event_moved', {
        event: newEvent,
        previousStart: oldEvent.start,
        previousEnd: oldEvent.end,
        source: 'calendar'
      });
    }
    
    return newEvent;
  },
  
  // Delete an event
  delete_event(params) {
    const { id } = params;
    
    if (!id) {
      throw new Error('Event ID required for deletion');
    }
    
    const deleted = calendarState.delete(id);
    
    eventBus.emit('calendar_event_deleted', {
      event: deleted,
      source: 'calendar'
    });
    
    return deleted;
  },
  
  // Get events (with optional filters)
  get_events(params = {}) {
    const { date, startDate, endDate, upcoming } = params;
    
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      return calendarState.getInRange(dayStart, dayEnd);
    }
    
    if (startDate && endDate) {
      return calendarState.getInRange(startDate, endDate);
    }
    
    if (upcoming) {
      return calendarState.getUpcoming(upcoming);
    }
    
    return calendarState.getToday();
  },
  
  // Check for conflicts
  check_conflicts(params) {
    const { start, end, excludeId } = params;
    
    if (!start || !end) {
      throw new Error('Start and end time required');
    }
    
    return calendarState.checkConflicts(start, end, excludeId);
  },
  
  // Find free time
  find_free_time(params) {
    const { date, minDuration } = params;
    return calendarState.findFreeTime(date || new Date(), minDuration);
  }
};
