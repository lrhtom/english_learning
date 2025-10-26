import { createApp, ref } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

const app = createApp(App)

export let words = ref([])
export let tags_dict = ref([])

;(async () => {
  try {
    words.value = (await axios.get('http://localhost:3001/word_data/get_all_word')).data;          // 真正数据在 data 里
     tags_dict.value= (await axios.get('http://localhost:3001/word_data/get_all_tag')).data;
  } catch (e) {
    console.error('拉取失败', e)
  }
})()

app.use(router)

app.mount('#app')
