// src/apps/calendar/state.js
// Calendar state management

class CalendarState {
  constructor() {
    this.events = [];
    this.loadFromStorage();
  }

  // Load events from localStorage
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('awareos_calendar_events');
      if (saved) {
        this.events = JSON.parse(saved);
        console.log(`[Calendar] Loaded ${this.events.length} events`);
      }
    } catch (error) {
      console.error('[Calendar] Failed to load events:', error);
      this.events = [];
    }
  }

  // Save events to localStorage
  saveToStorage() {
    try {
      localStorage.setItem('awareos_calendar_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('[Calendar] Failed to save events:', error);
    }
  }

  // Get all events
  getAll() {
    return [...this.events];
  }

  // Get events for a specific date range
  getInRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return this.events.filter(event => {
      const eventTime = new Date(event.start).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  // Get today's events
  getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.getInRange(today, tomorrow);
  }

  // Get upcoming events (next N days)
  getUpcoming(days = 7) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    
    return this.getInRange(now, future);
  }

  // Get a single event by ID
  getById(id) {
    return this.events.find(e => e.id === id);
  }

  // Add an event
  add(event) {
    const newEvent = {
      id: Date.now().toString(),
      ...event,
      createdAt: new Date().toISOString(),
      status: event.status || 'confirmed'
    };
    
    this.events.push(newEvent);
    this.saveToStorage();
    
    return newEvent;
  }

  // Update an event
  update(id, updates) {
    const index = this.events.findIndex(e => e.id === id);
    
    if (index === -1) {
      throw new Error(`Event not found: ${id}`);
    }
    
    const oldEvent = { ...this.events[index] };
    
    this.events[index] = {
      ...this.events[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveToStorage();
    
    return { oldEvent, newEvent: this.events[index] };
  }

  // Delete an event
  delete(id) {
    const index = this.events.findIndex(e => e.id === id);
    
    if (index === -1) {
      throw new Error(`Event not found: ${id}`);
    }
    
    const deleted = this.events.splice(index, 1)[0];
    this.saveToStorage();
    
    return deleted;
  }

  // Check for conflicts with a proposed time
  checkConflicts(start, end, excludeId = null) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    
    return this.events.filter(event => {
      if (excludeId && event.id === excludeId) return false;
      
      const eventStart = new Date(event.start).getTime();
      const eventEnd = new Date(event.end).getTime();
      
      // Check for overlap
      return startTime < eventEnd && endTime > eventStart;
    });
  }

  // Find free time slots on a given day
  findFreeTime(date, minDuration = 30) {
    const dayStart = new Date(date);
    dayStart.setHours(9, 0, 0, 0); // Assume 9am start
    
    const dayEnd = new Date(date);
    dayEnd.setHours(18, 0, 0, 0); // Assume 6pm end
    
    const dayEvents = this.getInRange(dayStart, dayEnd)
      .sort((a, b) => new Date(a.start) - new Date(b.start));
    
    const freeSlots = [];
    let currentTime = dayStart.getTime();
    
    for (const event of dayEvents) {
      const eventStart = new Date(event.start).getTime();
      
      if (eventStart > currentTime) {
        const duration = (eventStart - currentTime) / (1000 * 60); // minutes
        if (duration >= minDuration) {
          freeSlots.push({
            start: new Date(currentTime).toISOString(),
            end: new Date(eventStart).toISOString(),
            duration: duration
          });
        }
      }
      
      currentTime = Math.max(currentTime, new Date(event.end).getTime());
    }
    
    // Check for free time after last event
    if (currentTime < dayEnd.getTime()) {
      const duration = (dayEnd.getTime() - currentTime) / (1000 * 60);
      if (duration >= minDuration) {
        freeSlots.push({
          start: new Date(currentTime).toISOString(),
          end: dayEnd.toISOString(),
          duration: duration
        });
      }
    }
    
    return freeSlots;
  }

  // Get snapshot for orchestrator
  getSnapshot() {
    return {
      eventsToday: this.getToday(),
      upcomingEvents: this.getUpcoming(7),
      totalEvents: this.events.length
    };
  }
}

export const calendarState = new CalendarState();
