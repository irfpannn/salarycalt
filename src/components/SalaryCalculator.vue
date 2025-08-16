<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { formatMYR, toPct } from '../lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

type Formula = {
  name: string
  needs: number // percent
  wants: number // percent
  savings: number // percent
}

const DEFAULT_FORMULAS: Formula[] = [
  { name: '50 / 30 / 20', needs: 50, wants: 30, savings: 20 },
  { name: '70 / 20 / 10', needs: 70, wants: 20, savings: 10 },
  { name: '60 / 20 / 20', needs: 60, wants: 20, savings: 20 },
]

const showAdvanced = ref(false)

function getDefaultForm() {
  return {
    salary: 0,
    epfRate: 11, // % employee EPF (KWSP)
    socsoRate: 0.5, // % employee SOCSO (Invalidity Scheme)
    socsoCeiling: 6000, // RM wage ceiling applied to rate (approx; configurable)
    eisRate: 0.2, // % Employment Insurance System
    eisCeiling: 6000, // RM wage ceiling
    // Necessities (monthly)
    house: 0,
    car: 0,
    food: 0,
    utilities: 0,
    otherNecessities: 0,
  }
}

const form = reactive(getDefaultForm())

const gross = computed(() => Math.max(0, Number(form.salary) || 0))
const epf = computed(() => gross.value * (form.epfRate / 100))
const socso = computed(() => Math.min(gross.value, form.socsoCeiling) * (form.socsoRate / 100))
const eis = computed(() => Math.min(gross.value, form.eisCeiling) * (form.eisRate / 100))
const totalDeductions = computed(() => epf.value + socso.value + eis.value)
const net = computed(() => Math.max(0, gross.value - totalDeductions.value))

const necessities = computed(() =>
  ['house', 'car', 'food', 'utilities', 'otherNecessities']
    .map((k) => (form as any)[k] as number)
    .reduce((a, b) => a + (Number(b) || 0), 0),
)

const necessityPct = computed(() => (net.value > 0 ? (necessities.value / net.value) * 100 : 0))

const chosenFormula = computed<Formula>(() => {
  // Try to find a preset formula that fits
  const fit = DEFAULT_FORMULAS.slice()
    .sort((a, b) => a.needs - b.needs)
    .find((f) => f.needs >= necessityPct.value)
  if (fit) return fit

  // If none fits, craft a custom one prioritizing at least 10% savings
  const needs = Math.min(100, Math.ceil(necessityPct.value))
  let savings = 20
  if (needs > 70) savings = 10
  let wants = 100 - needs - savings
  if (wants < 0) {
    // Squeeze savings but keep non-negative wants
    savings = Math.max(0, 100 - needs)
    wants = 100 - needs - savings
  }
  return { name: `${needs} / ${wants} / ${savings} (custom)`, needs, wants, savings }
})

const allocations = computed(() => {
  const f = chosenFormula.value
  const needsAmount = (f.needs / 100) * net.value
  const wantsAmount = (f.wants / 100) * net.value
  const savingsAmount = (f.savings / 100) * net.value
  return { needsAmount, wantsAmount, savingsAmount }
})

// Dark mode removed; app is dark by default

function resetForm() {
  Object.assign(form, getDefaultForm())
  showAdvanced.value = false
}

async function sharePlan() {
  const lines = [
    `MYR Salary Plan`,
    `Gross: ${formatMYR(gross.value)}`,
    `Net: ${formatMYR(net.value)}`,
    `Necessities: ${formatMYR(necessities.value)} (${necessityPct.value.toFixed(1)}% of net)`,
    `Suggested formula: ${chosenFormula.value.name}`,
    `Needs: ${formatMYR(allocations.value.needsAmount)}`,
    `Wants: ${formatMYR(allocations.value.wantsAmount)}`,
    `Savings: ${formatMYR(allocations.value.savingsAmount)}`,
  ]
  const text = lines.join('\n')
  try {
    if (navigator.share) {
      await navigator.share({ title: 'MYR Salary Plan', text })
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      alert('Plan copied to clipboard')
    } else {
      alert(text)
    }
  } catch {
    // user cancelled share — no-op
  }
}
</script>

