<script setup lang="ts">
import { ref, computed } from 'vue'
import pictosList from './assets/pictos_list.json'
import Picto from './components/Picto.vue'

const pictos = ref(pictosList)
const searchQuery = ref('')
const selectedType = ref('all')

// Extract unique types from pictos list
const pictoTypes = computed(() => {
  const types = new Set<string>()
  types.add('all')

  pictos.value.forEach(picto => {
    if (picto.Type) {
      types.add(picto.Type)
    }
  })

  return Array.from(types)
})

const filteredPictos = computed(() => {
  let filtered = pictos.value

  // Filter by type if not 'all'
  if (selectedType.value !== 'all') {
    filtered = filtered.filter(picto =>
      picto.Type === selectedType.value
    )
  }

  // Filter by search query if present
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(picto =>
      picto.Pictos.toLowerCase().includes(query) ||
      (typeof picto.Level === 'string' ? picto.Level.toLowerCase().includes(query) : String(picto.Level).includes(query)) ||
      picto.Type.toLowerCase().includes(query) ||
      picto.Lumina.toLowerCase().includes(query)
    )
  }

  return filtered
})
</script>

<template>
  <div class="container">
    <h1>Picto Builder</h1>

    <div class="filters-container">
      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search pictos..."
          class="search-input"
        />
      </div>

      <div class="type-filter">
        <label for="type-select">Filter by Type:</label>
        <select id="type-select" v-model="selectedType" class="type-select">
          <option value="all">All Types</option>
          <option v-for="type in pictoTypes.filter(t => t !== 'all')" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>
    </div>

    <div class="results-info">
      Showing {{ filteredPictos.length }} of {{ pictos.length }} pictos
    </div>

    <div class="pictos-grid">
      <Picto
        v-for="picto in filteredPictos"
        :key="picto.Pictos"
        :picto="picto"
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

h1 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
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
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
}

.type-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-select {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  background-color: white;
}

.results-info {
  text-align: center;
  margin-bottom: 16px;
  color: #666;
  font-size: 0.9rem;
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

  .type-filter {
    flex-direction: column;
    align-items: flex-start;
  }

  .type-select {
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
