/**
 * Utility functions for highlighting picto/lumina names in comment text
 */

import type { PictoItem } from '../types';

/**
 * Highlights picto/lumina names in a text string
 * @param text The comment text to process
 * @param pictos Array of all pictos to match against
 * @returns HTML string with highlighted picto names
 */
export function highlightPictoNames(text: string, pictos: PictoItem[]): string {
  if (!text || !pictos || pictos.length === 0) {
    return text;
  }

  // Create a map of picto names for faster lookup
  const pictoMap = new Map<string, PictoItem>();
  pictos.forEach(picto => {
    pictoMap.set(picto.name.toLowerCase(), picto);
  });

  // Sort picto names by length (descending) to match longer names first
  // This prevents partial matches (e.g. "Heal" inside "Accelerating Heal")
  const pictoNames = Array.from(pictoMap.keys()).sort((a, b) => b.length - a.length);

  // Create a regex pattern that matches any picto name
  // Use word boundaries to ensure we match whole words
  const pattern = new RegExp(`\\b(${pictoNames.map(name => escapeRegExp(name)).join('|')})\\b`, 'gi');

  // Replace matches with highlighted spans that include data attributes for the popover
  return text.replace(pattern, (match) => {
    const picto = pictoMap.get(match.toLowerCase());
    if (!picto) return match; // This shouldn't happen due to our regex, but just in case

    // Create a span with data attributes for the popover
    return `<span class="picto-highlight" 
      data-picto-id="${picto.id}" 
      data-picto-name="${picto.name}"
      data-picto-type="${picto.type}"
      data-picto-effect="${picto.effect}"
      data-picto-cost="${picto.cost}">${match}</span>`;
  });
}

/**
 * Escapes special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
