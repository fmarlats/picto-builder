<script setup lang="ts">
import { computed } from 'vue';
import type { Character, SkillItem } from '../types';
import WarningIcon from './WarningIcon.vue';
import EmptyState from './EmptyState.vue';

// Define props
const props = defineProps<{
  characters: Character[];
  selectedCharacterId?: number;
  selectedSkillIds: number[];
}>();

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
      <h2 class="section-title">
        <div class="left-aligned-title">
          Character
        </div>
      </h2>

      <div v-if="selectedCharacter" class="selected-character">
        <div class="character-name">{{ selectedCharacter.name }}</div>
      </div>

      <EmptyState
        v-else
        title="No character selected"
        instruction="Select a character to build your team."
        icon="👆"
      />
    </div>

    <!-- Skills Section -->
    <div class="panel-section">
      <h2 class="section-title">
        <div class="left-aligned-title">
          Skills
          <WarningIcon
            v-if="selectedSkills.length > 6"
            message="A maximum of 6 skills can be selected in-game."
            title="Too many skills selected"
          />
          <span class="count-display" :class="{ 'warning': selectedSkills.length > 6 }">
            ({{ selectedSkills.length }}/6)
          </span>
        </div>
      </h2>

      <EmptyState
        v-if="selectedSkills.length === 0"
        title="No skills selected"
        instruction="Select skills for your character."
        icon="👆"
      />

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
/* Panel Layout */
.character-skills-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.section-title {
  display: flex;
  align-items: center;
}

.left-aligned-title {
  display: flex;
  align-items: center;
  width: 100%;
}

.count-display {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-left: 8px;
}

.count-display.warning {
  color: var(--warning-color);
  font-weight: bold;
}

/* Character Display */
.selected-character {
  background-color: var(--bg-item);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  border-left: 4px solid var(--primary-color);
}

.character-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
}

/* Skills Display */
.selected-skills {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.skill-item {
  background-color: var(--bg-item);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  position: relative;
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.skill-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 6px;
}

.skill-link {
  color: var(--primary-color);
  opacity: 0.7;
  transition: opacity 0.2s;
}

.skill-link:hover {
  opacity: 1;
}

.skill-cost {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--cost-color);
  font-weight: bold;
  background-color: rgba(255, 204, 0, 0.1);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
}

.skill-effect {
  color: var(--text-light);
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
