// src/core/orchestrator.js
// The brain - reasons about state, decides actions, coordinates apps

import { eventBus } from './eventBus.js';
import { registry } from './registry.js';
import { contextStore } from './contextStore.js';

class Orchestrator {
  constructor() {
    this.isInitialized = false;
    this.pendingActions = [];
    this.apiKey = null; // User provides their own Claude API key
  }

  async init(apiKey = null) {
    this.apiKey = apiKey;
    
    // Initialize context store (local memory)
    await contextStore.init();
    
    // Listen to ALL events from the event bus
    eventBus.on('*', (event, data) => {
      this.handleEvent(event, data);
    });
    
    this.isInitialized = true;
    console.log('[Orchestrator] Initialized and listening');
  }

  // Handle incoming events from apps
  async handleEvent(event, data) {
    console.log(`[Orchestrator] Received: ${event}`, data);
    
    // Log the event
    await contextStore.logAction({
      type: 'event_received',
      event: event,
      data: data,
      source: data?.source || 'unknown'
    });

    // Decide if this event needs attention
    const needsAttention = this.evaluateEvent(event, data);
    
    if (needsAttention) {
      await this.reason(event, data);
    }
  }

  // Quick evaluation - does this event need the AI to think about it?
  evaluateEvent(event, data) {
    // Events that probably need attention
    const importantEvents = [
      'weather_precipitation_expected',
      'calendar_event_created',
      'calendar_event_moved',
      'calendar_conflict_detected',
      'todo_task_overdue',
      'message_received',
      'email_high_priority'
    ];

    // Check if it's in our important list
    if (importantEvents.includes(event)) {
      return true;
    }

    // Check if the event itself says it's important
    if (data?.priority === 'high' || data?.needsAttention) {
      return true;
    }

    return false;
  }

  // Main reasoning function - this calls Claude
  async reason(trigger, triggerData) {
    if (!this.apiKey) {
      console.log('[Orchestrator] No API key - skipping AI reasoning');
      console.log('[Orchestrator] Would reason about:', trigger, triggerData);
      return;
    }

    // Gather context
    const context = this.buildContext(trigger, triggerData);
    
    // Build the prompt
    const prompt = this.buildPrompt(context);
    
    try {
      // Call Claude
      const response = await this.callClaude(prompt);
      
      // Parse and execute response
      await this.handleResponse(response, context);
      
    } catch (error) {
      console.error('[Orchestrator] Reasoning failed:', error);
      
      await contextStore.logAction({
        type: 'reasoning_error',
        trigger: trigger,
        error: error.message
      });
    }
  }

  // Gather all context the AI needs to reason
  buildContext(trigger, triggerData) {
    return {
      trigger: {
        event: trigger,
        data: triggerData,
        timestamp: new Date().toISOString()
      },
      
      // Current state of all apps
      appState: registry.getAllState(),
      
      // What apps can do
      capabilities: registry.getAllManifests(),
      
      // User context (profile, patterns, preferences)
      userContext: contextStore.getFullContext(),
      
      // Current time info
      time: {
        now: new Date().toISOString(),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        timeOfDay: this.getTimeOfDay()
      }
    };
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  // Build the prompt for Claude
  buildPrompt(context) {
    return `You are the orchestration layer for AwareOS, a personal operating system. Your job is to reason about events and decide if any action should be taken.

## Your Capabilities
You can see the state of all apps and dispatch actions to them. You understand the user's patterns and preferences.

## Current Trigger
Event: ${context.trigger.event}
Data: ${JSON.stringify(context.trigger.data, null, 2)}

## App States
${JSON.stringify(context.appState, null, 2)}

## Available Apps and Their Capabilities
${JSON.stringify(context.capabilities, null, 2)}

## User Context
${JSON.stringify(context.userContext, null, 2)}

## Current Time
${context.time.dayOfWeek}, ${context.time.timeOfDay}
${context.time.now}

## Instructions
1. Analyze the trigger event in context of the user's state, patterns, and preferences
2. Decide if any action should be suggested to the user
3. Be helpful but not annoying - only suggest things that matter
4. Respect user preferences about what NOT to be notified about
5. Consider time of day and context

## Response Format
Respond with JSON only:
{
  "shouldAct": true/false,
  "reasoning": "Brief explanation of your thinking",
  "suggestion": {
    "message": "What to say to the user (conversational, not robotic)",
    "actions": [
      {
        "app": "appName",
        "action": "actionName",
        "params": {}
      }
    ],
    "priority": "low/medium/high"
  }
}

If shouldAct is false, only include reasoning.`;
  }

  // Call Claude API
  async callClaude(prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // Handle Claude's response
  async handleResponse(response, context) {
    let parsed;
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('[Orchestrator] Failed to parse response:', response);
      return;
    }

    // Log the reasoning
    await contextStore.logAction({
      type: 'reasoning_complete',
      trigger: context.trigger.event,
      shouldAct: parsed.shouldAct,
      reasoning: parsed.reasoning,
      suggestion: parsed.suggestion
    });

    if (!parsed.shouldAct) {
      console.log('[Orchestrator] No action needed:', parsed.reasoning);
      return;
    }

    // Emit suggestion to UI
    eventBus.emit('orchestrator_suggestion', {
      id: Date.now(),
      message: parsed.suggestion.message,
      actions: parsed.suggestion.actions,
      priority: parsed.suggestion.priority,
      context: context.trigger
    });
  }

  // Execute approved actions
  async executeActions(actions) {
    const results = [];
    
    for (const action of actions) {
      try {
        const result = await registry.dispatch(
          action.app,
          action.action,
          action.params
        );
        
        results.push({ action, result, success: true });
        
        await contextStore.logAction({
          type: 'action_executed',
          app: action.app,
          action: action.action,
          params: action.params,
          result: result
        });
        
      } catch (error) {
        results.push({ action, error: error.message, success: false });
        
        await contextStore.logAction({
          type: 'action_failed',
          app: action.app,
          action: action.action,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // User approves a suggestion
  async approveSuggestion(suggestionId, actions) {
    console.log('[Orchestrator] User approved suggestion:', suggestionId);
    
    const results = await this.executeActions(actions);
    
    eventBus.emit('orchestrator_action_complete', {
      suggestionId,
      results
    });
    
    return results;
  }

  // User dismisses a suggestion
  async dismissSuggestion(suggestionId, reason = null, dontAskAgain = false) {
    console.log('[Orchestrator] User dismissed suggestion:', suggestionId, reason);
    
    await contextStore.logAction({
      type: 'suggestion_dismissed',
      suggestionId,
      reason,
      dontAskAgain
    });

    // If user said "don't ask again", learn from it
    if (dontAskAgain && reason) {
      await contextStore.setPreference(`suppress_${reason}`, {
        enabled: true,
        createdAt: new Date().toISOString()
      });
    }
  }
}

// Single global instance
export const orchestrator = new Orchestrator();
