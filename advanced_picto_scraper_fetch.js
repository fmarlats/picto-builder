// Advanced Picto Scraper with Detailed Page Information (using fetch API)
// This script can be run in the browser console on the pictos page

// Function to scrape the picto list
async function scrapePictosList() {
  try {
    console.log('Starting to scrape pictos list...');

    // Create an array to store the results
    const pictos = [];

    // Get all elements with the class 'db-item-link'
    const links = document.querySelectorAll('.namecol a.db-item-link');
    console.log(`Found ${links.length} picto links`);

    // Extract data from each link
    links.forEach((link, index) => {
      // Get the text content of the link (picto name)
      const name = link.textContent.trim();

      // Get the href attribute
      const href = link.getAttribute('href');

      // Initialize picto object with basic info
      const picto = {
        name: name,
        url: href,
        fullUrl: new URL(href, window.location.origin).href
      };

      // Add to our pictos array
      pictos.push(picto);

      console.log(`Added picto ${index + 1}/${links.length} to queue: ${name}`);
    });

    console.log('Picto list scraping completed!');
    console.log(`Found ${pictos.length} pictos to process!`);

    // Return the results
    return pictos;
  } catch (error) {
    console.error('Error scraping pictos list:', error);
    return [];
  }
}

// Function to scrape detailed information from a picto page using fetch
async function scrapePictoDetails(url) {
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
    const pictoDetails = {
      full_url: url,
      name: '',
      type: '',
      effect: '',
      cost: 0,
      attributes: []
    };

    // Extract name
    const nameElement = doc.querySelector("#item-title-inner h1");
    if (nameElement) {
      pictoDetails.name = nameElement.textContent.trim();
    }

    // Extract type
    const typeElement = doc.querySelector("#item-title-inner .item-cat");
    if (typeElement) {
      pictoDetails.type = typeElement.textContent.trim();
    }

    // Extract effect
    const effectElement = doc.querySelector(".db-field.db-field-type-6 p");
    if (effectElement) {
      pictoDetails.effect = effectElement.innerText.trim();
    }

    // Extract cost
    const costElement = doc.querySelector(".db-field.db-field-type-3 p");
    if (costElement) {
      const costText = costElement.innerText.trim();
      // Try to extract the number from the text
      const costMatch = costText.match(/\d+/);
      if (costMatch) {
        pictoDetails.cost = parseInt(costMatch[0], 10);
      }
    }

    // Extract attributes from the table - try multiple selectors
    console.log("Looking for attributes table...");

    // Try different table selectors
    let tableBody = doc.querySelector("table.md-table.table-sort.no-more-table.init tbody");

    // If not found, try a more general selector
    if (!tableBody) {
      tableBody = doc.querySelector("table.md-table tbody");
    }

    // If still not found, try any table
    if (!tableBody) {
      const tables = doc.querySelectorAll("table");
      console.log(`Found ${tables.length} tables on the page`);

      // Look for a table that might contain attribute data
      for (const table of tables) {
        const firstRow = table.querySelector("tr");
        if (firstRow && firstRow.querySelectorAll("td, th").length >= 2) {
          tableBody = table.querySelector("tbody") || table;
          console.log("Found a potential attributes table");
          break;
        }
      }
    }

    if (tableBody) {
      console.log("Found table body:", tableBody);
      const rows = tableBody.querySelectorAll('tr');
      console.log(`Found ${rows.length} rows in the table`);

      // Get column headers if available
      const headerRow = doc.querySelector("table thead tr");
      const columnHeaders = [];

      if (headerRow) {
        const headerCells = headerRow.querySelectorAll('th');
        headerCells.forEach(cell => {
          columnHeaders.push(cell.textContent.trim());
        });
        console.log("Column headers:", columnHeaders);
      }

      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('td');
        console.log(`Row ${rowIndex + 1} has ${cells.length} cells`);

        if (cells.length >= 2) {
          const levelCell = cells[0];
          const level = levelCell.textContent.trim();

          const attributesObj = {};

          // Process all other cells as attributes
          for (let i = 1; i < cells.length; i++) {
            const cell = cells[i];
            const cellText = cell.textContent.trim();

            // Try multiple ways to get the attribute name
            let attrName = null;

            // 1. Try data-title attribute
            attrName = cell.getAttribute('data-title');

            // 2. Try aria-label attribute
            if (!attrName) {
              attrName = cell.getAttribute('aria-label');
            }

            // 3. Try column headers if available
            if (!attrName && i < columnHeaders.length) {
              attrName = columnHeaders[i];
            }

            // 4. Try to get from the cell's HTML structure
            if (!attrName) {
              const labelElement = cell.querySelector('.column-label');
              if (labelElement) {
                attrName = labelElement.textContent.trim();
              }
            }

            if (attrName) {
              // Use the attribute name and the cell text as the value
              attributesObj[attrName.trim()] = cellText;
            } else {
              // Fallback: Try to split the text
              const attributeParts = cellText.split(':');
              if (attributeParts.length === 2) {
                const textAttrName = attributeParts[0].trim();
                const attrValue = attributeParts[1].trim();
                attributesObj[textAttrName] = attrValue;
              } else {
                // If we can't get a name, use a numbered attribute
                attributesObj[`attribute_${i}`] = cellText;
              }
            }
          }

          console.log(`Extracted attributes for level ${level}:`, attributesObj);

          // Only add if we have actual attributes
          if (Object.keys(attributesObj).length > 0) {
            pictoDetails.attributes.push({
              level: level,
              attributes: attributesObj
            });
          }
        }
      });
    } else {
      console.log("No attributes table found on the page");
    }

    // If we still don't have attributes, try a different approach
    if (pictoDetails.attributes.length === 0) {
      console.log("Trying alternative approach to find attributes...");

      // Look for sections that might contain attribute data
      const attributeSections = doc.querySelectorAll(".db-field");
      attributeSections.forEach(section => {
        const titleElement = section.querySelector(".db-field-title");
        if (titleElement && titleElement.textContent.includes("Attributes")) {
          const contentElement = section.querySelector(".db-field-content");
          if (contentElement) {
            // Try to parse attribute data from the content
            const attributeText = contentElement.textContent.trim();
            console.log("Found attribute section:", attributeText);

            // Simple parsing: assume format like "Level X: Attr1, Attr2, ..."
            const levelMatches = attributeText.match(/Level (\d+):(.*?)(?=Level \d+:|$)/g);
            if (levelMatches) {
              levelMatches.forEach(match => {
                const levelMatch = match.match(/Level (\d+):(.*)/);
                if (levelMatch) {
                  const level = levelMatch[1];
                  const attributesText = levelMatch[2].trim();
                  const attributesList = attributesText.split(',').map(a => a.trim());

                  const attributesObj = {};
                  attributesList.forEach((attr, index) => {
                    attributesObj[`attribute_${index + 1}`] = attr;
                  });

                  pictoDetails.attributes.push({
                    level: level,
                    attributes: attributesObj
                  });
                }
              });
            }
          }
        }
      });
    }

    return pictoDetails;
  } catch (error) {
    console.error(`Error processing ${url}:`, error);
    throw error;
  }
}

