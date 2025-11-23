// src/shell/widgets/CalendarWidget.jsx
// Visual calendar interface

import React, { useState, useEffect } from 'react';
import { eventBus } from '../../core/eventBus.js';
import { registry } from '../../core/registry.js';

export default function CalendarWidget() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: ''
  });

  // Load events when component mounts
  useEffect(() => {
    loadEvents();
    
    // Subscribe to calendar events
    const unsubscribe = eventBus.on('calendar_event_created', () => {
      loadEvents();
    });

    return () => unsubscribe();
  }, []);

  const loadEvents = () => {
    try {
      const state = registry.dispatch('calendar', 'get_events', {});
      setEvents(state || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    
    const startDateTime = `${newEvent.date}T${newEvent.startTime}:00`;
    const endDateTime = `${newEvent.date}T${newEvent.endTime}:00`;

    try {
      registry.dispatch('calendar', 'create_event', {
        title: newEvent.title,
        start: startDateTime,
        end: endDateTime,
        location: newEvent.location,
        description: newEvent.description
      });

      // Reset form
      setNewEvent({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        description: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event: ' + error.message);
    }
  };

  const handleDeleteEvent = (eventId) => {
    if (confirm('Delete this event?')) {
      try {
        registry.dispatch('calendar', 'delete_event', { id: eventId });
        loadEvents();
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate > today && eventDate < weekFromNow;
  }).slice(0, 5);

  return (
    <div style={{ padding: '15px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', color: '#4a9eff' }}>Today's Events</h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: '#4a9eff',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {/* Add Event Form */}
      {showAddForm && (
        <form onSubmit={handleAddEvent} style={{ 
          background: '#252540', 
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '15px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#aaa' }}>
              Title *
            </label>
            <input
              type="text"
              required
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              style={{
                width: '100%',
                padding: '6px',
                background: '#1a1a2e',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#eee',
                fontSize: '12px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#aaa' }}>
                Date *
              </label>
              <input
                type="date"
                required
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#eee',
                  fontSize: '12px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#aaa' }}>
                Location
              </label>
              <input
                type="text"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#eee',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#aaa' }}>
                Start Time *
              </label>
              <input
                type="time"
                required
                value={newEvent.startTime}
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#eee',
                  fontSize: '12px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#aaa' }}>
                End Time *
              </label>
              <input
                type="time"
                required
                value={newEvent.endTime}
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#1a1a2e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#eee',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          <button 
            type="submit"
            style={{
              width: '100%',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              padding: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Create Event
          </button>
        </form>
      )}

      {/* Today's Events */}
      <div style={{ marginBottom: '20px' }}>
        {todayEvents.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666',
            fontSize: '12px'
          }}>
            No events today
          </div>
        ) : (
          todayEvents.map(event => (
            <EventCard key={event.id} event={event} onDelete={handleDeleteEvent} />
          ))
        )}
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <>
          <h3 style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>
            Upcoming This Week
          </h3>
          {upcomingEvents.map(event => (
            <EventCard key={event.id} event={event} onDelete={handleDeleteEvent} compact />
          ))}
        </>
      )}
    </div>
  );
}

function EventCard({ event, onDelete, compact = false }) {
  const startTime = new Date(event.start);
  const endTime = new Date(event.end);

  return (
    <div style={{
      background: '#252540',
      border: '1px solid #333',
      borderRadius: '6px',
      padding: compact ? '8px' : '12px',
      marginBottom: '8px',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: compact ? '12px' : '13px', 
            fontWeight: '500',
            marginBottom: '4px',
            color: '#eee'
          }}>
            {event.title}
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            {startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            {' - '}
            {endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
          {event.location && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              📍 {event.location}
            </div>
          )}
          {!compact && event.description && (
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
              {event.description}
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(event.id)}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 4px'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
