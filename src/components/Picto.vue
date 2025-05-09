<script setup lang="ts">
// Define the props for the component
interface PictoItem {
  full_url: string;
  name: string;
  type: string;
  effect: string;
  cost: number;
  attributes: Array<{
    level: string;
    attributes: Record<string, string>;
  }>;
}

// Define the props with validation
const props = defineProps<{
  picto: PictoItem;
  searchQuery?: string;
}>();

// Compute the border color based on the picto type
const typeColor = computed(() => {
  const type = props.picto.type.toLowerCase();

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

// State for modal visibility
const showModal = ref(false);

// Function to toggle modal visibility
const toggleModal = () => {
  showModal.value = !showModal.value;
};

// Function to close the modal
const closeModal = () => {
  showModal.value = false;
};

// Import necessary Vue functions
import { computed, ref } from 'vue';
</script>

<template>
  <div class="picto-card" :style="{ borderColor: typeColor }">
    <div class="picto-header">
      <div class="picto-name-container">
        <div class="picto-name" v-html="highlightMatch(picto.name, searchQuery || '')"></div>
        <div class="picto-type" v-if="picto.type">{{ picto.type }}</div>
      </div>
      <div class="picto-cost">
        <img src="../assets/lumina.png" alt="Lumina" class="lumina-icon" /> {{ picto.cost }}
      </div>
    </div>
    <div class="picto-effect" v-html="highlightMatch(picto.effect, searchQuery || '')"></div>
    <div
      class="picto-footer clickable"
      v-if="picto.attributes && picto.attributes.length > 0"
      @click="toggleModal"
    >
      <div class="picto-level">
        <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        Level {{ picto.attributes[picto.attributes.length - 1].level }}
      </div>
      <div class="picto-attributes">
        <span
          v-for="(value, key) in picto.attributes[picto.attributes.length - 1].attributes"
          :key="key"
          class="attribute-item"
        >
          <span class="attribute-name">{{ key }}:</span> {{ value }}
        </span>
      </div>
    </div>

    <!-- Modal for displaying all levels -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ picto.name }} - Levels</h3>
          <button class="close-button" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-for="(levelData, index) in picto.attributes" :key="index" class="level-section">
            <div class="level-row">
              <div class="level-number">Level {{ levelData.level }}</div>
              <div class="level-attributes">
                <div v-for="(value, key) in levelData.attributes" :key="key" class="level-attribute-item">
                  <span class="attribute-name">{{ key }}:</span> {{ value }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picto-card {
  border: 4px solid;
  border-radius: 5px;
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

.picto-cost {
  color: #ccc;
  font-size: 1.2rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.lumina-icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
  margin-right: -5px;
}

.picto-type {
  font-size: 0.75rem;
  color: #aaa;
  margin-bottom: 2px;
  text-align: left;
}

.picto-effect {
  margin: 0;
  font-size: 1.1rem;
  flex-grow: 1;
  color: #ddd;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
}

.picto-footer {
  margin-top: 3px;
  display: flex;
  justify-content: space-between;
  border-top: 1px dotted #444;
  padding-top: 3px;
}

.clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.picto-level {
  font-size: 0.8rem;
  color: #bbb;
  text-align: left;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-icon {
  color: #888;
  margin-right: 2px;
  transition: color 0.2s;
}

.clickable:hover .info-icon {
  color: #aaa;
}

.picto-attributes {
  font-size: 0.75rem;
  color: #aaa;
  text-align: right;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
  max-width: 70%;
}

.attribute-item {
  display: inline-block;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 2px;
}

.attribute-name {
  font-weight: bold;
  color: #ccc;
}

:deep(.highlight) {
  background-color: rgba(255, 255, 0, 0.3);
  color: #fff;
  font-weight: bold;
  border-radius: 2px;
  padding: 0 2px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #333;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid #555;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #444;
  background-color: #2a2a2a;
  border-radius: 8px 8px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.2rem;
}

.close-button {
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.close-button:hover {
  color: #fff;
}

.modal-body {
  padding: 16px;
}

.level-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #444;
}

.level-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.level-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.level-number {
  font-weight: bold;
  font-size: 1rem;
  color: #fff;
  min-width: 80px;
  padding: 4px 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  text-align: center;
}

.level-attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.level-attribute-item {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}
</style>
