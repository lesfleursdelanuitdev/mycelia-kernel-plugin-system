export class FacetManagerTransaction {
  #txnStack = []; // tracks nested transaction frames
  #facetManager;
  #subsystem;

  constructor(facetManager, subsystem) {
    this.#facetManager = facetManager;
    this.#subsystem = subsystem;
  }

  /** Begin a transaction frame */
  beginTransaction() {
    this.#txnStack.push({ added: [] });
  }

  /** Commit current transaction frame */
  commit() {
    if (!this.#txnStack.length) throw new Error('FacetManagerTransaction.commit: no active transaction');
    this.#txnStack.pop();
  }

  /** Roll back current transaction frame: dispose + remove in reverse add order */
  async rollback() {
    if (!this.#txnStack.length) throw new Error('FacetManagerTransaction.rollback: no active transaction');
    const frame = this.#txnStack.pop();
    for (let i = frame.added.length - 1; i >= 0; i--) {
      const k = frame.added[i];
      const facet = this.#facetManager.find(k);
      try { facet?.dispose?.(this.#subsystem); } catch { /* best-effort disposal */ }
      this.#facetManager.remove(k);
    }
  }

  /** Track addition in current transaction frame */
  trackAddition(kind) {
    const frame = this.#txnStack[this.#txnStack.length - 1];
    if (frame) frame.added.push(kind);
  }

  /** Check if there's an active transaction */
  hasActiveTransaction() {
    return this.#txnStack.length > 0;
  }
}

