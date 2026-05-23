<template>
  <div class="stage" :class="{ 'stage--dev': isDev }">
    <Transition enter-active-class="animate__animated animate__fadeIn animate__faster"
                leave-active-class="animate__animated animate__fadeOut animate__faster">
      <div v-if="isOpen" ref="panelRef" class="panel" :style="panelStyle">

        <!-- ── Header ── -->
        <header class="panel__header" @mousedown="startDrag">
          <div class="panel__title">
            <span class="panel__logo">◉</span>
            ORBIT<span class="panel__title-sub"> · PARTICLE BUILDER</span>
          </div>

          <div class="panel__controls">
            <!-- play / stop -->
            <button
              class="hbtn"
              :class="store.isPlaying ? 'hbtn--stop' : 'hbtn--play'"
              @click="togglePlay"
            >
              <span class="hbtn__dot" />
              {{ store.isPlaying ? 'Stop All' : 'Play All' }}
            </button>

            <!-- slot count -->
            <span class="panel__count" v-if="store.slots.length">
              {{ store.slots.length }} slot{{ store.slots.length !== 1 ? 's' : '' }}
            </span>

            <!-- import lua -->
            <button class="hbtn hbtn--import" @click="showImportModal = true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Import Lua
            </button>

            <!-- copy lua -->
            <button class="hbtn hbtn--lua" @click="copyLua" :class="{ 'hbtn--copied': copied }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              {{ copied ? 'Copied!' : 'Copy Lua' }}
            </button>

            <!-- close -->
            <button class="hbtn hbtn--close" @click="close">✕</button>
          </div>
        </header>

        <!-- ── Body ── -->
        <div class="panel__body">
          <ParticleBrowser
            :custom-dicts="customDicts"
            @open-custom-dict="showCustomModal = true"
          />
          <ParticleConfig />
        </div>
      </div>
    </Transition>

    <!-- custom dict modal -->
    <CustomDictModal
      v-if="showCustomModal"
      @close="showCustomModal = false"
      @add="addCustomDict"
    />

    <!-- import lua modal -->
    <ImportLuaModal v-if="showImportModal" @close="showImportModal = false" />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useParticleStore } from '../store/useParticleStore'
import { api } from '../plugins/axios.plugin'
import ParticleBrowser from '../components/ParticleBrowser.vue'
import ParticleConfig from '../components/ParticleConfig.vue'
import CustomDictModal from '../components/CustomDictModal.vue'
import ImportLuaModal from '../components/ImportLuaModal.vue'

const store = useParticleStore()
const isOpen = ref(false)
const copied = ref(false)
const showCustomModal = ref(false)
const showImportModal = ref(false)
const isDev = import.meta.env.DEV

// custom dicts persisted to localStorage
const customDicts = reactive<Record<string, string[]>>(loadCustomDicts())

function loadCustomDicts(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem('pb_custom_dicts') ?? '{}') }
  catch { return {} }
}
function saveCustomDicts() {
  localStorage.setItem('pb_custom_dicts', JSON.stringify(customDicts))
}
function addCustomDict(dict: string, effects: string[]) {
  customDicts[dict] = effects
  saveCustomDicts()
}

// ── drag ──────────────────────────────────────────────────

const panelRef = ref<HTMLElement | null>(null)
const pos = reactive({ x: 0, y: 0 })
const dragOffset = { x: 0, y: 0 }

const panelStyle = computed(() => ({
  left: pos.x + 'px',
  top:  pos.y + 'px',
}))

function centerPanel() {
  const w = panelRef.value?.offsetWidth  ?? 820
  const h = panelRef.value?.offsetHeight ?? 540
  pos.x = Math.round((window.innerWidth  - w) / 2)
  pos.y = Math.round((window.innerHeight - h) / 2)
}

function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  e.preventDefault()
  dragOffset.x = e.clientX - pos.x
  dragOffset.y = e.clientY - pos.y
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup',   stopDrag, { once: true })
}

