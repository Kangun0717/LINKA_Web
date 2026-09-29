/** The Sado sketch's projection (a simple equirectangular view of the island). */
const WEST = 138.15
const EAST = 138.62
const NORTH = 38.36
const SOUTH = 37.78
const K = Math.cos((38.07 * Math.PI) / 180)

export const WIDTH = 300
export const HEIGHT = Math.round(((NORTH - SOUTH) / ((EAST - WEST) * K)) * WIDTH)

export const at = (lng: number, lat: number) => ({ x: ((lng - WEST) / (EAST - WEST)) * WIDTH, y: ((NORTH - lat) / (NORTH - SOUTH)) * HEIGHT })

/** The point under a tap, from its position as a fraction of the drawing (0–1). */
export const pointAt = (fx: number, fy: number) => ({ lng: WEST + fx * (EAST - WEST), lat: NORTH - fy * (NORTH - SOUTH) })
