// Malaysia Personal Income Tax (YA 2024) progressive brackets
// Brackets are defined by upper bound and rate; baseTax is cumulative tax for income up to the previous bracket upper bound.
// Amounts in RM.

type Bracket = {
  upTo: number | null // null = no upper bound
  rate: number // e.g. 0.25 for 25%
  baseTax: number // cumulative tax for previous brackets
  lowerBound: number // inclusive lower bound of this bracket
}

// Construct brackets using the table provided.
const BRACKETS: Bracket[] = [
  // A: 0 - 5,000 at 0%
  { lowerBound: 0, upTo: 5_000, rate: 0.0, baseTax: 0 },
  // B: 5,001 - 20,000 next 15,000 at 1%, cumulative after first 5,000 => 150
  { lowerBound: 5_000, upTo: 20_000, rate: 0.01, baseTax: 0 },
  // C: 20,001 - 35,000 next 15,000 at 3%, cumulative after first 20,000 => 150
  { lowerBound: 20_000, upTo: 35_000, rate: 0.03, baseTax: 150 },
  // D: 35,001 - 50,000 next 15,000 at 6%, cumulative after first 35,000 => 600
  { lowerBound: 35_000, upTo: 50_000, rate: 0.06, baseTax: 600 },
  // E: 50,001 - 70,000 next 20,000 at 11%, cumulative after first 50,000 => 1,500
  { lowerBound: 50_000, upTo: 70_000, rate: 0.11, baseTax: 1_500 },
  // F: 70,001 - 100,000 next 30,000 at 19%, cumulative after first 70,000 => 3,700
  { lowerBound: 70_000, upTo: 100_000, rate: 0.19, baseTax: 3_700 },
  // G: 100,001 - 400,000 next 300,000 at 25%, cumulative after first 100,000 => 9,400
  { lowerBound: 100_000, upTo: 400_000, rate: 0.25, baseTax: 9_400 },
  // H: 400,001 - 600,000 next 200,000 at 26%, cumulative after first 400,000 => 84,400
  { lowerBound: 400_000, upTo: 600_000, rate: 0.26, baseTax: 84_400 },
  // I: 600,001 - 2,000,000 next 1,400,000 at 28%, cumulative after first 600,000 => 136,400
  { lowerBound: 600_000, upTo: 2_000_000, rate: 0.28, baseTax: 136_400 },
  // J: 2,000,001+ next ringgit at 30%, cumulative after first 2,000,000 => 528,400
  { lowerBound: 2_000_000, upTo: null, rate: 0.3, baseTax: 528_400 },
]

/**
 * Compute annual personal income tax for Malaysia (YA 2024) given chargeable income.
 * chargeableIncome: annual income after reliefs (RM)
 */
export function computeAnnualTax(
  chargeableIncome: number,
  opts?: { applySelfRebate?: boolean; spouseRebate?: boolean },
): number {
  // Use exact decimals; do not floor to avoid systematic underestimation
  const ci = Math.max(0, chargeableIncome)
  if (ci <= 5_000) return 0

  const bracket = BRACKETS.find((b) =>
    b.upTo == null ? ci > b.lowerBound : ci > b.lowerBound && ci <= b.upTo,
  )
  if (!bracket) return 0

  const taxableInBracket =
    (bracket.upTo == null ? ci : Math.min(ci, bracket.upTo)) - bracket.lowerBound
  let tax = bracket.baseTax + taxableInBracket * bracket.rate

  // Resident individual rebate: if chargeable income <= 35,000, rebate up to RM400 (self)
  // Optional spouse rebate (additional RM400) can be applied by setting spouseRebate: true
  const applySelf = opts?.applySelfRebate !== false // default true
  const spouse = opts?.spouseRebate === true
  if (ci <= 35_000 && (applySelf || spouse)) {
    const rebate = (applySelf ? 400 : 0) + (spouse ? 400 : 0)
    tax = Math.max(0, tax - rebate)
  }
  return tax
}

/**
 * Convenience: estimate monthly MTD/PCB as annual tax / 12.
 */
export function estimateMonthlyTaxFromAnnualChargeable(
  chargeableIncome: number,
  opts?: { applySelfRebate?: boolean; spouseRebate?: boolean },
): number {
  return computeAnnualTax(chargeableIncome, opts) / 12
}

/**
 * Build chargeable income from monthly salary and annual reliefs.
 * Assumptions (approximation for planning):
 *  - Annual Gross = monthlyGross * 12
 *  - Annual Reliefs provided directly by user, optionally including EPF/SOCSO/EIS totals
 */
export function buildAnnualChargeableIncome(
  monthlyGross: number,
  annualReliefs: number,
  opts?: {
    epfMonthly?: number
    socsoMonthly?: number
    eisMonthly?: number
  },
): number {
  const annualGross = Math.max(0, monthlyGross) * 12
  let totalReliefs = Math.max(0, annualReliefs)

  // Approximate statutory reliefs (YA 2024 typical caps; planner estimate only):
  // - EPF (employee contribution) relief typically capped (commonly RM7,000 for EPF+Life historically).
  //   We conservatively cap EPF at RM7,000 here.
  // - SOCSO+EIS combined relief capped around RM350.
  // These caps can change; adjust if needed for accuracy.
  if (opts?.epfMonthly != null) {
    const epfAnnual = Math.max(0, opts.epfMonthly) * 12
    totalReliefs += Math.min(epfAnnual, 7_000)
  }
  if (opts?.socsoMonthly != null || opts?.eisMonthly != null) {
    const socsoEisAnnual =
      (Math.max(0, opts?.socsoMonthly ?? 0) + Math.max(0, opts?.eisMonthly ?? 0)) * 12
    totalReliefs += Math.min(socsoEisAnnual, 350)
  }

  return Math.max(0, annualGross - totalReliefs)
}
