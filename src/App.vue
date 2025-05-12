<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import pictosList from './assets/pictos_list.json'
import charactersList from './assets/characters.json'
import Picto from './components/Picto.vue'
import SelectionPanel from './components/SelectionPanel.vue'
import PanelToggleButton from './components/PanelToggleButton.vue'
import HowToUse from './components/HowToUse.vue'
import CharacterSelector from './components/CharacterSelector.vue'
import SkillSelector from './components/SkillSelector.vue'
import CharacterSkillsPanel from './components/CharacterSkillsPanel.vue'
import TabNavigation from './components/TabNavigation.vue'
import type { AppState, PictoItem, Character } from './types'

// URL handling utilities with compact encoding

/**
 * Encodes the complete app state into a compact URL-friendly string
 * Then converts to base64 for even more compactness
 */
const encodeStateToURL = (state: AppState): string => {
  // Check if there's any state to encode
  const hasLevels = Object.keys(state.selectedLevels).length > 0;
  const hasLuminaSelected = state.luminaSelectedPictos.length > 0;
  const hasPictoSelected = state.pictoSelectedPictos.length > 0;
  const hasComment = state.comment && state.comment.trim() !== '';
  const hasBuildTitle = state.buildTitle && state.buildTitle.trim() !== '';
  const hasCharacter = state.selectedCharacterId !== undefined;
  const hasSkills = state.selectedSkillIds && state.selectedSkillIds.length > 0;

  if (!hasLevels && !hasLuminaSelected && !hasPictoSelected && !hasComment && !hasBuildTitle && !hasCharacter && !hasSkills) {
    return '';
  }

  // Create a compact representation of the state
  const stateObj: Record<string, any> = {};

  // Add selected levels if any
  if (hasLevels) {
    stateObj.l = Object.entries(state.selectedLevels).map(([id, level]) => {
      // Extract the numeric part from the picto ID (e.g., "picto-42" -> "42")
      const idNumber = id.split('-')[1] || id;
      return `${idNumber}:${level}`;
    }).join(',');
  }

  // Add lumina selected pictos if any
  if (hasLuminaSelected) {
    stateObj.ls = state.luminaSelectedPictos.map(id => {
      // Extract the numeric part from the picto ID
      return id.split('-')[1] || id;
    }).join(',');
  }

  // Add picto selected pictos if any
  if (hasPictoSelected) {
    stateObj.ps = state.pictoSelectedPictos.map(id => {
      // Extract the numeric part from the picto ID
      return id.split('-')[1] || id;
    }).join(',');
  }

  // Add selected character ID if any
  if (hasCharacter) {
    stateObj.ch = state.selectedCharacterId;
  }

  // Add selected skill IDs if any
  if (hasSkills && state.selectedSkillIds) {
    stateObj.sk = state.selectedSkillIds.join(',');
  }

  // Add comment if any
  if (hasComment) {
    stateObj.c = state.comment;
  }

  // Add build title if any
  if (hasBuildTitle) {
    stateObj.t = state.buildTitle;
  }

  // Convert to JSON and then to base64
  return btoa(JSON.stringify(stateObj));
};

/**
 * Decodes a compact URL-friendly string back into the complete app state
 */
const decodeStateFromURL = (): AppState => {
  // Default empty state
  const emptyState: AppState = {
    selectedLevels: {},
    luminaSelectedPictos: [],
    pictoSelectedPictos: [],
    comment: '',
    buildTitle: '',
    selectedCharacterId: undefined,
    selectedSkillIds: []
  };

  // Get the current URL hash (without the # symbol)
  const hash = window.location.hash.substring(1);

  if (!hash) return emptyState;

  try {
    // Decode from base64
    const jsonString = atob(hash);

    // Parse the JSON
    const stateObj = JSON.parse(jsonString);

    // Initialize result with empty state
    const result: AppState = { ...emptyState };

    // Parse selected levels if present
    if (stateObj.l) {
      const levelPairs = stateObj.l.split(',');
      levelPairs.forEach((pair: string) => {
        const [idNumber, level] = pair.split(':');
        if (idNumber && level) {
          // Reconstruct the full picto ID
          const pictoId = `picto-${idNumber}`;
          result.selectedLevels[pictoId] = level;
        }
      });
    }

    // Parse lumina selected pictos if present
    if (stateObj.ls) {
      const idNumbers = stateObj.ls.split(',');
      result.luminaSelectedPictos = idNumbers.map((idNumber: string) =>
        `picto-${idNumber}`
      );
    }

    // Parse picto selected pictos if present
    if (stateObj.ps) {
      const idNumbers = stateObj.ps.split(',');
      result.pictoSelectedPictos = idNumbers.map((idNumber: string) =>
        `picto-${idNumber}`
      );
    }

    // Parse selected character ID if present
    if (stateObj.ch !== undefined) {
      result.selectedCharacterId = Number(stateObj.ch);
    }

    // Parse selected skill IDs if present
    if (stateObj.sk) {
      result.selectedSkillIds = stateObj.sk.split(',').map((id: string) => Number(id));
    }

    // Parse comment if present
    if (stateObj.c) {
      result.comment = stateObj.c;
    }

    // Parse build title if present
    if (stateObj.t) {
      result.buildTitle = stateObj.t;
    }

    return result;
  } catch (error) {
    console.error('Error decoding state from URL:', error);
    return emptyState;
  }
};

