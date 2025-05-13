<script setup lang="ts">
import { computed, ref } from 'vue';
import { highlightPictoNames } from '../utils/commentHighlighter';
import PictoPopover from './PictoPopover.vue';
import type { PictoItem } from '../types';

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

// Define the props with validation
const props = defineProps<{
  allPictos: PictoItem[];
  pictoSelectedPictos: string[];
  luminaSelectedPictos: string[];
  selectedLevels: Record<string, string>;
  comment?: string;
  buildTitle?: string;

}>();

// Define emits
const emit = defineEmits(['reset-all', 'update-comment-and-title']);

// Popover state
const showPopover = ref(false);
const hoveredPicto = ref<PictoItem | null>(null);
const popoverPosition = ref({ x: 0, y: 0 });

// Function to handle mouseover events on highlighted picto names
const handlePictoNameHover = (event: MouseEvent) => {
  // Check if we're hovering over a highlighted picto name
  let target = event.target as HTMLElement;

  // If the target itself isn't a highlight, check if any parent is
  // This handles cases where the highlight contains nested elements
  while (target && !target.classList.contains('picto-highlight')) {
    if (target.parentElement === null || target.classList.contains('build-comment-text')) {
      // We've reached the comment container or the root without finding a highlight
      showPopover.value = false;
      return;
    }
    target = target.parentElement;
  }

  // If we didn't find a highlighted element, exit
  if (!target || !target.classList.contains('picto-highlight')) {
    showPopover.value = false;
    return;
  }

  const pictoId = target.getAttribute('data-picto-id');
  if (!pictoId) {
    showPopover.value = false;
    return;
  }

  // Find the picto in the allPictos array
  const picto = props.allPictos.find(p => p.id === pictoId);
  if (!picto) {
    showPopover.value = false;
    return;
  }

  // Set the hovered picto and show the popover
  hoveredPicto.value = picto;
  popoverPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  showPopover.value = true;
};

// Function to handle mouse leave on highlighted picto name
const handlePictoNameLeave = () => {
  // Hide the popover immediately
  showPopover.value = false;
};

// Function to highlight picto names in comment text
const highlightedComment = computed(() => {
  if (!props.comment) return '';
  return highlightPictoNames(props.comment, props.allPictos);
});

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
const buildTitleText = ref('');

// Share modal state
const showShareModal = ref(false);
const isCopied = ref(false);
const copyTimeout = ref<number | null>(null);

// Function to open the comment modal
const openCommentModal = () => {
  commentText.value = props.comment || '';
  buildTitleText.value = props.buildTitle || '';
  showCommentModal.value = true;

  // Provide haptic feedback
  hapticFeedback.progressVibration();
};

// Function to close the comment modal
const closeCommentModal = () => {
  showCommentModal.value = false;
};

// Function to save the comment and build title
const saveComment = () => {
  emit('update-comment-and-title', commentText.value, buildTitleText.value);
  closeCommentModal();

  // Provide haptic feedback for save action
  hapticFeedback.strongVibration();
};

// Function to open the share modal
const openShareModal = () => {
  showShareModal.value = true;

  // Reset copy state
  isCopied.value = false;

  // Provide haptic feedback
  hapticFeedback.progressVibration();
};

// Function to close the share modal
const closeShareModal = () => {
  showShareModal.value = false;
};

// Get the current URL for sharing
const getCurrentUrl = (): string => {
  return window.location.href;
};

