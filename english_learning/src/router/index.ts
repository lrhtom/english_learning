import { createRouter, createWebHistory } from 'vue-router'
import notebooks from '@/notebook.vue'
import ai_talk from '@/ai_talk.vue'

const routes = [
  { path: '/', name: 'notebooks', component: notebooks },
  { path: '/ai_talk', name: 'ai_talk', component: ai_talk }
]

export default createRouter({
  history: createWebHistory(),
  routes
})