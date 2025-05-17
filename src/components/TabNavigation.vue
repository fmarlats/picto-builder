<script setup lang="ts">
// Define props
const props = defineProps<{
  activeTab: string;
  tabs: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
}>();

// Define emits
const emit = defineEmits<{
  'change-tab': [tabId: string];
}>();

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
  <nav class="tab-navigation" role="tablist" aria-label="Main navigation">
    <div class="tabs-container">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ 'active': activeTab === tab.id }"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`${tab.id}-panel`"
        @click="changeTab(tab.id)"
      >
        <div class="tab-content">
          <svg v-if="tab.icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="overflow: visible;">
            <path :d="tab.icon"></path>
          </svg>
          <span class="tab-label">{{ tab.label }}</span>
        </div>
        <div class="tab-indicator"></div>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tab-navigation {
  width: 100%;
  background-color: #222;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: sticky;
  top: 0;
  z-index: 10;
}

.tabs-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.tab-button {
  flex: 1;
  background: none;
  border: none;
  color: #aaa;
  padding: 16px 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  padding: 4px 0;
}

.tab-button:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.05);
}

.tab-button.active {
  color: #2196F3;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.tab-button.active .tab-indicator {
  background-color: #2196F3;
}

@media (max-width: 768px) {
  .tab-button {
    padding: 12px 8px;
  }

  .tab-label {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .tab-content {
    flex-direction: column;
    gap: 4px;
  }

  .tab-label {
    font-size: 0.8rem;
  }
}
</style>
