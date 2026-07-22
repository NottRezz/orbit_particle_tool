<template>
  <div class="acfg">

    <!-- ── Sub-tab bar ── -->
    <div class="acfg__tabs">
      <button class="acfg__tab" :class="{ 'acfg__tab--active': subTab === 'player' }" @click="setSubTab('player')">
        Player
      </button>
      <button class="acfg__tab" :class="{ 'acfg__tab--active': subTab === 'victim' }" @click="setSubTab('victim')">
        <span class="acfg__tab-pip" :class="{ 'acfg__tab-pip--on': store.victimSpawned }" />
        Victim Ped
      </button>
    </div>

    <!-- ══════════════════════ PLAYER TAB ══════════════════════ -->
    <template v-if="subTab === 'player'">
      <div v-if="!store.state" class="acfg__empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
        </svg>
        <p>Select an animation in the browser.</p>
      </div>

      <template v-else>
        <div class="acfg__info-row">
          <div class="acfg__label">
            <span class="acfg__dict">{{ store.state.dict }}</span>
            <span class="acfg__anim">{{ store.state.anim }}</span>
          </div>
          <button class="acfg__clear-btn" title="Clear animation" @click="store.clearAnim()">✕</button>
        </div>
        <div class="acfg__body">
          <div class="acfg__grid">
            <div class="acfg__col">
              <AnimParamBlock
                :anim="store.state"
                @set-playback-rate="store.setPlaybackRate"
                @set-blend-in="store.setBlendIn"
                @set-blend-out="store.setBlendOut"
                @set-duration="store.setDuration"
              />
            </div>
            <div class="acfg__col">
              <AnimFlagBlock
                :flags="store.state.flags"
                @set-flag="store.setFlag"
                @set-raw-flags="store.setRawFlags"
              />
            </div>
          </div>
        </div>
      </template>
    </template>

    <!-- ══════════════════════ VICTIM TAB ══════════════════════ -->
    <template v-else>
      <div class="acfg__body acfg__body--victim">

        <!-- spawn section -->
        <div class="acfg__vsection">
          <div class="acfg__section-title">Spawn</div>
          <div class="acfg__spawn-row">
            <input
              class="acfg__model-input"
              v-model="store.victimConfig.model"
              placeholder="ped model name"
              @change="store.setVictimModel(store.victimConfig.model)"
            />
            <button
              class="acfg__spawn-btn"
              :class="{ 'acfg__spawn-btn--spawned': store.victimSpawned }"
              :disabled="spawning"
              @click="handleSpawn"
            >
              {{ spawning ? '…' : store.victimSpawned ? 'Respawn' : 'Spawn' }}
            </button>
            <button
              v-if="store.victimSpawned"
              class="acfg__despawn-btn"
              @click="store.despawnVictim()"
            >Despawn</button>
          </div>
          <div v-if="spawnFailed" class="acfg__spawn-err">Model failed to load — check the name.</div>
        </div>

        <!-- position section -->
        <div class="acfg__vsection">
          <div class="acfg__section-title">Position <span class="acfg__section-hint">relative to player</span></div>
          <RangeSlider label="Forward" :model-value="store.victimConfig.offsetY" :min="-10" :max="10" :step="0.05"
            @update:model-value="v => store.setVictimOffset('offsetY', v)" />
          <RangeSlider label="Right"   :model-value="store.victimConfig.offsetX" :min="-10" :max="10" :step="0.05"
            @update:model-value="v => store.setVictimOffset('offsetX', v)" />
          <RangeSlider label="Up"      :model-value="store.victimConfig.offsetZ" :min="-5"  :max="5"  :step="0.05"
            @update:model-value="v => store.setVictimOffset('offsetZ', v)" />
          <RangeSlider label="Heading" :model-value="store.victimConfig.heading"  :min="-180" :max="180" :step="1"
            @update:model-value="v => store.setVictimHeading(v)" />
        </div>

        <!-- victim anim section -->
        <div class="acfg__vsection">
          <div class="acfg__section-title">Animation</div>

          <div v-if="!store.victimAnim" class="acfg__vempty">
            Select an animation in the browser while<br>the <strong>Victim</strong> tab is active.
          </div>

          <template v-else>
            <div class="acfg__label acfg__label--victim">
              <span class="acfg__dict">{{ store.victimAnim.dict }}</span>
              <span class="acfg__anim">{{ store.victimAnim.anim }}</span>
              <button class="acfg__clear-btn" title="Clear animation" @click="store.clearVictimAnim()">✕</button>
            </div>

            <div class="acfg__grid acfg__grid--victim">
              <div class="acfg__col">
                <AnimParamBlock
                  :anim="store.victimAnim"
                  @set-playback-rate="store.setVictimPlaybackRate"
                  @set-blend-in="store.setVictimBlendIn"
                  @set-blend-out="store.setVictimBlendOut"
                  @set-duration="store.setVictimDuration"
                />
              </div>
              <div class="acfg__col">
                <AnimFlagBlock
                  :flags="store.victimAnim.flags"
                  @set-flag="store.setVictimFlag"
                  @set-raw-flags="store.setVictimRawFlags"
                />
              </div>
            </div>

            <!-- victim play / stop -->
            <div class="acfg__victim-play">
              <button
                class="acfg__vplay-btn"
                :class="store.victimPlaying ? 'acfg__vplay-btn--stop' : 'acfg__vplay-btn--play'"
                :disabled="!store.victimSpawned"
                @click="store.victimPlaying ? store.stopVictim() : store.playVictim()"
              >
                <span class="acfg__vplay-dot" />
                {{ store.victimPlaying ? 'Stop Victim' : 'Play Victim' }}
              </button>
              <span v-if="!store.victimSpawned" class="acfg__vplay-hint">Spawn ped first</span>
            </div>
          </template>
        </div>

      </div>
    </template>

  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useAnimStore } from '../store/useAnimStore'
