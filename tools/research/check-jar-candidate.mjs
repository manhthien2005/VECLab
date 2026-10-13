// Read-only numerical check; not an application engine or a calibrated lab model.
// Alateef et al. (2024), DOI 10.6703/IJASE.202403_21(1).010, CC BY 4.0.
// Table 3: [initial NTU, initial pH, alum mg/L, observed removal %, two paddles].
// Equation 3 uses coded factors. Author-posted full text:
// https://www.researchgate.net/publication/379000836_Initial_turbidity_pH_dosage_of_alum_and_paddles_type_optimization_of_efficiency_removal_by_using_response_surface_methods_RSM
import assert from 'node:assert/strict'

const observed = [
  [125, 7, 150, 62.9], [125, 7, 150, 55.2], [125, 7, 150, 51.6],
  [125, 7, 150, 69.3], [125, 7, 150, 59.1], [125, 7, 150, 60.7],
  [125, 7, 250, 54.1], [50, 7, 150, 65.8], [200, 7, 150, 53.9],
  [125, 7, 50, 51.2], [125, 9, 150, 85.6], [125, 5, 150, 48.2],
  [200, 9, 50, 72.7], [50, 9, 250, 80.2], [50, 5, 250, 33.6],
  [50, 5, 50, 35.6], [200, 9, 250, 71.8], [200, 5, 250, 29.7],
  [50, 9, 50, 78.6], [200, 5, 50, 30.3],
]

function predict(initialNtu, initialPh, doseMgL) {
  const input = [initialNtu, initialPh, doseMgL]
  const bounds = [[50, 200], [5, 9], [50, 250]]
  if (input.some((x, i) => !Number.isFinite(x) || x < bounds[i][0] || x > bounds[i][1])) {
    throw new RangeError('Outside the published candidate domain')
  }
  const a = (initialNtu - 125) / 75
  const b = (initialPh - 7) / 2
  const c = (doseMgL - 150) / 100
  return 60.63 - 3.54 * a + 21.15 * b + 0.10 * c
    - 0.64 * a * b - 0.14 * a * c + 0.41 * b * c
    - 2.04 * a * a + 5.01 * b * b - 9.24 * c * c
}

// Table 9, first twelve published predictions; tolerance only for printed rounding.
const published = [60.63, 60.63, 60.63, 60.63, 60.63, 60.63,
  51.50, 62.14, 55.06, 51.30, 86.80, 44.50]
published.forEach((expected, i) => {
  assert.ok(Math.abs(predict(...observed[i].slice(0, 3)) - expected) <= 0.03)
})
const residuals = observed.map(([ntu, ph, dose, measured]) => predict(ntu, ph, dose) - measured)
const rmse = Math.sqrt(residuals.reduce((sum, x) => sum + x * x, 0) / residuals.length)
const maxAbsoluteResidual = Math.max(...residuals.map(Math.abs))
const grid = []
for (let i = 0; i <= 20; i++) {
  for (let j = 0; j <= 20; j++) {
    for (let k = 0; k <= 20; k++) grid.push(predict(50 + 7.5 * i, 5 + 0.2 * j, 50 + 10 * k))
  }
}
assert.ok(grid.every((x) => Number.isFinite(x) && x >= 0 && x <= 100))
for (const bad of [[201, 7, 150], [125, 4, 150], [125, 7, 0], [NaN, 7, 150]]) {
  assert.throws(() => predict(...bad), RangeError)
}
process.stdout.write(JSON.stringify({
  status: 'Candidate arithmetic reproduced; external validation still absent',
  publishedPredictionsChecked: published.length,
  predictionRoundingTolerancePp: 0.03,
  inSampleRmsePp: +rmse.toFixed(4),
  maximumAbsoluteResidualPp: +maxAbsoluteResidual.toFixed(4),
  gridPointsChecked: grid.length,
  gridEfficiencyRange: [Math.min(...grid), Math.max(...grid)].map((x) => +x.toFixed(4)),
  fixed125NtuExamples: [
    [5, 150], [7, 50], [7, 150], [7, 250], [9, 150],
  ].map(([ph, dose]) => ({ ph, doseMgL: dose, predictedRemovalPercent: +predict(125, ph, dose).toFixed(2) })),
}, null, 2) + '\n')
