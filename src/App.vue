<script setup lang="ts">
import { provide } from 'vue'
import type { PopularBuild } from './types'

// Example popular builds data - you can replace this with your actual data
const popularBuilds: PopularBuild[] = [
  // Add your popular builds here as an array
  // Example:
  {
    id: '1',
    title: 'Maelle Nuke',
    description: 'Burn stacking build for Maelle',
    author: 'Tenkiei',
    encodedBuild: 'eyJscyI6IjU0LDIwNiwxNTUsMjEsMTIwLDExMSwxMCwzOCwxNDgsMTI1LDE0NywxMDUsMjAwLDE5OSwxNDYsMjA4LDIxNCwxOTYsMTg2LDEyMyw2OCw3MCwxNSwxOCwxNiwxMzIiLCJwcyI6IjYwLDE2OCwxMzMiLCJjaCI6Miwic2siOiIxMCwzNCw5LDI2LDMzLDE1IiwiYyI6IlVzZSBNZWRhbHVtIHdlYXBvbi5cbkF0dHJpYnV0ZXM6IG1heCBkZWZlbnNlLCB0aGVuIGFnaWxpdHksIHRoZW4gbWlnaHQuXG5cbk51a2UgZW5lbWllcyB3aXRoIEJ1cm5pbmcgQ2FudmFzIGFmdGVyIHN0YWNraW5nIGEgbG90IG9mIGJ1cm5zIG9uIHRoZW0sIG9yIGRvIEZsZXVyZXQgRnVyeSB0byBkb3VibGUgdGhlaXIgYnVybi4iLCJ0IjoiTWFlbGxlIG51a2UifQ==',
    tags: ['DPS', 'Burn'],

    createdAt: '2024-05-08'
  }
]

// Provide popular builds to child components
provide('popularBuilds', popularBuilds)
</script>

<template>
  <router-view />
</template>