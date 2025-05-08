<script setup lang="ts">
// Define the props for the component
interface PictoItem {
  Pictos: string;
  Level: number | string;
  Type: string;
  Lumina: string;
  "Stat Bonus": string[];
}

// Define the props with validation
const props = defineProps<{
  picto: PictoItem;
  searchQuery?: string;
}>();

// Compute the border color based on the picto type
const typeColor = computed(() => {
  const type = props.picto.Type.toLowerCase();

  if (type.includes('offensive')) return '#ff5252'; // Vibrant red
  if (type.includes('defensive')) return '#4caf50'; // Vibrant green
  if (type.includes('support')) return '#2196f3'; // Vibrant blue

  return '#9e9e9e'; // Default gray
});

// Function to highlight matched text
const highlightMatch = (text: string, query: string) => {
  if (!query || query.trim() === '') return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerText.includes(lowerQuery)) return text;

  const startIndex = lowerText.indexOf(lowerQuery);
  const endIndex = startIndex + lowerQuery.length;

  const before = text.substring(0, startIndex);
  const match = text.substring(startIndex, endIndex);
  const after = text.substring(endIndex);

  return `${before}<span class="highlight">${match}</span>${after}`;
};

// Import necessary Vue functions
import { computed } from 'vue';
</script>

<template>
  <div class="picto-card" :style="{ borderColor: typeColor }">
    <div class="picto-header">
      <div class="picto-name-container">
        <div class="picto-name" v-html="highlightMatch(picto.Pictos, searchQuery || '')"></div>
        <div class="picto-type" v-if="picto.Type">{{ picto.Type }}</div>
      </div>
      <div class="picto-level">Lvl {{ picto.Level }}</div>
    </div>
    <div class="picto-lumina" v-html="highlightMatch(picto.Lumina, searchQuery || '')"></div>
    <div class="picto-stats">
      <div v-for="(stat, index) in picto['Stat Bonus']" :key="index" class="stat-item">{{ stat }}</div>
    </div>
  </div>
</template>

<style scoped>
.picto-card {
  border: 3px solid #ddd;
  padding: 6px;
  height: 100%;
  font-size: 0.85rem;
  display: flex;
  flex-direction: column;
  background-color: #222;
  color: #fff;
}

.picto-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.picto-name-container {
  display: flex;
  flex-direction: column;
}

.picto-name {
  font-weight: bold;
  color: #fff;
  font-size: 0.9rem;
  margin-bottom: 1px;
}

.picto-level {
  color: #ccc;
  font-size: 0.8rem;
}

.picto-type {
  font-size: 0.75rem;
  color: #aaa;
  margin-bottom: 2px;
  text-align: left;
}

.picto-lumina {
  margin: 3px 0;
  font-size: 0.8rem;
  flex-grow: 1;
  color: #ddd;
}

.picto-stats {
  margin-top: 3px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  border-top: 1px dotted #444;
  padding-top: 3px;
}

.stat-item {
  font-size: 0.75rem;
  color: #bbb;
  margin-right: 6px;
}

:deep(.highlight) {
  background-color: rgba(255, 255, 0, 0.3);
  color: #fff;
  font-weight: bold;
  border-radius: 2px;
  padding: 0 2px;
}
</style>
