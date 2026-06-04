import type { RouteRecordRaw } from 'vue-router'
import BuilderView from '../views/BuilderView.vue'
import PopularBuildsView from '../views/PopularBuildsView.vue'

export const routes: RouteRecordRaw[] = [
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
