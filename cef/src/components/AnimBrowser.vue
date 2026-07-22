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
        placeholder="Search animations…"
        @keydown.escape="q = ''"
      />
      <button v-if="q" class="browser__clear" @click="q = ''">✕</button>
      <span class="browser__target" :class="{ 'browser__target--victim': store.activeTarget === 'victim' }">
        → {{ store.activeTarget === 'victim' ? 'Victim' : 'Player' }}
      </span>
    </div>

    <!-- animation tree -->
    <div class="browser__list">
      <template v-if="q">
        <template v-if="searchResults.length">
          <div
            v-for="entry in searchResults" :key="entry.dict + entry.anim"
            class="browser__fx"
            :class="{ 'browser__fx--selected': isActive(entry) }"
            @click="select(entry.dict, entry.anim)"
            :title="`${entry.dict} / ${entry.anim}`"
          >
            <div class="browser__fx-info">
              <span class="browser__fx-dict">{{ entry.dict }}</span>
              <span class="browser__fx-name" v-html="highlight(entry.anim, q)" />
            </div>
          </div>
        </template>
        <div v-else class="browser__empty">No results for "{{ q }}"</div>
      </template>

      <template v-else>
        <div v-for="group in groups" :key="group.dict" class="browser__group">
          <button class="browser__dict" @click="toggleGroup(group.dict)">
            <svg class="browser__arrow" :class="{ 'browser__arrow--open': isOpen(group.dict) }"
              width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 3l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>{{ group.dict }}</span>
            <span class="browser__count">{{ group.animList.length }}</span>
            <span v-if="group.custom" class="browser__badge">CUSTOM</span>
            <button
              v-if="group.custom"
              class="browser__dict-rm"
              @click.stop="$emit('removeCustomDict', group.dict)"
              title="Remove custom dictionary"
            >✕</button>
          </button>

          <div v-if="isOpen(group.dict)" class="browser__fxlist">
            <div
              v-for="anim in group.animList"
              :key="anim"
              class="browser__fx"
              :class="{ 'browser__fx--selected': isActive({ dict: group.dict, anim }) }"
              @click="select(group.dict, anim)"
              :title="`${group.dict} / ${anim}`"
            >
              <span class="browser__fx-text">{{ anim }}</span>
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
import { ref, computed } from 'vue'
import DefaultAnims from '../anims.json'
import { useAnimStore } from '../store/useAnimStore'

const props = defineProps<{
  customDicts: Record<string, string[]>
}>()

defineEmits<{
  (e: 'openCustomDict'): void
  (e: 'removeCustomDict', dict: string): void
}>()

const store = useAnimStore()
const q = ref('')
const openGroups = ref<Set<string>>(new Set())

interface Group { dict: string; animList: string[]; custom: boolean }

const groups = computed<Group[]>(() => {
  const defaults: Group[] = Object.entries(DefaultAnims as Record<string, string[]>)
    .map(([dict, animList]) => ({ dict, animList, custom: false }))
  const customs: Group[] = Object.entries(props.customDicts)
    .map(([dict, animList]) => ({ dict, animList, custom: true }))
  return [...customs, ...defaults]
})

interface FlatEntry { dict: string; anim: string }

const searchResults = computed<FlatEntry[]>(() => {
  const lower = q.value.toLowerCase()
  const results: FlatEntry[] = []
  for (const g of groups.value) {
    for (const anim of g.animList) {
      if (anim.toLowerCase().includes(lower) || g.dict.toLowerCase().includes(lower)) {
        results.push({ dict: g.dict, anim })
      }
    }
  }
  return results.slice(0, 120)
})

function toggleGroup(dict: string) {
  if (openGroups.value.has(dict)) openGroups.value.delete(dict)
  else openGroups.value.add(dict)
}

function isOpen(dict: string) { return openGroups.value.has(dict) }

function isActive(entry: { dict: string; anim: string }) {
  return store.state?.dict === entry.dict && store.state?.anim === entry.anim
}

function select(dict: string, anim: string) {
  store.setAnim(dict, anim)
}

function highlight(text: string, query: string): string {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}
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

  &__target {
    flex-shrink: 0;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 6px;
    border-radius: 3px;
    color: #a78bfa;
    background: rgba(124,93,249,0.12);
    border: 1px solid rgba(124,93,249,0.2);
    white-space: nowrap;
    transition: all 0.15s;

    &--victim {
      color: #7dd3fc;
      background: rgba(56,189,248,0.12);
      border-color: rgba(56,189,248,0.2);
    }
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
    transform: rotate(-90deg);
    &--open { transform: rotate(0deg); }
  }

  &__count {
    font-size: 10px;
    color: #444;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }

  &__dict-rm {
    background: none;
    border: none;
    color: #444;
    font-size: 9px;
    cursor: pointer;
    padding: 1px 4px;
    border-radius: 3px;
    flex-shrink: 0;
    opacity: 0;
    transition: color 0.1s, opacity 0.1s;
    line-height: 1;
    &:hover { color: #f87171; }
  }

  &__dict:hover &__dict-rm { opacity: 1; }

  &__badge {
    font-size: 9px;
    background: rgba(56,189,248,0.15);
    color: #7dd3fc;
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
    }

    &--selected {
      background: rgba(56,189,248,0.1);
      color: #7dd3fc;
    }
  }

  &__fx-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

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
      background: rgba(56,189,248,0.25);
      color: #7dd3fc;
      border-radius: 2px;
      padding: 0 1px;
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
    background: rgba(56,189,248,0.06);
    border: 1px dashed rgba(56,189,248,0.2);
    border-radius: 6px;
    color: #38bdf8;
    font-size: 11px;
    font-weight: 500;
    padding: 7px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: rgba(56,189,248,0.12);
      border-color: rgba(56,189,248,0.4);
      color: #7dd3fc;
    }
  }
}
</style>
