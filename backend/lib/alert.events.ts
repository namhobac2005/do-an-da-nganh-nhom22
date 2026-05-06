/**
 * alert.events.ts
 * Singleton Node.js EventEmitter for the alert system.
 *
 * The Actuator module can subscribe to 'ALERT_TRIGGERED' to react
 * to threshold violations (e.g. turn on aerators when DO is low).
 *
 * Usage in Actuator module:
 *   import { alertEmitter } from '../lib/alert.events.ts';
 *   alertEmitter.on('ALERT_TRIGGERED', (payload) => { ... });
 */

import { EventEmitter } from 'events';

export interface AlertTriggeredPayload {
  alertId:       string;
  zoneId:        string;
  metric:        string;
  recordedValue: number;
  minValue:      number;
  maxValue:      number;
  reason:        string;
  triggeredAt:   string;
}

class AlertEmitter extends EventEmitter {}
export const alertEmitter = new AlertEmitter();
