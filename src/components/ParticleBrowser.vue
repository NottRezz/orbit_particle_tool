<template>
  <aside class="browser">
    <!-- search -->
    <div class="browser__search-wrap">
      <svg class="browser__search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
      </svg>
      <input
        v-model="q"
        class="browser__search"
        placeholder="Search particles…"
        @keydown.escape="q = ''"
      />
      <button v-if="q" class="browser__clear" @click="q = ''">✕</button>
    </div>

    <!-- particle tree -->
    <div class="browser__list" ref="listRef">
      <template v-if="q">
        <!-- flat search results -->
        <template v-if="searchResults.length">
          <div v-for="entry in searchResults" :key="entry.dict + entry.fx" class="browser__fx"
            :class="{ 'browser__fx--selected': isSelected(entry) }"
            @dblclick="add(entry.dict, entry.fx)"
            @click="preview(entry)"
            :title="`${entry.dict} / ${entry.fx} — double-click to add`"
          >
            <div class="browser__fx-info">
              <span class="browser__fx-dict">{{ entry.dict }}</span>
              <span class="browser__fx-name" v-html="highlight(entry.fx, q)" />
            </div>
            <button class="browser__eye" :class="{ 'browser__eye--active': isPreviewActive(entry) }"
              @click.stop="togglePreview(entry)" title="Preview particle">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>
        </template>
        <div v-else class="browser__empty">No results for "{{ q }}"</div>
      </template>

      <template v-else>
        <!-- grouped tree -->
        <div v-for="group in groups" :key="group.dict" class="browser__group">
          <button class="browser__dict" @click="toggleGroup(group.dict)">
            <svg class="browser__arrow" :class="{ 'browser__arrow--open': isOpen(group.dict) }"
              width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 3l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ group.dict }}</span>
            <span class="browser__count">{{ group.fxList.length }}</span>
            <span v-if="group.custom" class="browser__badge">CUSTOM</span>
          </button>

          <div v-if="isOpen(group.dict)" class="browser__fxlist">
            <div
              v-for="fx in group.fxList"
              :key="fx"
              class="browser__fx"
              :class="{ 'browser__fx--selected': isSelected({ dict: group.dict, fx }) }"
              @dblclick="add(group.dict, fx)"
              @click="preview({ dict: group.dict, fx })"
              :title="`${group.dict} / ${fx} — double-click to add`"
            >
              <span class="browser__fx-text">{{ fx }}</span>
              <button class="browser__eye" :class="{ 'browser__eye--active': isPreviewActive({ dict: group.dict, fx }) }"
                @click.stop="togglePreview({ dict: group.dict, fx })" title="Preview particle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- footer -->
    <div class="browser__footer">
      <button class="browser__add-custom" @click="$emit('openCustomDict')">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add Custom Dictionary
      </button>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { ref, computed, onUnmounted } from 'vue'
import DefaultParticles from '../particles.json'
import { useParticleStore } from '../store/useParticleStore'
import { api } from '../plugins/axios.plugin'

const props = defineProps<{
  customDicts: Record<string, string[]>
}>()

const emit = defineEmits<{
  (e: 'openCustomDict'): void
}>()

const store = useParticleStore()
const q = ref('')
const openGroups = ref<Set<string>>(new Set())
const lastPreview = ref<{ dict: string; fx: string } | null>(null)

// ── data ──────────────────────────────────────────────────────

interface Group { dict: string; fxList: string[]; custom: boolean }

const groups = computed<Group[]>(() => {
  const defaults: Group[] = Object.entries(DefaultParticles as Record<string, string[]>)
    .map(([dict, fxList]) => ({ dict, fxList, custom: false }))
  const customs: Group[] = Object.entries(props.customDicts)
    .map(([dict, fxList]) => ({ dict, fxList, custom: true }))
  return [...customs, ...defaults]
})

interface FlatEntry { dict: string; fx: string }

const searchResults = computed<FlatEntry[]>(() => {
  const lower = q.value.toLowerCase()
  const results: FlatEntry[] = []
  for (const g of groups.value) {
    for (const fx of g.fxList) {
      if (fx.toLowerCase().includes(lower) || g.dict.toLowerCase().includes(lower)) {
        results.push({ dict: g.dict, fx })
      }
    }
  }
  return results.slice(0, 120)
})

// ── interactions ──────────────────────────────────────────────

function toggleGroup(dict: string) {
  if (openGroups.value.has(dict)) openGroups.value.delete(dict)
  else openGroups.value.add(dict)
}

function isOpen(dict: string) { return openGroups.value.has(dict) }

