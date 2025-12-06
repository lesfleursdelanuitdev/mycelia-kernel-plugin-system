# Documentation Plan for mycelia-kernel-plugin-system

## Overview

This document outlines which documentation from `mycelia-kernel` should be included in the new standalone `mycelia-kernel-plugin-system` repository, and what modifications are needed.

## Documentation Categories

### ✅ **CORE DOCUMENTATION** (Must Include - Core Concepts)

These documents explain the fundamental concepts of the plugin system and are essential for users:

1. **HOOKS-AND-FACETS-OVERVIEW.md** ✅
   - **Status**: Include with minor modifications
   - **Changes Needed**: 
     - Remove references to MessageSystem-specific hooks (useMessageProcessor, useSynchronous, etc.)
     - Update examples to use `StandalonePluginSystem` instead of `BaseSubsystem` with message system
     - Remove "Default Hooks" section that references message-system-specific hooks
   - **Why**: Core conceptual overview that explains the Hook-Facet pattern

2. **HOOKS.md** ✅
   - **Status**: Include with significant modifications
   - **Changes Needed**:
     - Remove "Available Hooks" section (lines 213-370) - these are message-system-specific
     - Remove "Default Hook Sets" section (lines 320-346) - references message-system hooks
     - Keep all core concepts: hook structure, metadata, execution process, patterns
     - Update examples to be generic/standalone
   - **Why**: Comprehensive guide to creating hooks - essential for plugin developers

3. **FACETS.md** ✅
   - **Status**: Include with minor modifications
   - **Changes Needed**:
     - Remove references to message-system-specific facets
     - Update context object documentation to note `ctx.ms` is optional/null for standalone
     - Keep all lifecycle, dependency, and introspection documentation
   - **Why**: Complete guide to facets - core to the plugin system

4. **FACET-MANAGER.md** ✅
   - **Status**: Include as-is (or with minimal changes)
   - **Changes Needed**: None (already generic)
   - **Why**: Explains how facets are managed - essential for understanding the system

5. **FACET-MANAGER-TRANSACTION.md** ✅
   - **Status**: Include as-is
   - **Changes Needed**: None
   - **Why**: Explains transaction safety - unique feature of the system

6. **FACET-INIT-CALLBACK.md** ✅
   - **Status**: Include with minor modifications
   - **Changes Needed**: Update context documentation to note `ctx.ms` is optional
   - **Why**: Explains lifecycle callbacks - important for plugin developers

### ✅ **FACET CONTRACTS DOCUMENTATION** (Must Include)

7. **FACET-CONTRACT.md** ✅
   - **Status**: Include as-is
   - **Changes Needed**: None (already generic)
   - **Why**: Core contract system documentation

8. **FACET-CONTRACT-REGISTRY.md** ✅
   - **Status**: Include with modifications
   - **Changes Needed**:
     - Update "Pre-registered contracts" list to only include contracts we've extracted
     - Remove references to message-system-specific contracts
   - **Why**: Explains contract registry - part of the contract system

9. **FACET-CONTRACTS-OVERVIEW.md** ✅
   - **Status**: Include as-is
   - **Changes Needed**: None
   - **Why**: Overview of the contract system

### ✅ **STANDALONE PLUGIN SYSTEM DOCUMENTATION** (Must Include)

10. **STANDALONE-PLUGIN-SYSTEM.md** ✅
    - **Status**: Include with modifications
    - **Changes Needed**:
      - Remove references to `useListeners` being automatically installed (we removed that)
      - Update examples to reflect that `useListeners` is optional
      - Update import paths to new structure
    - **Why**: Primary documentation for using the system standalone

### ✅ **HOOK FUNCTION PARAMETERS** (Should Include)

11. **HOOK-FUNCTION-CONTEXT.md** ✅
    - **Status**: Include with modifications
    - **Changes Needed**:
      - Update to note `ctx.ms` is optional/null for standalone systems
      - Remove message-system-specific context properties
    - **Why**: Explains the context parameter - important for hook developers

12. **HOOK-FUNCTION-API-PARAM.md** ✅
    - **Status**: Include as-is
    - **Changes Needed**: None
    - **Why**: Explains the API parameter

13. **HOOK-FUNCTION-SUBSYSTEM-PARAM.md** ✅
    - **Status**: Include as-is
    - **Changes Needed**: None
    - **Why**: Explains the subsystem parameter

### ✅ **ARCHITECTURE DOCUMENTATION** (Should Include)

14. **PLUGIN-SYSTEM-ANALYSIS.md** (from `/docs/architecture/`) ✅
    - **Status**: Include with modifications
    - **Changes Needed**:
      - Remove message-system-specific comparisons
      - Update examples to use `StandalonePluginSystem`
      - Keep the comparison tables and unique features sections
    - **Why**: Provides architectural overview and comparisons to other systems

