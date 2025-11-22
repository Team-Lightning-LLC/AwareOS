# AwareOS

A local-first, AI-orchestrated operating environment where apps share context and an intelligent layer coordinates them on your behalf.

## Vision

Imagine your weather app knows it will rain today and suggests moving your outdoor reservation indoors. Your calendar knows you meet Jim on Thursdays even though it's not scheduled. Your OS understands the patterns of your life—not to surveil, but to help.

This isn't an assistant you talk to. It's an environment that's aware.

## Core Principles

1. **Local-first** — Your data never leaves your device. Memory, patterns, preferences—all stored locally and fully under your control.

2. **Apps self-describe** — Each app publishes a manifest declaring what it can do. The orchestrator discovers capabilities dynamically.

3. **AI reasons, doesn't rule** — Claude (or another LLM) acts as the reasoning layer. It suggests, you approve. Fully auditable.

4. **Non-intrusive** — No popups demanding attention. The orchestrator messages you like a contact. You respond when you want.

5. **Patterns, not just data** — The system learns that you walk on sunny days and gym on rainy days. It understands context, not just content.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Shell                            │
│   (command center - where apps live visually)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        App Runtime                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Calendar │ │   Todo   │ │ Weather  │ │ Messages │  ...  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       └────────────┴─────┬──────┴────────────┘              │
│                          ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Event Bus                         │   │
│  │  (pub/sub - apps emit events, orchestrator listens)  │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Core Services                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Registry   │  │   Context   │  │    Orchestrator     │ │
│  │             │  │    Store    │  │                     │ │
│  │ - manifests │  │ - patterns  │  │ - reads all state   │ │
│  │ - discovery │  │ - prefs     │  │ - listens to events │ │
│  │             │  │ - profile   │  │ - reasons (Claude)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## App Contract

Every app exposes the same interface:

```javascript
export default {
  manifest: {
    name: 'calendar',
    domain: 'time-based commitments',
    capabilities: ['read_events', 'check_availability'],
    actions: ['create_event', 'update_event', 'delete_event'],
    events: ['event_created', 'event_moved', 'upcoming_soon']
  },
  
  getState: () => { /* current snapshot */ },
  dispatch: (action, params) => { /* execute action */ },
  subscribe: (callback) => { /* event listener */ },
  init: () => { /* initialize app */ }
}
```

## Project Structure

```
/src
  /core
    eventBus.js       # pub/sub system
    registry.js       # app manifest registration
    contextStore.js   # local memory (IndexedDB)
    orchestrator.js   # Claude reasoning layer
  /apps
    /calendar         # First working app
      manifest.js
      state.js
      actions.js
      CalendarApp.js
    /todo             # Coming soon
    /weather          # Coming soon
    /messages         # Coming soon
    /email            # Coming soon
  main.js             # Entry point
```

## Testing in Console

Open browser DevTools (F12) and try:

```javascript
// Create an event
AwareOS.calendar.dispatch("create_event", { 
  title: "Team Meeting", 
  start: "2025-11-22T14:00:00",
  end: "2025-11-22T15:00:00"
})

// See calendar state
AwareOS.calendar.getState()

// See all app capabilities
AwareOS.registry.getAllManifests()

// See stored context
AwareOS.context.getFullContext()

// Set user profile data
AwareOS.context.setProfile("location", "Exton, PA")
AwareOS.context.setProfile("name", "Your Name")
```

## Adding Claude API Key

To enable AI reasoning, initialize with your API key:

```javascript
// In browser console after page loads
AwareOS.orchestrator.apiKey = "your-claude-api-key"
```

Or modify `src/main.js` to pass it during init.

## Deploying to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Deploy (zero config needed with Vite)

## Status

🚧 Under construction. Building the future one event at a time.

### Working
- ✅ Event Bus
- ✅ Registry
- ✅ Context Store (IndexedDB)
- ✅ Orchestrator (Claude integration)
- ✅ Calendar App

### Coming Soon
- 📋 Todo App
- 🌤 Weather App
- 💬 Messages App
- 📧 Email App
- 🖥 Visual Shell (widget-based UI)

## Philosophy

> "They shouldn't even know they're using AI."

The best tools disappear into the work. This OS doesn't demand attention—it provides awareness.

## License

MIT
