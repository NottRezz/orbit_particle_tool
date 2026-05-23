import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../plugins/axios.plugin'
import { boneById } from '../bones'
import type { ParticleSlot, ParticleGroup, RGBA, Vec3 } from '../types'

const HEAD_BONE = 31086

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

function defaultSlot(dict: string, fx: string): ParticleSlot {
  return {
    id: uid(),
    dict,
    fx,
    bone: HEAD_BONE,
    boneName: 'SKEL_Head',
    offset: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1.0,
    color: { r: 1, g: 1, b: 1, a: 1 },
    evolution: {},
    groupId: null,
  }
}

// ── Lua parser ────────────────────────────────────────────────────

function parseLuaSlots(src: string): Array<{ slot: Omit<ParticleSlot, 'id'>; groupName: string | null }> {
  const stripped = src.replace(/--[^\n]*/g, '')
  const results: Array<{ slot: Omit<ParticleSlot, 'id'>; groupName: string | null }> = []
  let depth = 0
  let blockStart = -1

  for (let i = 0; i < stripped.length; i++) {
    const c = stripped[i]
    if (c === '{') {
      depth++
      if (depth === 2) blockStart = i
    } else if (c === '}') {
      if (depth === 2 && blockStart !== -1) {
        const block = stripped.slice(blockStart, i + 1)
        const parsed = parseSlotBlock(block)
        if (parsed) results.push(parsed)
        blockStart = -1
      }
      depth--
    }
  }
  return results
}

function parseSlotBlock(block: string): { slot: Omit<ParticleSlot, 'id'>; groupName: string | null } | null {
  const str = (key: string) => block.match(new RegExp(`\\b${key}\\s*=\\s*"([^"]*)"`)) ?.[1] ?? null
  const num = (key: string) => { const m = block.match(new RegExp(`\\b${key}\\s*=\\s*(-?[\\d.]+)`)); return m ? parseFloat(m[1]) : null }
  const vec3 = (key: string): Vec3 => {
    const m = block.match(new RegExp(`\\b${key}\\s*=\\s*vector3\\s*\\(\\s*(-?[\\d.]+)\\s*,\\s*(-?[\\d.]+)\\s*,\\s*(-?[\\d.]+)\\s*\\)`))
    return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]), z: parseFloat(m[3]) } : { x: 0, y: 0, z: 0 }
  }

  const dict = str('dict')
  const fx = str('fx')
  if (!dict || !fx) return null

  const bone = num('bone') ?? HEAD_BONE
  const scale = num('scale') ?? 1.0
  const offset = vec3('offset')
  const rotation = vec3('rotation')

  const colorBlock = block.match(/\bcolor\s*=\s*\{([^}]*)\}/)?.[1] ?? ''
  const color: RGBA = {
    r: parseFloat(colorBlock.match(/\br\s*=\s*(-?[\d.]+)/)?.[1] ?? '1'),
    g: parseFloat(colorBlock.match(/\bg\s*=\s*(-?[\d.]+)/)?.[1] ?? '1'),
    b: parseFloat(colorBlock.match(/\bb\s*=\s*(-?[\d.]+)/)?.[1] ?? '1'),
    a: parseFloat(colorBlock.match(/\ba\s*=\s*(-?[\d.]+)/)?.[1] ?? '1'),
  }

  const evolution: Record<string, number> = {}
  const evoBlock = block.match(/\bevolution\s*=\s*\{([^}]*)\}/)?.[1]
  if (evoBlock) {
    for (const [, k, v] of [...evoBlock.matchAll(/(\w+)\s*=\s*(-?[\d.]+)/g)]) {
      evolution[k] = parseFloat(v)
    }
  }

  const groupName = str('group')
  const boneDef = boneById(bone)

  return {
    slot: { dict, fx, bone, boneName: boneDef.name, offset, rotation, scale, color, evolution, groupId: null },
    groupName,
  }
}

// ── Store ─────────────────────────────────────────────────────────

