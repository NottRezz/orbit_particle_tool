<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="$emit('close')">
      <div class="modal animate__animated animate__fadeInUp animate__faster">
        <div class="modal__header">
          <span>Add Custom Dictionary</span>
          <button class="modal__close" @click="$emit('close')">✕</button>
        </div>

        <div class="modal__body">
          <div class="field">
            <label>Dictionary Name</label>
            <input
              v-model="dictName"
              class="inp"
              placeholder="e.g. scr_rcpaparazzo1"
              @keydown.enter="fxInput?.focus()"
            />
          </div>

          <div class="field">
            <label>Effect Names <span class="hint">(one per line)</span></label>
            <textarea
              ref="fxInput"
              v-model="fxRaw"
              class="inp inp--ta"
              placeholder="scr_paparazzi_flash&#10;scr_paparazzi_smoke"
              rows="6"
            />
          </div>

          <p v-if="error" class="modal__error">{{ error }}</p>
        </div>

        <div class="modal__footer">
          <button class="btn btn--ghost" @click="$emit('close')">Cancel</button>
          <button class="btn btn--primary" @click="submit">Add Dictionary</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add', dict: string, effects: string[]): void
}>()

const dictName = ref('')
const fxRaw = ref('')
const fxInput = ref<HTMLTextAreaElement | null>(null)
const error = ref('')

function submit() {
  const dict = dictName.value.trim()
  const effects = fxRaw.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (!dict) { error.value = 'Dictionary name is required.'; return }
  if (!effects.length) { error.value = 'Add at least one effect name.'; return }

  emit('add', dict, effects)
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
  width: 400px;
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
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .hint { text-transform: none; color: #555; }
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
  &::placeholder { color: #444; }

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
