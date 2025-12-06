/**
 * ListenerStatistics Class
 * 
 * Tracks statistics for listener operations.
 * 
 * @example
 * const stats = new ListenerStatistics();
 * stats.recordRegistration();
 * stats.recordNotification(5);
 */
export class ListenerStatistics {
  /**
   * Create a new ListenerStatistics instance
   */
  constructor() {
    this.stats = {
      listenersRegistered: 0,
      listenersUnregistered: 0,
      notificationsSent: 0,
      notificationErrors: 0,
      patternListenersRegistered: 0,
      patternListenersUnregistered: 0,
      patternMatches: 0
    };
  }

  /**
   * Record a listener registration
   */
  recordRegistration() {
    this.stats.listenersRegistered++;
  }

  /**
   * Record a listener unregistration
   */
  recordUnregistration() {
    this.stats.listenersUnregistered++;
  }

  /**
   * Record notifications sent
   * @param {number} count - Number of notifications sent
   */
  recordNotifications(count) {
    this.stats.notificationsSent += count;
  }

  /**
   * Record a notification error
   */
  recordError() {
    this.stats.notificationErrors++;
  }

  /**
   * Record a pattern listener registration
   */
  recordPatternRegistration() {
    this.stats.patternListenersRegistered++;
    this.stats.listenersRegistered++; // Also count as regular registration
  }

  /**
   * Record a pattern listener unregistration
   */
  recordPatternUnregistration() {
    this.stats.patternListenersUnregistered++;
    this.stats.listenersUnregistered++; // Also count as regular unregistration
  }

  /**
   * Record a pattern match
   */
  recordPatternMatch() {
    this.stats.patternMatches++;
  }

  /**
   * Get current statistics
   * @param {Object} additionalData - Additional data to include in stats
   * @returns {Object} Statistics object
   */
  get(additionalData = {}) {
    return {
      ...this.stats,
      ...additionalData
    };
  }

  /**
   * Clear statistics and reset state
   */
  clear() {
    this.stats = {
      listenersRegistered: 0,
      listenersUnregistered: 0,
      notificationsSent: 0,
      notificationErrors: 0,
      patternListenersRegistered: 0,
      patternListenersUnregistered: 0,
      patternMatches: 0
    };
  }
}

