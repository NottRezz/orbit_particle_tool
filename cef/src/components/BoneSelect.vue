<template>
  <div class="bs" ref="root">
    <button class="bs__trigger" @click="open = !open">
      <span>{{ currentBone.label }}</span>
      <span class="bs__id">{{ modelValue }}</span>
      <svg class="bs__chevron" :class="{ 'bs__chevron--open': open }" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>

    <Teleport to="body">
      <div v-if="open" ref="dropdownEl" class="bs__dropdown" :style="dropdownStyle">
        <div class="bs__search-wrap">
          <input
            ref="searchRef"
            class="bs__search"
            v-model="q"
            placeholder="Search bone…"
            @keydown.escape="open = false"
          />
        </div>
        <div class="bs__list">
          <button
            v-for="bone in filtered"
            :key="bone.id"
            class="bs__item"
            :class="{ 'bs__item--active': bone.id === modelValue }"
            @click="select(bone.id)"
          >
            <span>{{ bone.label }}</span>
            <span class="bs__item-name">{{ bone.name }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { BONES, boneById } from '../bones'

const props = defineProps<{ modelValue: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

const open = ref(false)
const q = ref('')
const root = ref<HTMLElement | null>(null)
const dropdownEl = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const currentBone = computed(() => boneById(props.modelValue))

const filtered = computed(() => {
  const s = q.value.toLowerCase()
  return s ? BONES.filter(b => b.label.toLowerCase().includes(s) || b.name.toLowerCase().includes(s)) : BONES
})

watch(open, async (v) => {
  if (v) {
    await nextTick()
    searchRef.value?.focus()
    updateDropdownPos()
  } else {
    q.value = ''
  }
})

function updateDropdownPos() {
  const el = root.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '9999',
  }
}

function select(id: number) {
  emit('update:modelValue', id)
  open.value = false
}

function onDocClick(e: MouseEvent) {
  if (!root.value?.contains(e.target as Node) && !dropdownEl.value?.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))
</script>

<style lang="scss" scoped>
.bs {
  position: relative;

  &__trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    color: #e4e4e7;
    font-size: 12px;
    padding: 6px 10px;
    cursor: pointer;
    transition: border-color 0.15s;
    &:hover { border-color: rgba(124,93,249,0.4); }

    span:first-child { flex: 1; text-align: left; }
  }

  &__id {
    font-size: 10px;
    color: #555;
    font-variant-numeric: tabular-nums;
  }

  &__chevron {
    color: #666;
    transition: transform 0.15s;
    flex-shrink: 0;
    &--open { transform: rotate(180deg); }
  }
}
</style>

<style lang="scss">
.bs__dropdown {
  background: #1a1a1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0,0,0,0.6);
}

.bs__search-wrap {
  padding: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.bs__search {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 5px;
  color: #e4e4e7;
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
  &:focus { border-color: rgba(124,93,249,0.5); }
  &::placeholder { color: #555; }
}

.bs__list {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.bs__item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  border-radius: 5px;
  color: #ccc;
  font-size: 12px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.1s;
  text-align: left;

  &:hover { background: rgba(255,255,255,0.06); }

  &--active {
    background: rgba(124,93,249,0.15);
    color: #a78bfa;
  }
}

.bs__item-name {
  font-size: 10px;
  color: #555;
  font-family: monospace;
}
</style>
