<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Character } from '../types';

// Define props
const props = defineProps<{
  characters: Character[];
  selectedCharacterId?: number;
}>();

// Define emits
const emit = defineEmits<{
  'select-character': [characterId: number];
}>();

// Haptic feedback utility
const hapticFeedback = {
  // Check if vibration is supported
  isSupported: () => {
    return 'vibrate' in navigator;
  },

  // Short vibration for selection
  shortVibration: () => {
    if (hapticFeedback.isSupported()) {
      navigator.vibrate(40);
    }
  }
};

// Function to handle character selection
const selectCharacter = (characterId: number) => {
  emit('select-character', characterId);
  hapticFeedback.shortVibration();
};

// Computed property to get the selected character
const selectedCharacter = computed(() => {
  if (!props.selectedCharacterId) return null;
  return props.characters.find(character => character.id === props.selectedCharacterId) || null;
});
</script>

<template>
  <div class="character-selector">
    <h2 class="section-title">Select a Character</h2>
    
    <div class="characters-grid">
      <div 
        v-for="character in characters" 
        :key="character.id" 
        class="character-card"
        :class="{ 'selected': character.id === selectedCharacterId }"
        @click="selectCharacter(character.id)"
      >
        <div class="character-name">{{ character.name }}</div>
        <div class="character-skills-count">{{ character.skills.length }} Skills</div>
      </div>
    </div>
    
    <div v-if="selectedCharacter" class="selected-character-info">
      <h3>Selected: {{ selectedCharacter.name }}</h3>
    </div>
  </div>
</template>

<style scoped>
.character-selector {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.2rem;
  margin-bottom: 16px;
  color: #fff;
  font-weight: 600;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.character-card {
  background-color: #333;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.character-card:hover {
  background-color: #444;
  transform: translateY(-2px);
}

.character-card.selected {
  border-color: #2196F3;
  background-color: rgba(33, 150, 243, 0.2);
}

.character-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.character-skills-count {
  font-size: 0.9rem;
  color: #aaa;
}

.selected-character-info {
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(33, 150, 243, 0.1);
  border-radius: 8px;
  border-left: 4px solid #2196F3;
}

.selected-character-info h3 {
  margin: 0;
  font-size: 1rem;
  color: #2196F3;
}

@media (max-width: 768px) {
  .characters-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  
  .character-card {
    padding: 12px;
  }
  
  .character-name {
    font-size: 1rem;
  }
}
</style>
