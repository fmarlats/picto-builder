/**
 * Utility functions for highlighting picto/lumina and skill names in comment text
 */

import type { PictoItem, SkillItem } from '../types';

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
 * Highlights skill names in a text string
 * @param text The comment text to process
 * @param skills Array of all skills to match against
 * @returns HTML string with highlighted skill names
 */
export function highlightSkillNames(text: string, skills: SkillItem[]): string {
  if (!text || !skills || skills.length === 0) {
    return text;
  }

  // Create a map of skill names for faster lookup
  const skillMap = new Map<string, SkillItem>();
  skills.forEach(skill => {
    skillMap.set(skill.name.toLowerCase(), skill);
  });

  // Sort skill names by length (descending) to match longer names first
  // This prevents partial matches
  const skillNames = Array.from(skillMap.keys()).sort((a, b) => b.length - a.length);

  // Create a regex pattern that matches any skill name
  // Use word boundaries to ensure we match whole words
  const pattern = new RegExp(`\\b(${skillNames.map(name => escapeRegExp(name)).join('|')})\\b`, 'gi');

  // Replace matches with highlighted spans that include data attributes for the popover
  return text.replace(pattern, (match) => {
    const skill = skillMap.get(match.toLowerCase());
    if (!skill) return match; // This shouldn't happen due to our regex, but just in case

    // Create a span with data attributes for the popover
    return `<span class="skill-highlight"
      data-skill-id="${skill.id}"
      data-skill-name="${skill.name}"
      data-skill-effect="${skill.effect}"
      data-skill-cost="${skill.cost}">${match}</span>`;
  });
}

/**
 * Highlights both picto and skill names in a text string
 * @param text The comment text to process
 * @param pictos Array of all pictos to match against
 * @param skills Array of all skills to match against
 * @returns HTML string with highlighted picto and skill names
 */
export function highlightNamesInComment(text: string, pictos: PictoItem[], skills: SkillItem[]): string {
  if (!text) {
    return '';
  }

  // First highlight picto names
  let highlightedText = highlightPictoNames(text, pictos);

  // Then highlight skill names
  // We need to be careful not to highlight inside already highlighted spans
  if (skills && skills.length > 0) {
    // Split the text by picto highlight spans to avoid modifying them
    const parts: string[] = [];
    let lastIndex = 0;

    // Simple regex to find picto highlight spans
    const pictoSpanRegex = /<span class="picto-highlight"[^>]*>.*?<\/span>/gi;
    let match;

    while ((match = pictoSpanRegex.exec(highlightedText)) !== null) {
      // Add the text before the match
      if (match.index > lastIndex) {
        parts.push(highlightedText.substring(lastIndex, match.index));
      }

      // Add the match itself (don't modify it)
      parts.push(match[0]);

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < highlightedText.length) {
      parts.push(highlightedText.substring(lastIndex));
    }

    // Now highlight skills in the non-picto parts
    highlightedText = parts.map(part => {
      if (part.startsWith('<span class="picto-highlight"')) {
        return part; // Don't modify picto highlights
      } else {
        return highlightSkillNames(part, skills);
      }
    }).join('');
  }

  return highlightedText;
}

/**
 * Escapes special characters in a string for use in a regular expression
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
