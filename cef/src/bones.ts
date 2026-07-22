import type { BoneDef } from './types'

export const BONES: BoneDef[] = [
  { id: 0,     name: 'SKEL_ROOT',         label: 'Root' },
  { id: 11816, name: 'SKEL_Pelvis',       label: 'Pelvis' },
  { id: 23553, name: 'SKEL_Spine0',       label: 'Spine 0' },
  { id: 24816, name: 'SKEL_Spine1',       label: 'Spine 1' },
  { id: 24817, name: 'SKEL_Spine2',       label: 'Spine 2' },
  { id: 24818, name: 'SKEL_Spine3',       label: 'Spine 3' },
  { id: 39317, name: 'SKEL_Neck_1',       label: 'Neck' },
  { id: 31086, name: 'SKEL_Head',         label: 'Head' },
  { id: 25260, name: 'FB_L_Eye_000',      label: 'L Eye' },
  { id: 27474, name: 'FB_R_Eye_000',      label: 'R Eye' },
  { id: 64729, name: 'SKEL_L_Clavicle',   label: 'L Clavicle' },
  { id: 10706, name: 'SKEL_R_Clavicle',   label: 'R Clavicle' },
  { id: 45509, name: 'SKEL_L_UpperArm',   label: 'L Upper Arm' },
  { id: 40269, name: 'SKEL_R_UpperArm',   label: 'R Upper Arm' },
  { id: 61163, name: 'SKEL_L_Forearm',    label: 'L Forearm' },
  { id: 28252, name: 'SKEL_R_Forearm',    label: 'R Forearm' },
  { id: 18905, name: 'SKEL_L_Hand',       label: 'L Hand' },
  { id: 57005, name: 'SKEL_R_Hand',       label: 'R Hand' },
  { id: 26610, name: 'SKEL_L_Finger00',   label: 'L Finger' },
  { id: 58866, name: 'SKEL_R_Finger00',   label: 'R Finger' },
  { id: 58271, name: 'SKEL_L_Thigh',      label: 'L Thigh' },
  { id: 51826, name: 'SKEL_R_Thigh',      label: 'R Thigh' },
  { id: 63931, name: 'SKEL_L_Calf',       label: 'L Calf' },
  { id: 36864, name: 'SKEL_R_Calf',       label: 'R Calf' },
  { id: 14201, name: 'SKEL_L_Foot',       label: 'L Foot' },
  { id: 52301, name: 'SKEL_R_Foot',       label: 'R Foot' },
  { id: 36029, name: 'IK_L_Hand',         label: 'IK L Hand' },
  { id: 6286,  name: 'IK_R_Hand',         label: 'IK R Hand' },
  { id: 65245, name: 'IK_L_Foot',         label: 'IK L Foot' },
  { id: 35502, name: 'IK_R_Foot',         label: 'IK R Foot' },
]

export function boneById(id: number): BoneDef {
  return BONES.find(b => b.id === id) ?? BONES[7] // default Head
}
