// src/shell/widgets/CalendarWidget.jsx
// Calendar UI widget - talks to calendar app via dispatch

import React, { useState, useEffect } from 'react';
import { registry } from '../../core/registry.js';
import { eventBus } from '../../core/eventBus.js';

export default function CalendarWidget() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: ''
  });

  useEffect(() => {
    loadEvents();

    // Listen to calendar events
    const unsubscribe = eventBus.on('*', (event) => {
      if (event.startsWith('calendar_')) {
        loadEvents();
      }
    });

    return () => unsubscribe();
  }, []);

  const loadEvents = () => {
    try {
      const todayEvents = registry.dispatch('calendar', 'get_events', {});
      setEvents(todayEvents);
    } catch (error) {
      console.error('[CalendarWidget] Failed to load events:', error);
      setEvents([]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const start = `${formData.date}T${formData.startTime}:00`;
    const end = `${formData.date}T${formData.endTime}:00`;

    try {
      registry.dispatch('calendar', 'create_event', {
        title: formData.title,
        start,
        end,
        location: formData.location
      });

      // Reset form
      setFormData({ title: '', date: '', startTime: '', endTime: '', location: '' });
      setShowForm(false);
    } catch (error) {
      console.error('[CalendarWidget] Failed to create event:', error);
      alert('Failed to create event: ' + error.message);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Delete this event?')) {
      try {
        registry.dispatch('calendar', 'delete_event', { id });
      } catch (error) {
        console.error('[CalendarWidget] Failed to delete event:', error);
        alert('Failed to delete event: ' + error.message);
      }
    }
  };

  return (
    <div style={{ padding: '15px' }}>
      <button
        onClick={() => setShowForm(!showForm)}
        style={{
          width: '100%',
          padding: '10px',
          background: '#4a9eff',
          border: 'none',
          borderRadius: '6px',
          color: 'white',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '15px'
        }}
      >
        {showForm ? 'Cancel' : '+ Add Event'}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#252540',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '15px'
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
              Title *
            </label>
            <input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                background: '#1a1a2e',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#eee',
                fontSize: '12px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#1a1a2e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#eee',
                  fontSize: '12px'
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                Location
              </label>
              <input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#1a1a2e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#eee',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                Start Time *
              </label>
              <input
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#1a1a2e',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#eee',
                  fontSize: '12px'
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>
                End Time *
              </label>
              <input
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
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
              padding: '10px',
              background: '#10b981',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Create Event
          </button>
        </form>
      )}

      <h4 style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>Today's Events</h4>

      {events.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
          No events today
        </div>
      ) : (
        events.map(event => {
          const start = new Date(event.start);
          const end = new Date(event.end);
          return (
            <div
              key={event.id}
              style={{
                background: '#252540',
                border: '1px solid #333',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{event.title}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' - '}
                    {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  {event.location && (
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      📍 {event.location}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(event.id)}
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
        })
      )}
    </div>
  );
}
