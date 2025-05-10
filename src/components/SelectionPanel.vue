<script setup lang="ts">
import { computed, ref } from 'vue';

// Haptic feedback utility
const hapticFeedback = {
  // Check if vibration is supported
  isSupported: () => {
    return 'vibrate' in navigator;
  },

  // Strong vibration for reset action
  strongVibration: () => {
    if (hapticFeedback.isSupported()) {
      navigator.vibrate(100);
    }
  },

  // Progress vibration for reset progress
  progressVibration: () => {
    if (hapticFeedback.isSupported()) {
      navigator.vibrate(10);
    }
  }
};

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
  id?: string; // Unique ID (e.g., "picto-1")
  numeric_id?: number; // The numeric ID from the JSON file
}

// Define the props with validation
const props = defineProps<{
  allPictos: PictoItem[];
  pictoSelectedPictos: string[];
  luminaSelectedPictos: string[];
  selectedLevels: Record<string, string>;
  comment?: string;
}>();

// Define emits
const emit = defineEmits(['reset-all', 'update-comment']);

// Reset button state
const isResetting = ref(false);
const resetProgress = ref(0);
const resetTimer = ref<number | null>(null);
const resetDuration = 500; // milliseconds
const resetInterval = 10; // update progress every 10ms
const isResetComplete = ref(false); // Track if reset was completed
const lastProgressVibration = ref(0); // Track last vibration time

// Function to handle reset button press
const startReset = (event: Event) => {
  // Prevent default behavior to avoid text selection
  event.preventDefault();

  // If reset was just completed, ignore new presses for a short time
  if (isResetComplete.value) {
    return;
  }

  isResetting.value = true;
  resetProgress.value = 0;
  lastProgressVibration.value = 0;

  // Clear any existing timer
  if (resetTimer.value !== null) {
    clearInterval(resetTimer.value);
  }

  // Start a new timer to update progress
  resetTimer.value = setInterval(() => {
    resetProgress.value += (resetInterval / resetDuration) * 100;

    // Provide haptic feedback at 25%, 50%, 75% progress points
    const progressMilestones = [25, 50, 75];
    const currentProgress = Math.floor(resetProgress.value);

    // Check if we've hit a milestone and haven't vibrated recently
    if (progressMilestones.includes(currentProgress) &&
        currentProgress > lastProgressVibration.value) {
      hapticFeedback.progressVibration();
      lastProgressVibration.value = currentProgress;
    }

    // If we've reached 100%, trigger the reset
    if (resetProgress.value >= 100) {
      completeReset();
    }
  }, resetInterval);
};

// Function to handle reset button release
const cancelReset = () => {
  // If reset was just completed, don't cancel
  if (isResetComplete.value) {
    return;
  }

  isResetting.value = false;
  resetProgress.value = 0;

  // Clear the timer
  if (resetTimer.value !== null) {
    clearInterval(resetTimer.value);
    resetTimer.value = null;
  }
};

// Function to complete the reset
const completeReset = () => {
  // Clear the timer
  if (resetTimer.value !== null) {
    clearInterval(resetTimer.value);
    resetTimer.value = null;
  }

  // Set the complete flag to prevent immediate re-triggering
  isResetComplete.value = true;

  // Provide strong haptic feedback for reset completion
  hapticFeedback.strongVibration();

  // Emit the reset event
  emit('reset-all');

  // Reset the button state after a delay
  setTimeout(() => {
    isResetting.value = false;
    resetProgress.value = 0;

    // Allow new reset after a short delay
    setTimeout(() => {
      isResetComplete.value = false;
    }, 300);
  }, 200); // Short delay to show the completed state
};

// Get the selected pictos objects from their IDs
const selectedPictos = computed(() => {
  return props.pictoSelectedPictos.map(id => {
    const picto = props.allPictos.find(p => p.id === id);
    return picto;
  }).filter(Boolean) as PictoItem[];
});

// Get the selected luminas objects from their IDs
const selectedLuminas = computed(() => {
  return props.luminaSelectedPictos
    .map(id => {
      const picto = props.allPictos.find(p => p.id === id);
      return picto;
    }).filter(Boolean) as PictoItem[];
});

// Calculate the total attributes of all selected pictos
const totalPictoAttributes = computed(() => {
  const totals: Record<string, number> = {};

  selectedPictos.value.forEach(picto => {
    // Find the selected level for this picto, or use the highest level
    const selectedLevel = props.selectedLevels[picto.id || ''] ||
      picto.attributes[picto.attributes.length - 1].level;

    // Find the attributes for the selected level
    const levelData = picto.attributes.find(attr => attr.level === selectedLevel);

    if (levelData) {
      // Add each attribute to the totals
      Object.entries(levelData.attributes).forEach(([key, value]) => {
        // Convert the value to a number, removing any non-numeric characters (like % in "Critical Rate")
        const numValue = parseFloat(value.replace(/[^0-9.]/g, ''));

        if (!isNaN(numValue)) {
          if (totals[key]) {
            totals[key] += numValue;
          } else {
            totals[key] = numValue;
          }
        }
      });
    }
  });

  return totals;
});

