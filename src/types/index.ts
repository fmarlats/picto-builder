/**
 * Type definitions for the application
 */

/**
 * Interface for a picto item
 */
export interface PictoItem {
  full_url: string;
  name: string;
  type: string;
  effect: string;
  cost: number;
  attributes: Array<{
    level: string;
    attributes: Record<string, string>;
  }>;
  id?: string; // Unique ID (e.g., "picto-1")
  numeric_id?: number; // The numeric ID from the JSON file
}

/**
 * Interface for a skill item
 */
export interface SkillItem {
  full_url: string;
  name: string;
  effect: string;
  cost: number;
  id: number; // Unique ID for the skill
}

/**
 * Interface for a character
 */
export interface Character {
  name: string;
  id: number;
  icon?: string; // Path to character icon image
  skills: SkillItem[];
}

/**
 * Interface for the complete app state
 */
export interface AppState {
  selectedLevels: Record<string, string>;
  luminaSelectedPictos: string[];
  pictoSelectedPictos: string[];
  comment?: string; // Optional comment about the build
  buildTitle?: string; // Optional title for the build
  selectedCharacterId?: number; // ID of the selected character
  selectedSkillIds?: number[]; // IDs of the selected skills
}

/**
 * Interface for a popular build
 */
export interface PopularBuild {
  id: string; // Unique identifier for the build
  title: string; // Build title
  description?: string; // Optional description
  author?: string; // Optional author name
  encodedBuild: string; // The encoded build string (same format as URL hash)
  tags?: string[]; // Optional tags for categorization
  createdAt?: string; // Optional creation date
  source?: string; // Optional source URL (e.g., YouTube video, forum post, etc.)
}
