<script setup lang="ts">
import { computed } from 'vue';

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
  allPictos: PictoItem[];
  pictoSelectedPictos: string[];
  luminaSelectedPictos: string[];
  selectedLevels: Record<string, string>;
}>();

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
</script>

<template>
  <div class="selection-panel">
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

</style>
