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
 * Interface for the complete app state
 */
export interface AppState {
  selectedLevels: Record<string, string>;
  luminaSelectedPictos: string[];
  pictoSelectedPictos: string[];
  comment?: string; // Optional comment about the build
  buildTitle?: string; // Optional title for the build
}
