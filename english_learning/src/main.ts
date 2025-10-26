import { createApp, ref } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

const app = createApp(App)

export let words = ref([])
export let tags_dict = ref([])



/** 拉取全部单词 & 标签 */
export async function loadWordsAndTags() {
  const baseURL = 'http://localhost:3001/word_data';
  try {
    const [wRes, tRes] = await Promise.all([
      axios.get(`${baseURL}/get_all_word`),
      axios.get(`${baseURL}/get_all_tag`)
    ]);
    words.value     = wRes.data;
    tags_dict.value = tRes.data;
  } catch (e) {
    console.error('拉取失败', e);
  }
}
loadWordsAndTags()
app.use(router)

app.mount('#app')
