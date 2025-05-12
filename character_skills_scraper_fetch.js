// Character Skills Scraper with Detailed Page Information (using fetch API)
// This script can be run in the browser console on the character skills page

// Function to generate a unique ID
function generateUniqueId() {
  // Generate a random string
  const randomPart = Math.random().toString(36).substring(2, 10);
  // Add a timestamp for uniqueness
  const timestamp = Date.now().toString(36);
  // Combine them for a unique ID in format: skill_[timestamp]_[random]
  // This ensures IDs are unique even if skills are scraped at the same time
  return `skill_${timestamp}_${randomPart}`;
}

// Function to scrape the skills list
async function scrapeSkillsList() {
  try {
    console.log('Starting to scrape skills list...');

    // Create an array to store the results
    const skills = [];

    // Get all elements with the class 'db-item-link'
    const links = document.querySelectorAll('.namecol a.db-item-link');
    console.log(`Found ${links.length} skill links`);

    // Extract data from each link
    links.forEach((link, index) => {
      // Get the text content of the link (skill name)
      const name = link.textContent.trim();

      // Get the href attribute
      const href = link.getAttribute('href');

      // Initialize skill object with basic info
      const skill = {
        name: name,
        url: href,
        fullUrl: new URL(href, window.location.origin).href
      };

      // Add to our skills array
      skills.push(skill);

      console.log(`Added skill ${index + 1}/${links.length} to queue: ${name}`);
    });

    console.log('Skills list scraping completed!');
    console.log(`Found ${skills.length} skills to process!`);

    // Return the results
    return skills;
  } catch (error) {
    console.error('Error scraping skills list:', error);
    return [];
  }
}

// Function to scrape detailed information from a skill page using fetch
async function scrapeSkillDetails(url) {
  try {
    console.log(`Fetching details from: ${url}`);

    // Fetch the page content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract the required information
    const skillDetails = {
      id: generateUniqueId(), // Add unique ID
      full_url: url,
      name: '',
      effect: '',
      cost: 0,
      character: ''
    };

    // Extract name
    const nameElement = doc.querySelector("#item-title-inner h1");
    if (nameElement && nameElement.firstChild) {
      skillDetails.name = nameElement.firstChild.textContent.trim();
    }

    // Extract character
    const characterElement = doc.querySelector("#item-title-inner .item-cat");
    if (characterElement) {
      skillDetails.character = characterElement.textContent.trim();
    }

    // Extract effect
    const effectElement = doc.querySelector(".db-field.db-field-type-6 p");
    if (effectElement) {
      skillDetails.effect = effectElement.innerText.trim();
    }

    // Extract cost
    const costElement = doc.querySelector(".db-field.db-field-type-3 p");
    if (costElement) {
      const costText = costElement.innerText.trim();
      // Try to extract the number from the text
      const costMatch = costText.match(/\d+/);
      if (costMatch) {
        skillDetails.cost = parseInt(costMatch[0], 10);
      }
    }

    return skillDetails;
  } catch (error) {
    console.error(`Error processing ${url}:`, error);
    throw error;
  }
}

// Function to process all skills with a delay between requests
async function processAllSkills(skillsList, maxConcurrent = 3, delayMs = 1000) {
  console.log(`Starting to process ${skillsList.length} skills with ${maxConcurrent} concurrent requests...`);

  const detailedSkills = [];
  let completed = 0;
  let failed = 0;

  // Create a progress indicator
  const progressDiv = document.createElement('div');
  progressDiv.style.position = 'fixed';
  progressDiv.style.top = '10px';
  progressDiv.style.right = '10px';
  progressDiv.style.padding = '10px';
  progressDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  progressDiv.style.color = 'white';
  progressDiv.style.borderRadius = '5px';
  progressDiv.style.zIndex = '9999';
  progressDiv.innerHTML = `Processing: 0/${skillsList.length} (0%)`;
  document.body.appendChild(progressDiv);

  // Process in batches to avoid overwhelming the browser
  for (let i = 0; i < skillsList.length; i += maxConcurrent) {
    const batch = skillsList.slice(i, i + maxConcurrent);

    // Process each batch concurrently
    const batchPromises = batch.map(async (skill) => {
      try {
        const details = await scrapeSkillDetails(skill.fullUrl);
        detailedSkills.push(details);
        completed++;

        // Update progress
        const percentage = Math.round((completed + failed) / skillsList.length * 100);
        progressDiv.innerHTML = `Processing: ${completed + failed}/${skillsList.length} (${percentage}%)<br>
                              Completed: ${completed} | Failed: ${failed}`;

        return details;
      } catch (error) {
        console.error(`Error processing ${skill.name}:`, error);
        failed++;

        // Update progress
        const percentage = Math.round((completed + failed) / skillsList.length * 100);
        progressDiv.innerHTML = `Processing: ${completed + failed}/${skillsList.length} (${percentage}%)<br>
                              Completed: ${completed} | Failed: ${failed}`;

        // Add a placeholder with error information
        detailedSkills.push({
          full_url: skill.fullUrl,
          name: skill.name,
          error: error.message || 'Unknown error'
        });

        return null;
      }
    });

    // Wait for the batch to complete
    await Promise.all(batchPromises);

    // Add a delay before the next batch to avoid overwhelming the server
    if (i + maxConcurrent < skillsList.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Remove the progress indicator
  document.body.removeChild(progressDiv);

  console.log(`Processing completed! Successfully processed ${completed} skills, failed: ${failed}`);
  return detailedSkills;
}

// Function to download the data as JSON
function downloadSkillsData(skills) {
  try {
    // Create a data URL containing the JSON data
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(skills, null, 2));

    // Create a temporary anchor element
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "scraped_character_skills.json");

    // Append to the body, click, and remove
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    console.log('Data downloaded as scraped_character_skills.json');
  } catch (error) {
    console.error('Error downloading data:', error);
  }
}

