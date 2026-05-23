<template>
  <div class="cfg">

    <!-- ── Slot sidebar ── -->
    <div class="cfg__sidebar">
      <div v-if="!store.slots.length" class="cfg__sidebar-hint">
        Double-click a particle<br>in the browser to add it
      </div>

      <template v-else>
        <!-- flat list (no groups) -->
        <template v-if="!store.groups.length">
          <div
            v-for="slot in store.slots" :key="slot.id"
            class="cfg__slot" :class="{ 'cfg__slot--active': slot.id === store.selectedId }"
            @click="store.selectSlot(slot.id)"
          >
            <span class="cfg__slot-dot" :style="{ background: rgbaStr(slot.color) }" />
            <span class="cfg__slot-name">{{ slot.fx }}</span>
            <div class="cfg__slot-btns">
              <button class="cfg__slot-btn" @click.stop="store.duplicateSlot(slot.id)" title="Duplicate">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>
              <button class="cfg__slot-btn cfg__slot-btn--rm" @click.stop="store.removeSlot(slot.id)">✕</button>
            </div>
          </div>
        </template>

        <!-- grouped view -->
        <template v-else>
          <!-- named groups -->
          <div v-for="group in store.groups" :key="group.id" class="cfg__group">
            <div class="cfg__group-hdr" @click="toggleCollapse(group.id)">
              <svg class="cfg__chevron" :class="{ 'cfg__chevron--open': !collapsed.has(group.id) }"
                width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input
                v-if="editingId === group.id"
                ref="renameInputs"
                v-model="editingName"
                class="cfg__group-input"
                @blur="finishRename"
                @keydown.enter.prevent="finishRename"
                @keydown.escape="editingId = null"
                @click.stop
              />
              <span v-else class="cfg__group-label" @dblclick.stop="startRename(group)">{{ group.name }}</span>
              <span class="cfg__group-count">{{ slotsFor(group.id).length }}</span>
              <button class="cfg__group-rm" @click.stop="store.removeGroup(group.id)" title="Remove group">✕</button>
            </div>
            <div v-if="!collapsed.has(group.id)" class="cfg__group-slots">
              <div
                v-for="slot in slotsFor(group.id)" :key="slot.id"
                class="cfg__slot cfg__slot--indented"
                :class="{ 'cfg__slot--active': slot.id === store.selectedId }"
                @click="store.selectSlot(slot.id)"
              >
                <span class="cfg__slot-dot" :style="{ background: rgbaStr(slot.color) }" />
                <span class="cfg__slot-name">{{ slot.fx }}</span>
                <div class="cfg__slot-btns">
                  <button class="cfg__slot-btn" @click.stop="store.duplicateSlot(slot.id)" title="Duplicate">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                  <button class="cfg__slot-btn cfg__slot-btn--rm" @click.stop="store.removeSlot(slot.id)">✕</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ungrouped -->
          <div v-if="ungrouped.length" class="cfg__group">
            <div class="cfg__group-hdr" @click="toggleCollapse('__ug')">
              <svg class="cfg__chevron" :class="{ 'cfg__chevron--open': !collapsed.has('__ug') }"
                width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span class="cfg__group-label cfg__group-label--muted">Ungrouped</span>
              <span class="cfg__group-count">{{ ungrouped.length }}</span>
            </div>
            <div v-if="!collapsed.has('__ug')" class="cfg__group-slots">
              <div
                v-for="slot in ungrouped" :key="slot.id"
                class="cfg__slot cfg__slot--indented"
                :class="{ 'cfg__slot--active': slot.id === store.selectedId }"
                @click="store.selectSlot(slot.id)"
              >
                <span class="cfg__slot-dot" :style="{ background: rgbaStr(slot.color) }" />
                <span class="cfg__slot-name">{{ slot.fx }}</span>
                <div class="cfg__slot-btns">
                  <button class="cfg__slot-btn" @click.stop="store.duplicateSlot(slot.id)" title="Duplicate">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                  <button class="cfg__slot-btn cfg__slot-btn--rm" @click.stop="store.removeSlot(slot.id)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <button class="cfg__add-group" @click="createGroup">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add Group
      </button>
    </div>

    <!-- ── Config editor ── -->
    <div class="cfg__editor">
      <div v-if="!slot" class="cfg__empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <p>Select a particle slot to configure it.</p>
      </div>

      <template v-else>
        <div class="cfg__particle-row">
          <div class="cfg__particle-label">
            <span class="cfg__particle-dict">{{ ns.dict }}</span>
            <span class="cfg__particle-fx">{{ ns.fx }}</span>
          </div>
          <div class="cfg__particle-actions">
            <button class="cfg__action-btn" @click="store.duplicateSlot(ns.id)" title="Duplicate slot">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Duplicate
            </button>
            <span class="cfg__hint">Double-click browser to replace</span>
          </div>
        </div>

        <div class="cfg__body">
          <div class="cfg__grid">
            <!-- left column -->
            <div class="cfg__col">
              <div class="cfg__section">
                <div class="cfg__section-title">Bone Attachment</div>
                <BoneSelect
                  :model-value="ns.bone"
                  @update:model-value="v => store.setBone(ns.id, v)"
                />
              </div>

              <div v-if="store.groups.length" class="cfg__section">
                <div class="cfg__section-title">Group</div>
                <select
                  class="cfg__group-sel"
                  :value="ns.groupId ?? ''"
                  @change="e => store.setSlotGroup(ns.id, (e.target as HTMLSelectElement).value || null)"
                >
                  <option value="">— None —</option>
                  <option v-for="g in store.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
              </div>

              <div class="cfg__section">
                <div class="cfg__section-title">Offset</div>
                <RangeSlider label="X" :model-value="ns.offset.x" :min="-3" :max="3" :step="0.001"
                  @update:model-value="v => store.setOffset(ns.id, 'x', v)" />
                <RangeSlider label="Y" :model-value="ns.offset.y" :min="-3" :max="3" :step="0.001"
                  @update:model-value="v => store.setOffset(ns.id, 'y', v)" />
                <RangeSlider label="Z" :model-value="ns.offset.z" :min="-3" :max="3" :step="0.001"
                  @update:model-value="v => store.setOffset(ns.id, 'z', v)" />
              </div>

              <div class="cfg__section">
                <div class="cfg__section-title">Rotation</div>
                <RangeSlider label="X" :model-value="ns.rotation.x" :min="-180" :max="180" :step="0.5"
                  @update:model-value="v => store.setRotation(ns.id, 'x', v)" />
                <RangeSlider label="Y" :model-value="ns.rotation.y" :min="-180" :max="180" :step="0.5"
                  @update:model-value="v => store.setRotation(ns.id, 'y', v)" />
                <RangeSlider label="Z" :model-value="ns.rotation.z" :min="-180" :max="180" :step="0.5"
                  @update:model-value="v => store.setRotation(ns.id, 'z', v)" />
              </div>
            </div>

            <!-- right column -->
            <div class="cfg__col">
              <div class="cfg__section">
                <div class="cfg__section-title">Scale</div>
                <RangeSlider label="Scale" :model-value="ns.scale" :min="0.01" :max="15" :step="0.01"
                  @update:model-value="v => store.setScale(ns.id, v)" />
              </div>

              <div class="cfg__section">
                <div class="cfg__section-title">Color</div>
                <div class="cfg__color-preview" :style="{ background: rgbaStr(ns.color) }" />
                <RangeSlider label="R" :model-value="ns.color.r" :min="0" :max="1" :step="0.001"
                  @update:model-value="v => setChannel('r', v)" />
                <RangeSlider label="G" :model-value="ns.color.g" :min="0" :max="1" :step="0.001"
                  @update:model-value="v => setChannel('g', v)" />
                <RangeSlider label="B" :model-value="ns.color.b" :min="0" :max="1" :step="0.001"
                  @update:model-value="v => setChannel('b', v)" />
                <RangeSlider label="Alpha" :model-value="ns.color.a" :min="0" :max="1" :step="0.001"
                  @update:model-value="v => setChannel('a', v)" />
              </div>

              <div class="cfg__section">
                <div class="cfg__section-title">
                  Evolution Variables
                  <span class="cfg__section-hint">name + 0–1 value</span>
                </div>
                <div v-for="(val, key) in ns.evolution" :key="key" class="cfg__evo-row">
                  <span class="cfg__evo-key">{{ key }}</span>
                  <RangeSlider
                    label="" :model-value="val" :min="0" :max="1" :step="0.001"
                    class="cfg__evo-slider"
                    @update:model-value="v => store.setEvolution(ns.id, key, v)"
                  />
                  <button class="cfg__evo-remove" @click="store.removeEvolution(ns.id, key)">✕</button>
                </div>
                <div class="cfg__evo-add">
                  <input v-model="newEvoName" class="cfg__evo-input" placeholder="variable name"
                    @keydown.enter="addEvolution" />
                  <button class="cfg__evo-btn" @click="addEvolution">Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue'
