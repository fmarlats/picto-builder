<script setup lang="ts">
import { ref, onMounted } from 'vue'
import pictosList from './assets/pictos_list.json'
const pictos = ref(pictosList)

</script>

<template>
  <div>
    <ul>
      <li v-for="picto in pictos" :key="picto.Pictos">
        {{ picto.Pictos }} (Level {{ picto.Level }}) - {{ picto.Lumina }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
