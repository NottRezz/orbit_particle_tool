<template>
  <div class="ocfg">

    <!-- ── Slot sidebar ── -->
    <div class="ocfg__sidebar">
      <div class="ocfg__slot-list">
      <div v-if="!store.slots.length" class="ocfg__sidebar-hint">
        Type a model name below<br>and press Add
      </div>

      <template v-else>
        <!-- flat list (no groups) -->
        <template v-if="!store.groups.length">
          <div
            v-for="slot in store.slots" :key="slot.id"
            class="ocfg__slot" :class="{ 'ocfg__slot--active': slot.id === store.selectedId }"
            @click="store.selectSlot(slot.id)"
          >
            <span class="ocfg__slot-eye" :class="{ 'ocfg__slot-eye--hidden': !slot.visible }" />
            <span class="ocfg__slot-name">{{ slot.model }}</span>
            <div class="ocfg__slot-btns">
              <button class="ocfg__slot-btn" @click.stop="store.duplicateSlot(slot.id)" title="Duplicate">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>
              <button class="ocfg__slot-btn ocfg__slot-btn--rm" @click.stop="store.removeSlot(slot.id)">✕</button>
            </div>
          </div>
        </template>

        <!-- grouped view -->
        <template v-else>
          <div v-for="group in store.groups" :key="group.id" class="ocfg__group">
            <div class="ocfg__group-hdr" @click="toggleCollapse(group.id)">
              <svg class="ocfg__chevron" :class="{ 'ocfg__chevron--open': !collapsed.has(group.id) }"
                width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input
                v-if="editingId === group.id"
                ref="renameInputs"
                v-model="editingName"
                class="ocfg__group-input"
                @blur="finishRename"
                @keydown.enter.prevent="finishRename"
                @keydown.escape="editingId = null"
                @click.stop
              />
              <span v-else class="ocfg__group-label" @dblclick.stop="startRename(group)">{{ group.name }}</span>
              <span class="ocfg__group-count">{{ slotsFor(group.id).length }}</span>
              <button class="ocfg__group-rm" @click.stop="store.removeGroup(group.id)" title="Remove group">✕</button>
            </div>
            <div v-if="!collapsed.has(group.id)" class="ocfg__group-slots">
              <div
                v-for="slot in slotsFor(group.id)" :key="slot.id"
                class="ocfg__slot ocfg__slot--indented"
                :class="{ 'ocfg__slot--active': slot.id === store.selectedId }"
                @click="store.selectSlot(slot.id)"
              >
                <span class="ocfg__slot-eye" :class="{ 'ocfg__slot-eye--hidden': !slot.visible }" />
                <span class="ocfg__slot-name">{{ slot.model }}</span>
                <div class="ocfg__slot-btns">
                  <button class="ocfg__slot-btn" @click.stop="store.duplicateSlot(slot.id)" title="Duplicate">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                  <button class="ocfg__slot-btn ocfg__slot-btn--rm" @click.stop="store.removeSlot(slot.id)">✕</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="ungrouped.length" class="ocfg__group">
            <div class="ocfg__group-hdr" @click="toggleCollapse('__ug')">
              <svg class="ocfg__chevron" :class="{ 'ocfg__chevron--open': !collapsed.has('__ug') }"
                width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <span class="ocfg__group-label ocfg__group-label--muted">Ungrouped</span>
              <span class="ocfg__group-count">{{ ungrouped.length }}</span>
            </div>
            <div v-if="!collapsed.has('__ug')" class="ocfg__group-slots">
              <div
                v-for="slot in ungrouped" :key="slot.id"
                class="ocfg__slot ocfg__slot--indented"
                :class="{ 'ocfg__slot--active': slot.id === store.selectedId }"
                @click="store.selectSlot(slot.id)"
              >
                <span class="ocfg__slot-eye" :class="{ 'ocfg__slot-eye--hidden': !slot.visible }" />
                <span class="ocfg__slot-name">{{ slot.model }}</span>
                <div class="ocfg__slot-btns">
                  <button class="ocfg__slot-btn" @click.stop="store.duplicateSlot(slot.id)" title="Duplicate">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                  </button>
                  <button class="ocfg__slot-btn ocfg__slot-btn--rm" @click.stop="store.removeSlot(slot.id)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
      </div><!-- /ocfg__slot-list -->

      <div class="ocfg__sidebar-footer">
        <button class="ocfg__add-group" @click="createGroup">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Add Group
        </button>
        <div class="ocfg__add-row">
          <input
            v-model="newModel"
            class="ocfg__add-input"
            placeholder="model name…"
            @keydown.enter="addProp"
          />
          <button class="ocfg__add-btn" @click="addProp" :disabled="!newModel.trim()">Add</button>
        </div>
      </div>
    </div>

    <!-- ── Config editor ── -->
    <div class="ocfg__editor">
      <div v-if="!slot" class="ocfg__empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        </svg>
        <p>Add a prop slot to get started.</p>
      </div>

      <template v-else>
        <!-- header row -->
        <div class="ocfg__prop-row">
          <div class="ocfg__prop-label">
            <input
              class="ocfg__model-input"
              :value="ns.model"
              placeholder="model name"
              @change="e => store.setModel(ns.id, (e.target as HTMLInputElement).value)"
            />
          </div>
          <div class="ocfg__prop-actions">
            <button
              class="ocfg__vis-btn"
              :class="ns.visible ? 'ocfg__vis-btn--on' : 'ocfg__vis-btn--off'"
              @click="store.setVisible(ns.id, !ns.visible)"
              :title="ns.visible ? 'Hide prop' : 'Show prop'"
            >
              <svg v-if="ns.visible" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              {{ ns.visible ? 'Visible' : 'Hidden' }}
            </button>
            <button class="ocfg__action-btn" @click="store.duplicateSlot(ns.id)" title="Duplicate slot">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Duplicate
            </button>
          </div>
        </div>

        <div class="ocfg__body">
          <div class="ocfg__grid">
            <!-- left column -->
            <div class="ocfg__col">
              <div class="ocfg__section">
                <div class="ocfg__section-title">Bone Attachment</div>
                <BoneSelect
                  :model-value="ns.bone"
                  @update:model-value="v => store.setBone(ns.id, v)"
                />
              </div>

              <div v-if="store.groups.length" class="ocfg__section">
                <div class="ocfg__section-title">Group</div>
                <select
                  class="ocfg__group-sel"
                  :value="ns.groupId ?? ''"
                  @change="e => store.setSlotGroup(ns.id, (e.target as HTMLSelectElement).value || null)"
                >
                  <option value="">— None —</option>
                  <option v-for="g in store.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
              </div>

              <div class="ocfg__section">
                <div class="ocfg__section-title">Offset</div>
                <RangeSlider label="X" :model-value="ns.offset.x" :min="-3" :max="3" :step="0.001"
                  @update:model-value="v => store.setOffset(ns.id, 'x', v)" />
                <RangeSlider label="Y" :model-value="ns.offset.y" :min="-3" :max="3" :step="0.001"
                  @update:model-value="v => store.setOffset(ns.id, 'y', v)" />
                <RangeSlider label="Z" :model-value="ns.offset.z" :min="-3" :max="3" :step="0.001"
                  @update:model-value="v => store.setOffset(ns.id, 'z', v)" />
              </div>
            </div>

            <!-- right column -->
            <div class="ocfg__col">
              <div class="ocfg__section">
                <div class="ocfg__section-title">Rotation</div>
                <RangeSlider label="X" :model-value="ns.rotation.x" :min="-180" :max="180" :step="0.5"
                  @update:model-value="v => store.setRotation(ns.id, 'x', v)" />
                <RangeSlider label="Y" :model-value="ns.rotation.y" :min="-180" :max="180" :step="0.5"
                  @update:model-value="v => store.setRotation(ns.id, 'y', v)" />
                <RangeSlider label="Z" :model-value="ns.rotation.z" :min="-180" :max="180" :step="0.5"
                  @update:model-value="v => store.setRotation(ns.id, 'z', v)" />
              </div>

              <div class="ocfg__section">
                <div class="ocfg__section-title">Info</div>
                <div class="ocfg__info-chip">
                  <span class="ocfg__info-label">Bone ID</span>
                  <span class="ocfg__info-val">{{ ns.bone }}</span>
                </div>
                <div class="ocfg__info-chip">
                  <span class="ocfg__info-label">Bone Name</span>
                  <span class="ocfg__info-val">{{ ns.boneName }}</span>
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
import { useObjectStore } from '../store/useObjectStore'
import RangeSlider from './RangeSlider.vue'
import BoneSelect from './BoneSelect.vue'
import type { ParticleGroup } from '../types'

