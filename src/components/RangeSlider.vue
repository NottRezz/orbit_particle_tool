<template>
  <div class="rs">
    <div class="rs__header">
      <span class="rs__label">{{ label }}</span>
      <input
        class="rs__num"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        @change="onNumChange"
      />
    </div>
    <input
      class="rs__track"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="onInput"
    />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  label: string
  modelValue: number
  min: number
  max: number
  step?: number
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()

function clamp(v: number) {
  return Math.min(props.max, Math.max(props.min, v))
}
function onInput(e: Event) {
  emit('update:modelValue', clamp(parseFloat((e.target as HTMLInputElement).value)))
}
function onNumChange(e: Event) {
  const v = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(v)) emit('update:modelValue', clamp(v))
}
</script>

<style lang="scss" scoped>
.rs {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__num {
    width: 56px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 4px;
    color: #e4e4e7;
    font-size: 11px;
    padding: 2px 4px;
    text-align: right;
    outline: none;
    &:focus { border-color: rgba(124,93,249,0.6); }
    &::-webkit-inner-spin-button { opacity: 0; }
  }

  &__track {
    -webkit-appearance: none;
    width: 100%;
    height: 3px;
    border-radius: 99px;
    background: rgba(255,255,255,0.1);
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #7c5df9;
      box-shadow: 0 0 6px rgba(124,93,249,0.5);
      cursor: pointer;
      transition: transform 0.1s;
    }
    &:hover::-webkit-slider-thumb { transform: scale(1.2); }
    &:active::-webkit-slider-thumb { transform: scale(1.1); background: #9678ff; }
  }
}
</style>
