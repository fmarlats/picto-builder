#!/usr/bin/env node

/**
 * Script to add sequential integer IDs to character skills in characters.json
 * 
 * This script:
 * 1. Reads the existing characters.json file
 * 2. Adds a sequential integer ID to each skill that doesn't already have one
 * 3. Saves the updated file back to the original location
 * 
 * Usage:
 * node add_sequential_skill_ids.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Main function to process the characters.json file
async function addSequentialSkillIds() {
  try {
    // Path to the characters.json file
    const filePath = path.join(__dirname, 'src', 'assets', 'characters.json');
    console.log(`Reading file from: ${filePath}`);
    
    // Read the file
    const data = fs.readFileSync(filePath, 'utf8');
    
    // Parse the JSON
    const characters = JSON.parse(data);
    
    // Counter for skills processed
    let skillsProcessed = 0;
    let skillsAlreadyWithId = 0;
    
    // Start ID counter at 1
    let nextId = 1;
    
    // Process each character
    characters.forEach(character => {
      console.log(`Processing skills for ${character.name}...`);
      
      // Check if the character has skills
      if (character.skills && Array.isArray(character.skills)) {
        // Add ID to each skill that doesn't already have one
        character.skills.forEach(skill => {
          if (!skill.id) {
            skill.id = nextId++;
            skillsProcessed++;
            console.log(`  Added ID ${skill.id} to skill: ${skill.name}`);
          } else {
            // If the skill already has an ID, check if it's a number
            if (typeof skill.id === 'number') {
              console.log(`  Skill already has numeric ID ${skill.id}: ${skill.name}`);
              skillsAlreadyWithId++;
              // Make sure nextId is always higher than any existing ID
              nextId = Math.max(nextId, skill.id + 1);
            } else {
              // If it's not a number, replace it with a sequential number
              console.log(`  Replacing non-numeric ID "${skill.id}" with ${nextId} for skill: ${skill.name}`);
              skill.id = nextId++;
              skillsProcessed++;
            }
          }
        });
      } else {
        console.log(`  No skills found for ${character.name}`);
      }
    });
    
    // Create a backup of the original file
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, data, 'utf8');
    console.log(`Backup of original file created at: ${backupPath}`);
    
    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(characters, null, 4), 'utf8');
    
    console.log('\nSummary:');
    console.log(`- Added/updated IDs for ${skillsProcessed} skills`);
    console.log(`- Found ${skillsAlreadyWithId} skills that already had numeric IDs`);
    console.log(`- Next available ID: ${nextId}`);
    console.log(`- Updated file saved to: ${filePath}`);
    
  } catch (error) {
    console.error('Error processing characters.json:', error);
    process.exit(1);
  }
}

// Run the main function
addSequentialSkillIds();
