<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import pictosList from './assets/pictos_list.json'
import Picto from './components/Picto.vue'

// URL handling utilities with compact encoding

/**
 * Encodes the selected levels into a compact URL-friendly string
 * Format: pictoId1:level1,pictoId2:level2,...
 * Then converts to base64 for even more compactness
 */
const encodeStateToURL = (selectedLevels: Record<string, string>) => {
  // Only include in URL if we have selections
  if (Object.keys(selectedLevels).length === 0) return '';

  // Convert the state object to a compact string format
  // Format: pictoId1:level1,pictoId2:level2,...
  const pairs = Object.entries(selectedLevels).map(([id, level]) => {
    // Extract the numeric part from the picto ID (e.g., "picto-42" -> "42")
    const idNumber = id.split('-')[1] || id;
    return `${idNumber}:${level}`;
  });

  // Join all pairs with commas
  const compactString = pairs.join(',');

  // Convert to base64 for even more compactness
  // Using btoa for browser compatibility
  return btoa(compactString);
};

/**
 * Decodes a compact URL-friendly string back into the selected levels object
 */
const decodeStateFromURL = (): Record<string, string> => {
  // Get the current URL hash (without the # symbol)
  const hash = window.location.hash.substring(1);

  if (!hash) return {};

  try {
    // Decode from base64
    const compactString = atob(hash);

    // Split by commas to get individual pairs
    const pairs = compactString.split(',');

    // Convert pairs back to an object
    const result: Record<string, string> = {};
    pairs.forEach(pair => {
      const [idNumber, level] = pair.split(':');
      if (idNumber && level) {
        // Reconstruct the full picto ID
        const pictoId = `picto-${idNumber}`;
        result[pictoId] = level;
      }
    });

    return result;
  } catch (error) {
    console.error('Error decoding state from URL:', error);
    return {};
  }
};

// Update URL without page reload
const updateURL = (state: Record<string, string>) => {
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
  selectedLevels.value = decodeStateFromURL();
})

// Function to handle level selection from a picto
const handleLevelSelect = (pictoId: string, level: string) => {
  // Update the selected level for this picto
  selectedLevels.value = {
    ...selectedLevels.value,
    [pictoId]: level
  };

  // Update the URL with the new state
  updateURL(selectedLevels.value);
};

// Watch for changes in the URL hash
watch(() => window.location.hash, () => {
  // Update the selected levels when the URL hash changes
  selectedLevels.value = decodeStateFromURL();
});

// Function to handle picto selection for lumina
const toggleLuminaSelection = (pictoId: string) => {
  // Check if the picto is already selected for lumina
  const index = luminaSelectedPictos.value.indexOf(pictoId);

  if (index === -1) {
    // If not selected, add it to the lumina selection
    luminaSelectedPictos.value.push(pictoId);
  } else {
    // If already selected, remove it from the lumina selection
    luminaSelectedPictos.value.splice(index, 1);
  }

  // Log the current lumina selection to the console
  console.log('Lumina Selected Pictos:', luminaSelectedPictos.value);
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

    <div class="filters-container">
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

    <div class="results-info">
      <span v-if="filteredPictos.length === totalCount">
        Showing all {{ totalCount }} pictos
      </span>
      <span v-else>
        Showing {{ filteredPictos.length }} of {{ totalCount }} pictos
      </span>
    </div>

    <div class="pictos-grid">
      <Picto
        v-for="picto in filteredPictos"
        :key="picto.id"
        :picto="picto"
        :searchQuery="searchQuery"
        :selectedLevel="selectedLevels[picto.id || '']"
        :isLuminaSelected="luminaSelectedPictos.includes(picto.id || '')"
        @select-level="handleLevelSelect"
        @toggle-selection="toggleLuminaSelection"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
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

.type-filter, .sort-filter {
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

.pictos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 8px;
  row-gap: 28px;
}

@media (max-width: 1024px) {
  .pictos-grid {
    grid-template-columns: repeat(3, 1fr);
    row-gap: 28px;
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