// Update URL without page reload
const updateURL = (state: AppState) => {
  const encodedState = encodeStateToURL(state);
  // Only update if there's something to encode
  if (encodedState) {
    window.location.hash = encodedState;
  } else if (window.location.hash) {
    // Clear hash if no state
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }
};

// PictoItem interface is already imported at the top of the file

// Create reactive references
const searchQuery = ref('')
const selectedType = ref('all')
const sortBy = ref('name') // Default sort by name
const allPictos = ref<PictoItem[]>([])
const allCharacters = ref<Character[]>([])
const selectedLevels = ref<Record<string, string>>({})
const luminaSelectedPictos = ref<string[]>([]) // Array of picto IDs selected for lumina
const pictoSelectedPictos = ref<string[]>([]) // Array of picto IDs selected as pictos
const selectedCharacterId = ref<number | undefined>(undefined) // ID of the selected character
const selectedSkillIds = ref<number[]>([]) // Array of skill IDs selected for the character
const isPanelVisible = ref(false) // Track if the side panel is visible on mobile
const showOnlySelected = ref(false) // Track if we should show only selected elements
const comment = ref('') // Comment about the build
const buildTitle = ref('') // Title for the build
const showHowToUse = ref(false) // Track if the how to use modal is visible
const activeTab = ref('character') // Track the active tab: 'character', 'picto', or 'summary'

// Function to toggle the panel visibility on mobile
const togglePanelVisibility = () => {
  isPanelVisible.value = !isPanelVisible.value;
}

// Function to toggle the how to use modal
const toggleHowToUse = () => {
  showHowToUse.value = !showHowToUse.value;
}

// Function to handle tab changes
const handleTabChange = (tabId: string) => {
  activeTab.value = tabId;
}

// Function to handle character selection
const handleCharacterSelect = (characterId: number) => {
  // If the same character is selected, deselect it
  if (selectedCharacterId.value === characterId) {
    selectedCharacterId.value = undefined;
    selectedSkillIds.value = [];
  } else {
    selectedCharacterId.value = characterId;
    // Clear selected skills when changing character
    selectedSkillIds.value = [];
  }

  // Update the URL with the new state
  saveStateToURL();
}

// Function to toggle skill selection
const toggleSkillSelection = (skillId: number) => {
  const index = selectedSkillIds.value.indexOf(skillId);

  if (index !== -1) {
    // Remove the skill if it's already selected
    selectedSkillIds.value.splice(index, 1);
  } else {
    // Add the skill if it's not already selected
    selectedSkillIds.value.push(skillId);
  }

  // Update the URL with the new state
  saveStateToURL();
}

// Function to save the current state to the URL
const saveStateToURL = () => {
  const state: AppState = {
    selectedLevels: selectedLevels.value,
    luminaSelectedPictos: luminaSelectedPictos.value,
    pictoSelectedPictos: pictoSelectedPictos.value,
    comment: comment.value,
    buildTitle: buildTitle.value,
    selectedCharacterId: selectedCharacterId.value,
    selectedSkillIds: selectedSkillIds.value
  };
  updateURL(state);
};

