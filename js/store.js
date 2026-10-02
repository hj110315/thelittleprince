// Reactive Pub/Sub Event Bus Store
class EventStore {
  constructor() {
    this.events = {};
  }

  subscribe(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);

    // Return unsubscriber function
    return () => {
      this.events[event] = this.events[event].filter(l => l !== listener);
    };
  }

  publish(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }
}

export const store = new EventStore();