import RangeSlider from './RangeSlider.vue'

// ── inline sub-components ─────────────────────────────────────────────────────
// AnimParamBlock and AnimFlagBlock are defined below as child render functions
// but to keep it simple we inline them directly.

const store = useAnimStore()

const subTab = ref<'player' | 'victim'>('player')
const spawning = ref(false)
const spawnFailed = ref(false)

function setSubTab(t: 'player' | 'victim') {
  subTab.value = t
  store.activeTarget = t
}

async function handleSpawn() {
  spawning.value = true
  spawnFailed.value = false
  const ok = await store.spawnVictim()
  if (!ok) spawnFailed.value = true
  spawning.value = false
}
</script>

<!-- ─────────────────────────────────────────────────────────────────────────── -->
<!-- AnimParamBlock: speed / blend / duration sliders                           -->
<!-- AnimFlagBlock:  flag checkboxes + raw bitmask                              -->
<!-- Both are used for both player and victim so they live here as components.  -->
<!-- ─────────────────────────────────────────────────────────────────────────── -->

<script lang="ts">
import { defineComponent, h } from 'vue'
import RangeSliderCmp from './RangeSlider.vue'
import type { AnimState } from '../types'

const FLAG_DEFS = [
  { label: 'Loop',              bit: 1,   hint: 'Repeat animation continuously' },
  { label: 'Hold Last Frame',   bit: 2,   hint: 'Freeze on the last frame when done' },
  { label: 'Not Interruptable', bit: 8,   hint: 'Prevent the task from being interrupted' },
  { label: 'Upper Body',        bit: 16,  hint: 'Play on upper body only' },
  { label: 'Secondary Task',    bit: 32,  hint: 'Allow locomotion blending (use with Upper Body)' },
  { label: 'Allow Rotation',    bit: 128, hint: 'Allow entity to rotate during the animation' },
  { label: 'Mirror',            bit: 256, hint: 'Mirror animation left/right' },
]

export const AnimParamBlock = defineComponent({
  name: 'AnimParamBlock',
  props: { anim: { type: Object as () => AnimState, required: true } },
  emits: ['setPlaybackRate', 'setBlendIn', 'setBlendOut', 'setDuration'],
  setup(props, { emit }) {
    function onDurationChange(e: Event) {
      const v = parseInt((e.target as HTMLInputElement).value, 10)
      if (!isNaN(v)) emit('setDuration', v)
    }
    return () => h('div', { class: 'apb' }, [
      h('div', { class: 'acfg__section-title' }, 'Playback'),
      h(RangeSliderCmp, { label: 'Speed',     modelValue: props.anim.playbackRate, min: 0.0,  max: 3.0,   step: 0.01, 'onUpdate:modelValue': (v: number) => emit('setPlaybackRate', v) }),
      h(RangeSliderCmp, { label: 'Blend In',  modelValue: props.anim.blendIn,     min: 0.1,  max: 16.0,  step: 0.1,  'onUpdate:modelValue': (v: number) => emit('setBlendIn', v) }),
      h(RangeSliderCmp, { label: 'Blend Out', modelValue: props.anim.blendOut,    min: -16.0, max: 16.0, step: 0.1,  'onUpdate:modelValue': (v: number) => emit('setBlendOut', v) }),
      h('div', { class: 'acfg__section', style: 'margin-top:10px' }, [
        h('div', { class: 'acfg__section-title' }, [
          'Duration ',
          h('span', { class: 'acfg__section-hint' }, 'ms · −1 = infinite'),
        ]),
        h('div', { class: 'acfg__duration-row' }, [
          h('input', {
            type: 'number', class: 'acfg__duration-input',
            value: props.anim.duration, step: 500,
            onChange: onDurationChange,
          }),
          h('button', {
            class: ['acfg__inf-btn', props.anim.duration === -1 ? 'acfg__inf-btn--active' : ''],
            title: 'Set infinite (−1)',
            onClick: () => emit('setDuration', -1),
          }, '∞'),
        ]),
      ]),
    ])
  },
})

