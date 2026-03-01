// A simple event emitter
// This is a simplified implementation for demonstration purposes.
// In a real-world application, you might use a library like 'eventemitter3'.

type Listener<T> = (data: T) => void;

class EventEmitter<TEventMap extends Record<string, any>> {
  private listeners: { [K in keyof TEventMap]?: Listener<TEventMap[K]>[] } = {};

  on<K extends keyof TEventMap>(eventName: K, listener: Listener<TEventMap[K]>) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName]!.push(listener);
  }

  off<K extends keyof TEventMap>(
    eventName: K,
    listener: Listener<TEventMap[K]>
  ) {
    if (!this.listeners[eventName]) {
      return;
    }
    this.listeners[eventName] = this.listeners[eventName]!.filter(
      (l) => l !== listener
    );
  }

  emit<K extends keyof TEventMap>(eventName: K, data: TEventMap[K]) {
    if (!this.listeners[eventName]) {
      return;
    }
    this.listeners[eventName]!.forEach((listener) => listener(data));
  }
}

import type { FirestorePermissionError } from './errors';

type AppEvents = {
  'permission-error': FirestorePermissionError;
};

export const errorEmitter = new EventEmitter<AppEvents>();
