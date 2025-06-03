import { createRouter, createWebHistory } from 'vue-router'
import BuilderView from '../views/BuilderView.vue'
import PopularBuildsView from '../views/PopularBuildsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'builder',
      component: BuilderView
    },
    {
      path: '/popular',
      name: 'popular',
      component: PopularBuildsView
    }
  ]
})

export default router