export const AnimFlagBlock = defineComponent({
  name: 'AnimFlagBlock',
  props: { flags: { type: Number, required: true } },
  emits: ['setFlag', 'setRawFlags'],
  setup(props, { emit }) {
    function onRawChange(e: Event) {
      const v = parseInt((e.target as HTMLInputElement).value, 10)
      if (!isNaN(v) && v >= 0) emit('setRawFlags', v)
    }
    return () => h('div', { class: 'afb' }, [
      h('div', { class: 'acfg__section-title' }, 'Flags'),
      h('div', { class: 'afb__grid' },
        FLAG_DEFS.map(f => {
          const active = !!(props.flags & f.bit)
          return h('button', {
            class: ['afb__chip', active ? 'afb__chip--on' : ''],
            title: f.hint,
            onClick: () => emit('setFlag', f.bit, !active),
          }, [
            h('span', { class: 'afb__chip-dot' }),
            h('span', { class: 'afb__chip-label' }, f.label),
            h('span', { class: 'afb__chip-bit' }, String(f.bit)),
          ])
        })
      ),
      h('div', { class: 'acfg__section', style: 'margin-top:12px' }, [
        h('div', { class: 'acfg__section-title' }, [
          'Raw Flags ',
          h('span', { class: 'acfg__section-hint' }, 'bitmask'),
        ]),
        h('input', {
          type: 'number', class: 'acfg__duration-input',
          value: props.flags, min: 0, step: 1,
          onChange: onRawChange,
        }),
      ]),
    ])
  },
})
</script>