const store = useObjectStore()
const slot = computed(() => store.selected)
const ns = computed(() => store.selected!)
const newModel = ref('')

// ── sidebar collapse ───────────────────────────────────────

const collapsed = ref(new Set<string>())

function toggleCollapse(id: string) {
  const next = new Set(collapsed.value)
  next.has(id) ? next.delete(id) : next.add(id)
  collapsed.value = next
}

// ── group helpers ──────────────────────────────────────────

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

async function createGroup() {
  const id = store.addGroup('New Group')
  const group = store.groups.find(g => g.id === id)
  if (group) startRename(group)
}

// ── add prop ───────────────────────────────────────────────

function addProp() {
  if (!newModel.value.trim()) return
  store.addSlot(newModel.value)
  newModel.value = ''
}
</script>

<style lang="scss" scoped>
.ocfg {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  min-width: 0;

  // ── sidebar ───────────────────────────────────────
  &__sidebar {
    width: 172px;
    min-width: 172px;
    flex-shrink: 0;
    border-right: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #0d0d0d;
  }

  &__slot-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 6px 0 4px;
    display: flex;
    flex-direction: column;
    gap: 1px;
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
    &:hover .ocfg__group-rm { opacity: 1; }
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
    border: 1px solid rgba(251,191,36,0.4);
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
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    margin: 0 4px;
    transition: background 0.1s;

    &--indented { padding-left: 20px; }

    &--active {
      background: rgba(251,191,36,0.1);
      .ocfg__slot-name { color: #fde68a; }
    }

    &:not(&--active):hover { background: rgba(255,255,255,0.05); }
    &:hover .ocfg__slot-btns { opacity: 1; }
  }

  &__slot-eye {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background: #fbbf24;
    box-shadow: 0 0 4px #fbbf24;
    transition: background 0.15s, box-shadow 0.15s;

    &--hidden {
      background: #3a3a3a;
      box-shadow: none;
    }
  }

  &__slot-name {
    flex: 1;
    font-size: 11px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: monospace;
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
    &:hover { color: #fbbf24; }
    &--rm:hover { color: #f87171; }
  }

  // ── sidebar footer ────────────────────────────────
  &__sidebar-footer {
    flex-shrink: 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 8px 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__add-group {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    color: #3a3a3a;
    font-size: 10px;
    cursor: pointer;
    padding: 4px 6px;
    border-radius: 4px;
    transition: color 0.1s;
    width: 100%;

    &:hover { color: #fbbf24; }
  }

  &__add-row {
    display: flex;
    gap: 5px;
  }

  &__add-input {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 5px;
    color: #e4e4e7;
    font-size: 11px;
    font-family: monospace;
    padding: 5px 7px;
    outline: none;
    min-width: 0;
    transition: border-color 0.15s;
    &:focus { border-color: rgba(251,191,36,0.4); }
    &::placeholder { color: #3a3a3a; }
  }

  &__add-btn {
    flex-shrink: 0;
    background: rgba(251,191,36,0.1);
    border: 1px solid rgba(251,191,36,0.22);
    border-radius: 5px;
    color: #fbbf24;
    font-size: 11px;
    font-weight: 500;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.15s;
    &:hover { background: rgba(251,191,36,0.18); }
    &:disabled { opacity: 0.35; cursor: default; }
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

  // ── prop header row ───────────────────────────────
  &__prop-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
    gap: 8px;
  }

  &__prop-label {
    flex: 1;
    min-width: 0;
  }

  &__model-input {
    width: 100%;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    color: #e4e4e7;
    font-size: 12px;
    font-family: monospace;
    font-weight: 600;
    padding: 5px 9px;
    outline: none;
    transition: border-color 0.15s;
    &:focus { border-color: rgba(251,191,36,0.4); }
    &::placeholder { color: #444; }
  }

  &__prop-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__vis-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 5px;
    color: #555;
    font-size: 10px;
    padding: 4px 9px;
    cursor: pointer;
    transition: all 0.15s;

    &--on {
      color: #4ade80;
      background: rgba(74,222,128,0.07);
      border-color: rgba(74,222,128,0.18);
      &:hover { background: rgba(74,222,128,0.13); }
    }

    &--off {
      color: #555;
      &:hover { color: #888; background: rgba(255,255,255,0.07); }
    }
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
    &:hover { color: #fbbf24; border-color: rgba(251,191,36,0.3); background: rgba(251,191,36,0.08); }
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
    &:hover { border-color: rgba(251,191,36,0.4); }
    option { background: #1a1a1a; }
  }

  // ── info chips ────────────────────────────────────
  &__info-chip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 5px;
    padding: 5px 9px;
  }

  &__info-label {
    font-size: 10px;
    color: #444;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__info-val {
    font-size: 11px;
    color: #888;
    font-family: monospace;
  }
}

</style>
