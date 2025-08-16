<script setup lang="ts">
import SalaryCalculator from './components/SalaryCalculator.vue'
</script>

<template>
  <main class="min-h-dvh bg-background text-foreground">
    <!-- Mobile app bar -->
    <header class="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
      <!-- Paint the status bar area (notch) with the same color -->
      <div
        class="pointer-events-none fixed left-0 right-0 top-0 bg-primary"
        style="height: env(safe-area-inset-top);"
        aria-hidden="true"
      />
      <div class="mx-auto w-full max-w-md px-4 py-3" style="padding-top: env(safe-area-inset-top);">
        <h1 class="text-lg font-semibold text-center">Salary Planner/Calculator</h1>
      </div>
    </header>
    <section class="mx-auto w-full max-w-2xl px-4 py-5 sm:py-8">
      <SalaryCalculator />
    </section>
  </main>
</template>

<style scoped>
/* Optional: ensure background also fills under the notch area */
.bg-primary {
  /* Keep Tailwind class behavior; this is only for environments needing env() support */
  background-color: var(--color-primary, inherit);
}
</style>