<style lang="scss" scoped>
.acfg {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;

  // ── sub-tab bar ───────────────────────────────────
  &__tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 14px;
    height: 32px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: #0f0f0f;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: #555;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0 8px;
    height: 100%;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    &:hover { color: #888; }
    &--active { color: #e4e4e7; border-bottom-color: #38bdf8; }
  }

  &__tab-pip {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #3a3a3a;
    flex-shrink: 0;
    &--on { background: #4ade80; box-shadow: 0 0 4px #4ade80; }
  }

  // ── empty states ──────────────────────────────────
  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #3a3a3a;
    font-size: 12px;
    text-align: center;
    p { margin: 0; }
  }

  &__vempty {
    font-size: 11px;
    color: #3a3a3a;
    line-height: 1.6;
    text-align: center;
    padding: 16px 0;
    strong { color: #555; }
  }

  // ── info row ──────────────────────────────────────
  &__info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }

  &__clear-btn {
    flex-shrink: 0;
    background: none;
    border: none;
    color: #3a3a3a;
    font-size: 11px;
    width: 20px; height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.1s, background 0.1s;
    margin-left: auto;
    &:hover { color: #f87171; background: rgba(248,113,113,0.1); }
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow: hidden;
    flex: 1;
    &--victim { padding: 0 0 8px; }
  }

  &__dict {
    font-size: 10px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  &__anim {
    font-size: 13px;
    font-weight: 600;
    color: #e4e4e7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // ── body ─────────────────────────────────────────
  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    &--victim {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 18px;
    &--victim { margin-top: 8px; }
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  // ── sections ─────────────────────────────────────
  &__vsection {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    &:last-child { border-bottom: none; }
  }

  &__section { display: flex; flex-direction: column; gap: 7px; }

  &__section-title {
    font-size: 10px;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__section-hint {
    font-size: 9px;
    font-weight: 400;
    color: #444;
    text-transform: none;
    letter-spacing: 0;
  }

  // ── spawn row ─────────────────────────────────────
  &__spawn-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  &__model-input {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px;
    color: #e4e4e7;
    font-size: 11px;
    font-family: monospace;
    padding: 5px 8px;
    outline: none;
    min-width: 0;
    transition: border-color 0.15s;
    &:focus { border-color: rgba(56,189,248,0.4); }
    &::placeholder { color: #444; }
  }

  &__spawn-btn {
    flex-shrink: 0;
    background: rgba(56,189,248,0.08);
    border: 1px solid rgba(56,189,248,0.2);
    border-radius: 5px;
    color: #38bdf8;
    font-size: 11px;
    font-weight: 500;
    padding: 5px 12px;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { background: rgba(56,189,248,0.15); }
    &:disabled { opacity: 0.5; cursor: default; }
    &--spawned {
      color: #fbbf24;
      background: rgba(251,191,36,0.08);
      border-color: rgba(251,191,36,0.2);
      &:hover { background: rgba(251,191,36,0.15); }
    }
  }

  &__despawn-btn {
    flex-shrink: 0;
    background: rgba(248,113,113,0.07);
    border: 1px solid rgba(248,113,113,0.18);
    border-radius: 5px;
    color: #f87171;
    font-size: 11px;
    font-weight: 500;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { background: rgba(248,113,113,0.14); }
  }

  &__spawn-err {
    font-size: 10px;
    color: #f87171;
  }

  // ── duration ─────────────────────────────────────
  &__duration-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  &__duration-input {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px;
    color: #e4e4e7;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    padding: 5px 8px;
    outline: none;
    transition: border-color 0.15s;
    &:focus { border-color: rgba(56,189,248,0.4); }
    &::-webkit-inner-spin-button { opacity: 0.4; }
  }

  &__inf-btn {
    flex-shrink: 0;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px;
    color: #666;
    font-size: 14px;
    width: 30px; height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { color: #38bdf8; border-color: rgba(56,189,248,0.3); }
    &--active { color: #38bdf8 !important; background: rgba(56,189,248,0.08) !important; border-color: rgba(56,189,248,0.3) !important; }
  }

  // (flag chip styles live in :deep block below)

  // ── victim play row ───────────────────────────────
  &__victim-play {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }

  &__vplay-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 500;
    padding: 5px 14px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    &:disabled { opacity: 0.35; cursor: default; }

    &--play {
      color: #4ade80;
      background: rgba(74,222,128,0.08);
      border-color: rgba(74,222,128,0.2);
      &:hover:not(:disabled) { background: rgba(74,222,128,0.15); }
    }

    &--stop {
      color: #f87171;
      background: rgba(248,113,113,0.08);
      border-color: rgba(248,113,113,0.2);
      &:hover:not(:disabled) { background: rgba(248,113,113,0.15); }
      .acfg__vplay-dot { animation: pulse 1s ease-in-out infinite; }
    }
  }

  &__vplay-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }

  &__vplay-hint {
    font-size: 10px;
    color: #3a3a3a;
  }
}

// ── shared section styles (used by render-fn sub-components) ──
:deep(.acfg__section-title) {
  font-size: 10px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
}

:deep(.acfg__section-hint) {
  font-size: 9px;
  font-weight: 400;
  color: #444;
  text-transform: none;
  letter-spacing: 0;
}

:deep(.acfg__section) {
  display: flex;
  flex-direction: column;
}

:deep(.apb), :deep(.afb) {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

:deep(.afb__grid) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.afb__chip) {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 5px;
  padding: 5px 8px;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s, border-color 0.1s;
}
:deep(.afb__chip:hover) {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.1);
}
:deep(.afb__chip--on) {
  background: rgba(56,189,248,0.08);
  border-color: rgba(56,189,248,0.25);
}
:deep(.afb__chip--on .afb__chip-dot) {
  background: #38bdf8;
  box-shadow: 0 0 5px rgba(56,189,248,0.6);
}
:deep(.afb__chip--on .afb__chip-label) {
  color: #e4e4e7;
}

:deep(.afb__chip-dot) {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #333;
  flex-shrink: 0;
  transition: background 0.1s, box-shadow 0.1s;
}

:deep(.afb__chip-label) {
  flex: 1;
  font-size: 11px;
  color: #666;
  transition: color 0.1s;
}

:deep(.afb__chip-bit) {
  font-size: 9px;
  color: #333;
  font-family: monospace;
  font-variant-numeric: tabular-nums;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
</style>
