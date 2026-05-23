# orbit_particle_tool — Session Notes

## What This Script Is

A FiveM **developer tool** for visually building, testing, and exporting looped particle effects attached to a ped's bones. It lets you configure multiple particle slots (each with a bone, offset, rotation, scale, colour, and evolution variables), preview them live on your character in-game, organise them into named groups, and export the result as a ready-to-paste Lua table.

It is **never shipped to players** — it lives under `[DEV]` and is used during development to quickly find and tune particle setups.

---

## Resource Structure

```
orbit_particle_tool/
├── fxmanifest.lua          — fx_version adamant, serves html/ as NUI page
├── client.lua              — all GTA native calls (particle handles, preview)
├── NOTES.md                — this file
└── cef/                    — Vue 3 + Vite source (build → html/)
    ├── src/
    │   ├── App.vue
    │   ├── views/
    │   │   └── Panel.vue           — main window: drag, header buttons, modals
    │   ├── components/
    │   │   ├── ParticleBrowser.vue — left pane: dict/fx tree + search + preview
    │   │   ├── ParticleConfig.vue  — right pane: sidebar groups + slot editor
    │   │   ├── BoneSelect.vue      — teleported dropdown for bone selection
    │   │   ├── RangeSlider.vue     — labelled slider component
    │   │   ├── CustomDictModal.vue — add custom particle dict modal
    │   │   └── ImportLuaModal.vue  — import Lua table modal (added this session)
    │   ├── store/
    │   │   └── useParticleStore.ts — Pinia store: all state + Lua parser
    │   ├── bones.ts                — BONES array (28 entries, fact-checked)
    │   ├── types.ts                — TypeScript interfaces
    │   ├── particles.json          — bundled GTA particle dict/fx list
    │   └── plugins/
    │       └── axios.plugin.ts     — thin axios wrapper for NUI callbacks
    └── html/               — compiled output (what FiveM actually loads)
```

`fxmanifest.lua` points to `html/index.html`. After any source edit you must run:
```
cd cef && npm run build
```
Or use `npm run watch` for auto-rebuild on save.

---

## How It Works (Architecture)

### Data flow

```
Vue UI (NUI)  ──NUI callback──▶  client.lua  ──GTA native──▶  game engine
              ◀──SendNUIMessage──
```

The Vue app owns all state (Pinia store). The Lua side only holds live particle **handles** in `Builder.Slots[id]`. Every meaningful action sends a NUI callback; Lua acts on it and calls the appropriate GTA particle native.

### Particle slot lifecycle

1. User double-clicks an fx in the browser → `addSlot()` in store → `ADD_PARTICLE_SLOT` → `StartParticleFxLoopedOnPedBone`
2. Live edits:
   - Bone / offset / rotation / particle change → `UPDATE_SLOT_TRANSFORM` → full `StartParticleFxLoopedOnPedBone` restart
   - Scale → `UPDATE_SLOT_SCALE` → `SetParticleFxLoopedScale`
   - Color → `UPDATE_SLOT_COLOR` → `SetParticleFxLoopedColour` + `SetParticleFxLoopedAlpha`
   - Evolution variable → `UPDATE_SLOT_EVOLUTION` → `SetParticleFxLoopedEvolution`
3. Remove slot → `REMOVE_PARTICLE_SLOT` → `RemoveParticleFx`
4. Play All → `SET_ALL_PLAYING` → starts all slots
5. Stop All → `STOP_ALL` → removes all handles

### Particle data types

```typescript
interface ParticleSlot {
  id: string            // random uid
  dict: string          // GTA particle dict name
  fx: string            // effect name within dict
  bone: number          // GTA bone ID (decimal)
  boneName: string      // canonical name e.g. "SKEL_Head"
  offset: Vec3          // bone-relative offset
  rotation: Vec3        // bone-relative rotation
  scale: number         // 0.01 – 15
  color: RGBA           // 0.0–1.0 per channel
  evolution: Record<string, number>  // named float params 0–1
  groupId: string | null // null = ungrouped
}

interface ParticleGroup {
  id: string
  name: string
}
```

---

## NUI Callbacks (client.lua ← Vue)

