import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../plugins/axios.plugin'
import { boneById } from '../bones'
import type { PropSlot, ParticleGroup, Vec3 } from '../types'

const HEAD_BONE = 31086

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function defaultSlot(model: string): PropSlot {
  return {
    id: uid(),
    model,
    bone: HEAD_BONE,
    boneName: 'SKEL_Head',
    offset: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    visible: true,
    groupId: null,
  }
}

export const useObjectStore = defineStore('objects', () => {
  const slots      = ref<PropSlot[]>([])
  const groups     = ref<ParticleGroup[]>([])
  const selectedId = ref<string | null>(null)
  const isAttached = ref(false)

  const selected = computed(() => slots.value.find(s => s.id === selectedId.value) ?? null)

  // ── slot CRUD ──────────────────────────────────────────────

  function addSlot(model: string) {
    const slot = defaultSlot(model.trim())
    slots.value.push(slot)
    selectedId.value = slot.id
    if (isAttached.value) api.post('SPAWN_PROP', { slot })
  }

  function removeSlot(id: string) {
    const idx = slots.value.findIndex(s => s.id === id)
    if (idx === -1) return
    slots.value.splice(idx, 1)
    api.post('REMOVE_PROP', { id })
    if (selectedId.value === id) {
      selectedId.value = slots.value[Math.max(0, idx - 1)]?.id ?? null
    }
  }

  function duplicateSlot(id: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    const copy: PropSlot = { ...JSON.parse(JSON.stringify(slot)), id: uid() }
    const idx = slots.value.findIndex(s => s.id === id)
    slots.value.splice(idx + 1, 0, copy)
    selectedId.value = copy.id
    if (isAttached.value) api.post('SPAWN_PROP', { slot: copy })
  }

  function selectSlot(id: string) {
    selectedId.value = id
  }

  // ── group CRUD ─────────────────────────────────────────────

  function addGroup(name: string): string {
    const id = uid()
    groups.value.push({ id, name })
    return id
  }

  function removeGroup(id: string) {
    const idx = groups.value.findIndex(g => g.id === id)
    if (idx === -1) return
    for (const s of slots.value) {
      if (s.groupId === id) s.groupId = null
    }
    groups.value.splice(idx, 1)
  }

  function renameGroup(id: string, name: string) {
    const g = groups.value.find(g => g.id === id)
    if (g && name.trim()) g.name = name.trim()
  }

  function setSlotGroup(slotId: string, groupId: string | null) {
    const slot = slots.value.find(s => s.id === slotId)
    if (slot) slot.groupId = groupId
  }

  // ── field setters ──────────────────────────────────────────

  function setBone(id: string, boneId: number) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    const def = boneById(boneId)
    slot.bone = def.id
    slot.boneName = def.name
    if (isAttached.value) api.post('UPDATE_PROP_TRANSFORM', { slot })
  }

  function setOffset(id: string, axis: keyof Vec3, value: number) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.offset[axis] = value
    if (isAttached.value) api.post('UPDATE_PROP_TRANSFORM', { slot })
  }

  function setRotation(id: string, axis: keyof Vec3, value: number) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.rotation[axis] = value
    if (isAttached.value) api.post('UPDATE_PROP_TRANSFORM', { slot })
  }

  function setModel(id: string, model: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.model = model.trim()
    if (isAttached.value) api.post('SPAWN_PROP', { slot })
  }

  function setVisible(id: string, visible: boolean) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.visible = visible
    api.post('TOGGLE_PROP_VISIBLE', { id, visible })
  }

  // ── attach / detach ────────────────────────────────────────

  async function setAttached(state: boolean) {
    isAttached.value = state
    if (state) {
      await api.post('SPAWN_ALL_PROPS', { slots: slots.value })
    } else {
      await api.post('REMOVE_ALL_PROPS', {})
    }
  }

  // ── export ─────────────────────────────────────────────────

  function toLua(): string {
    if (!slots.value.length) return '-- no prop slots configured'
    const lines: string[] = ['local props = {']
    slots.value.forEach((s, i) => {
      const last = i === slots.value.length - 1
      const o = s.offset
      const r = s.rotation
      const groupName = s.groupId ? groups.value.find(g => g.id === s.groupId)?.name : null
      lines.push(`    { -- ${s.model}`)
      lines.push(`        model    = "${s.model}",`)
      lines.push(`        bone     = ${s.bone}, -- ${s.boneName}`)
      lines.push(`        offset   = vector3(${o.x.toFixed(3)}, ${o.y.toFixed(3)}, ${o.z.toFixed(3)}),`)
      lines.push(`        rotation = vector3(${r.x.toFixed(1)}, ${r.y.toFixed(1)}, ${r.z.toFixed(1)}),`)
      if (!s.visible) lines.push(`        visible  = false,`)
      if (groupName) lines.push(`        group    = "${groupName}",`)
      lines.push(`    }${last ? '' : ','}`)
    })
    lines.push('}')
    return lines.join('\n')
  }

  return {
    slots, groups, selectedId, selected, isAttached,
    addSlot, removeSlot, duplicateSlot, selectSlot,
    addGroup, removeGroup, renameGroup, setSlotGroup,
    setBone, setOffset, setRotation, setModel, setVisible,
    setAttached, toLua,
  }
})