<template>
  <div class="space-y-5 pb-24">
    <!-- Salary & Deductions -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Monthly salary (gross)</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1">
          <div class="grid gap-1">
            <Label class="text-sm text-muted-foreground">Gross salary (before EPF/SOCSO/EIS)</Label>
            <Input
              inputmode="decimal"
              type="number"
              min="0"
              step="50"
              v-model.number="form.salary"
              class="text-base h-12"
              placeholder="e.g. 5000"
            />
          </div>

          <div class="flex items-center justify-between">
            <Button variant="link" class="px-0" @click="showAdvanced = !showAdvanced">
              <span class="mr-1 align-middle">{{ showAdvanced ? '▾' : '▸' }}</span>
              <span class="align-middle">Advanced deduction settings</span>
            </Button>
          </div>

          <div v-if="showAdvanced" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="grid gap-1">
              <Label class="text-sm text-muted-foreground">EPF rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                v-model.number="form.epfRate"
                class="h-12"
              />
            </div>
            <div class="grid gap-1">
              <Label class="text-sm text-muted-foreground">SOCSO rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                v-model.number="form.socsoRate"
                class="h-12"
              />
              <span class="mt-1 block text-xs text-muted-foreground"
                >Applied up to RM {{ form.socsoCeiling.toLocaleString() }}</span
              >
            </div>
            <div class="grid gap-1">
              <Label class="text-sm text-muted-foreground">SOCSO wage ceiling (RM)</Label>
              <Input
                type="number"
                min="0"
                step="50"
                v-model.number="form.socsoCeiling"
                class="h-12"
              />
            </div>
            <div class="grid gap-1">
              <Label class="text-sm text-muted-foreground">EIS rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                v-model.number="form.eisRate"
                class="h-12"
              />
              <span class="mt-1 block text-xs text-muted-foreground"
                >Applied up to RM {{ form.eisCeiling.toLocaleString() }}</span
              >
            </div>
            <div class="grid gap-1">
              <Label class="text-sm text-muted-foreground">EIS wage ceiling (RM)</Label>
              <Input
                type="number"
                min="0"
                step="50"
                v-model.number="form.eisCeiling"
                class="h-12"
              />
            </div>
            <p class="sm:col-span-2 text-xs text-muted-foreground">
              Note: Rates and ceilings are approximate defaults. For official figures, refer to EPF
              (KWSP), PERKESO (SOCSO), and EIS guidance.
            </p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card class="bg-secondary-30 w-full">
            <CardContent class="p-3">
              <div class="flex items-center justify-between text-sm">
                <span>Gross salary</span>
                <span class="font-medium">{{ formatMYR(gross) }}</span>
              </div>
              <div class="mt-2 space-y-1 text-sm text-muted-foreground">
                <div class="flex items-center justify-between">
                  <span>EPF ({{ toPct(form.epfRate) }})</span>
                  <span>-{{ formatMYR(epf) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>SOCSO ({{ toPct(form.socsoRate) }})</span>
                  <span>-{{ formatMYR(socso) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>EIS ({{ toPct(form.eisRate) }})</span>
                  <span>-{{ formatMYR(eis) }}</span>
                </div>
              </div>
              <Separator class="my-2" />
              <div class="text-sm">
                <div class="flex items-center justify-between">
                  <span class="font-medium">Net after deductions</span>
                  <span class="font-semibold">{{ formatMYR(net) }}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="bg-secondary-30 w-full">
            <CardContent class="p-3">
              <div class="text-sm">
                <div class="flex items-center justify-between">
                  <span class="font-medium">Necessities total</span>
                  <span class="font-semibold">{{ formatMYR(necessities) }}</span>
                </div>
                <div class="mt-1 text-muted-foreground">{{ necessityPct.toFixed(1) }}% of net</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>

    <!-- Necessities Input -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Monthly necessities</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">Enter estimated amounts to tailor a formula</p>
        <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="grid gap-1">
            <Label class="text-sm text-muted-foreground">Housing / Rent</Label>
            <Input type="number" min="0" step="10" v-model.number="form.house" />
          </div>
          <div class="grid gap-1">
            <Label class="text-sm text-muted-foreground">Car / Transport</Label>
            <Input type="number" min="0" step="10" v-model.number="form.car" />
          </div>
          <div class="grid gap-1">
            <Label class="text-sm text-muted-foreground">Food & Groceries</Label>
            <Input type="number" min="0" step="10" v-model.number="form.food" />
          </div>
          <div class="grid gap-1">
            <Label class="text-sm text-muted-foreground">Utilities & Bills</Label>
            <Input type="number" min="0" step="10" v-model.number="form.utilities" />
          </div>
          <div class="grid gap-1 sm:col-span-2">
            <Label class="text-sm text-muted-foreground">Other necessities</Label>
            <Input type="number" min="0" step="10" v-model.number="form.otherNecessities" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Recommendation -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Recommended formula</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">Based on your necessities and net income</p>

        <div
          class="mt-3 flex gap-3 overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible"
        >
          <Card
            class="bg-emerald-500/10 border-emerald-500/40 min-w-[70px] max-h-[90px] snap-center sm:min-w-0"
          >
            <CardContent class="px-2">
              <div class="text-xs text-emerald-300">Needs ({{ chosenFormula.needs }}%)</div>
              <div class="mt-1 text-base sm:text-lg font-semibold text-emerald-200">
                {{ formatMYR(allocations.needsAmount) }}
              </div>
            </CardContent>
          </Card>
          <Card
            class="bg-amber-500/10 border-amber-500/40 min-w-[70px] max-h-[90px] snap-center sm:min-w-0"
          >
            <CardContent class="px-2">
              <div class="text-xs text-amber-300">Wants ({{ chosenFormula.wants }}%)</div>
              <div class="mt-1 text-base sm:text-lg font-semibold text-amber-200">
                {{ formatMYR(allocations.wantsAmount) }}
              </div>
            </CardContent>
          </Card>
          <Card
            class="bg-sky-500/10 border-sky-500/40 min-w-[70px] max-h-[90px] snap-center sm:min-w-0"
          >
            <CardContent class="px-2">
              <div class="text-xs text-sky-300">Savings ({{ chosenFormula.savings }}%)</div>
              <div class="mt-1 text-base sm:text-lg font-semibold text-sky-200">
                {{ formatMYR(allocations.savingsAmount) }}
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="mt-3 text-sm">
          <div class="font-medium">Suggested: {{ chosenFormula.name }}</div>
          <ul class="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>We used your necessities share ({{ necessityPct.toFixed(1) }}%) to pick a fit.</li>
            <li>Adjust advanced rates if your EPF/SOCSO/EIS differ.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>

  <!-- Bottom action bar -->
  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-primary/95 text-primary-foreground backdrop-blur supports-[backdrop-filter]:bg-primary/85"
  >
    <div class="mx-auto w-full max-w-md px-4 py-3 flex items-center gap-3">
      <Button variant="outline" class="w-1/2" @click="resetForm">Reset</Button>
      <Button variant="secondary" class="w-1/2" @click="sharePlan">Share plan</Button>
    </div>
  </nav>
</template>

<style scoped></style>
