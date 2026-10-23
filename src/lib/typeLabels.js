export function formatTypeMultiplier(multiplier) {
  if (multiplier === 0) return 'Immune'
  if ([1, 2, 0.5].includes(multiplier)) return ''
  return `×${multiplier}`
}

export function describeTypeEffectiveness(multiplier) {
  if (multiplier === 0) return 'Immune'
  const description = multiplier > 1 ? 'Superefficace' : multiplier < 1 ? 'Poco efficace' : 'Neutrale'
  const suffix = formatTypeMultiplier(multiplier)
  return suffix ? `${description} ${suffix}` : description
}
