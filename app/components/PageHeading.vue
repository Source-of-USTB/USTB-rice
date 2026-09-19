<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="mb-8 flex flex-col gap-2">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-3xl leading-tight font-bold text-highlighted">
        {{ title }}
      </h1>
      <slot name="actions" />
    </div>

    <p
      v-if="description"
      class="m-0 text-muted"
    >
      {{ description }}
    </p>
  </div>
</template>
