<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <div class="build-card" @click="handleCardSelect">
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

    <div class="build-card-overlay">
      <div class="overlay-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <span>View Build</span>
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
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(33, 150, 243, 0.15);
}

.build-card:hover .build-card-overlay {
  opacity: 1;
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

.build-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.build-date {
  color: #666;
}

.build-card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(33, 150, 243, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 600;
}

@media (max-width: 768px) {
  .build-card {
    padding: 1rem;
  }

  .build-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
