import axios from 'axios'

const resourceName =
  typeof (window as unknown as Record<string, unknown>).GetParentResourceName === 'function'
    // @ts-ignore
    ? GetParentResourceName()
    : 'orbit_particle_tool'

export const api = axios.create({
  baseURL: `https://${resourceName}/`,
})