// Function to update characters.json with the scraped skills
function updateCharactersJson(skills) {
  try {
    // Get the existing characters.json content
    // Note: This is a placeholder. In a browser environment, you would need to load this file separately
    // or have it available in a variable

    // For demonstration, we'll create a sample structure
    const characters = [
      { name: "Gustave", id: 1, skills: [] },
      { name: "Maelle", id: 2, skills: [] },
      { name: "Sciel", id: 3, skills: [] },
      { name: "Lune", id: 4, skills: [] },
      { name: "Monoco", id: 5, skills: [] },
      { name: "Verso", id: 6, skills: [] }
    ];

    // Group skills by character
    const skillsByCharacter = {};
    skills.forEach(skill => {
      if (skill.character && !skill.error) {
        // Extract character name from the character field (e.g., "Character: Gustave" -> "Gustave")
        const characterName = skill.character.replace("Character: ", "").trim();

        if (!skillsByCharacter[characterName]) {
          skillsByCharacter[characterName] = [];
        }

        // Add the skill to the character's skills array
        skillsByCharacter[characterName].push({
          id: skill.id,
          full_url: skill.full_url,
          name: skill.name,
          effect: skill.effect,
          cost: skill.cost
        });
      }
    });

    // Update the characters array with the skills
    characters.forEach(character => {
      if (skillsByCharacter[character.name]) {
        character.skills = skillsByCharacter[character.name];
      }
    });

    // Create a data URL containing the updated characters JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(characters, null, 2));

    // Create a temporary anchor element
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "updated_characters.json");

    // Append to the body, click, and remove
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    console.log('Updated characters.json downloaded as updated_characters.json');
  } catch (error) {
    console.error('Error updating characters.json:', error);
  }
}

// Main function to run the scraper
async function main() {
  console.log('Character Skills Scraper starting...');

  // Check if we're on the correct page
  if (!window.location.href.includes('gamerguides.com/clair-obscur-expedition-33/database')) {
    console.error('Please run this script on the Clair Obscur: Expedition 33 database page.');
    alert('Please run this script on the Clair Obscur: Expedition 33 database page.');
    return;
  }

  // Ask for confirmation as this will make many requests
  const shouldContinue = confirm(
    'This script will visit each skill page to extract detailed information. ' +
    'This may take several minutes and make many requests to the website. ' +
    'Do you want to continue?'
  );

  if (!shouldContinue) {
    console.log('Operation cancelled by user.');
    return;
  }

  // Scrape the skills list
  const skillsList = await scrapeSkillsList();

  if (skillsList.length === 0) {
    alert('No skills found to process. Please check the console for errors.');
    return;
  }

  // Ask for the number of concurrent requests
  let maxConcurrent = 3; // Default
  const concurrentInput = prompt('Enter the maximum number of concurrent requests (1-5, default: 3):', '3');
  if (concurrentInput) {
    const parsed = parseInt(concurrentInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) {
      maxConcurrent = parsed;
    }
  }

  // Ask for the delay between batches
  let delayMs = 1000; // Default: 1 second
  const delayInput = prompt('Enter the delay between batches in milliseconds (default: 1000):', '1000');
  if (delayInput) {
    const parsed = parseInt(delayInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      delayMs = parsed;
    }
  }

  // Process all skills to get detailed information
  const detailedSkills = await processAllSkills(skillsList, maxConcurrent, delayMs);

  // Download the detailed data
  if (detailedSkills.length > 0) {
    console.log('Each skill has been assigned a unique ID for reference');
    downloadSkillsData(detailedSkills);

    // Update characters.json with the scraped skills
    updateCharactersJson(detailedSkills);

    alert(`Successfully processed ${detailedSkills.length} skills! The data has been downloaded with unique IDs.`);
  } else {
    alert('No detailed skill data was collected. Please check the console for errors.');
  }
}

// Run the main function
main();
