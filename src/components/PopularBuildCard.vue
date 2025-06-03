<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PopularBuild } from '../types'

// Props
const props = defineProps<{
  build: PopularBuild
}>()

// Emits
const emit = defineEmits<{
  select: [build: PopularBuild]
}>()

// Computed properties
const formattedDate = computed(() => {
  if (!props.build.createdAt) return null
  return new Date(props.build.createdAt).toLocaleDateString()
})

const displayTags = computed(() => {
  if (!props.build.tags || props.build.tags.length === 0) return []
  return props.build.tags.slice(0, 3) // Show max 3 tags
})

// Function to handle card click
const handleCardClick = () => {
  emit('select', props.build)
}

// Haptic feedback utility
const hapticFeedback = {
  isSupported: () => 'vibrate' in navigator,
  shortVibration: () => {
    if (hapticFeedback.isSupported()) {
      navigator.vibrate(40)
    }
  }
}

// Function to handle card selection with haptic feedback
const handleCardSelect = () => {
  hapticFeedback.shortVibration()
  handleCardClick()
}

// Reactive state for source button hover
const isSourceHovered = ref(false)

// Function to handle source link click
const handleSourceClick = (event: MouseEvent) => {
  event.stopPropagation() // Prevent card selection when clicking source link
  event.preventDefault() // Prevent any default behavior
  if (props.build.source) {
    window.open(props.build.source, '_blank', 'noopener,noreferrer')
  }
}

// Functions to handle source button hover state
const handleSourceMouseEnter = () => {
  isSourceHovered.value = true
}

const handleSourceMouseLeave = () => {
  isSourceHovered.value = false
}
</script>

<template>
  <div class="build-card" :class="{ 'source-hovered': isSourceHovered }" @click="handleCardSelect">
    <div class="build-card-header">
      <h3 class="build-title">{{ build.title }}</h3>
    </div>

    <div v-if="build.description" class="build-description">
      {{ build.description }}
    </div>

    <div v-if="displayTags.length > 0" class="build-tags">
      <span v-for="tag in displayTags" :key="tag" class="build-tag">
        {{ tag }}
      </span>
    </div>

    <div class="build-footer">
      <div class="build-footer-left">
        <div v-if="build.author" class="build-author">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          {{ build.author }}
        </div>
        <div v-if="formattedDate" class="build-date">
          {{ formattedDate }}
        </div>
      </div>
      <div v-if="build.source" class="build-source">
        <button
          @click.stop="handleSourceClick"
          @mousedown.stop
          @mouseenter="handleSourceMouseEnter"
          @mouseleave="handleSourceMouseLeave"
          class="source-link"
          title="View Source"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          <span class="source-text">Source</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.build-card {
  background-color: #2a2a2a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.build-card:hover {
  border-color: #2196F3;
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(33, 150, 243, 0.2);
}

.build-card:hover .build-title {
  color: #2196F3;
}

.build-card:hover .build-tags .build-tag {
  border-color: #2196F3;
  background-color: rgba(33, 150, 243, 0.1);
}

/* Disable card hover effects when hovering over source button */
.build-card.source-hovered {
  border-color: #333 !important;
  transform: none !important;
  box-shadow: none !important;
}

.build-card.source-hovered .build-title {
  color: #fff !important;
}

.build-card.source-hovered .build-tags .build-tag {
  border-color: #444 !important;
  background-color: #333 !important;
}

.build-card-header {
  margin-bottom: 1rem;
}

.build-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.build-description {
  color: #ccc;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.build-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.build-tag {
  background-color: #333;
  color: #2196F3;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #444;
}

.build-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #888;
  font-size: 0.85rem;
  margin-top: auto;
}

.build-footer-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.build-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.build-date {
  color: #666;
}

.build-source {
  display: flex;
  align-items: center;
}

.source-link {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid #2196F3;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  color: #2196F3;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  position: relative;
  z-index: 10; /* Ensure it's above the card click area */
}

.source-link:hover {
  border-color: #1976D2;
  color: #1976D2;
  background-color: rgba(25, 118, 210, 0.15);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.source-link:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(33, 150, 243, 0.2);
}

.source-text {
  font-size: 0.8rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .build-card {
    padding: 1rem;
  }

  .build-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .build-footer-left {
    width: 100%;
  }

  .build-source {
    align-self: flex-end;
  }

  .source-link {
    padding: 0.75rem 1rem; /* Larger touch target on mobile */
    font-size: 0.85rem;
  }

  .source-text {
    font-size: 0.85rem;
  }
}
</style>
