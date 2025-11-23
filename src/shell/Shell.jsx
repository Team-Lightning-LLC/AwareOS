// src/shell/Shell.jsx
// Main visual shell - the command center

import React, { useState, useEffect } from 'react';
import { eventBus } from '../core/eventBus.js';
import { registry } from '../core/registry.js';
import CalendarWidget from './widgets/CalendarWidget.jsx';
import NotificationBar from './NotificationBar.jsx';
import './Shell.css';

export default function Shell() {
  const [widgets, setWidgets] = useState([
    // Start with calendar widget visible
    {
      id: 'calendar-1',
      type: 'calendar',
      x: 100,
      y: 100,
      w: 400,
      h: 500,
      minimized: false
    }
  ]);
  
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // Listen for orchestrator suggestions
    const unsubscribe = eventBus.on('orchestrator_suggestion', (data) => {
      setSuggestions(prev => [data, ...prev].slice(0, 5)); // Keep last 5
    });

    return () => unsubscribe();
  }, []);

  const addWidget = (type) => {
    const newWidget = {
      id: `${type}-${Date.now()}`,
      type,
      x: 150,
      y: 150,
      w: 400,
      h: 500,
      minimized: false
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const moveWidget = (id, x, y) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, x, y } : w));
  };

  const resizeWidget = (id, w, h) => {
    setWidgets(widgets.map(widget => widget.id === id ? { ...widget, w, h } : widget));
  };

  const toggleMinimize = (id) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w));
  };

  return (
    <div className="shell">
      <NotificationBar suggestions={suggestions} />
      
      <div className="canvas">
        {widgets.map(widget => (
          <Widget
            key={widget.id}
            widget={widget}
            onMove={moveWidget}
            onResize={resizeWidget}
            onRemove={removeWidget}
            onToggleMinimize={toggleMinimize}
          />
        ))}
      </div>

      <div className="toolbar">
        <button onClick={() => addWidget('calendar')} className="toolbar-btn">
          📅 Calendar
        </button>
        <button onClick={() => addWidget('todo')} className="toolbar-btn" disabled>
          ✓ Todo (soon)
        </button>
        <button onClick={() => addWidget('weather')} className="toolbar-btn" disabled>
          🌤 Weather (soon)
        </button>
      </div>
    </div>
  );
}

function Widget({ widget, onMove, onResize, onRemove, onToggleMinimize }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('resize-handle')) return;
    if (e.target.closest('.widget-controls')) return;
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e) => {
      if (isDragging) {
        onMove(widget.id, e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      }
      if (isResizing) {
        const rect = document.getElementById(widget.id).getBoundingClientRect();
        const newW = Math.max(300, e.clientX - rect.left);
        const newH = Math.max(200, e.clientY - rect.top);
        onResize(widget.id, newW, newH);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, widget.id, onMove, onResize]);

  return (
    <div
      id={widget.id}
      className={`widget ${widget.minimized ? 'minimized' : ''}`}
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.minimized ? 200 : widget.w,
        height: widget.minimized ? 40 : widget.h,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="widget-header">
        <span className="widget-title">
          {widget.type === 'calendar' && '📅 Calendar'}
          {widget.type === 'todo' && '✓ Todo'}
          {widget.type === 'weather' && '🌤 Weather'}
        </span>
        <div className="widget-controls">
          <button onClick={() => onToggleMinimize(widget.id)} className="widget-btn">
            {widget.minimized ? '□' : '_'}
          </button>
          <button onClick={() => onRemove(widget.id)} className="widget-btn">
            ×
          </button>
        </div>
      </div>

      {!widget.minimized && (
        <>
          <div className="widget-content">
            {widget.type === 'calendar' && <CalendarWidget />}
            {widget.type === 'todo' && <div>Todo coming soon</div>}
            {widget.type === 'weather' && <div>Weather coming soon</div>}
          </div>
          <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
        </>
      )}
    </div>
  );
}
