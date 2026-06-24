<script setup lang="ts">
const items = [
  { label: "RL", value: 90 },
  { label: "Agent", value: 86 },
  { label: "Python", value: 88 },
  { label: "LLM", value: 82 },
  { label: "C++", value: 70 },
  { label: "Infra", value: 68 },
];

const center = 160;
const radius = 112;
const levels = 4;

function point(angle: number, value: number) {
  const r = (radius * value) / 100;
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: center + Math.cos(rad) * r,
    y: center + Math.sin(rad) * r,
  };
}

const polygon = items
  .map((item, index) => {
    const angle = (360 / items.length) * index;
    const { x, y } = point(angle, item.value);
    return `${x},${y}`;
  })
  .join(" ");

const axes = items.map((item, index) => {
  const angle = (360 / items.length) * index;
  const end = point(angle, 100);
  const label = point(angle, 118);
  return {
    ...item,
    x1: center,
    y1: center,
    x2: end.x,
    y2: end.y,
    labelX: label.x,
    labelY: label.y,
  };
});

const rings = Array.from({ length: levels }, (_, index) => {
  const scale = ((index + 1) / levels) * 100;
  return items
    .map((_, itemIndex) => {
      const angle = (360 / items.length) * itemIndex;
      const { x, y } = point(angle, scale);
      return `${x},${y}`;
    })
    .join(" ");
});
</script>

<template>
  <div class="skill-radar">
    <svg viewBox="0 0 320 320" role="img" aria-label="Skill radar chart">
      <polygon
        v-for="ring in rings"
        :key="ring"
        :points="ring"
        class="skill-radar__ring"
      />
      <line
        v-for="axis in axes"
        :key="axis.label"
        :x1="axis.x1"
        :y1="axis.y1"
        :x2="axis.x2"
        :y2="axis.y2"
        class="skill-radar__axis"
      />
      <polygon :points="polygon" class="skill-radar__shape" />
      <circle cx="160" cy="160" r="4" class="skill-radar__center" />
      <text
        v-for="axis in axes"
        :key="`${axis.label}-text`"
        :x="axis.labelX"
        :y="axis.labelY"
        text-anchor="middle"
        class="skill-radar__label"
      >
        {{ axis.label }}
      </text>
    </svg>
    <div class="skill-radar__legend">
      <div v-for="item in items" :key="item.label">
        <strong>{{ item.label }}</strong>
        <span>{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>
