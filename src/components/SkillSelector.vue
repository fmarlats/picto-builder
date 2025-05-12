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

  // If max skills are already selected, don't allow more
  if (props.selectedSkillIds.length >= maxSkillsCount) {
    alert(`You can only select up to ${maxSkillsCount} skills.`);
    return;
  }

  // Otherwise, add the skill
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
        <span class="skill-count">({{ selectedSkillIds.length }}/{{ maxSkillsCount }})</span>
        <span v-if="selectedSkillIds.length > maxSkillsCount" class="warning-icon" :title="`Skill selected should not exceed ${maxSkillsCount}`">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span class="warning-tooltip">Skill selected should not exceed {{ maxSkillsCount }}</span>
        </span>
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
              <img src="../assets/lumina.png" alt="Lumina" class="lumina-icon" /> {{ skill.cost }}
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

.skill-count {
  font-size: 0.9rem;
  color: #aaa;
  font-weight: normal;
}

.warning-icon {
  color: #ff9800;
  cursor: help;
  position: relative;
  display: inline-flex;
}

.warning-tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: #333;
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 10;
  pointer-events: none;
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
}

.lumina-icon {
  width: 16px;
  height: 16px;
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
