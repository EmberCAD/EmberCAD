# PR Title
Layer-first Designer refactor + text/proxy stability + project persistence and TreeView hardening

# Summary
This PR delivers the full session refactor from object/group-driven workflow to **layer-driven workflow**, plus a long set of stability fixes around text editing, grouping, project save/load, image handling, selection state, and TreeView drag/drop robustness.

# What Changed

## 1. Layer-first workflow (Designer)
- Reworked right panel to be **Layers-first** (instead of object hierarchy).
- Added/updated layer model usage (`00..29 + T1/T2`) across creation, selection, and rendering.
- Layer tools now drive per-layer settings (speed/power/passes/air/output/visibility/include-in-frame).
- T1/T2 treated as tool layers with non-burn behavior.
- Layer order and layer list behavior aligned with laser job ordering expectations.

## 2. Text architecture and editing reliability
- Stabilized text editing anchor/positioning to remove re-edit offset drift.
- Improved text root/proxy/carrier handling so selection and transforms are consistent.
- Preserved text root/proxy pair through grouping/ungrouping flows.
- Prevented hidden/internal text nodes from polluting selection bounds (origin-stretch issues).

## 3. Selection and top-tools synchronization
- Fixed stale “No Selection” / selection-label behavior.
- Restored correct selection callbacks after switching back from Laser to Designer.
- Ensured **New Document** clears selection and resets top tools to default Designer state.

## 4. Project persistence and load/open stability
- Extended project save/load to persist and restore element metadata reliably.
- Excluded transient selection group from serialization.
- Persisted image layer fields explicitly so image layer assignment survives reopen.
- Fixed startup-open race for images (guarded zero-size raster preview path to avoid `drawImage` failure).

## 5. TreeView robustness
- Hardened TreeView drop/reorder logic:
  - safe handling for dropping at end of list,
  - missing/stale drop target fallbacks,
  - proper reparent/reorder without undefined dereferences or duplicates.
- Prevented crash path in `reorder` observed during bottom/end drops.

# User-Visible Fixes
- No more stale selection handles/state after New.
- No top-tools mismatch after deselection/new document.
- No startup “Open Project Failed” from zero-size image draw path.
- Image layer assignment survives reopen.
- Box selection and grouped text flows no longer break text editability.
- TreeView no longer crashes when dropping item as last row.

# Main Commits Included
- `459250b` switch from hierarchy to layers
- `04b3552` refactor text editor | power elements
- `a1b16a9` refactor Layer Settings UI (constant/range)
- `8187d76` fix text re-edit offset
- `ee838c3` preserve text root/proxy on ungroup
- `ace6969`, `b93e2e1`, `f9b699b`, `cbbca88` selection/text-root fixes
- `bbe27d2`, `0c42043` top-tools/selection sync fixes
- `b488132`, `c60eaa3`, `cfeb41e` project persistence improvements
- `e6e3c8d` clear selection state on New
- `77180c5` guard raster preview on startup open
- `7bfc4f4` reset Designer top tools on unselect
- `6158202` TreeView drop/reorder hardening

# Notes
- This is alpha-phase work; scope prioritized behavior correctness and state consistency over backward-compat migration complexity.