function onDrag(e: MouseEvent) {
  const w = panelRef.value?.offsetWidth  ?? 0
  const h = panelRef.value?.offsetHeight ?? 0
  pos.x = Math.max(0, Math.min(window.innerWidth  - w, e.clientX - dragOffset.x))
  pos.y = Math.max(0, Math.min(window.innerHeight - h, e.clientY - dragOffset.y))
}

function stopDrag() {
  window.removeEventListener('mousemove', onDrag)
}

// ── open / close ──────────────────────────────────────────

function open() {
  isOpen.value = true
  api.post('SET_CURSOR_STATE', { state: true })
  // center on next tick so the panel is mounted and has dimensions
  setTimeout(centerPanel, 0)
}
function close() {
  isOpen.value = false
  api.post('SET_CURSOR_STATE', { state: false })
}

// ── play / stop ───────────────────────────────────────────

async function togglePlay() {
  await store.setPlaying(!store.isPlaying)
}

// ── copy lua ──────────────────────────────────────────────

async function copyLua() {
  const lua = store.toLua()
  try {
    await navigator.clipboard.writeText(lua)
  } catch {
    // fallback for NUI context
    const ta = document.createElement('textarea')
    ta.value = lua
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

// ── keyboard shortcuts ────────────────────────────────────

window.addEventListener('keyup', (e: KeyboardEvent) => {
  if (e.key === 'Escape') close()
})

// ── NUI message listener ──────────────────────────────────

window.addEventListener('message', (e: MessageEvent) => {
  if (e.data?.event === 'SET_OPEN_STATE') {
    e.data.state ? open() : close()
  }
})

// ── dev mode ──────────────────────────────────────────────

onMounted(() => {
  if (isDev) {
    isOpen.value = true
    setTimeout(centerPanel, 0)
  }
})
</script>

<style lang="scss" scoped>
.stage {
  position: fixed;
  inset: 0;
  pointer-events: none;

  &--dev { background: #222; }
}

.panel {
  pointer-events: all;
  position: absolute;
  width: min(820px, 90vw);
  height: min(540px, 84vh);
  background: #111111;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // ── header ────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    padding: 0 16px;
    height: 48px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: #0d0d0d;
    gap: 12px;
    cursor: move;
    user-select: none;
  }

  &__title {
    font-size: 13px;
    font-weight: 700;
    color: #e4e4e7;
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  &__logo {
    color: #7c5df9;
    font-size: 16px;
    line-height: 1;
  }

  &__title-sub {
    color: #555;
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__count {
    font-size: 11px;
    color: #555;
    padding: 0 4px;
  }

  // ── body ──────────────────────────────────────────
  &__body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }
}

// ── header buttons ────────────────────────────────────────

.hbtn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  color: #aaa;
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.08);

  &:hover { color: #ddd; background: rgba(255,255,255,0.09); }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &--play {
    color: #4ade80;
    background: rgba(74,222,128,0.08);
    border-color: rgba(74,222,128,0.2);
    &:hover { background: rgba(74,222,128,0.15); }
  }

  &--stop {
    color: #f87171;
    background: rgba(248,113,113,0.08);
    border-color: rgba(248,113,113,0.2);
    &:hover { background: rgba(248,113,113,0.15); }
    .hbtn__dot { animation: pulse 1s ease-in-out infinite; }
  }

  &--import {
    color: #38bdf8;
    background: rgba(56,189,248,0.07);
    border-color: rgba(56,189,248,0.18);
    &:hover { background: rgba(56,189,248,0.13); }
  }

  &--lua {
    color: #7c5df9;
    background: rgba(124,93,249,0.08);
    border-color: rgba(124,93,249,0.2);
    &:hover { background: rgba(124,93,249,0.15); }
  }

  &--copied {
    color: #4ade80 !important;
    background: rgba(74,222,128,0.1) !important;
    border-color: rgba(74,222,128,0.2) !important;
  }

  &--close {
    color: #555;
    padding: 5px 8px;
    &:hover { color: #f87171; background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.15); }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
