<script setup lang="ts">
import SalaryCalculator from './components/SalaryCalculator.vue'
</script>

<template>
  <main class="min-h-dvh bg-background text-foreground">
    <!-- Mobile app bar -->
    <header class="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
      <div class="mx-auto w-full max-w-md px-4 py-3">
        <h1 class="text-lg font-semibold text-center">Salary Planner/Calculator</h1>
      </div>
    </header>
    <section class="mx-auto w-full max-w-2xl px-4 py-5 sm:py-8">
      <SalaryCalculator />
    </section>
  </main>
</template>

<style scoped></style>
