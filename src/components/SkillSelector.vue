<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Character, SkillItem } from '../types';

// Define props
const props = defineProps<{
  character?: Character | null;
  selectedSkillIds: number[];
  maxSkills?: number; // Maximum number of skills that can be selected
}>();

// Default value for maxSkills
const maxSkillsCount = props.maxSkills || 6;

// Define emits
const emit = defineEmits<{
  'toggle-skill': [skillId: number];
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

// Search functionality
const searchQuery = ref('');

// Filtered skills based on search query
const filteredSkills = computed(() => {
  if (!props.character) return [];

  if (!searchQuery.value.trim()) {
    return props.character.skills;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return props.character.skills.filter(skill =>
    skill.name.toLowerCase().includes(query) ||
    skill.effect.toLowerCase().includes(query)
  );
});

// Function to handle skill selection
const toggleSkill = (skillId: number) => {
  // If skill is already selected, remove it
  if (props.selectedSkillIds.includes(skillId)) {
    emit('toggle-skill', skillId);
    hapticFeedback.shortVibration();
    return;
  }

  // Even if max skills are already selected, still allow more (just with a warning)
  emit('toggle-skill', skillId);
  hapticFeedback.shortVibration();
};

// Function to highlight search matches
const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.trim()})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
};
</script>

<template>
  <div class="skill-selector">
    <div v-if="character" class="skill-selector-content">
      <h2 class="section-title">
        Select Skills for {{ character.name }}
        <div class="skill-count-container">
          <span class="skill-count" :class="{ 'warning': selectedSkillIds.length > maxSkillsCount }">
            ({{ selectedSkillIds.length }}/{{ maxSkillsCount }})
          </span>
          <span v-if="selectedSkillIds.length > maxSkillsCount" class="warning-icon" :title="`A maximum of ${maxSkillsCount} skills can be selected in-game`">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <div class="warning-tooltip">
              <div class="tooltip-title">Too many skills selected</div>
              <div class="tooltip-content">
                A maximum of {{ maxSkillsCount }} skills can be selected in-game.
              </div>
            </div>
          </span>
        </div>
      </h2>

      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search skills by name or effect..."
          class="search-input"
        />
      </div>

      <div class="skills-grid">
        <div
          v-for="skill in filteredSkills"
          :key="skill.id"
          class="skill-card"
          :class="{ 'selected': selectedSkillIds.includes(skill.id) }"
          @click="toggleSkill(skill.id)"
        >
          <div class="skill-header">
            <div class="skill-name" v-html="highlightMatch(skill.name, searchQuery)"></div>
            <div class="skill-cost">
              {{ skill.cost }} AP
            </div>
          </div>
          <div class="skill-effect" v-html="highlightMatch(skill.effect, searchQuery)"></div>
        </div>
      </div>
    </div>

    <div v-else class="no-character-message">
      <p>Please select a character first to view their skills.</p>
    </div>
  </div>
</template>

<style scoped>
.skill-selector {
  margin-bottom: 24px;
  width: 100%;
  max-width: 1000px;
  box-sizing: border-box;
  overflow: hidden;
}

.skill-selector-content {
  width: 100%;
  max-width: 1000px;
  overflow: hidden;
  box-sizing: border-box;
}

.section-title {
  font-size: 1.2rem;
  margin-bottom: 16px;
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.skill-count-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-count {
  font-size: 0.9rem;
  color: #aaa;
  font-weight: normal;
  transition: color 0.3s ease;
}

.skill-count.warning {
  color: #ff9800;
  font-weight: bold;
}

.warning-icon {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  color: #ff9800;
  position: relative;
  cursor: pointer;
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

.search-container {
  margin-bottom: 16px;
  width: 100%;
  max-width: 1000px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #444;
  background-color: #333;
  color: #fff;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 300px);
  gap: 16px;
  width: 100%;
  max-width: 1000px;
  overflow: hidden;
  justify-content: center;
}

.skill-card {
  background-color: #333;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  width: 300px;
  min-height: 150px;
  max-height: 200px;
  overflow: auto;
  box-sizing: border-box;
}

.skill-card:hover {
  background-color: #444;
  transform: translateY(-2px);
}

.skill-card.selected {
  border-color: #2196F3;
  background-color: rgba(33, 150, 243, 0.2);
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
  word-break: break-word;
  overflow-wrap: break-word;
}

.no-character-message {
  padding: 24px;
  background-color: #333;
  border-radius: 8px;
  text-align: center;
  color: #aaa;
}

:deep(.highlight) {
  background-color: rgba(255, 204, 0, 0.3);
  color: #fff;
  padding: 0 2px;
  border-radius: 2px;
}

@media (max-width: 1000px) {
  .skills-grid {
    grid-template-columns: repeat(2, 300px);
  }
}

@media (max-width: 650px) {
  .skills-grid {
    grid-template-columns: repeat(1, 300px);
  }
}
</style>