// Function to reset all selections and levels
const resetAll = () => {
  // Clear all selected levels
  selectedLevels.value = {};

  // Clear all selected pictos
  luminaSelectedPictos.value = [];
  pictoSelectedPictos.value = [];

  // Clear character and skill selections
  selectedCharacterId.value = undefined;
  selectedSkillIds.value = [];

  // Clear comment and build title
  comment.value = '';
  buildTitle.value = '';

  // Update the URL to reflect the empty state
  saveStateToURL();

  // Log the reset action
  console.log('All selections, levels, comments, and build title have been reset');
};

// Function to update the comment and build title
const updateCommentAndTitle = (newComment: string, newBuildTitle: string) => {
  comment.value = newComment;
  buildTitle.value = newBuildTitle;
  saveStateToURL();
};

// Load data on component mount
onMounted(() => {
  // Make a deep copy of the pictos data to avoid reference issues
  const pictos = JSON.parse(JSON.stringify(pictosList))

  // Use the existing IDs from the JSON file
  allPictos.value = pictos.map((picto: any) => {
    // Store the numeric ID from the JSON file
    const numericId = picto.id;

    return {
      ...picto,
      numeric_id: numericId, // Store the numeric ID
      id: `picto-${numericId}` // Create the string ID for UI references
    };
  })

  // Load characters data
  allCharacters.value = JSON.parse(JSON.stringify(charactersList));

  // Load any saved state from URL
  const savedState = decodeStateFromURL();
  selectedLevels.value = savedState.selectedLevels;
  luminaSelectedPictos.value = savedState.luminaSelectedPictos;
  pictoSelectedPictos.value = savedState.pictoSelectedPictos;
  comment.value = savedState.comment || '';
  buildTitle.value = savedState.buildTitle || '';

  // Load character and skill selections if present
  if (savedState.selectedCharacterId !== undefined) {
    selectedCharacterId.value = savedState.selectedCharacterId;
    // Set active tab to character if a character is selected
    activeTab.value = 'character';
  }

  if (savedState.selectedSkillIds && savedState.selectedSkillIds.length > 0) {
    selectedSkillIds.value = savedState.selectedSkillIds;
  }

  // Check if there are any selections
  const hasSelections = luminaSelectedPictos.value.length > 0 ||
                        pictoSelectedPictos.value.length > 0 ||
                        selectedCharacterId.value !== undefined ||
                        selectedSkillIds.value.length > 0;

  if (hasSelections) {
    // Set the active tab based on what's selected
    if (selectedCharacterId.value !== undefined) {
      activeTab.value = 'character';
    } else if (luminaSelectedPictos.value.length > 0 || pictoSelectedPictos.value.length > 0) {
      activeTab.value = 'picto';
    } else {
      activeTab.value = 'summary';
    }

    // Check if we're on mobile (screen width <= 768px)
    const isMobile = window.innerWidth <= 768;

    if (isMobile && activeTab.value === 'picto') {
      // Show the panel view on mobile only in picto tab
      isPanelVisible.value = true;
    }
  }
})

// Function to handle level selection from a picto
const handleLevelSelect = (pictoId: string, level: string) => {
  // Update the selected level for this picto
  selectedLevels.value = {
    ...selectedLevels.value,
    [pictoId]: level
  };

  // Update the URL with the new state
  saveStateToURL();
};

// Watch for changes in the URL hash
watch(() => window.location.hash, () => {
  // Update all state when the URL hash changes
  const savedState = decodeStateFromURL();
  selectedLevels.value = savedState.selectedLevels;
  luminaSelectedPictos.value = savedState.luminaSelectedPictos;
  pictoSelectedPictos.value = savedState.pictoSelectedPictos;
  comment.value = savedState.comment || '';
  buildTitle.value = savedState.buildTitle || '';

  // Update character and skill selections
  selectedCharacterId.value = savedState.selectedCharacterId;
  selectedSkillIds.value = savedState.selectedSkillIds || [];

  // Set active tab based on selections
  if (savedState.selectedCharacterId !== undefined) {
    activeTab.value = 'character';
  } else if (luminaSelectedPictos.value.length > 0 || pictoSelectedPictos.value.length > 0) {
    activeTab.value = 'picto';
  } else {
    activeTab.value = 'summary';
  }

  // Check if there are any selections
  const hasSelections = luminaSelectedPictos.value.length > 0 ||
                        pictoSelectedPictos.value.length > 0 ||
                        selectedCharacterId.value !== undefined ||
                        selectedSkillIds.value.length > 0;

  if (hasSelections) {
    // Check if we're on mobile (screen width <= 768px)
    const isMobile = window.innerWidth <= 768;

    if (isMobile && activeTab.value === 'picto') {
      // Show the panel view on mobile only in picto tab
      isPanelVisible.value = true;
    }
  } else {
    // If there are no selections, reset to default views
    isPanelVisible.value = false;
  }
});

