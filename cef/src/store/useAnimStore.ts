import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../plugins/axios.plugin'
import type { AnimState, VictimConfig } from '../types'

function defaultState(dict: string, anim: string): AnimState {
  return {
    dict, anim,
    blendIn: 8.0, blendOut: -8.0,
    duration: -1, flags: 1, playbackRate: 1.0,
  }
}

export const useAnimStore = defineStore('anim', () => {

  // ── player ────────────────────────────────────────────────
  const state        = ref<AnimState | null>(null)
  const isPlaying    = ref(false)

  // ── victim ────────────────────────────────────────────────
  const victimAnim    = ref<AnimState | null>(null)
  const victimConfig  = ref<VictimConfig>({
    model: 'a_m_m_skater_01',
    offsetX: 0.0, offsetY: 1.0, offsetZ: 0.0, heading: 180.0,
  })
  const victimSpawned = ref(false)
  const victimPlaying = ref(false)

  // which ped the browser routes selections to
  const activeTarget  = ref<'player' | 'victim'>('player')

  // ── browser routing ───────────────────────────────────────

  function setAnim(dict: string, anim: string) {
    if (activeTarget.value === 'victim') {
      if (!victimAnim.value) victimAnim.value = defaultState(dict, anim)
      else { victimAnim.value.dict = dict; victimAnim.value.anim = anim }
      if (victimPlaying.value) _sendVictimPlay()
    } else {
      if (!state.value) state.value = defaultState(dict, anim)
      else { state.value.dict = dict; state.value.anim = anim }
      if (isPlaying.value) _sendPlay()
    }
  }

  // ── player helpers ────────────────────────────────────────

  function _sendPlay() {
    if (!state.value) return
    return api.post('PLAY_ANIM', state.value)
  }

  async function play() {
    if (!state.value) return
    isPlaying.value = true
    await _sendPlay()
  }

  async function stop() {
    isPlaying.value = false
    await api.post('STOP_ANIM', {})
  }

  function setPlaybackRate(v: number) {
    if (!state.value) return
    state.value.playbackRate = v
    if (isPlaying.value) api.post('UPDATE_ANIM_SPEED', { playbackRate: v })
  }

  function setBlendIn(v: number) {
    if (!state.value) return
    state.value.blendIn = v
    if (isPlaying.value) _sendPlay()
  }

  function setBlendOut(v: number) {
    if (!state.value) return
    state.value.blendOut = v
    if (isPlaying.value) _sendPlay()
  }

  function setDuration(v: number) {
    if (!state.value) return
    state.value.duration = v
    if (isPlaying.value) _sendPlay()
  }

  function setFlag(bit: number, on: boolean) {
    if (!state.value) return
    if (on) state.value.flags |= bit
    else    state.value.flags &= ~bit
    if (isPlaying.value) _sendPlay()
  }

  function setRawFlags(v: number) {
    if (!state.value) return
    state.value.flags = v
    if (isPlaying.value) _sendPlay()
  }

  // ── victim spawn / despawn ────────────────────────────────

  async function spawnVictim(): Promise<boolean> {
    const res = await api.post('SPAWN_VICTIM_PED', victimConfig.value)
    const ok: boolean = res.data?.ok !== false
    victimSpawned.value = ok
    return ok
  }

  async function despawnVictim() {
    await api.post('DESPAWN_VICTIM_PED', {})
    victimSpawned.value = false
    victimPlaying.value = false
  }

  // ── victim anim helpers ───────────────────────────────────

  function _sendVictimPlay() {
    if (!victimAnim.value) return
    return api.post('PLAY_VICTIM_ANIM', victimAnim.value)
  }

  async function playVictim() {
    if (!victimAnim.value || !victimSpawned.value) return
    victimPlaying.value = true
    await _sendVictimPlay()
  }

  async function stopVictim() {
    victimPlaying.value = false
    await api.post('STOP_VICTIM_ANIM', {})
  }

  function setVictimPlaybackRate(v: number) {
    if (!victimAnim.value) return
    victimAnim.value.playbackRate = v
    if (victimPlaying.value) api.post('UPDATE_VICTIM_SPEED', { playbackRate: v })
  }

  function setVictimBlendIn(v: number) {
    if (!victimAnim.value) return
    victimAnim.value.blendIn = v
    if (victimPlaying.value) _sendVictimPlay()
  }

  function setVictimBlendOut(v: number) {
    if (!victimAnim.value) return
    victimAnim.value.blendOut = v
    if (victimPlaying.value) _sendVictimPlay()
  }

  function setVictimDuration(v: number) {
    if (!victimAnim.value) return
    victimAnim.value.duration = v
    if (victimPlaying.value) _sendVictimPlay()
  }

  function setVictimFlag(bit: number, on: boolean) {
    if (!victimAnim.value) return
    if (on) victimAnim.value.flags |= bit
    else    victimAnim.value.flags &= ~bit
    if (victimPlaying.value) _sendVictimPlay()
  }

  function setVictimRawFlags(v: number) {
    if (!victimAnim.value) return
    victimAnim.value.flags = v
    if (victimPlaying.value) _sendVictimPlay()
  }

  // ── victim position ───────────────────────────────────────

  function setVictimModel(v: string) {
    victimConfig.value.model = v
  }

  function setVictimOffset(axis: 'offsetX' | 'offsetY' | 'offsetZ', v: number) {
    victimConfig.value[axis] = v
    if (victimSpawned.value) api.post('UPDATE_VICTIM_TRANSFORM', victimConfig.value)
  }

  function setVictimHeading(v: number) {
    victimConfig.value.heading = v
    if (victimSpawned.value) api.post('UPDATE_VICTIM_TRANSFORM', victimConfig.value)
  }

  // ── play/stop all ─────────────────────────────────────────

  async function playAll() {
    if (state.value) { isPlaying.value = true; _sendPlay() }
    if (victimAnim.value && victimSpawned.value) { victimPlaying.value = true; _sendVictimPlay() }
  }

  async function stopAll() {
    isPlaying.value = false
    victimPlaying.value = false
    api.post('STOP_ANIM', {})
    api.post('STOP_VICTIM_ANIM', {})
  }

  // ── clear ─────────────────────────────────────────────────

  async function clearAnim() {
    if (isPlaying.value) await stop()
    state.value = null
  }

  async function clearVictimAnim() {
    if (victimPlaying.value) await stopVictim()
    victimAnim.value = null
  }

  // ── lua export ────────────────────────────────────────────

  function _animBlock(s: AnimState, indent: string): string[] {
    return [
      `${indent}dict         = "${s.dict}",`,
      `${indent}anim         = "${s.anim}",`,
      `${indent}blendIn      = ${s.blendIn.toFixed(1)},`,
      `${indent}blendOut     = ${s.blendOut.toFixed(1)},`,
      `${indent}duration     = ${s.duration},`,
      `${indent}flags        = ${s.flags},`,
      `${indent}playbackRate = ${s.playbackRate.toFixed(2)},`,
    ]
  }

  function toLua(): string {
    if (!state.value) return '-- no animation configured'
    return ['local anim = {', ..._animBlock(state.value, '    '), '}'].join('\n')
  }

  function toLuaBoth(): string {
    if (!state.value && !victimAnim.value) return '-- no animations configured'
    const lines: string[] = ['local animations = {']

    if (state.value) {
      lines.push('    player = {')
      lines.push(..._animBlock(state.value, '        '))
      lines.push('    },')
    }

    if (victimAnim.value) {
      const c = victimConfig.value
      lines.push('    victim = {')
      lines.push(`        model         = "${c.model}",`)
      lines.push(`        offsetForward = ${c.offsetY.toFixed(3)},`)
      lines.push(`        offsetRight   = ${c.offsetX.toFixed(3)},`)
      lines.push(`        offsetUp      = ${c.offsetZ.toFixed(3)},`)
      lines.push(`        heading       = ${c.heading.toFixed(1)},`)
      lines.push(..._animBlock(victimAnim.value, '        '))
      lines.push('    },')
    }

    lines.push('}')
    return lines.join('\n')
  }

  return {
    state, isPlaying,
    victimAnim, victimConfig, victimSpawned, victimPlaying,
    activeTarget,
    setAnim,
    play, stop,
    setPlaybackRate, setBlendIn, setBlendOut, setDuration, setFlag, setRawFlags,
    spawnVictim, despawnVictim,
    playVictim, stopVictim,
    setVictimPlaybackRate, setVictimBlendIn, setVictimBlendOut,
    setVictimDuration, setVictimFlag, setVictimRawFlags,
    setVictimModel, setVictimOffset, setVictimHeading,
    clearAnim, clearVictimAnim,
    playAll, stopAll,
    toLua, toLuaBoth,
  }
})
