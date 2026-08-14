/* Tono de Badge para las etiquetas reales de etapa del catálogo minero
   ('Operation', 'Operation Ampliation', 'Construction', 'Feasibility', 'PEA', '—', …). */

export function stageTone(stage: string): 'positive' | 'caution' | 'neutral' {
  if (stage.includes('Operation')) return 'positive'
  if (stage.includes('Construction')) return 'caution'
  return 'neutral'
}