// Function to handle picto selection for lumina
const toggleLuminaSelection = (pictoId: string) => {
  // Check if the picto is already selected for lumina
  const index = luminaSelectedPictos.value.indexOf(pictoId);

  // Check if the picto is in the picto selected list
  const pictoIndex = pictoSelectedPictos.value.indexOf(pictoId);

  // If it's in the picto list, unselect it from the picto list
  if (pictoIndex !== -1) {
    pictoSelectedPictos.value.splice(pictoIndex, 1);
    // Save state to URL
    saveStateToURL();
    return;
  }

  if (index === -1) {
    // If not selected, add it to the lumina selection
    luminaSelectedPictos.value.push(pictoId);
  } else {
    // If already selected, remove it from the lumina selection
    luminaSelectedPictos.value.splice(index, 1);
  }

  // Log the current selections to the console
  console.log('Lumina Selected Pictos:', luminaSelectedPictos.value);
  console.log('Picto Selected Pictos:', pictoSelectedPictos.value);

  // Save state to URL
  saveStateToURL();
};

// Function to handle picto selection via long press (200ms)
const togglePictoSelection = (pictoId: string) => {
  // Check if the picto is already selected as a picto
  const index = pictoSelectedPictos.value.indexOf(pictoId);

  // Check if the picto is in the lumina selected list
  const luminaIndex = luminaSelectedPictos.value.indexOf(pictoId);

  if (index === -1) {
    // If not selected, add it to the picto selection
    pictoSelectedPictos.value.push(pictoId);

    // If it was in the lumina list, remove it
    if (luminaIndex !== -1) {
      luminaSelectedPictos.value.splice(luminaIndex, 1);
    }
  } else {
    // If already selected, remove it from the picto selection
    pictoSelectedPictos.value.splice(index, 1);
  }

  // Log the current selections to the console
  console.log('Lumina Selected Pictos:', luminaSelectedPictos.value);
  console.log('Picto Selected Pictos:', pictoSelectedPictos.value);

  // Save state to URL
  saveStateToURL();
};

// Extract unique types from pictos list
const pictoTypes = computed(() => {
  // Start with 'all' and add the three basic types
  const types = new Set<string>(['all', 'Offensive', 'Defensive', 'Support'])

  // Extract all unique types for reference
  const allUniqueTypes = new Set<string>()
  allPictos.value.forEach(picto => {
    if (picto.type) {
      allUniqueTypes.add(picto.type)
    }
  })

  // Make sure we have at least one picto of each basic type before adding it to the options
  const hasOffensive = Array.from(allUniqueTypes).some(type =>
    type.toLowerCase().includes('offensive'))
  const hasDefensive = Array.from(allUniqueTypes).some(type =>
    type.toLowerCase().includes('defensive'))
  const hasSupport = Array.from(allUniqueTypes).some(type =>
    type.toLowerCase().includes('support'))

  // Only include types that exist in the data
  if (!hasOffensive) types.delete('Offensive')
  if (!hasDefensive) types.delete('Defensive')
  if (!hasSupport) types.delete('Support')

  return Array.from(types)
})

// Computed property for total count
const totalCount = computed(() => allPictos.value.length)