import { useParticleStore } from '../store/useParticleStore'
import RangeSlider from './RangeSlider.vue'
import BoneSelect from './BoneSelect.vue'
import type { RGBA, ParticleGroup } from '../types'

const store = useParticleStore()
const slot = computed(() => store.selected)
const ns = computed(() => store.selected!)
const newEvoName = ref('')

// ── sidebar collapse ───────────────────────────────────────

const collapsed = ref(new Set<string>())

function toggleCollapse(id: string) {
  const next = new Set(collapsed.value)
  next.has(id) ? next.delete(id) : next.add(id)
  collapsed.value = next
}

// ── group data helpers ─────────────────────────────────────

function slotsFor(groupId: string) {
  return store.slots.filter(s => s.groupId === groupId)
}

const ungrouped = computed(() => store.slots.filter(s => s.groupId === null))

// ── group rename ───────────────────────────────────────────

const editingId = ref<string | null>(null)
const editingName = ref('')
const renameInputs = ref<HTMLInputElement | HTMLInputElement[] | null>(null)

async function startRename(group: ParticleGroup) {
  editingId.value = group.id
  editingName.value = group.name
  await nextTick()
  const el = Array.isArray(renameInputs.value) ? renameInputs.value[0] : renameInputs.value
  el?.focus()
  el?.select()
}

