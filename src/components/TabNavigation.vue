<script setup lang="ts">
import { computed } from 'vue';

// Define props
const props = defineProps<{
  activeTab: string;
  tabs: Array<{
    id: string;
    label: string;
    hint?: string;
  }>;
}>();

// Define emits
const emit = defineEmits<{
  'change-tab': [tabId: string];
}>();

// Index of the active step; drives positional done/active/upcoming states.
const activeIndex = computed(() =>
  props.tabs.findIndex(tab => tab.id === props.activeTab)
);

// Haptic feedback utility
const hapticFeedback = {
  // Check if vibration is supported
  isSupported: () => {
    return 'vibrate' in navigator;
  },

  // Short vibration for tab change
  shortVibration: () => {
    if (hapticFeedback.isSupported()) {
      navigator.vibrate(40);
    }
  }
};

// Function to handle tab change
const changeTab = (tabId: string) => {
  if (tabId !== props.activeTab) {
    emit('change-tab', tabId);
    hapticFeedback.shortVibration();
  }
};
</script>

<template>
  <nav class="step-nav" role="tablist" aria-label="Build steps">
    <div class="track">
      <template v-for="(tab, i) in tabs" :key="tab.id">
        <button
          class="step"
          :class="{ done: i < activeIndex, active: i === activeIndex }"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`${tab.id}-panel`"
          :aria-label="`Step ${i + 1} of ${tabs.length}: ${tab.label}`"
          @click="changeTab(tab.id)"
        >
          <span class="dot">
            <svg v-if="i < activeIndex" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="text">
            <span class="label">{{ tab.label }}</span>
            <span v-if="tab.hint" class="hint">{{ tab.hint }}</span>
          </span>
        </button>
        <span
          v-if="i < tabs.length - 1"
          class="line"
          :class="{ done: i < activeIndex }"
        ></span>
      </template>
    </div>
  </nav>
</template>

<style scoped>
.step-nav {
  width: 100%;
  background-color: var(--bg-panel);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-xl);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 18px 24px;
}

.track {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto;
  align-items: center;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #2c2c2c;
  border: 1px solid #3a3a3a;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.dot {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid var(--border-color);
  color: var(--text-muted);
  background: transparent;
  transition: all 0.25s ease;
}

.text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  text-align: left;
}

.label {
  font-weight: 600;
  font-size: 0.98rem;
  color: var(--text-light);
  transition: color 0.2s ease;
}

.hint {
  font-size: 0.72rem;
  color: #666;
  margin-top: 2px;
  transition: color 0.2s ease;
}

.line {
  height: 2px;
  min-width: 0;
  margin: 0 12px;
  border-radius: 2px;
  background: var(--border-color);
  transition: background 0.3s ease;
}

.line.done {
  background: var(--primary-color);
}

/* Hover */
.step:hover {
  background: #343434;
  border-color: #4a4a4a;
  transform: translateY(-1px);
}

.step:hover .label {
  color: var(--text-color);
}

.step:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 4px;
  border-radius: 4px;
}

/* Completed step */
.step.done .dot {
  background: rgba(33, 150, 243, 0.15);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.step.done .label {
  color: var(--text-light);
}

/* Current step */
.step.active {
  background: rgba(33, 150, 243, 0.12);
  border-color: rgba(33, 150, 243, 0.55);
}

.step.active .dot {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
  box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.25);
}

.step.active .label {
  color: var(--text-color);
}

.step.active .hint {
  color: var(--primary-color);
}

/* Mobile: stack dot over wrapped label, connector becomes a background bar */
@media (max-width: 560px) {
  .step-nav {
    padding: 14px 10px;
  }

  .track {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
  }

  /* connector drawn behind the chips so it never affects layout width */
  .track::before {
    content: "";
    position: absolute;
    top: 26px;
    left: 46px;
    right: 46px;
    height: 2px;
    background: var(--border-color);
    z-index: 0;
  }

  .step {
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 92px;
    z-index: 1;
  }

  .text {
    text-align: center;
    align-items: center;
  }

  .label {
    font-size: 0.72rem;
    line-height: 1.15;
  }

  .hint {
    display: none;
  }

  .dot {
    width: 34px;
    height: 34px;
    font-size: 0.95rem;
  }

  .line {
    display: none;
  }
}
</style>
