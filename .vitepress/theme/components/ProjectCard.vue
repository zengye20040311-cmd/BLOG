<script setup lang="ts">
defineProps<{
  title: string;
  summary: string;
  stack: string;
  href: string;
  status?: string;
}>();
</script>

<template>
  <a class="project-card" :href="href">
    <div class="project-card__meta">
      <span>{{ status || "Active" }}</span>
      <span>{{ stack }}</span>
    </div>
    <h3>{{ title }}</h3>
    <p>{{ summary }}</p>
    <span class="project-card__cta">查看详情</span>
  </a>
</template>
