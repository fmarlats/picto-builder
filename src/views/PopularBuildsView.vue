<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import PopularBuildCard from '../components/PopularBuildCard.vue'
import type { PopularBuild } from '../types'

// Inject popular builds from parent (if provided)
const injectedBuilds = inject<PopularBuild[]>('popularBuilds', [])

// Props for the popular builds array (fallback)
const props = defineProps<{
  popularBuilds?: PopularBuild[]
}>()

// Reactive reference for builds
const builds = ref<PopularBuild[]>([])

// Function to update SEO for popular builds page
const updatePopularBuildsSEO = () => {
  // Update page title
  document.title = 'Popular Builds - Expedition 33 Builds';

  // Update meta description
  const description = 'Discover the most popular and effective Expedition 33 character builds created by the community. Find inspiration for your next character build with proven strategies and combinations.';

  // Update meta description tag
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }

  // Update Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', document.title);
  }

  // Update Open Graph description
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', description);
  }

  // Update Twitter title
  const twitterTitle = document.querySelector('meta[property="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', document.title);
  }

  // Update Twitter description
  const twitterDescription = document.querySelector('meta[property="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', description);
  }

  // Update canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', window.location.href);
  }

  // Update keywords
  const keywords = document.querySelector('meta[name="keywords"]');
  if (keywords) {
    keywords.setAttribute('content', 'Expedition 33, Popular Builds, Community Builds, Character Builds, Gaming, RPG, Pictos, Lumina, Clair Obscur, Best Builds, Top Builds');
  }
};

// Load builds on mount
onMounted(() => {
  // Use injected builds, then props, then default empty array
  builds.value = injectedBuilds.length > 0 ? injectedBuilds : (props.popularBuilds || [])

  // Update SEO for popular builds page
  updatePopularBuildsSEO();
})

// Function to handle build selection
const handleBuildSelect = (build: PopularBuild) => {
  // Navigate to the main builder with the encoded build
  const url = `/?b=${encodeURIComponent(build.title)}&summary=true#${build.encodedBuild}`
  window.location.href = url
}
</script>

<template>
  <div class="popular-builds-container">
    <header class="popular-builds-header">
      <div class="header-content">
        <h1>Popular Builds</h1>
        <p class="header-description">Discover and try out community-favorite character builds</p>
        <router-link to="/" class="back-to-builder">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Builder
        </router-link>
      </div>
    </header>

    <main class="popular-builds-main">
      <div v-if="builds.length === 0" class="no-builds-message">
        <div class="no-builds-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          <h2>No Popular Builds Available</h2>
          <p>Check back later for community builds, or create your own!</p>
        </div>
      </div>

      <div v-else class="builds-grid">
        <PopularBuildCard
          v-for="build in builds"
          :key="build.id"
          :build="build"
          @select="handleBuildSelect"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.popular-builds-container {
  min-height: 100vh;
  background-color: #222;
  color: #fff;
}

.popular-builds-header {
  background-color: #222;
  border-bottom: 1px solid #333;
  padding: 2rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-content h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.header-description {
  font-size: 1.1rem;
  color: #aaa;
  margin: 0;
}

.back-to-builder {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #2196F3;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  align-self: flex-start;
}

.back-to-builder:hover {
  color: #1976D2;
}

.popular-builds-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.no-builds-message {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.no-builds-content {
  text-align: center;
  color: #666;
}

.no-builds-content svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-builds-content h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #888;
}

.no-builds-content p {
  font-size: 1rem;
  color: #666;
}

.builds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .builds-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .popular-builds-main {
    padding: 1rem;
  }
}
</style>
