<script setup lang="ts">
import { computed } from 'vue';
import type { Character, SkillItem } from '../types';

// Define props
const props = defineProps<{
  characters: Character[];
  selectedCharacterId?: number;
  selectedSkillIds: number[];
}>();

// Define emits
const emit = defineEmits<{
  'remove-skill': [skillId: number];
}>();

// Haptic feedback utility
const hapticFeedback = {
  // Check if vibration is supported
  isSupported: () => {
    return 'vibrate' in navigator;
  },

  // Short vibration for removal
  shortVibration: () => {
    if (hapticFeedback.isSupported()) {
      navigator.vibrate(40);
    }
  }
};

// Computed property to get the selected character
const selectedCharacter = computed(() => {
  if (!props.selectedCharacterId) return null;
  return props.characters.find(character => character.id === props.selectedCharacterId) || null;
});

// Computed property to get the selected skills
const selectedSkills = computed(() => {
  if (!selectedCharacter.value) return [];
  
  return props.selectedSkillIds
    .map(skillId => {
      return selectedCharacter.value?.skills.find(skill => skill.id === skillId);
    })
    .filter(skill => skill !== undefined) as SkillItem[];
});

// Computed property to calculate total cost of selected skills
const totalCost = computed(() => {
  return selectedSkills.value.reduce((total, skill) => total + skill.cost, 0);
});

// Function to remove a skill
const removeSkill = (skillId: number) => {
  emit('remove-skill', skillId);
  hapticFeedback.shortVibration();
};
</script>

<template>
  <div class="character-skills-panel">
    <!-- Character Section -->
    <div class="panel-section">
      <h2 class="section-title">Character</h2>
      
      <div v-if="selectedCharacter" class="selected-character">
        <div class="character-name">{{ selectedCharacter.name }}</div>
      </div>
      
      <div v-else class="empty-message">
        <div class="empty-icon">👆</div>
        <div class="empty-title">No character selected</div>
        <div class="empty-instruction">Select a character to build your team.</div>
      </div>
    </div>
    
    <!-- Skills Section -->
    <div class="panel-section">
      <h2 class="section-title">
        Skills ({{ selectedSkills.length }})
        <span class="total-cost">
          Total Cost: <img src="../assets/lumina.png" alt="Lumina" class="lumina-icon" /> {{ totalCost }}
        </span>
      </h2>
      
      <div v-if="selectedSkills.length === 0" class="empty-message">
        <div class="empty-icon">👆</div>
        <div class="empty-title">No skills selected</div>
        <div class="empty-instruction">Select skills for your character.</div>
      </div>
      
      <div v-else class="selected-skills">
        <div v-for="skill in selectedSkills" :key="skill.id" class="skill-item">
          <div class="skill-header">
            <div class="skill-name">
              {{ skill.name }}
              <a
                v-if="skill.full_url"
                :href="skill.full_url"
                target="_blank"
                rel="noopener noreferrer"
                class="skill-link"
                title="Open in new tab"
                @click.stop
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
            <div class="skill-cost">
              <img src="../assets/lumina.png" alt="Lumina" class="lumina-icon" /> {{ skill.cost }}
            </div>
          </div>
          <div class="skill-effect">{{ skill.effect }}</div>
          <button class="remove-button" @click="removeSkill(skill.id)" title="Remove skill">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.character-skills-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.panel-section {
  background-color: #222;
  border-radius: 8px;
  padding: 16px;
}

.section-title {
  font-size: 1.2rem;
  margin-bottom: 16px;
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.total-cost {
  font-size: 0.9rem;
  color: #ffcc00;
  display: flex;
  align-items: center;
  gap: 4px;
}

.lumina-icon {
  width: 16px;
  height: 16px;
}

.empty-message {
  text-align: center;
  padding: 24px 16px;
  color: #aaa;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.empty-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #ddd;
}

.empty-instruction {
  font-size: 0.9rem;
}

.selected-character {
  background-color: #333;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #2196F3;
}

.character-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
}

.selected-skills {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-item {
  background-color: #333;
  border-radius: 8px;
  padding: 16px;
  position: relative;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.skill-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-link {
  color: #2196F3;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.skill-link:hover {
  opacity: 1;
}

.skill-cost {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffcc00;
  font-weight: bold;
}

.skill-effect {
  color: #ddd;
  font-size: 0.9rem;
  line-height: 1.4;
}

.remove-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #ff5252;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
}

.skill-item:hover .remove-button {
  opacity: 0.7;
}

.remove-button:hover {
  opacity: 1 !important;
  background-color: rgba(255, 82, 82, 0.1);
}
</style>