// Calculate the total cost of all selected luminas
const totalLuminaCost = computed(() => {
  return selectedLuminas.value.reduce((total, picto) => {
    return total + picto.cost;
  }, 0);
});

// Get the current attributes for a picto based on its selected level
const getPictoAttributes = (picto: PictoItem) => {
  const selectedLevel = props.selectedLevels[picto.id || ''] ||
    picto.attributes[picto.attributes.length - 1].level;

  const levelData = picto.attributes.find(attr => attr.level === selectedLevel);
  return levelData ? levelData.attributes : {};
};

// Get the current level for a picto
const getPictoLevel = (picto: PictoItem) => {
  return props.selectedLevels[picto.id || ''] ||
    picto.attributes[picto.attributes.length - 1].level;
};

// Comment modal state
const showCommentModal = ref(false);
const commentText = ref('');

// Function to open the comment modal
const openCommentModal = () => {
  commentText.value = props.comment || '';
  showCommentModal.value = true;

  // Provide haptic feedback
  hapticFeedback.progressVibration();
};

// Function to close the comment modal
const closeCommentModal = () => {
  showCommentModal.value = false;
};

// Function to save the comment
const saveComment = () => {
  emit('update-comment', commentText.value);
  closeCommentModal();

  // Provide haptic feedback for save action
  hapticFeedback.strongVibration();
};
</script>

