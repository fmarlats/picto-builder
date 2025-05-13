<script setup lang="ts">
import { computed } from 'vue';
import type { Character, SkillItem } from '../types';

// Define props
const props = defineProps<{
  characters: Character[];
  selectedCharacterId?: number;
  selectedSkillIds: number[];
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
        <div class="title-with-warning">
          Skills ({{ selectedSkills.length }}/6)<span v-if="selectedSkills.length > 6" class="warning-icon" title="A maximum of 6 skills can be selected in-game">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div class="warning-tooltip">
              <div class="tooltip-title">Too many skills selected</div>
              <div class="tooltip-content">
                A maximum of 6 skills can be selected in-game.
              </div>
            </div>
          </span>
        </div>
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
              {{ skill.cost }} AP
            </div>
          </div>
          <div class="skill-effect">{{ skill.effect }}</div>

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
}

.title-with-warning {
  display: flex;
  align-items: center;
}

.warning-icon {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  margin-right: 0;
  color: #ff9800;
  position: relative;
  cursor: pointer;
  vertical-align: middle;
}

.warning-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  white-space: normal;
  width: 250px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  margin-top: 8px;
}

.warning-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent #444 transparent;
}

.tooltip-title {
  color: #ff9800;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1rem;
}

.tooltip-content {
  line-height: 1.4;
}

.warning-icon:hover .warning-tooltip {
  opacity: 1;
  visibility: visible;
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
  background-color: rgba(255, 204, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.skill-effect {
  color: #ddd;
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
