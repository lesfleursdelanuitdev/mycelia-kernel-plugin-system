import { getDefaultVersion, isValidSemver } from '../utils/semver.js';

export class Facet {
  #kind;
  #version;
  #attach;
  #required;
  #isInit = false;
  #initCallback = null;
  #disposeCallback = null;
  #source;
  #overwrite;
  #contract = null;
  orderIndex = null; // Public property: index in the orderedKinds array when added via addMany

  constructor(kind, { attach = false, required = [], source, overwrite = false, contract = null, version } = {}) {
    if (!kind || typeof kind !== 'string') {
      throw new Error('Facet: kind must be a non-empty string');
    }
    if (contract !== null && (typeof contract !== 'string' || !contract.trim())) {
      throw new Error('Facet: contract must be a non-empty string or null');
    }
    
    // Validate version if provided, otherwise use default
    const facetVersion = version || getDefaultVersion();
    if (!isValidSemver(facetVersion)) {
      throw new Error(
        `Facet: invalid semver version "${facetVersion}" for facet "${kind}". ` +
        'Must follow format: MAJOR.MINOR.PATCH (e.g., "1.0.0", "2.1.3-alpha")'
      );
    }
    
    this.#kind = kind;
    this.#version = facetVersion;
    this.#attach = !!attach;
    this.#required = Array.isArray(required) ? [...new Set(required)] : [];
    this.#source = source;
    this.#overwrite = !!overwrite;
    this.#contract = contract || null;
    this.orderIndex = null;
  }

  add(object) {
    if (!object || typeof object !== 'object') {
      throw new Error('Facet.add: object must be a non-null object');
    }
    if (this.#isInit) {
      throw new Error(`Facet '${this.#kind}': cannot mutate after init()`);
    }
    // Use Object.getOwnPropertyDescriptors to properly copy getters, setters, and other property descriptors
    const descriptors = Object.getOwnPropertyDescriptors(object);
    
    // Filter out properties that already exist on this instance
    const filteredDescriptors = {};
    for (const key of Reflect.ownKeys(descriptors)) {
      const descriptor = descriptors[key];
      // Skip if property already exists on this instance (own property)
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        continue;
      }
      
      // Also check if it exists on the prototype and is non-configurable
      const protoDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), key);
      if (protoDescriptor && !protoDescriptor.configurable) {
        // Skip non-configurable properties from prototype (like Function.prototype.name)
        continue;
      }
      // Create a new descriptor, preserving getters/setters but making it configurable
      const newDescriptor = {
        configurable: true,
        enumerable: descriptor.enumerable !== false
      };
      
      // Copy the appropriate property descriptor fields
      if (descriptor.get || descriptor.set) {
        // It's a getter/setter
        if (descriptor.get) newDescriptor.get = descriptor.get;
        if (descriptor.set) newDescriptor.set = descriptor.set;
      } else {
        // It's a value property
        newDescriptor.value = descriptor.value;
        newDescriptor.writable = descriptor.writable !== false;
      }
      
      filteredDescriptors[key] = newDescriptor;
    }
    
    // Define properties one by one, skipping any that fail (e.g., non-configurable existing properties)
    for (const key of Reflect.ownKeys(filteredDescriptors)) {
      const descriptor = filteredDescriptors[key];
      try {
        Object.defineProperty(this, key, descriptor);
      } catch {
        // Skip properties that can't be defined (e.g., read-only properties like 'name')
        // This can happen if a property exists on the prototype chain and is non-configurable
        continue;
      }
    }
    
    return this;
  }

  onInit(cb) {
    if (typeof cb !== 'function') {
      throw new Error(`Facet '${this.#kind}': onInit callback must be a function`);
    }
    if (this.#isInit) {
      throw new Error(`Facet '${this.#kind}': onInit must be set before init()`);
    }
    this.#initCallback = cb;
    return this;
  }

  onDispose(cb) {
    if (typeof cb !== 'function') {
      throw new Error(`Facet '${this.#kind}': onDispose callback must be a function`);
    }
    this.#disposeCallback = cb;
    return this;
  }

  async init(ctx, api, subsystem) {
    if (this.#isInit) return;
    if (this.#initCallback) {
      await this.#initCallback({ ctx, api, subsystem, facet: this });
    }
    this.#isInit = true;
    Object.freeze(this);
  }

  async dispose() {
    if (this.#disposeCallback) {
      await this.#disposeCallback(this);
    }
  }

  // ---- Dependency management ----

  /** Add a dependency before initialization. */
  addDependency(dep) {
    if (this.#isInit) {
      throw new Error(`Facet '${this.#kind}': cannot modify dependencies after init()`);
    }
    if (typeof dep !== 'string' || !dep.trim()) {
      throw new Error(`Facet '${this.#kind}': dependency must be a non-empty string`);
    }
    if (!this.#required.includes(dep)) {
      this.#required.push(dep);
    }
    return this;
  }

  /** Remove a dependency before initialization. */
  removeDependency(dep) {
    if (this.#isInit) {
      throw new Error(`Facet '${this.#kind}': cannot modify dependencies after init()`);
    }
    const idx = this.#required.indexOf(dep);
    if (idx !== -1) this.#required.splice(idx, 1);
    return this;
  }

  // ---- Order index management ----

  /** Set the order index (position in orderedKinds array). Can only be set before init(). */
  setOrderIndex(index) {
    if (this.#isInit) {
      throw new Error(`Facet '${this.#kind}': cannot set order index after init()`);
    }
    if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
      throw new Error(`Facet '${this.#kind}': order index must be a non-negative integer`);
    }
    this.orderIndex = index;
    return this;
  }

  // ---- Introspection ----

  getKind() { return this.#kind; }
  getVersion() { return this.#version; }
  shouldAttach() { return this.#attach; }
  shouldOverwrite() { return this.#overwrite; }
  getDependencies() { return this.#required.slice(); }
  hasDependency(dep) { return this.#required.includes(dep); }
  hasDependencies() { return this.#required.length > 0; }
  getSource() { return this.#source; }
  getContract() { return this.#contract; }
}

