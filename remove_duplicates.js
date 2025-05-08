import fs from 'fs';

// Read the pictos_list.json file
const filePath = 'src/assets/pictos_list.json';
const pictosList = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`Original list contains ${pictosList.length} pictos`);

// Create a map to track seen picto names
const seenPictos = new Map();
const uniquePictos = [];

// Process each picto, keeping only the first occurrence of each name
pictosList.forEach(picto => {
  const name = picto.Pictos;

  if (!seenPictos.has(name)) {
    seenPictos.set(name, true);
    uniquePictos.push(picto);
  } else {
    console.log(`Removing duplicate: ${name}`);
  }
});

console.log(`Unique list contains ${uniquePictos.length} pictos`);
console.log(`Removed ${pictosList.length - uniquePictos.length} duplicates`);

// Write the unique pictos back to the file
fs.writeFileSync(filePath, JSON.stringify(uniquePictos, null, 2), 'utf8');
console.log(`Updated ${filePath} with unique pictos`);
