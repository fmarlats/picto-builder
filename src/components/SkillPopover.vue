<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { SkillItem } from '../types';

// Define props
const props = defineProps<{
  skill: SkillItem;
  position: { x: number; y: number };
}>();

// Popover positioning
const popoverRef = ref<HTMLElement | null>(null);
const popoverPosition = ref({ top: '0px', left: '0px' });

// Calculate and set popover position
const calculatePosition = () => {
  if (!popoverRef.value) return;

  const popover = popoverRef.value;
  const popoverRect = popover.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  // Default position is above the cursor
  let top = props.position.y - popoverRect.height - 10;
  let left = props.position.x - (popoverRect.width / 2);

  // Adjust if popover would go off screen
  if (top < 10) {
    // If not enough space above, position below
    top = props.position.y + 20;
  }

  // Adjust horizontal position if needed
  if (left < 10) {
    left = 10;
  } else if (left + popoverRect.width > viewportWidth - 10) {
    left = viewportWidth - popoverRect.width - 10;
  }

  // Set the position
  popoverPosition.value = {
    top: `${top}px`,
    left: `${left}px`
  };
};

// Set up and clean up
onMounted(() => {
  calculatePosition();
  window.addEventListener('resize', calculatePosition);
});

onUnmounted(() => {
  window.removeEventListener('resize', calculatePosition);
});
</script>

<template>
  <div
    ref="popoverRef"
    class="skill-popover"
    :style="{ top: popoverPosition.top, left: popoverPosition.left }"
  >
    <div class="popover-header">
      <div class="popover-name">{{ skill.name }}</div>
    </div>
    <div class="popover-cost">
      {{ skill.cost }} AP
    </div>
    <div class="popover-effect">{{ skill.effect }}</div>
  </div>
</template>

<style scoped>
.skill-popover {
  position: fixed;
  z-index: 9999;
  background-color: #333;
  border-radius: 6px;
  padding: 12px;
  width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 1px solid #555;
  pointer-events: none; /* Ensures the popover doesn't interfere with mouse events */
  animation: fade-in 0.2s ease-out;
  user-select: none; /* Prevents text selection */
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popover-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.popover-name {
  font-weight: bold;
  color: #fff;
  font-size: 1rem;
}

.popover-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffcc00;
  font-weight: bold;
  margin-bottom: 8px;
}

.popover-effect {
  color: #ddd;
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
