export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface RGBA {
  r: number  // 0.0 – 1.0
  g: number
  b: number
  a: number
}

export interface ParticleGroup {
  id: string
  name: string
}

export interface ParticleSlot {
  id: string
  dict: string
  fx: string
  bone: number
  boneName: string
  offset: Vec3
  rotation: Vec3
  scale: number
  color: RGBA
  evolution: Record<string, number>
  groupId: string | null
}

export interface BoneDef {
  id: number
  name: string
  label: string
}

export interface ParticleEntry {
  dict: string
  fx: string
  custom?: boolean
}
