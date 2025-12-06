# Architecture Documentation Plan

## Overview

This document outlines the comprehensive architecture documentation for the Mycelia Plugin System builder components. The documentation will cover the build process, internal components, data structures, performance considerations, troubleshooting, and include visual diagrams.

## Documentation Structure

### 1. BUILD-PROCESS.md
**Purpose:** High-level overview of how the system builds and installs plugins

**Content:**
- Two-phase build process (verify vs execute)
- Build flow diagram (ASCII or Mermaid)
- Verification phase (pure, side-effect-free)
  - Hook collection
  - Hook ordering
  - Facet creation
  - Dependency graph building
  - Topological sorting
  - Contract validation
- Execution phase (transactional)
  - Context assignment
  - Facet installation
  - Child subsystem building
- Builder API usage patterns
- Error handling and rollback
- Sequence diagram showing the full flow

**Target Audience:** All users (developers using the system)

**Cross-References:**
- Links to BUILDER-COMPONENTS.md for details
- Links to DATA-STRUCTURES.md for structure definitions
- Links to PERFORMANCE.md for optimization tips
- Links to TROUBLESHOOTING.md for common issues

---

### 2. BUILDER-COMPONENTS.md
**Purpose:** Detailed documentation of each builder component

**Content:**
- Overview of component relationships
- **SubsystemBuilder** section:
  - Public API methods (`withCtx()`, `plan()`, `build()`, `invalidate()`)
  - Context management and merging
  - Plan caching strategy
  - Usage examples
- **Hook Processor** section:
  - Hook metadata extraction
  - Dependency-based ordering algorithm
  - Hook execution flow
  - Facet creation process
  - Overwrite hook handling