function finishRename() {
  if (editingId.value) store.renameGroup(editingId.value, editingName.value)
  editingId.value = null
}

// ── create group ───────────────────────────────────────────

async function createGroup() {
  const id = store.addGroup('New Group')
  const group = store.groups.find(g => g.id === id)
  if (group) startRename(group)
}

// ── color / evolution helpers ──────────────────────────────

function rgbaStr(c: RGBA): string {
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${c.a})`
}

function setChannel(ch: keyof RGBA, v: number) {
  if (!ns.value) return
  store.setColor(ns.value.id, { ...ns.value.color, [ch]: v })
}

function addEvolution() {
  if (!ns.value) return
  const name = newEvoName.value.trim()
  if (!name) return
  store.setEvolution(ns.value.id, name, 0)
  newEvoName.value = ''
}
</script>

<style lang="scss" scoped>
.cfg {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-width: 0;

  // ── sidebar ───────────────────────────────────────
  &__sidebar {
    width: 162px;
    min-width: 162px;
    flex-shrink: 0;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 6px 0 8px;
    gap: 1px;
    background: #0d0d0d;
  }

  &__sidebar-hint {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 11px;
    color: #3a3a3a;
    line-height: 1.5;
    padding: 16px 12px;
  }

  // ── group ─────────────────────────────────────────
  &__group {
    display: flex;
    flex-direction: column;
  }

  &__group-hdr {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px 4px 6px;
    cursor: pointer;
    border-radius: 4px;
    margin: 0 4px;
    transition: background 0.1s;
    min-height: 26px;

    &:hover { background: rgba(255,255,255,0.04); }
    &:hover .cfg__group-rm { opacity: 1; }
  }

  &__chevron {
    color: #444;
    flex-shrink: 0;
    transform: rotate(-90deg);
    transition: transform 0.15s;
    &--open { transform: rotate(0deg); }
  }

  &__group-label {
    flex: 1;
    font-size: 11px;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    &--muted { color: #555; }
  }

  &__group-input {
    flex: 1;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(124,93,249,0.4);
    border-radius: 3px;
    color: #e4e4e7;
    font-size: 11px;
    font-weight: 600;
    padding: 1px 4px;
    outline: none;
    min-width: 0;
  }

  &__group-count {
    font-size: 10px;
    color: #3a3a3a;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  &__group-rm {
    background: none;
    border: none;
    color: #444;
    font-size: 9px;
    cursor: pointer;
    padding: 1px 3px;
    border-radius: 2px;
    flex-shrink: 0;
    opacity: 0;
    transition: color 0.1s;
    &:hover { color: #f87171; }
  }

  &__group-slots {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  // ── slot row ──────────────────────────────────────
  &__slot {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    margin: 0 4px;
    transition: background 0.1s;

    &--indented { padding-left: 20px; }

    &--active {
      background: rgba(124,93,249,0.12);
      .cfg__slot-name { color: #c4b5fd; }
    }

    &:not(&--active):hover { background: rgba(255,255,255,0.05); }
    &:hover .cfg__slot-btns { opacity: 1; }
  }

  &__slot-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 4px currentColor;
  }

  &__slot-name {
    flex: 1;
    font-size: 11px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__slot-btns {
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.1s;
    flex-shrink: 0;
  }

  &__slot-btn {
    background: none;
    border: none;
    color: #555;
    cursor: pointer;
    padding: 1px 3px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    transition: color 0.1s;
    &:hover { color: #a78bfa; }

    &--rm:hover { color: #f87171; }
  }

  // ── add group ─────────────────────────────────────
  &__add-group {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    color: #3a3a3a;
    font-size: 10px;
    cursor: pointer;
    padding: 6px 10px;
    margin-top: 4px;
    border-radius: 4px;
    transition: color 0.1s;
    width: calc(100% - 8px);
    margin-left: 4px;

    &:hover { color: #7c5df9; }
  }

  // ── editor ────────────────────────────────────────
  &__editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  // ── empty state ───────────────────────────────────
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

  // ── particle header row ───────────────────────────
  &__particle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    gap: 8px;
  }

  &__particle-label {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    overflow: hidden;
  }

  &__particle-dict {
    font-size: 10px;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  &__particle-fx {
    font-size: 13px;
    font-weight: 600;
    color: #e4e4e7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__particle-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 5px;
    color: #666;
    font-size: 10px;
    padding: 3px 8px;
    cursor: pointer;
    transition: all 0.1s;
    &:hover { color: #a78bfa; border-color: rgba(124,93,249,0.3); background: rgba(124,93,249,0.08); }
  }

  &__hint {
    font-size: 10px;
    color: #3a3a3a;
  }

  // ── body / grid ───────────────────────────────────
  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 18px;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  // ── section ───────────────────────────────────────
  &__section {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

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

  // ── group select ──────────────────────────────────
  &__group-sel {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    color: #e4e4e7;
    font-size: 12px;
    padding: 6px 10px;
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    padding-right: 28px;
    transition: border-color 0.15s;
    &:hover { border-color: rgba(124,93,249,0.4); }
    option { background: #1a1a1a; }
  }

  // ── color preview ─────────────────────────────────
  &__color-preview {
    height: 22px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.08);
    transition: background 0.1s;
  }

  // ── evolution ─────────────────────────────────────
  &__evo-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__evo-key {
    font-size: 10px;
    color: #888;
    font-family: monospace;
    min-width: 70px;
    flex-shrink: 0;
  }

  &__evo-slider { flex: 1; }

  &__evo-remove {
    background: none;
    border: none;
    color: #444;
    font-size: 9px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    flex-shrink: 0;
    &:hover { color: #f87171; }
  }

  &__evo-add {
    display: flex;
    gap: 6px;
    margin-top: 2px;
  }

  &__evo-input {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px;
    color: #e4e4e7;
    font-size: 11px;
    font-family: monospace;
    padding: 5px 8px;
    outline: none;
    &:focus { border-color: rgba(124,93,249,0.4); }
    &::placeholder { color: #444; }
  }

  &__evo-btn {
    background: rgba(124,93,249,0.12);
    border: 1px solid rgba(124,93,249,0.25);
    border-radius: 5px;
    color: #a78bfa;
    font-size: 11px;
    padding: 5px 12px;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { background: rgba(124,93,249,0.2); }
  }
}
</style>