// Create a computed property for filtered pictos
const filteredPictos = computed(() => {
  // Start with all pictos
  let result = [...allPictos.value]

  // Apply selected elements filter if enabled
  if (showOnlySelected.value) {
    const selectedIds = [...luminaSelectedPictos.value, ...pictoSelectedPictos.value];
    result = result.filter(picto => selectedIds.includes(picto.id || ''));
  }

  // Apply type filter
  if (selectedType.value !== 'all') {
    result = result.filter(picto => {
      if (!picto.type) return false;

      // Check if the picto type contains the selected type
      // This will match both exact types and combined types (e.g., "offensive / support")
      return picto.type.toLowerCase().includes(selectedType.value.toLowerCase());
    })
  }

  // Apply search filter (only name or effect)
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(picto =>
      picto.name.toLowerCase().includes(query) ||
      picto.effect.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  if (sortBy.value === 'name') {
    // Sort alphabetically by name (A-Z)
    result.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy.value === 'name-desc') {
    // Sort alphabetically by name (Z-A)
    result.sort((a, b) => b.name.localeCompare(a.name))
  } else if (sortBy.value === 'level') {
    // Sort by level (Low-High)
    result.sort((a, b) => {
      // Get the highest level from attributes array
      const getMaxLevel = (picto: PictoItem) => {
        if (!picto.attributes || picto.attributes.length === 0) return 0;
        return parseInt(picto.attributes[picto.attributes.length - 1].level);
      };

      return getMaxLevel(a) - getMaxLevel(b);
    })
  } else if (sortBy.value === 'level-desc') {
    // Sort by level (High-Low)
    result.sort((a, b) => {
      // Get the highest level from attributes array
      const getMaxLevel = (picto: PictoItem) => {
        if (!picto.attributes || picto.attributes.length === 0) return 0;
        return parseInt(picto.attributes[picto.attributes.length - 1].level);
      };

      return getMaxLevel(b) - getMaxLevel(a);
    })
  }

  return result
})
</script>

<template>
  <div class="container">
    <header>
      <h1>Expedition 33 Builds</h1>
      <p class="site-description">Create, customize, and share your Expedition 33 character builds with Pictos and Luminas</p>
      <button class="how-to-use-button" @click="toggleHowToUse">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        How to Use
      </button>
    </header>

    <!-- Tab Navigation -->
    <TabNavigation
      :activeTab="activeTab"
      :tabs="[
        { id: 'character', label: 'Character', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
        { id: 'picto', label: 'Pictos', icon: 'M4 3h16a2 2 0 0 1 2 2v6a10 10 0 0 1-10 10A10 10 0 0 1 2 11V5a2 2 0 0 1 2-2z M8 10h.01 M12 10h.01 M16 10h.01' },
        { id: 'summary', label: 'Summary', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' }
      ]"
      @change-tab="handleTabChange"
    />

    <!-- Character Tab -->
    <div v-if="activeTab === 'character'" class="tab-content character-tab">
      <CharacterSelector
        :characters="allCharacters"
        :selectedCharacterId="selectedCharacterId"
        @select-character="handleCharacterSelect"
      />

      <SkillSelector
        :character="selectedCharacterId ? allCharacters.find(c => c.id === selectedCharacterId) : null"
        :selectedSkillIds="selectedSkillIds"
        :maxSkills="6"
        @toggle-skill="toggleSkillSelection"
      />
    </div>

    <!-- Picto Tab -->
    <div v-if="activeTab === 'picto'" class="tab-content picto-tab">
      <nav class="filters-container" :class="{ 'hidden-on-mobile': isPanelVisible }" aria-label="Picto filters">
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search by name or effect..."
            class="search-input"
          />
        </div>

        <div class="filter-controls">
          <div class="type-filter">
            <label for="type-select">Filter by Type:</label>
            <select id="type-select" v-model="selectedType" class="filter-select">
              <option value="all">All Types</option>
              <option v-for="type in pictoTypes.filter(t => t !== 'all')" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <div class="sort-filter">
            <label for="sort-select">Sort by:</label>
            <select id="sort-select" v-model="sortBy" class="filter-select">
              <option value="name">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="level">Level (Low-High)</option>
              <option value="level-desc">Level (High-Low)</option>
            </select>
          </div>

          <div class="selected-filter">
            <label for="selected-toggle" class="toggle-label">
              <span>Show Selected Only</span>
              <div class="toggle-switch">
                <input
                  type="checkbox"
                  id="selected-toggle"
                  v-model="showOnlySelected"
                  class="toggle-input"
                />
                <span class="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
      </nav>

      <div class="results-info" :class="{ 'hidden-on-mobile': isPanelVisible }">
        <span v-if="showOnlySelected">
          Showing {{ filteredPictos.length }} selected pictos
          <span class="selected-count">
            ({{ luminaSelectedPictos.length }} lumina, {{ pictoSelectedPictos.length }} picto)
          </span>
        </span>
        <span v-else-if="filteredPictos.length === totalCount">
          Showing all {{ totalCount }} pictos
        </span>
        <span v-else>
          Showing {{ filteredPictos.length }} of {{ totalCount }} pictos
        </span>
      </div>

      <div class="pictos-grid" :class="{ 'hidden-on-mobile': isPanelVisible }" aria-label="Picto cards">
        <Picto
          v-for="picto in filteredPictos"
          :key="picto.id"
          :picto="picto"
          :searchQuery="searchQuery"
          :selectedLevel="selectedLevels[picto.id || '']"
          :isLuminaSelected="luminaSelectedPictos.includes(picto.id || '')"
          :isPictoSelected="pictoSelectedPictos.includes(picto.id || '')"
          @select-level="handleLevelSelect"
          @toggle-selection="toggleLuminaSelection"
          @toggle-picto-selection="togglePictoSelection"
        />
      </div>
    </div>

    <!-- Summary Tab -->
    <div v-if="activeTab === 'summary'" class="tab-content summary-tab">
      <div class="summary-container">
        <SelectionPanel
          :allPictos="allPictos"
          :pictoSelectedPictos="pictoSelectedPictos"
          :luminaSelectedPictos="luminaSelectedPictos"
          :selectedLevels="selectedLevels"
          :comment="comment"
          :buildTitle="buildTitle"
          @reset-all="resetAll"
          @update-comment-and-title="updateCommentAndTitle"
        />

        <CharacterSkillsPanel
          v-if="selectedCharacterId !== undefined"
          :characters="allCharacters"
          :selectedCharacterId="selectedCharacterId"
          :selectedSkillIds="selectedSkillIds"
          @remove-skill="toggleSkillSelection"
        />
      </div>
    </div>

    <!-- Mobile Panel Toggle Button (only visible on picto tab) -->
    <PanelToggleButton
      v-if="activeTab === 'picto'"
      :isPanelVisible="isPanelVisible"
      @toggle-panel="togglePanelVisibility"
    />

    <footer class="site-footer">
      <p>Expedition 33 Builds - Picto Builder Tool</p>
      <p>A fan-made tool for creating and sharing character builds</p>
      <p>Made in Paris "la Ville Lumière", France 🇫🇷</p>
      <p class="error-report">
        Found an error? Contact
        <a href="mailto:expedition33builds@proton.me?subject=Error%20Report%20-%20Picto%20Builder&body=I%20found%20an%20error%20on%20the%20Picto%20Builder%20website%3A%0A%0ADescription%20of%20the%20error%3A%0A%0ASteps%20to%20reproduce%3A%0A%0ABrowser%20and%20device%3A" target="_blank" rel="noopener noreferrer">
          expedition33builds@proton.me
        </a>
      </p>
    </footer>

    <!-- How To Use Modal -->
    <teleport to="body">
      <div v-if="showHowToUse" class="modal-overlay" @click.self="toggleHowToUse">
        <div class="how-to-use-modal">
          <div class="modal-header">
            <h3>How to Use the Expedition 33 Builder</h3>
            <button class="close-button" @click="toggleHowToUse">&times;</button>
          </div>
          <div class="modal-body">
            <HowToUse />
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* Background color already set in style.css */

header {
  text-align: center;
  margin-bottom: 24px;
  position: relative;
}

h1 {
  margin-bottom: 8px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.site-description {
  color: #aaa;
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 24px;
}

.how-to-use-button {
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto;
}

.how-to-use-button:hover {
  background-color: #1976d2;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.how-to-use-modal {
  background-color: #333;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 1px solid #555;
  animation: modal-appear 0.2s ease-out;
}

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

.site-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #444;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
}

.site-footer p {
  margin: 5px 0;
}

.error-report {
  margin-top: 15px !important;
  font-size: 0.85rem;
}

.error-report {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

/* Character section styles */
/* Tab content styles */
.tab-content {
  margin-bottom: 24px;
}

.character-tab,
.picto-tab,
.summary-tab {
  animation: fadeIn 0.3s ease;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.character-tab {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Summary tab styles */
.summary-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* Picto grid styles for tab layout */
.pictos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 16px;
  row-gap: 28px;
  margin-top: 16px;
}

@media (max-width: 1200px) {
  .pictos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .pictos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .pictos-grid {
    grid-template-columns: 1fr;
  }
}

.error-report::before {
  content: "⚠️";
  font-size: 1rem;
}

.error-report a {
  color: #2196f3;
  text-decoration: none;
  transition: color 0.2s ease;
  font-weight: 500;
}

.error-report a:hover {
  color: #64b5f6;
  text-decoration: underline;
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.search-container {
  flex: 1;
  min-width: 300px;
  max-width: 500px;
  display: flex;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 10px 16px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 16px;
  background-color: #333;
  color: #fff;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.search-input::placeholder {
  color: #aaa;
}

.search-input:focus {
  border-color: #666;
  box-shadow: 0 0 0 2px rgba(100, 100, 100, 0.5);
}

.filter-controls {
  display: flex;
  gap: 16px;
  flex-wrap: nowrap;
  justify-content: flex-end;
}

.type-filter, .sort-filter, .selected-filter, .reset-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-filter label, .sort-filter label, .selected-filter label {
  color: #ddd;
  font-weight: 500;
  white-space: nowrap;
}

/* Toggle switch styles */
.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #444;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: #2196F3;
}

.toggle-input:focus + .toggle-slider {
  box-shadow: 0 0 1px #2196F3;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.filter-select {
  padding: 10px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 16px;
  background-color: #333;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  min-width: 140px;
}

.filter-select:hover {
  background-color: #444;
  border-color: #555;
}

.filter-select:focus {
  border-color: #666;
  box-shadow: 0 0 0 2px rgba(100, 100, 100, 0.5);
}

.filter-select option {
  background-color: #333;
  color: #fff;
  padding: 8px;
}

.results-info {
  text-align: center;
  margin-bottom: 16px;
  color: #aaa;
  font-size: 0.9rem;
  font-weight: 500;
}

.selected-count {
  color: #2196F3;
  font-weight: 600;
  margin-left: 4px;
}

.main-content {
  display: flex;
  gap: 24px;
  transition: all 0.3s ease;
}

.hidden {
  display: none !important;
}

/* Panel header and toggle styles moved to SelectionPanel.vue */

.pictos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 16px; /* Increased from 8px for better spacing */
  row-gap: 28px;
  flex: 1;
  align-items: stretch; /* Ensure cards stretch to fill their grid cells */
  grid-auto-rows: minmax(200px, auto); /* Set minimum row height */
}

.selection-panel-container {
  width: 320px;
  min-width: 320px;
  height: calc(100vh - 200px);
  position: sticky;
  top: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent container overflow */
}

@media (max-width: 1200px) {
  .pictos-grid {
    grid-template-columns: repeat(3, 1fr);
    row-gap: 28px;
  }

  .selection-panel-container {
    width: 280px;
    min-width: 280px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
    position: relative;
    min-height: 300px;
  }

  .selection-panel-container {
    width: 100%;
    min-width: 100%;
    height: auto;
    max-height: none;
    position: static;
    margin-top: 30px;
    border-top: 1px solid #444;
    padding-top: 20px;
    overflow: visible;
    display: none; /* Hide by default on mobile */
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  /* Hide the full-width toggle on mobile */
  .panel-header {
    display: none;
  }

  /* Mobile panel toggle styles */
  .filters-container, .results-info, .pictos-grid {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .hidden-on-mobile {
    display: none !important;
  }

  .selection-panel-container.visible-on-mobile {
    display: block; /* Show when toggled */
    animation: fadeIn 0.3s ease;
    margin-top: 20px;
    border-top: none;
    padding-top: 0;
    padding-bottom: 80px;
  }

  /* Ensure the title is always visible */
  h1 {
    margin-bottom: 20px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

@media (max-width: 900px) {
  .filters-container {
    justify-content: center;
  }

  .filter-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    align-items: center;
  }

  .search-container {
    min-width: auto;
    width: 100%;
  }

  .filter-controls {
    flex-direction: row;
    gap: 16px;
    width: 100%;
    justify-content: center;
  }

  .type-filter, .sort-filter {
    flex: 1;
    max-width: 250px;
  }

  .filter-select {
    width: 100%;
  }

  .pictos-grid {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 28px;
  }
}

@media (max-width: 600px) {
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .type-filter, .sort-filter, .selected-filter {
    flex-direction: column;
    align-items: flex-start;
    max-width: none;
    width: 100%;
  }

  .toggle-label {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .pictos-grid {
    grid-template-columns: 1fr;
    row-gap: 28px;
  }
}
</style>
