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
  id?: string; // Optional unique ID
}

// Define the props with validation
const props = defineProps<{
  picto: PictoItem;
  searchQuery?: string;
  selectedLevel?: string; // Add prop for selected level
  isLuminaSelected?: boolean; // Whether this picto is selected for lumina
  isPictoSelected?: boolean; // Whether this picto is selected as a picto
}>();

// Define emits
const emit = defineEmits<{
  'select-level': [pictoId: string, level: string];
  'toggle-selection': [pictoId: string]; // Event for toggling lumina selection
  'toggle-picto-selection': [pictoId: string]; // Event for toggling picto selection
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

// Function to handle level selection
const selectLevel = (level: string) => {
  // Emit event to parent component with picto ID and selected level
  emit('select-level', props.picto.id || '', level);
  // Close the modal after selection
  closeModal();
};

// Compute the current level to display
const currentLevel = computed(() => {
  // If a level is selected via props, use it
  if (props.selectedLevel) {
    // Find the level data that matches the selected level
    const levelData = props.picto.attributes.find(attr => attr.level === props.selectedLevel);
    // If found, return the level, otherwise use the highest level
    return levelData ? props.selectedLevel : props.picto.attributes[props.picto.attributes.length - 1].level;
  }
  // Default to highest level
  return props.picto.attributes[props.picto.attributes.length - 1].level;
});

// Compute the attributes to display based on the current level
const currentAttributes = computed(() => {
  // Find the level data that matches the current level
  const levelData = props.picto.attributes.find(attr => attr.level === currentLevel.value);
  // Return the attributes if found, otherwise empty object
  return levelData ? levelData.attributes : {};
});

// Track press timing for long press detection
const pressTimer = ref<number | null>(null);
const longPressDelay = 200; // milliseconds to wait before treating as long press
const isLongPress = ref(false);
const isPressing = ref(false); // Track if user is currently pressing

// Function to handle mouse/touch down - start timer for long press
const handleMouseDown = (event: Event) => {
  // Stop event propagation
  event.stopPropagation();

  // Set pressing state for visual feedback
  isPressing.value = true;

  // Reset long press flag
  isLongPress.value = false;

  // Start timer for long press
  pressTimer.value = window.setTimeout(() => {
    // This is a long press
    isLongPress.value = true;
    emit('toggle-picto-selection', props.picto.id || '');
    pressTimer.value = null;

    // Keep pressing state active for visual feedback
    isPressing.value = false;
  }, longPressDelay);
};

// Alias for touch start - same behavior as mouse down
const handleTouchStart = handleMouseDown;

// Function to handle mouse up - either trigger click or cancel long press
const handleMouseUp = (event: Event) => {
  // Stop event propagation
  event.stopPropagation();

  // Reset pressing state
  isPressing.value = false;

  // Clear the timer
  if (pressTimer.value !== null) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }

  // If it wasn't a long press, treat as a normal click
  if (!isLongPress.value) {
    emit('toggle-selection', props.picto.id || '');
  }

  // Reset long press flag
  isLongPress.value = false;
};

// Alias for touch end - same behavior as mouse up
const handleTouchEnd = handleMouseUp;

// Function to handle touch cancel - same as mouse leave
const handleTouchCancel = () => {
  // Reset pressing state
  isPressing.value = false;

  // Clear the timer if touch is canceled
  if (pressTimer.value !== null) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }

  // Reset long press flag
  isLongPress.value = false;
};

// Function to handle mouse leave - cancel long press
const handleMouseLeave = () => {
  // Reset pressing state
  isPressing.value = false;

  // Clear the timer if mouse leaves the element
  if (pressTimer.value !== null) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }

  // Reset long press flag
  isLongPress.value = false;
};

// Import necessary Vue functions
import { computed, ref } from 'vue';
</script>

<template>
  <div
    class="picto-card"
    :class="{
      'lumina-selected': isLuminaSelected,
      'picto-selected': isPictoSelected,
      'pressing': isPressing
    }"
    :style="{ borderColor: typeColor }"
    @mousedown="handleMouseDown($event)"
    @mouseup="handleMouseUp($event)"
    @mouseleave="handleMouseLeave()"
    @touchstart="handleTouchStart($event)"
    @touchend="handleTouchEnd($event)"
    @touchcancel="handleTouchCancel()"
  >
    <!-- Selection overlays -->
    <div v-if="isPictoSelected" class="selection-overlay picto-selection-overlay">
      <div class="selection-indicator picto-indicator">Picto Selected</div>
    </div>
    <div v-else-if="isLuminaSelected" class="selection-overlay lumina-selection-overlay">
      <div class="selection-indicator lumina-indicator">Lumina Selected</div>
    </div>
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
      @click.stop="toggleModal"
    >
      <div class="picto-level">
        <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        Level {{ currentLevel }}
      </div>
      <div class="picto-attributes">
        <span
          v-for="(value, key) in currentAttributes"
          :key="key"
          class="attribute-item"
        >
          <span class="attribute-name">{{ key }}:</span> {{ value }}
        </span>
      </div>
    </div>

    <!-- Modal for displaying all levels -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self.stop="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ picto.name }} - Levels</h3>
            <button class="close-button" @click.stop="closeModal">&times;</button>
          </div>
          <div class="modal-body">
            <div v-for="(levelData, index) in picto.attributes" :key="index" class="level-section">
              <div
                class="level-row clickable"
                :class="{ 'selected': levelData.level === currentLevel }"
                @click.stop="selectLevel(levelData.level)"
              >
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
    </teleport>
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
  position: relative; /* For absolute positioning of the overlay */
  cursor: pointer; /* Show pointer cursor to indicate clickability */
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

/* Hover effect for the card */
.picto-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  background-color: #2a2a2a;
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
  z-index: 9999;
}

.modal-content {
  background-color: #333;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid #555;
  animation: modal-appear 0.2s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  max-height: 60vh;
  overflow-y: auto;
}

.level-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #444;
}

.level-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.level-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.level-number {
  font-weight: bold;
  font-size: 1rem;
  color: #fff;
  min-width: 90px;
  padding: 6px 10px;
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
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Selected level styles */
.level-row.selected {
  background-color: rgba(33, 150, 243, 0.3);
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(33, 150, 243, 0.5);
}

.level-row.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
}

.level-row.clickable:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Lumina selection styles */
.picto-card.lumina-selected {
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3);
  background-color: #2d3747; /* Slightly blue-tinted background to distinguish from hover */
  transform: translateY(-2px); /* Keep the same lift effect as hover */
}

/* Ensure hover doesn't override the lumina selected state's background */
.picto-card.lumina-selected:hover {
  background-color: #2d3747;
}

/* Picto selection styles */
.picto-card.picto-selected {
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3);
  background-color: #2d4732; /* Green-tinted background */
  transform: translateY(-2px);
}

/* Ensure hover doesn't override the picto selected state's background */
.picto-card.picto-selected:hover {
  background-color: #2d4732;
}

/* Pressing state for visual feedback during long press */
.picto-card.pressing {
  transform: scale(0.98);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.5);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 2px;
}

.selection-indicator {
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.lumina-indicator {
  background-color: rgba(33, 150, 243, 0.8); /* Blue for lumina */
}

.picto-indicator {
  background-color: rgba(76, 175, 80, 0.8); /* Green for picto */
}
</style>
