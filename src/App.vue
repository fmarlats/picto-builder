<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import pictosList from './assets/pictos_list.json'
import Picto from './components/Picto.vue'
import SelectionPanel from './components/SelectionPanel.vue'
import PanelToggleButton from './components/PanelToggleButton.vue'

// URL handling utilities with compact encoding

// Define interface for the complete app state
interface AppState {
  selectedLevels: Record<string, string>;
  luminaSelectedPictos: string[];
  pictoSelectedPictos: string[];
}

/**
 * Encodes the complete app state into a compact URL-friendly string
 * Then converts to base64 for even more compactness
 */
const encodeStateToURL = (state: AppState): string => {
  // Check if there's any state to encode
  const hasLevels = Object.keys(state.selectedLevels).length > 0;
  const hasLuminaSelected = state.luminaSelectedPictos.length > 0;
  const hasPictoSelected = state.pictoSelectedPictos.length > 0;

  if (!hasLevels && !hasLuminaSelected && !hasPictoSelected) {
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
    pictoSelectedPictos: []
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

// Define the type for a picto item
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

// Create reactive references
const searchQuery = ref('')
const selectedType = ref('all')
const sortBy = ref('name') // Default sort by name
const allPictos = ref<PictoItem[]>([])
const selectedLevels = ref<Record<string, string>>({})
const luminaSelectedPictos = ref<string[]>([]) // Array of picto IDs selected for lumina
const pictoSelectedPictos = ref<string[]>([]) // Array of picto IDs selected as pictos
const isPanelVisible = ref(false) // Track if the side panel is visible on mobile

// Function to toggle the panel visibility
const togglePanelVisibility = () => {
  isPanelVisible.value = !isPanelVisible.value;
}

// Function to save the current state to the URL
const saveStateToURL = () => {
  const state: AppState = {
    selectedLevels: selectedLevels.value,
    luminaSelectedPictos: luminaSelectedPictos.value,
    pictoSelectedPictos: pictoSelectedPictos.value
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

  // Update the URL to reflect the empty state
  saveStateToURL();

  // Log the reset action
  console.log('All selections and levels have been reset');
};

// Load data on component mount
onMounted(() => {
  // Make a deep copy of the data to avoid reference issues
  const pictos = JSON.parse(JSON.stringify(pictosList))

  // Add a unique ID to each picto
  allPictos.value = pictos.map((picto: any, index: number) => ({
    ...picto,
    id: `picto-${index}`
  }))

  // Load any saved state from URL
  const savedState = decodeStateFromURL();
  selectedLevels.value = savedState.selectedLevels;
  luminaSelectedPictos.value = savedState.luminaSelectedPictos;
  pictoSelectedPictos.value = savedState.pictoSelectedPictos;
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
    <h1>Picto & Lumina Builder</h1>

    <div class="filters-container" :class="{ 'hidden-on-mobile': isPanelVisible }">
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
      </div>
    </div>

    <div class="results-info" :class="{ 'hidden-on-mobile': isPanelVisible }">
      <span v-if="filteredPictos.length === totalCount">
        Showing all {{ totalCount }} pictos
      </span>
      <span v-else>
        Showing {{ filteredPictos.length }} of {{ totalCount }} pictos
      </span>
    </div>

    <div class="main-content" :class="{ 'panel-mode': isPanelVisible }">
      <div class="pictos-grid" :class="{ 'hidden-on-mobile': isPanelVisible }">
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

      <div class="selection-panel-container" :class="{ 'visible-on-mobile': isPanelVisible }">
        <SelectionPanel
          :allPictos="allPictos"
          :pictoSelectedPictos="pictoSelectedPictos"
          :luminaSelectedPictos="luminaSelectedPictos"
          :selectedLevels="selectedLevels"
          @reset-all="resetAll"
        />
      </div>
    </div>

    <!-- Panel toggle button (only visible on mobile) -->
    <PanelToggleButton
      :isPanelVisible="isPanelVisible"
      @toggle-panel="togglePanelVisibility"
    />
  </div>
</template>

<style scoped>
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

/* Ensure dark background */
:root, html, body {
  background-color: #222 !important;
  color: #fff !important;
}

h1 {
  text-align: center;
  margin-bottom: 24px;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
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

.type-filter, .sort-filter, .reset-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-filter label, .sort-filter label {
  color: #ddd;
  font-weight: 500;
  white-space: nowrap;
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

.main-content {
  display: flex;
  gap: 24px;
}

.pictos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 8px;
  row-gap: 28px;
  flex: 1;
}

.selection-panel-container {
  width: 320px;
  min-width: 320px;
  max-height: calc(100vh - 180px);
  position: sticky;
  top: 20px;
  display: flex;
  flex-direction: column;
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
    min-height: 300px; /* Ensure there's space for content */
  }

  .selection-panel-container {
    width: 100%;
    min-width: 100%;
    max-height: none;
    position: static;
    margin-top: 30px;
    border-top: 1px solid #444;
    padding-top: 20px;
  }

  /* Mobile panel toggle styles */
  .filters-container, .results-info, .pictos-grid {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .hidden-on-mobile {
    display: none !important;
  }

  .pictos-grid.hidden-on-mobile {
    display: none;
  }

  .selection-panel-container {
    display: none; /* Hide by default on mobile */
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .selection-panel-container.visible-on-mobile {
    display: block; /* Show when toggled */
    animation: fadeIn 0.3s ease;
    margin-top: 20px; /* Add some space below the title */
    border-top: none;
    padding-top: 0;
    padding-bottom: 80px; /* Add padding at the bottom to avoid the toggle button overlapping content */
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
  }

  .type-filter, .sort-filter {
    flex-direction: column;
    align-items: flex-start;
    max-width: none;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .pictos-grid {
    grid-template-columns: 1fr;
    row-gap: 28px;
  }
}
</style>