export const useParticleStore = defineStore('particles', () => {
  const slots = ref<ParticleSlot[]>([])
  const groups = ref<ParticleGroup[]>([])
  const selectedId = ref<string | null>(null)
  const isPlaying = ref(false)

  const selected = computed(() => slots.value.find(s => s.id === selectedId.value) ?? null)

  // ── slot CRUD ──────────────────────────────────────────────

  function addSlot(dict: string, fx: string) {
    const slot = defaultSlot(dict, fx)
    slots.value.push(slot)
    selectedId.value = slot.id
    if (isPlaying.value) api.post('ADD_PARTICLE_SLOT', { slot })
  }

  function removeSlot(id: string) {
    const idx = slots.value.findIndex(s => s.id === id)
    if (idx === -1) return
    slots.value.splice(idx, 1)
    api.post('REMOVE_PARTICLE_SLOT', { id })
    if (selectedId.value === id) {
      selectedId.value = slots.value[Math.max(0, idx - 1)]?.id ?? null
    }
  }

  function duplicateSlot(id: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    const copy: ParticleSlot = { ...JSON.parse(JSON.stringify(slot)), id: uid() }
    const idx = slots.value.findIndex(s => s.id === id)
    slots.value.splice(idx + 1, 0, copy)
    selectedId.value = copy.id
    if (isPlaying.value) api.post('ADD_PARTICLE_SLOT', { slot: copy })
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

  // ── live update helpers ────────────────────────────────────

  function syncTransform(id: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot || !isPlaying.value) return
    api.post('UPDATE_SLOT_TRANSFORM', { slot })
  }

  function syncScale(id: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot || !isPlaying.value) return
    api.post('UPDATE_SLOT_SCALE', { id, scale: slot.scale })
  }

  function syncColor(id: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot || !isPlaying.value) return
    api.post('UPDATE_SLOT_COLOR', { id, color: slot.color })
  }

  function syncEvolution(id: string, name: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot || !isPlaying.value) return
    api.post('UPDATE_SLOT_EVOLUTION', { id, name, value: slot.evolution[name] ?? 0 })
  }

  // ── field setters ──────────────────────────────────────────

  function setBone(id: string, boneId: number) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    const def = boneById(boneId)
    slot.bone = def.id
    slot.boneName = def.name
    syncTransform(id)
  }

  function setOffset(id: string, axis: keyof Vec3, value: number) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.offset[axis] = value
    syncTransform(id)
  }

  function setRotation(id: string, axis: keyof Vec3, value: number) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.rotation[axis] = value
    syncTransform(id)
  }

  function setScale(id: string, value: number) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.scale = value
    syncScale(id)
  }

  function setColor(id: string, color: RGBA) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.color = { ...color }
    syncColor(id)
  }

  function setEvolution(id: string, name: string, value: number) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.evolution[name] = value
    syncEvolution(id, name)
  }

  function removeEvolution(id: string, name: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    delete slot.evolution[name]
  }

  function setParticle(id: string, dict: string, fx: string) {
    const slot = slots.value.find(s => s.id === id)
    if (!slot) return
    slot.dict = dict
    slot.fx = fx
    syncTransform(id)
  }

  // ── play / stop ────────────────────────────────────────────

  async function setPlaying(state: boolean) {
    isPlaying.value = state
    if (state) {
      await api.post('SET_ALL_PLAYING', { slots: slots.value })
    } else {
      await api.post('STOP_ALL', {})
    }
  }

  // ── import / export ────────────────────────────────────────

  function importLua(src: string, mode: 'replace' | 'append'): boolean {
    const parsed = parseLuaSlots(src)
    if (!parsed.length) return false

    if (mode === 'replace') {
      slots.value = []
      groups.value = []
      selectedId.value = null
      isPlaying.value = false
      api.post('STOP_ALL', {})
    }

    const nameToId = new Map<string, string>(groups.value.map(g => [g.name, g.id]))

    for (const { slot, groupName } of parsed) {
      let groupId: string | null = null
      if (groupName) {
        if (!nameToId.has(groupName)) {
          const gid = uid()
          groups.value.push({ id: gid, name: groupName })
          nameToId.set(groupName, gid)
        }
        groupId = nameToId.get(groupName)!
      }
      slots.value.push({ ...slot, id: uid(), groupId })
    }

    if (!selectedId.value && slots.value.length) {
      selectedId.value = slots.value[0].id
    }
    return true
  }

  function toLua(): string {
    if (slots.value.length === 0) return '-- no particle slots configured'
    const lines: string[] = ['local particles = {']
    slots.value.forEach((s, i) => {
      const last = i === slots.value.length - 1
      const c = s.color
      const o = s.offset
      const r = s.rotation
      const groupName = s.groupId ? groups.value.find(g => g.id === s.groupId)?.name : null
      lines.push(`    { -- ${s.dict} / ${s.fx}`)
      lines.push(`        dict     = "${s.dict}",`)
      lines.push(`        fx       = "${s.fx}",`)
      lines.push(`        bone     = ${s.bone}, -- ${s.boneName}`)
      lines.push(`        offset   = vector3(${o.x.toFixed(3)}, ${o.y.toFixed(3)}, ${o.z.toFixed(3)}),`)
      lines.push(`        rotation = vector3(${r.x.toFixed(1)}, ${r.y.toFixed(1)}, ${r.z.toFixed(1)}),`)
      lines.push(`        scale    = ${s.scale.toFixed(2)},`)
      lines.push(`        color    = { r=${c.r.toFixed(3)}, g=${c.g.toFixed(3)}, b=${c.b.toFixed(3)}, a=${c.a.toFixed(3)} },`)
      if (groupName) lines.push(`        group    = "${groupName}",`)
      const evoKeys = Object.keys(s.evolution)
      if (evoKeys.length) {
        lines.push(`        evolution = {`)
        evoKeys.forEach(k => lines.push(`            ${k} = ${s.evolution[k].toFixed(3)},`))
        lines.push(`        },`)
      }
      lines.push(`    }${last ? '' : ','}`)
    })
    lines.push('}')
    return lines.join('\n')
  }

  return {
    slots, groups, selectedId, selected, isPlaying,
    addSlot, removeSlot, duplicateSlot, selectSlot,
    addGroup, removeGroup, renameGroup, setSlotGroup,
    setBone, setOffset, setRotation, setScale, setColor,
    setEvolution, removeEvolution, setParticle,
    setPlaying, importLua, toLua,
  }
})
