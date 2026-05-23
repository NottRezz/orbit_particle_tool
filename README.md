# orbit_particle_tool

A FiveM developer tool for building, previewing, and fine-tuning GTA V looped particle effects on the local player ped in real time.

---

## Features

- **Multi-slot system** — layer multiple particle effects simultaneously, each with independent settings
- **Live editing** — adjust scale, color, alpha, offset, rotation, and bone without restarting the effect
- **Evolution parameters** — set named evolution keys per slot (e.g. `brightness`, `speed`, `size`)
- **3-second floating preview** — audition any effect in front of your ped before committing it to a slot
- **Custom dictionaries** — add particle dictionaries and effect lists beyond the 278 built-in ones
- **Transparent NUI** — panel opens/closes on demand; idle camera is suppressed while open

---

## Requirements

- FiveM server running `game 'gta5'`
- Lua 5.4 (`lua54 "yes"`)

No framework dependency.

---

## Installation

1. Clone or download the repository.
2. Build the UI — `node_modules` is not included in the repo, so you need to compile it once:
   ```bash
   cd cef
   npm install
   npm run build
   ```
   This generates the `html/` folder that FiveM serves.
3. Drop the `orbit_particle_tool` folder into your server's `resources` directory.
4. Add to your `server.cfg`:
   ```
   ensure orbit_particle_tool
   ```

---

## Usage

| Action | How |
|---|---|
| Open the panel | `/pb_open` in chat, or call the `Open` export |
| Close the panel | `/pb_close` in chat, or call the `Close` export |

### Exports

```lua
-- open / close from another resource
exports['orbit_particle_tool']:Open()
exports['orbit_particle_tool']:Close()
```

---

## Panel Workflow

1. **Open** the panel with `/pb_open`.
2. **Browse** the built-in particle library (278 dictionaries) or add a custom one.
3. **Add a slot** — pick a dictionary and effect name.
4. **Configure** the slot:
   - **Bone** — ped bone to attach to
   - **Offset** — X / Y / Z offset from the bone
   - **Rotation** — pitch / roll / yaw
   - **Scale** — particle size multiplier
   - **Color / Alpha** — tint the effect
   - **Evolutions** — named evolution parameters supported by the effect
5. **Play** to start all slots on the ped simultaneously.
6. **Stop** to remove all active effects.

Use the **Preview** button on any effect in the browser to spawn a 3-second floating copy in front of your ped before adding it to a slot.

---

## Project Structure

```
orbit_particle_tool/
├── fxmanifest.lua          # Resource manifest
├── client.lua              # All game-side logic (NUI callbacks, particle management)
└── cef/                    # Vue 3 frontend source
    └── src/
        ├── App.vue
        ├── main.ts
        ├── global.scss
        ├── particles.json          # Built-in particle library (278 dictionaries)
        ├── plugins/
        │   └── axios.plugin.ts     # NUI fetch helper
        └── components/
            ├── RangeSlider.vue     # Labeled range + number input, v-model compatible
            └── CustomDictModal.vue # Modal for adding custom dictionaries
```

The compiled UI is served from `html/` (built from `cef/`).

---

## Development

```bash
cd cef
npm install
npm run dev    # hot-reload dev server
npm run build  # outputs to html/
```

---

## License

MIT
