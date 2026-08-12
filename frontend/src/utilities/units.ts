import { decimalMark, formatCompact } from './formatNumber'

/**
 * Gas unit system.
 * - `metric`   → MMm³/d (millones de m³/día) — the unit Argentina's oil & gas
 *                industry actually uses. This is the default.
 * - `imperial` → MMcf/d (million cubic feet/day) — the source-data unit.
 *
 * The backend exposes gas as `gas_mmcf_d` on every DTO; `gas_mm3_d` equals
 * `gas_mmcf_d × MMCF_TO_MMM3`, so we convert client-side from the ubiquitous
 * MMcf/d figure instead of plumbing a second field through every component.
 */
export type GasUnitSystem = 'metric' | 'imperial'

export const GAS_UNIT_SYSTEMS: GasUnitSystem[] = ['metric', 'imperial']

// ponytail: physical constant (1 ft³ = 0.0283168466 m³) → exact, never changes.
const MMCF_TO_MMM3 = 0.0283168466

export const GAS_UNIT_LABEL: Record<GasUnitSystem, string> = {
  metric: 'MMm³/d',
  imperial: 'MMcf/d',
}

/** Convert a MMcf/d figure to the selected system's numeric value. */
export function gasValue(mmcfD: number, system: GasUnitSystem): number {
  return system === 'metric' ? mmcfD * MMCF_TO_MMM3 : mmcfD
}

/** Compact display string for a MMcf/d figure in the selected system. */
export function formatGas(mmcfD: number, system: GasUnitSystem, locale = 'es-AR'): string {
  const v = gasValue(mmcfD, system)
  const abs = Math.abs(v)
  // Per-well metric values are sub-1 (e.g. 0.0028 MMm³/d) — formatCompact would
  // round them to "0", so keep two significant figures instead.
  if (abs > 0 && abs < 1) return v.toPrecision(2).replace('.', decimalMark(locale))
  return formatCompact(v, locale)
}
