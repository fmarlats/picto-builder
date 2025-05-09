<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import pictosList from './assets/pictos_list.json'
import Picto from './components/Picto.vue'

// Define the type for a picto item
interface PictoItem {
  Pictos: string;
  Level: number | string;
  Type: string;
  Lumina: string;
  "Stat Bonus": string[];
  id?: string; // Optional unique ID
  isAP?: boolean; // Flag for AP-related pictos
}

// Create reactive references
const searchQuery = ref('')
const selectedType = ref('all')
const sortBy = ref('name') // Default sort by name
const allPictos = ref<PictoItem[]>([])

// Load data on component mount
onMounted(() => {
  // Make a deep copy of the data to avoid reference issues
  const pictos = JSON.parse(JSON.stringify(pictosList))

  // Add a unique ID to each picto
  allPictos.value = pictos.map((picto: any, index: number) => ({
    ...picto,
    id: `picto-${index}`
  }))
})

// Extract unique types from pictos list
const pictoTypes = computed(() => {
  const types = new Set<string>(['all'])

  allPictos.value.forEach(picto => {
    if (picto.Type) {
      types.add(picto.Type)
    }
  })

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
    result = result.filter(picto => picto.Type === selectedType.value)
  }

  // Apply search filter (only name or lumina)
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(picto =>
      picto.Pictos.toLowerCase().includes(query) ||
      picto.Lumina.toLowerCase().includes(query)
    )
  }

  // Apply sorting
  if (sortBy.value === 'name') {
    // Sort alphabetically by name (A-Z)
    result.sort((a, b) => a.Pictos.localeCompare(b.Pictos))
  } else if (sortBy.value === 'name-desc') {
    // Sort alphabetically by name (Z-A)
    result.sort((a, b) => b.Pictos.localeCompare(a.Pictos))
  } else if (sortBy.value === 'level') {
    // Sort by level (Low-High)
    result.sort((a, b) => {
      const levelA = typeof a.Level === 'string' ? parseInt(a.Level) : a.Level
      const levelB = typeof b.Level === 'string' ? parseInt(b.Level) : b.Level
      return levelA - levelB
    })
  } else if (sortBy.value === 'level-desc') {
    // Sort by level (High-Low)
    result.sort((a, b) => {
      const levelA = typeof a.Level === 'string' ? parseInt(a.Level) : a.Level
      const levelB = typeof b.Level === 'string' ? parseInt(b.Level) : b.Level
      return levelB - levelA
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
          placeholder="Search by name or description..."
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

:root {
  background-color: #222;
  color: #fff;
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
  justify-content: center;
  align-items: center;
}

.search-container {
  flex: 1;
  min-width: 300px;
  display: flex;
  justify-content: center;
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
  flex-wrap: wrap;
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

@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }

  .search-container {
    min-width: auto;
  }

  .filter-controls {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .type-filter, .sort-filter {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .pictos-grid {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 28px;
  }
}

@media (max-width: 480px) {
  .pictos-grid {
    grid-template-columns: 1fr;
    row-gap: 28px;
  }
}
</style>