| Callback | Payload | What Lua does |
|---|---|---|
| `SET_CURSOR_STATE` | `{ state: bool }` | Enables/disables NUI focus + idle cam. Does NOT stop particles on close. |
| `SET_ALL_PLAYING` | `{ slots: ParticleSlot[] }` | Starts all slots via `StartParticleFxLoopedOnPedBone` |
| `STOP_ALL` | — | Removes all particle handles |
| `ADD_PARTICLE_SLOT` | `{ slot }` | Starts one slot |
| `REMOVE_PARTICLE_SLOT` | `{ id }` | Stops and removes one slot handle |
| `UPDATE_SLOT_TRANSFORM` | `{ slot }` | Restarts the slot (bone/offset/rotation/fx changed) |
| `UPDATE_SLOT_SCALE` | `{ id, scale }` | `SetParticleFxLoopedScale` |
| `UPDATE_SLOT_COLOR` | `{ id, color: RGBA }` | `SetParticleFxLoopedColour` + `SetParticleFxLoopedAlpha` |
| `UPDATE_SLOT_EVOLUTION` | `{ id, name, value }` | `SetParticleFxLoopedEvolution` |
| `PREVIEW_PARTICLE` | `{ dict, fx }` | Spawns particle 1.2m in front of ped, auto-stops after 3s |
| `STOP_PREVIEW` | — | Immediately removes preview particle |

## NUI Messages (Vue ← client.lua)

| Event | When | What Vue does |
|---|---|---|
| `SET_OPEN_STATE` | From `pb_open` / `pb_close` commands or exports | Opens or closes the panel |
| `PREVIEW_STOPPED` | 3s after preview started | Clears the active eye-icon state in ParticleBrowser |

## Commands / Exports

```lua
-- commands
pb_open   -- opens the panel
pb_close  -- closes the panel

-- exports
exports['orbit_particle_tool']:Open()
exports['orbit_particle_tool']:Close()
```

---

## Lua Export Format

```lua
local particles = {
    { -- dict / fx
        dict     = "core",
        fx       = "ent_amb_cigarette_smoke",
        bone     = 31086, -- SKEL_Head
        offset   = vector3(0.000, 0.000, 0.000),
        rotation = vector3(0.0, 0.0, 0.0),
        scale    = 1.00,
        color    = { r=1.000, g=1.000, b=1.000, a=1.000 },
        group    = "Head Effects",   -- only present if slot is in a group
        evolution = {
            speed = 0.500,
        },
    },
}
```

The `group` field is optional. If present during import it will auto-create the group. This means export → import round-trips perfectly including group structure.

---

## Changes Made This Session

### 1. Window size + draggable (Panel.vue)

