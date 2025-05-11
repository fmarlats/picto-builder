<script setup lang="ts">
import { computed } from 'vue';

// Define props
const props = defineProps<{
  isPanelVisible: boolean;
}>();

// Define emits
const emit = defineEmits(['toggle-panel']);

// Haptic feedback utility
const hapticFeedback = {
  // Check if vibration is supported
  isSupported: () => {
    return 'vibrate' in navigator;
  },

  // Short vibration for toggle action
  shortVibration: () => {
    if (hapticFeedback.isSupported()) {
      navigator.vibrate(40);
    }
  }
};

// Function to toggle the panel
const togglePanel = () => {
  emit('toggle-panel');
  hapticFeedback.shortVibration();
};

// Compute the icon based on panel visibility
const buttonIcon = computed(() => {
  return props.isPanelVisible
    ? 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' // Left arrow icon
    : 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z'; // Right arrow icon
});

// Compute the aria label based on panel visibility
const ariaLabel = computed(() => {
  return props.isPanelVisible ? 'Back to pictos list' : 'View selection panel';
});
</script>

<template>
  <button
    class="panel-toggle-button"
    :class="{ 'panel-visible': isPanelVisible }"
    @click="togglePanel"
    :aria-label="ariaLabel"
  >
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path :d="buttonIcon" fill="currentColor" />
    </svg>
  </button>
</template>

<style scoped>
.panel-toggle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #2196f3;
  color: white;
  border: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s ease;
  /* Prevent text selection */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  /* Add a subtle pulse animation to draw attention */
  animation: pulse 2s infinite;
}

.panel-toggle-button:hover {
  background-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.panel-toggle-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* No specific styles needed for panel-visible state */

/* Pulse animation */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(33, 150, 243, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0);
  }
}

/* Hide the button on larger screens */
@media (min-width: 1025px) {
  .panel-toggle-button {
    display: none;
  }
}
</style>
