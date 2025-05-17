<script setup lang="ts">
import type { Character } from '../types';

// Import character images directly
import gustaveImage from '../assets/gustave.avif';
import maelleImage from '../assets/maelle.avif';
import scielImage from '../assets/sciel.avif';
import luneImage from '../assets/lune.avif';
import monocoImage from '../assets/monoco.avif';
import versoImage from '../assets/verso.avif';

// Create a mapping of image filenames to their imported URLs
const characterImageMap: Record<string, string> = {
  'gustave.avif': gustaveImage,
  'maelle.avif': maelleImage,
  'sciel.avif': scielImage,
  'lune.avif': luneImage,
  'monoco.avif': monocoImage,
  'verso.avif': versoImage
};

// Define props
defineProps<{
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
        <div class="character-image-container">
          <img
            v-if="character.icon && characterImageMap[character.icon]"
            :src="characterImageMap[character.icon]"
            :alt="`${character.name} portrait`"
            class="character-image"
          />
        </div>
        <div class="character-name">{{ character.name }}</div>
        <div class="character-skills-count">{{ character.skills.length }} Skills</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.character-selector {
  margin-bottom: 24px;
  width: 100%;
  max-width: 1000px;
  box-sizing: border-box;
  overflow: visible;
  padding: 4px 0;
}

.section-title {
  font-size: 1.2rem;
  margin-bottom: 16px;
  color: #fff;
  font-weight: 600;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(6, 150px);
  gap: 16px;
  margin-bottom: 16px;
  width: 100%;
  max-width: 1000px;
  overflow: visible;
  justify-content: center;
  padding-top: 4px;
  padding-bottom: 4px;
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
  position: relative;
  top: 0;
  margin-top: 2px;
  margin-bottom: 2px;
}

.character-card:hover {
  background-color: #444;
  top: -2px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.character-card.selected {
  border-color: #2196F3;
  background-color: rgba(33, 150, 243, 0.2);
}

.character-image-container {
  width: 100px;
  height: 100px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.character-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.character-card:hover .character-image {
  transform: scale(1.05);
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

@media (max-width: 1000px) {
  .characters-grid {
    grid-template-columns: repeat(4, 150px);
  }
}

@media (max-width: 768px) {
  .characters-grid {
    grid-template-columns: repeat(3, 150px);
  }

  .character-card {
    padding: 12px;
  }

  .character-image-container {
    width: 80px;
    height: 80px;
  }

  .character-name {
    font-size: 1rem;
  }
}

@media (max-width: 500px) {
  .characters-grid {
    grid-template-columns: repeat(2, 150px);
  }

  .character-image-container {
    width: 70px;
    height: 70px;
  }
}
</style>