<template>
  <div class="selection-panel">
    <div class="buttons-container">
      <button
        class="reset-button"
        :class="{ 'resetting': isResetting, 'reset-complete': isResetComplete }"
        @mousedown.prevent="startReset($event)"
        @mouseup="cancelReset"
        @mouseleave="cancelReset"
        @touchstart.prevent="startReset($event)"
        @touchend="cancelReset"
        @touchcancel="cancelReset"
      >
        <div class="reset-button-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>{{ isResetting ? 'Hold to Reset...' : 'Reset All Selections' }}</span>
        </div>
        <div class="reset-progress" :style="{ width: resetProgress + '%' }"></div>
      </button>

      <button class="comment-button" @click="openCommentModal">
        <div class="comment-button-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span>{{ props.comment ? 'Edit Comment' : 'Add Comment' }}</span>
        </div>
      </button>
    </div>
    <!-- Picto Selected Section -->
    <div class="panel-section">
      <h2 class="section-title">Picto Selected ({{ selectedPictos.length }})</h2>

      <div v-if="selectedPictos.length === 0" class="empty-message">
        <div class="empty-icon">👆</div>
        <div class="empty-title">No pictos selected</div>
        <div class="empty-instruction">Press and hold (200ms) on a picto card to select it as a picto. This will remove it from the lumina list if it was there.</div>
      </div>

      <div v-else>
        <!-- Selected Pictos List -->
        <div class="selected-items">
          <div v-for="picto in selectedPictos" :key="picto.id" class="selected-item">
            <div class="item-header">
              <div class="item-name">{{ picto.name }}</div>
            </div>
            <div class="item-effect">{{ picto.effect }}</div>
            <div class="item-attributes">
              <div class="item-level">Level {{ getPictoLevel(picto) }}</div>
              <div class="attributes-list">
                <span v-for="(value, key) in getPictoAttributes(picto)" :key="key" class="attribute-item">
                  <span class="attribute-name">{{ key }}:</span> {{ value }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Attributes -->
        <div class="total-section">
          <h3>Total Attributes</h3>
          <div class="total-attributes">
            <div v-for="(value, key) in totalPictoAttributes" :key="key" class="total-attribute-item">
              <span class="attribute-name">{{ key }}:</span>
              <span class="attribute-value">{{ key.includes('Rate') || key.includes('Chance') ? value + '%' : value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lumina Selected Section -->
    <div class="panel-section">
      <h2 class="section-title">Lumina Selected ({{ selectedLuminas.length }})</h2>

      <div v-if="selectedLuminas.length === 0" class="empty-message">
        <div class="empty-icon">👇</div>
        <div class="empty-title">No luminas selected</div>
        <div class="empty-instruction">Click on a picto card to select it as a lumina. A picto cannot be in both lists at the same time.</div>
      </div>

      <div v-else>
        <!-- Selected Luminas List -->
        <div class="selected-items">
          <div v-for="picto in selectedLuminas" :key="picto.id" class="selected-item lumina-item">
            <div class="item-header">
              <div class="item-name">{{ picto.name }}</div>
              <div class="item-cost">
                <img src="../assets/lumina.png" alt="Lumina" class="lumina-icon" /> {{ picto.cost }}
              </div>
            </div>
            <div class="item-effect">{{ picto.effect }}</div>
          </div>
        </div>

        <!-- Total Cost -->
        <div class="total-section">
          <h3>Total Cost</h3>
          <div class="total-cost">
            <img src="../assets/lumina.png" alt="Lumina" class="lumina-icon" /> {{ totalLuminaCost }}
          </div>
        </div>
      </div>
    </div>

    <!-- Comment Modal -->
    <teleport to="body">
      <div v-if="showCommentModal" class="modal-overlay" @click.self="closeCommentModal">
        <div class="comment-modal">
          <div class="modal-header">
            <h3>Add Comment</h3>
            <button class="close-button" @click="closeCommentModal">&times;</button>
          </div>
          <div class="modal-body">
            <textarea
              v-model="commentText"
              class="comment-textarea"
              placeholder="Which character is it for... which weapon to use..."
              rows="5"
            ></textarea>
          </div>
          <div class="modal-footer">
            <button class="save-button" @click="saveComment">Save</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.selection-panel {
  background-color: #222;
  border-radius: 5px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.reset-button {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  width: 100%;
  overflow: hidden;
  height: 40px;
  /* Prevent text selection */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.comment-button {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  width: 100%;
  overflow: hidden;
  height: 40px;
  /* Prevent text selection */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.reset-button-content, .comment-button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  padding: 0 12px;
  position: relative;
  z-index: 2;
  /* Prevent text selection */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  pointer-events: none; /* This prevents text selection but allows button clicks */
}

.reset-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 100%;
  width: 0;
  background-color: rgba(0, 0, 0, 0.2);
  transition: width 0.01s linear;
  z-index: 1;
}

.reset-button:hover {
  background-color: #f44336;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.comment-button:hover {
  background-color: #1976d2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.reset-button.resetting {
  background-color: #c62828;
}

/* No visual change for reset-complete state */

.reset-button:active, .comment-button:active {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Mobile-specific styles */
@media (max-width: 768px) {
  .reset-button, .comment-button {
    height: 48px; /* Larger touch target on mobile */
    font-size: 16px;
  }

  .reset-button-content, .comment-button-content {
    gap: 8px;
  }

  .reset-button-content svg, .comment-button-content svg {
    width: 18px;
    height: 18px;
  }
}

.panel-section {
  border-bottom: 1px solid #444;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.panel-section:first-child {
  flex: 1;
  max-height: none;
  overflow: visible;
}

.panel-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  font-size: 1.1rem;
  margin-bottom: 16px;
  color: #ddd;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: #555;
  margin-right: 8px;
  border-radius: 2px;
}

.empty-message {
  color: #aaa;
  text-align: center;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.empty-title {
  font-weight: 600;
  color: #ddd;
  font-size: 1.1rem;
}

.empty-instruction {
  font-style: italic;
  font-size: 0.9rem;
  max-width: 80%;
  line-height: 1.4;
}

.selected-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  flex: 1;
}

.selected-item {
  background-color: #333;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-header {
  display: flex;
  align-items: center;
  width: 100%;
}

.item-name {
  font-weight: bold;
  color: #fff;
}

.item-effect {
  font-size: 0.9rem;
  color: #ddd;
  margin: 4px 0;
}

.item-attributes {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #bbb;
}

.item-level {
  font-weight: 500;
}

.attributes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.attribute-item {
  background-color: #444;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
}

.attribute-name {
  font-weight: 500;
  color: #aaa;
}

.item-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  color: #ffcc00;
  margin-left: auto;
}

.lumina-icon {
  width: 16px;
  height: 16px;
}

.total-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #444;
}

.total-section h3 {
  font-size: 1rem;
  margin-bottom: 8px;
  color: #fff;
}

.total-attributes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.total-attribute-item {
  background-color: #444;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.attribute-value {
  font-weight: 500;
  color: #fff;
}

.total-cost {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffcc00;
}

/* Scrollbar styling */
.selection-panel::-webkit-scrollbar {
  width: 6px;
}

.selection-panel::-webkit-scrollbar-track {
  background: #333;
}

.selection-panel::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.selection-panel::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* Comment Modal Styles */
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

.comment-modal {
  background-color: #333;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid #555;
  animation: modal-appear 0.2s ease-out;
  overflow: hidden;
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
  padding: 0;
}

.comment-textarea {
  width: 100%;
  background-color: #222;
  color: #fff;
  border: none;
  padding: 16px;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  box-sizing: border-box;
}

.comment-textarea:focus {
  outline: none;
  background-color: #1e1e1e;
}

.modal-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #444;
  background-color: #2a2a2a;
}

.save-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button:hover {
  background-color: #1976d2;
}

</style>