// Function to copy URL to clipboard
const copyToClipboard = () => {
  // Get the current URL
  const url = getCurrentUrl();

  // Copy to clipboard
  navigator.clipboard.writeText(url).then(() => {
    // Show success message
    isCopied.value = true;

    // Provide haptic feedback for copy action
    hapticFeedback.strongVibration();

    // Clear any existing timeout
    if (copyTimeout.value !== null) {
      clearTimeout(copyTimeout.value);
    }

    // Reset the copied state after 3 seconds
    copyTimeout.value = setTimeout(() => {
      isCopied.value = false;
      copyTimeout.value = null;
    }, 3000);
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
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
          <span>{{ props.buildTitle || props.comment ? 'Edit Build Details' : 'Add Build Details' }}</span>
        </div>
      </button>

      <!-- Share button -->
      <button class="share-button" @click="openShareModal">
        <div class="share-button-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span>Share Build</span>
        </div>
      </button>


    </div>
    <!-- Build Title and Comment Display (if exists) -->
    <div v-if="props.buildTitle || props.comment" class="build-title-display">
      <h1 v-if="props.buildTitle" class="build-title-text">{{ props.buildTitle }}</h1>
      <p
        v-if="props.comment"
        class="build-comment-text"
        v-html="highlightedComment"
        @mouseover="handlePictoNameHover"
        @mouseleave="handlePictoNameLeave"
      ></p>
    </div>

    <!-- Picto Popover -->
    <teleport to="body">
      <PictoPopover
        v-if="showPopover && hoveredPicto"
        :picto="hoveredPicto"
        :position="popoverPosition"
      />
    </teleport>
    <!-- Picto Selected Section -->
    <div class="panel-section">
      <h2 class="section-title">
        Picto Selected ({{ selectedPictos.length }})
        <span v-if="selectedPictos.length > 3" class="warning-icon" title="A maximum of 3 pictos can be selected in-game">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <div class="warning-tooltip">
            <div class="tooltip-title">Too many pictos selected</div>
            <div class="tooltip-content">
              A maximum of 3 pictos can be selected in-game.
            </div>
          </div>
        </span>
      </h2>

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
              <div class="item-name">
                {{ picto.name }}
                <a
                  v-if="picto.full_url"
                  :href="picto.full_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="item-link"
                  title="Open in new tab"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
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
              <div class="item-name">
                {{ picto.name }}
                <a
                  v-if="picto.full_url"
                  :href="picto.full_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="item-link"
                  title="Open in new tab"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
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
            <h3>Build Details</h3>
            <button class="close-button" @click="closeCommentModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="input-group">
              <label for="build-title">Build Title</label>
              <input
                type="text"
                id="build-title"
                v-model="buildTitleText"
                class="build-title-input"
                placeholder="Enter a title for your build..."
              />
            </div>
            <div class="input-group">
              <label for="build-comment">Comment</label>
              <textarea
                id="build-comment"
                v-model="commentText"
                class="comment-textarea"
                placeholder="Which character is it for... which weapon to use..."
                rows="5"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="save-button" @click="saveComment">Save</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Share Modal -->
    <teleport to="body">
      <div v-if="showShareModal" class="modal-overlay" @click.self="closeShareModal">
        <div class="share-modal">
          <div class="modal-header">
            <h3>Share Build</h3>
            <button class="close-button" @click="closeShareModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="share-instructions">
              <p>Copy this link to share your build with others:</p>
            </div>
            <div class="share-url-container">
              <input
                type="text"
                readonly
                :value="getCurrentUrl()"
                class="share-url-input"
                @click="($event.target as HTMLInputElement).select()"
              />
              <button
                class="copy-button"
                @click="copyToClipboard"
                :class="{ 'copied': isCopied }"
              >
                <span v-if="!isCopied">Copy</span>
                <span v-else>Copied!</span>
              </button>
            </div>
            <div class="share-tips">
              <p>This link contains all your selected pictos, luminas, levels, and build details.</p>
              <p>Anyone with this link can view your build exactly as you've created it.</p>
            </div>
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
  max-height: 100%;
}

/* When in full-width mode, adjust scrolling behavior */
.selection-panel.full-width-panel {
  max-height: none;
  overflow-y: visible;
  height: auto;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.build-title-display {
  padding: 12px 16px;
  background-color: rgba(33, 150, 243, 0.1);
  border-radius: 4px;
  border-left: 3px solid #2196f3;
  margin-bottom: 16px;
}

.build-title-text {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
}

.build-comment-text {
  margin: 0;
  font-size: 0.95rem;
  color: #ccc;
  text-align: center;
  line-height: 1.4;
  white-space: pre-line; /* Preserve line breaks in the comment */
}

/* Styles for highlighted picto names */
:deep(.picto-highlight) {
  color: #2196f3;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 1px dotted #2196f3;
  transition: all 0.2s ease;
}

:deep(.picto-highlight:hover) {
  color: #64b5f6;
  border-bottom-color: #64b5f6;
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

.comment-button, .share-button {
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

.share-button {
  background-color: #4caf50; /* Green color for share button */
}

.share-button:hover {
  background-color: #388e3c;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.reset-button-content, .comment-button-content, .share-button-content, .full-width-button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 100%;
  padding: 0 12px;
  position: relative;
  z-index: 2;
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

.reset-button:active, .comment-button:active, .full-width-toggle:active {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.full-width-toggle {
  position: relative;
  display: flex;
  align-items: center;
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

.expand-button {
  background-color: #2196f3;
}

.expand-button:hover {
  background-color: #1976d2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.collapse-button {
  background-color: #ff9800;
}

.collapse-button:hover {
  background-color: #f57c00;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

/* Mobile-specific styles */
@media (max-width: 768px) {
  .reset-button, .comment-button, .share-button, .full-width-toggle {
    height: 48px; /* Larger touch target on mobile */
    font-size: 16px;
  }

  .reset-button-content, .comment-button-content, .share-button-content, .full-width-button-content {
    gap: 8px;
  }

  .reset-button-content svg, .comment-button-content svg, .share-button-content svg, .full-width-button-content svg {
    width: 18px;
    height: 18px;
  }

  /* Hide the full-width toggle on mobile */
  .full-width-toggle {
    display: none;
  }
}

.panel-section {
  border-bottom: 1px solid #444;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  min-height: min-content; /* Ensure sections take at least their content height */
}

.panel-section:first-child {
  flex: 1;
  max-height: none;
  overflow: visible;
}

/* Adjust panel sections in full-width mode */
.full-width-panel .panel-section {
  overflow: visible;
}

.full-width-panel .panel-section:first-child {
  flex: 0 0 auto;
}

.panel-section:last-child {
  border-bottom: none;
  padding-bottom: 20px; /* Add padding to ensure total cost is visible */
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

.warning-icon {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  color: #ff9800;
  position: relative;
  cursor: pointer;
}

.warning-icon svg {
  width: 16px;
  height: 16px;
}

.warning-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  white-space: normal;
  width: 250px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  margin-top: 8px;
}

.warning-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent #444 transparent;
}

.tooltip-title {
  color: #ff9800;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1rem;
}

.tooltip-content {
  line-height: 1.4;
}

.warning-icon:hover .warning-tooltip {
  opacity: 1;
  visibility: visible;
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

/* Adjust selected items in full-width mode */
.full-width-panel .selected-items {
  flex: 0 0 auto;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  transition: color 0.2s ease;
}

.item-link:hover {
  color: #2196f3;
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

.total-cost .lumina-icon {
  width: 24px;
  height: 24px;
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
  justify-content: center;
  gap: 8px;
  font-size: 1.6rem;
  font-weight: 700;
  color: #ffcc00;
  padding: 8px 0;
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

.comment-modal, .share-modal {
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
  padding: 16px;
}

.input-group {
  margin-bottom: 16px;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #ddd;
  font-size: 0.9rem;
}

.build-title-input {
  width: 100%;
  background-color: #222;
  color: #fff;
  border: none;
  padding: 12px;
  font-size: 1rem;
  border-radius: 4px;
  font-family: inherit;
  box-sizing: border-box;
}

.build-title-input:focus {
  outline: none;
  background-color: #1e1e1e;
}

.comment-textarea {
  width: 100%;
  background-color: #222;
  color: #fff;
  border: none;
  padding: 12px;
  font-size: 1rem;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  box-sizing: border-box;
  border-radius: 4px;
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

/* Share Modal Styles */
.share-instructions {
  margin-bottom: 16px;
}

.share-instructions p {
  margin: 0;
  color: #ddd;
  font-size: 0.95rem;
}

.share-url-container {
  display: flex;
  margin-bottom: 16px;
}

.share-url-input {
  flex: 1;
  background-color: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px 0 0 4px;
  padding: 12px;
  font-size: 0.9rem;
  font-family: monospace;
  outline: none;
}

.share-url-input:focus {
  border-color: #2196f3;
}

.copy-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 0 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.copy-button:hover {
  background-color: #388e3c;
}

.copy-button.copied {
  background-color: #2196f3;
}

.share-tips {
  background-color: rgba(33, 150, 243, 0.1);
  border-radius: 4px;
  padding: 12px;
  border-left: 3px solid #2196f3;
}

.share-tips p {
  margin: 0 0 8px 0;
  color: #bbb;
  font-size: 0.85rem;
  line-height: 1.4;
}

.share-tips p:last-child {
  margin-bottom: 0;
}

/* Mobile-specific styles for share modal */
@media (max-width: 768px) {
  .share-url-container {
    flex-direction: column;
  }

  .share-url-input {
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .copy-button {
    border-radius: 4px;
    width: 100%;
    height: 40px;
  }
}

</style>