function preview(entry: { dict: string; fx: string }) {
  lastPreview.value = entry
}

function add(dict: string, fx: string) {
  store.addSlot(dict, fx)
}

function isSelected(entry: { dict: string; fx: string }) {
  return lastPreview.value?.dict === entry.dict && lastPreview.value?.fx === entry.fx
}

function highlight(text: string, query: string): string {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

// ── preview ───────────────────────────────────────────────────

const previewingKey = ref<string | null>(null)
let previewTimer = 0

function previewKey(entry: { dict: string; fx: string }) {
  return `${entry.dict}:${entry.fx}`
}

function isPreviewActive(entry: { dict: string; fx: string }) {
  return previewingKey.value === previewKey(entry)
}

function togglePreview(entry: { dict: string; fx: string }) {
  const key = previewKey(entry)
  clearTimeout(previewTimer)

  if (previewingKey.value === key) {
    previewingKey.value = null
    api.post('STOP_PREVIEW', {})
    return
  }

  previewingKey.value = key
  api.post('PREVIEW_PARTICLE', { dict: entry.dict, fx: entry.fx })
  previewTimer = window.setTimeout(() => {
    if (previewingKey.value === key) previewingKey.value = null
  }, 3200)
}

function onMessage(e: MessageEvent) {
  if (e.data?.event === 'PREVIEW_STOPPED') previewingKey.value = null
}
window.addEventListener('message', onMessage)
onUnmounted(() => window.removeEventListener('message', onMessage))
</script>

<style lang="scss" scoped>
.browser {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  border-right: 1px solid rgba(255,255,255,0.06);
  background: #0d0d0d;
  overflow: hidden;

  &__search-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: #0d0d0d;
    flex-shrink: 0;
  }

  &__search-icon { color: #444; flex-shrink: 0; }

  &__search {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: #e4e4e7;
    font-size: 12px;
    &::placeholder { color: #444; }
  }

  &__clear {
    background: none;
    border: none;
    color: #555;
    font-size: 11px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    &:hover { color: #aaa; }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 6px 0;
  }

  &__empty {
    padding: 20px 14px;
    font-size: 12px;
    color: #555;
    text-align: center;
  }

  // dict group header
  &__group { }

  &__dict {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: #999;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 6px 12px;
    cursor: pointer;
    text-align: left;
    transition: color 0.1s;
    &:hover { color: #ccc; }

    span:nth-child(2) { flex: 1; }
  }

  &__arrow {
    color: #555;
    flex-shrink: 0;
    transition: transform 0.15s;
    &--open { transform: rotate(0deg); }
    transform: rotate(-90deg);
  }

  &__count {
    font-size: 10px;
    color: #444;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }

  &__badge {
    font-size: 9px;
    background: rgba(124,93,249,0.2);
    color: #a78bfa;
    border-radius: 3px;
    padding: 1px 4px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  &__fxlist {
    padding-left: 22px;
  }

  &__fx {
    font-size: 11px;
    color: #777;
    padding: 3px 6px 3px 6px;
    cursor: pointer;
    border-radius: 4px;
    margin: 1px 6px;
    transition: background 0.1s, color 0.1s;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    overflow: hidden;

    &:hover {
      background: rgba(255,255,255,0.05);
      color: #ccc;
      .browser__eye { opacity: 1; }
    }

    &--selected {
      background: rgba(124,93,249,0.12);
      color: #a78bfa;
    }
  }

  &__fx-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // search result two-line layout
  &__fx-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1px;
    overflow: hidden;
  }

  &__fx-dict {
    font-size: 9px;
    color: #444;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__fx-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    :deep(mark) {
      background: rgba(124,93,249,0.35);
      color: #c4b5fd;
      border-radius: 2px;
      padding: 0 1px;
    }
  }

  // eye / preview button
  &__eye {
    background: none;
    border: none;
    color: #444;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    opacity: 0;
    transition: color 0.1s, opacity 0.1s;

    &:hover { color: #a78bfa; }

    &--active {
      opacity: 1 !important;
      color: #7c5df9;
    }
  }

  &__footer {
    flex-shrink: 0;
    padding: 10px 12px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  &__add-custom {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: rgba(124,93,249,0.08);
    border: 1px dashed rgba(124,93,249,0.25);
    border-radius: 6px;
    color: #7c5df9;
    font-size: 11px;
    font-weight: 500;
    padding: 7px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: rgba(124,93,249,0.15);
      border-color: rgba(124,93,249,0.5);
      color: #a78bfa;
    }
  }
}
</style>