### ❌ **EXCLUDE** (Message System Specific)

These documents are specific to the message system and should NOT be included:

- ❌ Individual hook documentation (router/, queue/, scheduler/, etc.) - These are message-system hooks
- ❌ Message system documentation (MESSAGE-SYSTEM.md, COMMUNICATION-TYPES-SUPPORTED.md, etc.)
- ❌ Default hooks documentation (DEFAULT-HOOKS.md) - References message-system hooks
- ❌ Subsystem build utils that reference message system
- ❌ Any documentation about message processing, routing, queuing in the message system context

## Documentation Structure

### Proposed Structure for New Repository

```
/docs
  /getting-started
    README.md (new - quick start guide)
    INSTALLATION.md (new)
  
  /core-concepts
    HOOKS-AND-FACETS-OVERVIEW.md
    HOOKS.md
    FACETS.md
    FACET-MANAGER.md
    FACET-MANAGER-TRANSACTION.md
    FACET-INIT-CALLBACK.md
  
  /facet-contracts
    FACET-CONTRACTS-OVERVIEW.md
    FACET-CONTRACT.md
    FACET-CONTRACT-REGISTRY.md
  
  /standalone
    STANDALONE-PLUGIN-SYSTEM.md
  
  /api-reference
    HOOK-FUNCTION-CONTEXT.md
    HOOK-FUNCTION-API-PARAM.md
    HOOK-FUNCTION-SUBSYSTEM-PARAM.md
  
  /architecture
    PLUGIN-SYSTEM-ANALYSIS.md
  
  /examples
    basic-plugin.md (new)
    plugin-with-dependencies.md (new)
    lifecycle-management.md (new)
    contract-validation.md (new)
  
  /guides
    creating-plugins.md (new)
    dependency-management.md (new)
    best-practices.md (new)
```

## Required Modifications Summary

### Common Changes Across All Docs

1. **Import Path Updates**: 
   - Change `.mycelia.js` to `.js`
   - Update paths to new directory structure
   - Example: `'./models/facet-manager/facet.mycelia.js'` → `'../core/facet.js'`

2. **Message System References**:
   - Remove or note as optional all `ctx.ms` references
   - Remove message-system-specific examples
   - Update to use `StandalonePluginSystem` instead of `BaseSubsystem` with message system

3. **Hook References**:
   - Remove references to message-system hooks (useMessageProcessor, useQueue, useRouter, etc.)
   - Replace with generic examples (useDatabase, useCache, etc.)

4. **Default Hooks**:
   - Remove all references to default hook sets
   - Note that users must register their own hooks

## New Documentation to Create

1. **README.md** (root) - Already created, but may need enhancement
2. **docs/getting-started/README.md** - Quick start guide
3. **docs/getting-started/INSTALLATION.md** - Installation instructions
4. **docs/examples/** - Example documentation
5. **docs/guides/creating-plugins.md** - Step-by-step guide
6. **docs/guides/dependency-management.md** - Dependency patterns
7. **docs/guides/best-practices.md** - Best practices guide
8. **API.md** - Complete API reference (generated or manual)

## Priority Order

### Phase 1: Essential Documentation (Must Have)
1. ✅ HOOKS-AND-FACETS-OVERVIEW.md
2. ✅ HOOKS.md
3. ✅ FACETS.md
4. ✅ STANDALONE-PLUGIN-SYSTEM.md
5. ✅ README.md (root - already created)

### Phase 2: Important Documentation (Should Have)
6. ✅ FACET-MANAGER.md
7. ✅ FACET-MANAGER-TRANSACTION.md
8. ✅ FACET-CONTRACT.md
9. ✅ FACET-CONTRACT-REGISTRY.md
10. ✅ HOOK-FUNCTION-CONTEXT.md

### Phase 3: Supporting Documentation (Nice to Have)
11. ✅ FACET-INIT-CALLBACK.md
12. ✅ HOOK-FUNCTION-API-PARAM.md
13. ✅ HOOK-FUNCTION-SUBSYSTEM-PARAM.md
14. ✅ FACET-CONTRACTS-OVERVIEW.md
15. ✅ PLUGIN-SYSTEM-ANALYSIS.md

### Phase 4: New Documentation (Enhancement)
16. Examples documentation
17. Guides documentation
18. API reference

## Notes

- All documentation should be updated to reflect that this is a **standalone plugin system**
- Remove all dependencies on message system concepts
- Focus on **plugin composition** and **dependency management**
- Emphasize **transaction safety** and **lifecycle management** as unique features
- Keep the **comparison tables** from PLUGIN-SYSTEM-ANALYSIS.md as they're valuable
- Update all code examples to use the new import paths and `StandalonePluginSystem`

