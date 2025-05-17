<script setup lang="ts">
import { computed, ref } from 'vue';
import { highlightPictoNames } from '../utils/commentHighlighter';
import PictoPopover from './PictoPopover.vue';
import CharacterSkillsPanel from './CharacterSkillsPanel.vue';
import type { PictoItem, Character } from '../types';

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
  characters: Character[];
  selectedCharacterId?: number;
  selectedSkillIds: number[];
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
  <div class="summary-panel">
    <!-- Buttons Container -->
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

    <!-- Character and Skills Section -->
    <CharacterSkillsPanel
      :characters="characters"
      :selectedCharacterId="selectedCharacterId"
      :selectedSkillIds="selectedSkillIds"
    />

    <!-- Separator between Character/Skills and Pictos/Luminas -->
    <div class="character-section-separator"></div>

    <!-- Picto Popover -->
    <teleport to="body">
      <PictoPopover
        v-if="showPopover && hoveredPicto"
        :picto="hoveredPicto"
        :position="popoverPosition"
      />
    </teleport>

    <!-- Picto Selected Section -->
    <div class="panel-section first-after-separator">
      <h2 class="section-title no-before">
        <div class="left-aligned-title">
          Pictos
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
          <span class="count-display" :class="{ 'warning': selectedPictos.length > 3 }">({{ selectedPictos.length }}/3)</span>
        </div>
      </h2>

      <div v-if="selectedPictos.length === 0" class="empty-message">
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
      <h2 class="section-title no-before">
        <div class="left-aligned-title">
          Luminas
          <span class="count-display">({{ selectedLuminas.length }})</span>
        </div>
      </h2>

      <div v-if="selectedLuminas.length === 0" class="empty-message">
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
@import '../styles/selection-panel.css';
</style>
