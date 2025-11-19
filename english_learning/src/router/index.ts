import { createRouter, createWebHistory } from 'vue-router'
import notebooks from '@/notebook.vue'
import ai_talk from '@/ai_talk.vue'
import ai_writing from '@/ai_writing.vue'
import dicts from '@/dicts.vue'
import speechsyn from '@/speechsyn.vue'

const routes = [
  
  { path: '/', name: 'notebooks', component: notebooks },
  { path: '/ai_talk', name: 'ai_talk', component: ai_talk },
  { path: '/ai_writing', name: 'ai_writing', component: ai_writing },
  { path: '/dicts', name: 'dict', component: dicts },
  { path: '/speechsyn', name: 'speechsyn', component: speechsyn }
]

export default createRouter({
  history: createWebHistory(),
  routes
})