- **Dependency Graph** section:
  - Graph building from hooks and facets
  - Topological sorting (Kahn's algorithm)
  - Cycle detection and error messages
  - Graph structure visualization
- **Context Resolver** section:
  - Context merging strategy
  - Deep merge algorithm for config
  - Context resolution order
- **Facet Validator** section:
  - Contract enforcement timing
  - Validation process
  - Error reporting
- **Dependency Graph Cache** section:
  - LRU caching implementation
  - Cache key generation
  - Cache invalidation

**Target Audience:** Developers extending the system, contributors

**Cross-References:**
- Links to DATA-STRUCTURES.md for structure details
- Links to PERFORMANCE.md for optimization details
- Links to TROUBLESHOOTING.md for debugging tips

---

### 3. DATA-STRUCTURES.md
**Purpose:** Document internal data structures used by the builder

**Content:**
- **Plan Structure:**
  ```javascript
  {
    resolvedCtx: { ms, config, debug, graphCache },
    orderedKinds: string[],
    facetsByKind: { [kind: string]: Facet },
    graphCache?: DependencyGraphCache
  }
  ```
- **Dependency Graph Structure:**
  ```javascript
  {
    graph: Map<kind, Set<dependentKinds>>,
    indeg: Map<kind, number>,
    kinds: string[]
  }
  ```
- **Hook Metadata Structure:**
  ```javascript
  {
    hook: Function,
    required: string[],
    source: string,
    overwrite: boolean,
    version: string,
    index: number
  }
  ```
- **Cache Entry Structure:**
  ```javascript
  {
    valid: boolean,
    orderedKinds?: string[],
    error?: string
  }
  ```
- **Context Structure:**
  ```javascript
  {
    ms: null | MessageSystem,
    config: { [facetKind: string]: any },
    debug: boolean,
    graphCache?: DependencyGraphCache
  }
  ```
- Data flow diagrams showing how structures transform
- Memory considerations
- Structure relationships

**Target Audience:** Contributors, developers debugging issues

**Cross-References:**
- Links to BUILDER-COMPONENTS.md for usage context
- Links to PERFORMANCE.md for memory optimization

---

### 4. PERFORMANCE.md
**Purpose:** Performance considerations, optimization strategies, and benchmarks

**Content:**
- **Caching Strategy:**
  - Dependency graph cache benefits
  - Cache hit/miss scenarios
  - Cache size recommendations
  - When to invalidate cache
- **Build Performance:**
  - Verification phase performance (pure, can be cached)
  - Execution phase performance (transactional)
  - Parallel initialization of facets at same dependency level
  - Build time complexity analysis
- **Memory Considerations:**
  - Plan caching memory usage
  - Dependency graph memory footprint
  - Facet storage
  - Cache size limits
- **Optimization Tips:**
  - Reusing graph cache across builds
  - Minimizing context changes
  - Efficient hook ordering
  - Reducing dependency graph complexity
- **Performance Patterns:**
  - When to use `plan()` vs `build()`
  - Caching strategies for repeated builds
  - Batch operations
- **Benchmarks/Examples:**
  - Build time for N facets
  - Cache hit rates
  - Memory usage patterns

**Target Audience:** All developers (especially those building large systems)

**Cross-References:**
- Links to BUILDER-COMPONENTS.md for implementation details
- Links to DATA-STRUCTURES.md for memory considerations
- Links to TROUBLESHOOTING.md for performance issues

---

### 5. TROUBLESHOOTING.md
**Purpose:** Common issues, error messages, debugging strategies

**Content:**
- **Common Errors:**
  - Dependency cycle errors
    - How to identify cycles
    - How to resolve cycles
    - Example error messages
  - Missing dependency errors
    - Hook requires missing facet
    - Facet depends on missing facet
  - Contract validation errors
    - Missing required methods
    - Missing required properties
    - Custom validation failures
  - Duplicate facet errors
    - Overwrite permission issues
  - Invalid plan errors
- **Debugging Strategies:**
  - Enabling debug mode
  - Inspecting the build plan
  - Checking dependency graph
  - Validating hook metadata
  - Tracing hook execution
  - Inspecting facet creation
- **Diagnostic Tools:**
  - How to inspect `subsystem._builder.getPlan()`
  - How to check dependency graph
  - How to view cache contents
  - How to trace hook execution
- **Performance Issues:**
  - Slow builds
  - High memory usage
  - Cache not working
- **Build Failures:**
  - Transaction rollback scenarios
  - Initialization failures
  - Attachment failures
- **Best Practices for Debugging:**
  - Logging strategies
  - Error message interpretation
  - Step-by-step debugging process

**Target Audience:** All developers (especially those encountering issues)

**Cross-References:**
- Links to BUILD-PROCESS.md for understanding the flow
- Links to BUILDER-COMPONENTS.md for component details
- Links to PERFORMANCE.md for performance-related issues

---

### 6. DIAGRAMS.md (or embedded in relevant docs)
**Purpose:** Visual representations of the build process and data flow

**Content:**
- **Build Process Flow Diagram:**
  - High-level flow from hooks to installed facets
  - Two-phase separation (verify vs execute)
  - Decision points and error paths
- **Dependency Graph Visualization:**
  - Example dependency graph
  - Topological sort visualization
  - Cycle detection illustration
- **Hook Execution Sequence:**
  - Sequence diagram showing hook ordering
  - Facet creation flow
  - Dependency resolution
- **Context Resolution Flow:**
  - Context merging process
  - Deep merge visualization
- **Transaction Flow:**
  - Facet installation transaction
  - Rollback process
- **Cache Flow:**
  - Cache lookup and storage
  - Cache invalidation triggers
- **Component Interaction Diagram:**
  - How components interact
  - Data flow between components

**Format Options:**
- Mermaid diagrams (renderable in GitHub/GitLab)
- ASCII diagrams (always readable)
- Both formats for maximum compatibility

**Target Audience:** All users (visual learners, quick reference)

**Cross-References:**
- Embedded in BUILD-PROCESS.md
- Referenced from BUILDER-COMPONENTS.md
- Used in TROUBLESHOOTING.md for visual debugging

---

## Documentation Integration

### Update Main README.md

Add to Architecture section:
```markdown
### Architecture
- **[Build Process](./architecture/BUILD-PROCESS.md)** - How the system builds and installs plugins
- **[Builder Components](./architecture/BUILDER-COMPONENTS.md)** - Internal builder implementation details
- **[Data Structures](./architecture/DATA-STRUCTURES.md)** - Internal data structures and formats
- **[Performance](./architecture/PERFORMANCE.md)** - Performance considerations and optimization
- **[Troubleshooting](./architecture/TROUBLESHOOTING.md)** - Common issues and debugging guide
- **[Plugin System Analysis](./architecture/PLUGIN-SYSTEM-ANALYSIS.md)** - Architecture overview and comparisons
```

### Cross-Reference Strategy

**From Core Concepts:**
- `HOOKS-AND-FACETS-OVERVIEW.md` → BUILD-PROCESS.md (build process section)
- `HOOKS.md` → BUILDER-COMPONENTS.md (hook processor section)
- `FACETS.md` → BUILD-PROCESS.md (facet creation section)
- `FACET-MANAGER.md` → BUILD-PROCESS.md (facet installation section)

**From Standalone:**
- `STANDALONE-PLUGIN-SYSTEM.md` → BUILD-PROCESS.md (builder usage)

**From API Reference:**
- All API docs → BUILD-PROCESS.md (when context is resolved)

**From Facet Contracts:**
- `FACET-CONTRACTS-OVERVIEW.md` → BUILDER-COMPONENTS.md (facet validator section)

**Within Architecture:**
- BUILD-PROCESS.md → All other architecture docs
- BUILDER-COMPONENTS.md → DATA-STRUCTURES.md, PERFORMANCE.md
- TROUBLESHOOTING.md → All other architecture docs

---

## Documentation Style Guide

### Tone and Language
- **Technical but accessible**: Assume technical knowledge but explain complex concepts
- **Example-driven**: Include code examples for all major concepts
- **Visual aids**: Use diagrams where they add clarity
- **Progressive disclosure**: Start high-level, drill down to details

### Code Examples
- Use standalone plugin system examples (no message system dependencies)
- Show both simple and complex scenarios
- Include error cases and edge cases
- Use realistic facet names (database, cache, logger, etc.)

### Diagrams
- **Mermaid format** for GitHub/GitLab compatibility
- **ASCII alternatives** for universal readability
- **Clear labels** and legends
- **Color coding** where helpful (in rendered versions)

### Structure
- **Overview** at the top of each document
- **Table of Contents** for longer documents
- **Summary** at the end of each major section
- **See Also** links to related documentation

---

## Implementation Order

1. **BUILD-PROCESS.md** (foundation - everything else references it)
2. **BUILDER-COMPONENTS.md** (detailed implementation)
3. **DATA-STRUCTURES.md** (supporting detail)
4. **PERFORMANCE.md** (optimization guidance)
5. **TROUBLESHOOTING.md** (practical help)
6. **DIAGRAMS.md** (visual aids - can be created alongside other docs)

---

## Success Criteria

Documentation is complete when:
- ✅ A developer can understand the build process without reading code
- ✅ Common errors have clear explanations and solutions
- ✅ Performance optimization strategies are documented
- ✅ Internal data structures are fully documented
- ✅ Visual diagrams aid understanding
- ✅ All cross-references are accurate and helpful
- ✅ Examples are realistic and useful

---

## Notes

- Keep diagrams up-to-date with code changes
- Include "last updated" dates if helpful
- Consider version-specific notes if the architecture evolves
- Link to source code where appropriate for contributors
- Balance detail with readability - use appendices for deep dives if needed