// Function to process all pictos with a delay between requests
async function processAllPictos(pictosList, maxConcurrent = 3, delayMs = 1000) {
  console.log(`Starting to process ${pictosList.length} pictos with ${maxConcurrent} concurrent requests...`);

  const detailedPictos = [];
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
  progressDiv.innerHTML = `Processing: 0/${pictosList.length} (0%)`;
  document.body.appendChild(progressDiv);

  // Process in batches to avoid overwhelming the browser
  for (let i = 0; i < pictosList.length; i += maxConcurrent) {
    const batch = pictosList.slice(i, i + maxConcurrent);

    // Process each batch concurrently
    const batchPromises = batch.map(async (picto) => {
      try {
        const details = await scrapePictoDetails(picto.fullUrl);
        detailedPictos.push(details);
        completed++;

        // Update progress
        const percentage = Math.round((completed + failed) / pictosList.length * 100);
        progressDiv.innerHTML = `Processing: ${completed + failed}/${pictosList.length} (${percentage}%)<br>
                                Completed: ${completed} | Failed: ${failed}`;

        return details;
      } catch (error) {
        console.error(`Error processing ${picto.name}:`, error);
        failed++;

        // Update progress
        const percentage = Math.round((completed + failed) / pictosList.length * 100);
        progressDiv.innerHTML = `Processing: ${completed + failed}/${pictosList.length} (${percentage}%)<br>
                                Completed: ${completed} | Failed: ${failed}`;

        // Add a placeholder with error information
        detailedPictos.push({
          full_url: picto.fullUrl,
          name: picto.name,
          error: error.message || 'Unknown error'
        });

        return null;
      }
    });

    // Wait for the batch to complete
    await Promise.all(batchPromises);

    // Add a delay before the next batch to avoid overwhelming the server
    if (i + maxConcurrent < pictosList.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Remove the progress indicator
  document.body.removeChild(progressDiv);

  console.log(`Processing completed! Successfully processed ${completed} pictos, failed: ${failed}`);
  return detailedPictos;
}

// Function to download the data as JSON
function downloadPictosData(pictos) {
  try {
    // Create a data URL containing the JSON data
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pictos, null, 2));

    // Create a temporary anchor element
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "scraped_pictos_detailed.json");

    // Append to the body, click, and remove
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    console.log('Data downloaded as scraped_pictos_detailed.json');
  } catch (error) {
    console.error('Error downloading data:', error);
  }
}

// Main function to run the scraper
async function main() {
  console.log('Advanced Picto Scraper with Details starting...');

  // Check if we're on the correct page
  if (!window.location.href.includes('gamerguides.com/clair-obscur-expedition-33/database/pictos')) {
    console.error('Please run this script on the Clair Obscur: Expedition 33 pictos page.');
    alert('Please run this script on the Clair Obscur: Expedition 33 pictos page.');
    return;
  }

  // Ask for confirmation as this will make many requests
  const shouldContinue = confirm(
    'This script will visit each picto page to extract detailed information. ' +
    'This may take several minutes and make many requests to the website. ' +
    'Do you want to continue?'
  );

  if (!shouldContinue) {
    console.log('Operation cancelled by user.');
    return;
  }

  // Scrape the pictos list
  const pictosList = await scrapePictosList();

  if (pictosList.length === 0) {
    alert('No pictos found to process. Please check the console for errors.');
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

  // Process all pictos to get detailed information
  const detailedPictos = await processAllPictos(pictosList, maxConcurrent, delayMs);

  // Download the detailed data
  if (detailedPictos.length > 0) {
    downloadPictosData(detailedPictos);
    alert(`Successfully processed ${detailedPictos.length} pictos! The data has been downloaded.`);
  } else {
    alert('No detailed picto data was collected. Please check the console for errors.');
  }
}

// Run the main function
main();
