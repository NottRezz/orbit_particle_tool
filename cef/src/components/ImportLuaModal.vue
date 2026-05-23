<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="$emit('close')">
      <div class="modal animate__animated animate__fadeInUp animate__faster">
        <div class="modal__header">
          <span>Import Lua</span>
          <button class="modal__close" @click="$emit('close')">✕</button>
        </div>

        <div class="modal__body">
          <div class="modal__mode">
            <label class="modal__radio">
              <input type="radio" v-model="mode" value="append" />
              <span>Append to existing slots</span>
            </label>
            <label class="modal__radio">
              <input type="radio" v-model="mode" value="replace" />
              <span>Replace all slots</span>
            </label>
          </div>

          <div class="field">
            <label>Paste your <code>local particles = { ... }</code> Lua table</label>
            <textarea
              v-model="src"
              class="inp inp--ta"
              placeholder="local particles = {&#10;    {&#10;        dict = &quot;core&quot;,&#10;        fx   = &quot;ent_amb_cigarette_smoke&quot;,&#10;        ...&#10;    },&#10;}"
              rows="10"
            />
          </div>

          <p v-if="error" class="modal__error">{{ error }}</p>
        </div>

        <div class="modal__footer">
          <button class="btn btn--ghost" @click="$emit('close')">Cancel</button>
          <button class="btn btn--primary" @click="doImport">Import</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useParticleStore } from '../store/useParticleStore'

const emit = defineEmits<{ (e: 'close'): void }>()

const store = useParticleStore()
const src = ref('')
const mode = ref<'append' | 'replace'>('append')
const error = ref('')

function doImport() {
  error.value = ''
  const ok = store.importLua(src.value, mode.value)
  if (!ok) {
    error.value = 'No valid particle slots found. Make sure you copied the full table.'
    return
  }
  emit('close')
}
</script>

<style lang="scss" scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #161616;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  width: 480px;
  box-shadow: 0 24px 60px rgba(0,0,0,0.8);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    font-size: 13px;
    font-weight: 600;
    color: #e4e4e7;
  }

  &__close {
    background: none;
    border: none;
    color: #555;
    font-size: 13px;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    &:hover { color: #ccc; background: rgba(255,255,255,0.06); }
  }

  &__body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__mode {
    display: flex;
    gap: 20px;
  }

  &__radio {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #aaa;
    cursor: pointer;

    input[type=radio] { accent-color: #7c5df9; cursor: pointer; }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 20px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }

  &__error {
    font-size: 11px;
    color: #f87171;
    margin: 0;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 11px;
    color: #888;
    code { color: #a78bfa; font-size: 10px; }
  }
}

.inp {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 6px;
  color: #e4e4e7;
  font-size: 12px;
  padding: 8px 10px;
  outline: none;
  transition: border-color 0.15s;
  &:focus { border-color: rgba(124,93,249,0.5); }
  &::placeholder { color: #333; }

  &--ta {
    resize: vertical;
    font-family: monospace;
    line-height: 1.6;
  }
}

.btn {
  font-size: 12px;
  font-weight: 500;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;

  &--ghost {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.08);
    color: #aaa;
    &:hover { background: rgba(255,255,255,0.09); color: #ddd; }
  }

  &--primary {
    background: #7c5df9;
    color: white;
    &:hover { background: #9678ff; }
  }
}
</style>
