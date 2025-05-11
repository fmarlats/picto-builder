<script setup lang="ts">
// Simple component to display how to use instructions
</script>

<template>
  <div class="how-to-use-container">    
    <div class="section">
      <h3>Selecting Pictos & Luminas</h3>
      <ul>
        <li><strong>Click</strong> on a picto to select it as a <strong>Lumina</strong></li>
        <li><strong>Press and hold</strong> on a picto card to select it as a <strong>Picto</strong></li>
        <li>Selected items appear in the right panel</li>
        <li>Click on the <strong>level section</strong> at the bottom of a picto to change it</li>

      </ul>
    </div>
    
    <div class="section">
      <h3>Filtering and Sorting</h3>
      <ul>
        <li>Use the <strong>search box</strong> to filter pictos by name or effect</li>
        <li>Additional filters and sorting options are available next to the search box</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>Build Details</h3>
      <ul>
        <li>Click <strong>Add Build Details</strong> to add a title and instructions to your build</li>
        <li>In comments, if you refer to a by name, it will be automatically highlighted!</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>Sharing</h3>
      <ul>
        <li>Click <strong>Share Build</strong> to get a URL that includes all your selections</li>
        <li>Anyone with this URL can view your exact build</li>
        <li>All your selections, levels, and comments are encoded in the URL</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>Mobile View</h3>
      <ul>
        <li>Use the toggle button in the bottom-right to switch between the picto list and your selections</li>
        <li>On smaller screens, the panel view and list view are separate</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>Resetting</h3>
      <ul>
        <li>Press and hold the <strong>Reset All Selections</strong> button to clear everything</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.how-to-use-container {
  background-color: #222;
  border-radius: 8px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  color: #ddd;
}

h2 {
  color: #fff;
  text-align: center;
  margin-bottom: 24px;
  font-size: 1.5rem;
}

.section {
  margin-bottom: 24px;
  border-bottom: 1px solid #444;
  padding-bottom: 16px;
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

h3 {
  color: #2196f3;
  margin-bottom: 12px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
}

h3::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background-color: #2196f3;
  margin-right: 8px;
  border-radius: 2px;
}

ul {
  list-style-type: none;
  padding-left: 16px;
}

li {
  margin-bottom: 8px;
  line-height: 1.5;
  position: relative;
}

li::before {
  content: '•';
  color: #2196f3;
  font-weight: bold;
  position: absolute;
  left: -16px;
}

strong {
  color: #fff;
  font-weight: 600;
}

@media (max-width: 768px) {
  .how-to-use-container {
    padding: 16px;
    margin: 0 10px;
  }
  
  h2 {
    font-size: 1.3rem;
  }
  
  h3 {
    font-size: 1.1rem;
  }
  
  li {
    font-size: 0.95rem;
  }
}
</style>
