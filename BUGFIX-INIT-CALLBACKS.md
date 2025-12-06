# Bug Fix: onInit Callbacks Not Being Called

## Issue Summary

**Severity:** Critical  
**Impact:** Facet lifecycle callbacks (`onInit`) were not being executed during the build process, preventing proper initialization of plugin facets.

## Root Cause

The plugin system uses a two-phase build process:

1. **Verify Phase** (pure, side-effect-free): Creates facets and adds them to `FacetManager` temporarily for dependency lookups
2. **Execute Phase** (transactional): Properly initializes and attaches facets

The bug occurred because:

1. During the **verify phase**, facets are added to `FacetManager` via `subsystem.api.__facets[facetKind] = facet` (line 190 in `hook-processor.js`) to enable dependency lookups for later hooks.

2. During the **execute phase**, `buildSubsystem` checks if facets already exist:
   ```javascript
   const existingFacet = subsystem.api.__facets.find(kind);
   if (!existingFacet) {
     // Add facet
   } else {
     // Skip - facet already exists
     continue; // ❌ BUG: Facets added during verify are skipped!
   }
   ```

3. Since facets were already added during verify, they were skipped during execute, meaning:
   - `addMany()` was never called
   - Facets were never initialized via `facet.init()`
   - `onInit` callbacks were never executed

## The Fix

### 1. Fixed `buildSubsystem` in `utils.js`

**File:** `src/builder/utils.js`

**Change:** Check if the existing facet is the same instance as the one in the plan. If it is, it was added during verify and needs initialization:

```javascript
if (!existingFacet) {
  // New facet - add normally
  facetsToAdd[kind] = facet;
  kindsToAdd.push(kind);
} else if (existingFacet === facet) {
  // ✅ Same facet instance - added during verify phase
  // It needs to be properly initialized/attached, so add it
  facetsToAdd[kind] = facet;
  kindsToAdd.push(kind);
} else {
  // Different facet instance - check overwrite
  // ...
}
```

### 2. Fixed `addMany` in `FacetManager`

**File:** `src/manager/facet-manager.js`

**Change:** Handle the case where the facet is already registered (from verify phase) but needs initialization:

```javascript
if (this.#facets.has(kind)) {
  const existingFacets = this.#facets.get(kind);
  const existingFacetsArray = Array.isArray(existingFacets) ? existingFacets : [existingFacets];
  
  // Check if this is the same facet instance (added during verify phase)
  const isSameInstance = existingFacetsArray.includes(facet);
  
  if (isSameInstance) {
    // ✅ Same facet instance - already registered during verify
    // Just track it for initialization, don't add it again
    this.#txn.trackAddition(kind);
    continue; // Skip registration, but it will be initialized below
  }
  // ... handle different facet instances
}
```

Also, prevent duplicate additions:
```javascript
if (Array.isArray(facets)) {
  // Only add if not already in the array
  if (!facets.includes(facet)) {
    facets.push(facet);
    // ...
  }
}
```

### 3. Fixed `attach` in `FacetManager`

**File:** `src/manager/facet-manager.js`

**Change:** Prevent duplicate attachment attempts:

```javascript
if (facetKind in this.#subsystem) {
  // ✅ If it's the same facet instance, no need to re-attach
  if (this.#subsystem[facetKind] === facet) {
    return facet;
  }
  // ... handle overwrite
}
```

And in `addMany`, check before attaching:
```javascript
if (opts.attach && facet.shouldAttach?.()) {
  // Only attach if not already attached
  if (!(kind in this.#subsystem)) {
    this.attach(kind);
  }
}
```

## Files Changed

### Plugin System (`mycelia-kernel-plugin-system`)
- `src/builder/utils.js` - Fixed facet skipping logic
- `src/manager/facet-manager.js` - Fixed duplicate facet handling and attachment

### Main Codebase (`mycelia-kernel`)
- `src/messages/v2/models/subsystem-builder/subsystem-builder.utils.mycelia.js` - Same fix
- `src/messages/v2/models/facet-manager/facet-manager.mycelia.js` - Same fix

## Test Results

**Before Fix:**
- 32 failing tests
- onInit callbacks never executed
- Facets not properly initialized

**After Fix:**
- ✅ 116 tests passing (100% pass rate)
- ✅ All onInit callbacks execute correctly
- ✅ Facets properly initialized and attached

## Impact

This was a **critical bug** that affected:
- All facets with `onInit` callbacks
- Lifecycle management
- Dependency initialization
- Any code relying on facet initialization

The fix ensures that facets added during the verify phase (for dependency lookups) are still properly initialized during the execute phase, maintaining the two-phase build architecture while fixing the initialization gap.