- Shrunk panel from `1060×680` → `820×540`
- `.stage` changed from flex-centering to `position: fixed; inset: 0`
- `.panel` changed to `position: absolute` driven by reactive `pos: {x, y}`
- Header gets `@mousedown="startDrag"` with `e.preventDefault()` (critical — without it the browser's native drag steals mousemove events)
- Opens centered via `setTimeout(centerPanel, 0)` on each open
- Dragging is clamped to viewport bounds

### 2. Particles keep playing when menu closes (client.lua)

- Removed `StopAll()` and `Builder.Playing = false` from the `SET_CURSOR_STATE false` handler
- Particles now only stop on explicit Stop All button or resource unload

### 3. Bone fact-check (bones.ts)

All 28 bones cross-referenced against the authoritative `ePedBoneId` enum. 8 errors corrected:

| Entry | Was | Fixed to |
|---|---|---|
| `SKEL_Neck0` | name wrong | `SKEL_Neck_1` (id 39317 was correct) |
| `SKEL_L_Shoulder` | wrong name + wrong id 64064 | `SKEL_L_Clavicle` / **64729** |
| `SKEL_R_Shoulder` | name wrong | `SKEL_R_Clavicle` (id 10706 was correct) |
| `SKEL_L_Forearm` | id **28252** (was R's id) | **61163** |
| `SKEL_R_Forearm` | id **61007** (roll bone) | **28252** |
| `SKEL_R_Finger0` | id **4137** (was L_Finger31) | `SKEL_R_Finger00` / **58866** |
| `IK_R_Hand` | id **10061** (unknown) | **6286** |
| `IK_L_Foot` | id **67909** (over uint16 max) | **65245** |
| `IK_R_Foot` | id **2108** (was SKEL_L_Toe0) | **35502** |

### 4. Bone select dropdown fix (BoneSelect.vue)

The dropdown was `<Teleport to="body">`, so it was outside the component's root in the DOM. The `mousedown` outside-click handler was closing the dropdown before the `click` event on a bone item could fire — meaning you could never actually select a bone.

**Fix:** Added `ref="dropdownEl"` to the teleported dropdown and updated `onDocClick` to also check if the click was inside the dropdown:
```typescript
function onDocClick(e: MouseEvent) {
  if (!root.value?.contains(e.target as Node) && !dropdownEl.value?.contains(e.target as Node)) {
    open.value = false
  }
}
```

### 5. Import Lua (ImportLuaModal.vue + store)

- New "Import Lua" button (blue, download icon) in the panel header
- Modal with a textarea, append/replace toggle, and error feedback
- Lua parser in the store (`parseLuaSlots` + `parseSlotBlock`):
  - Strips `--` comments
  - Counts braces to extract top-level slot blocks (depth 1→2)
  - Regex extracts: dict, fx, bone, offset (vector3), rotation (vector3), scale, color sub-table, evolution sub-table, group name
  - Handles missing fields gracefully with defaults
- Groups named in `group = "..."` fields are auto-created on import
- Import mode: **Append** adds to existing slots/groups; **Replace** clears everything first

### 6. Duplicate slot (store + ParticleConfig.vue)

- `duplicateSlot(id)` in store: deep-clones the slot with a new uid, inserts it immediately after the original, and sends `ADD_PARTICLE_SLOT` if playing
- **Sidebar**: copy icon button appears on hover for every slot row
- **Editor header**: "Duplicate" button always visible next to the particle name

### 7. Groups (types.ts + store + ParticleConfig.vue)

- New `ParticleGroup { id, name }` type; `groupId: string | null` added to `ParticleSlot`
- Store operations: `addGroup`, `removeGroup` (orphaned slots → ungrouped), `renameGroup`, `setSlotGroup`
- The old horizontal tab strip is replaced with a **vertical sidebar** (162px):
  - No groups → flat list of slots
  - With groups → collapsible group headers (chevron), slots indented underneath, "Ungrouped" section for unassigned slots
  - Double-click group name → inline rename (input appears, Enter/blur confirms, Escape cancels)
  - "Add Group" button creates group and immediately enters rename mode
  - Group remove button (×) appears on hover
- **Config editor** gains a "Group" `<select>` (only shown when groups exist) to reassign the active slot
- `toLua()` now emits `group = "Name"` for grouped slots

### 8. Particle preview (client.lua + ParticleBrowser.vue)

- **Eye icon button** on every fx row in both tree view and search results
- Button is hidden by default, appears on row hover; stays purple/visible while that particle is previewing
- Click eye → plays the fx 1.2m in front of the ped at roughly chest height (`StartParticleFxLoopedAtCoord` using ped forward vector)
- Auto-stops after 3 seconds (token-guarded Lua thread + Vue-side `setTimeout`)
- Click eye again while active → immediate stop (`STOP_PREVIEW`)
- Switching to a different particle's eye cancels the previous preview
- Lua sends `PREVIEW_STOPPED` message back to Vue to clear the UI state

---

## Known Behaviour / Notes

- **Build required**: editing `cef/src/**` has no effect until you run `npm run build` in `cef/`. Use `npm run watch` during active development.
- **Groups are UI-only**: they exist purely for organisation in the tool. The exported Lua table is flat (groups appear as `group = "Name"` comments/fields). The game doesn't know about groups.
- **Particles persist across menu close**: this is intentional. Use Stop All or `ensure orbit_particle_tool` (which restarts the resource and clears all handles) to stop them.
- **Preview uses world coords**: the preview particle is spawned at world coordinates in front of the ped and does not follow movement. It auto-cleans up after 3s.
- **Custom dicts** are saved to `localStorage` in the NUI browser and persist across sessions without needing a rebuild.
