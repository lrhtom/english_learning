<script setup lang="ts">
/*返回数据
[
  {
tag:"asd".
  content:[
    a:[
      {
        word:"monday",
        pos:"n.",
        meaning:"周一",
        is_collected:false,
      },
      {
      ...
      }...
    ],
    b...
  ]
  },
]
*/
import { words, tags_dict } from './main';
import { createApp, ref } from 'vue';
import axios from 'axios';
let sreach_mode = ref("");

function get_words(str) {
  if (str === "" || str === "tag_megin") {
    return get_by_mg_tag(get_input_text())
  }
  else if (str === "tag_together") {
    return get_by_mt_tag(get_input_text())
  }
  else if (str === "english") {
    return get_by_english(input_text.value);
  }
  else if (str === "chinese") {
    return get_by_chinese(input_text.value);
  }
}
function get_by_mt_tag(tags) {

}
function get_by_english(str) {
  let arrs = words.value;
  let ress = [];
  let bodys = {
    "tag": str + " results",
    "content": []
  };
  if (str.length && str[0].charCodeAt(0) - 65 > 26) {
    str = String.fromCharCode(str.charCodeAt(0) - 32) + str.slice(1);
  }


  for (var i2 = 0; i2 < 100; i2++)bodys.content.push([]);

  for (var i = 0; i < arrs.length; i++) {
    var ct = arrs[i].word.charCodeAt(0) - 65;
    if (ct > 26) {
      arrs[i].word = String.fromCharCode(arrs[i].word.charCodeAt(0) - 32) + arrs[i].word.slice(1);
    }
  }
  let arr = arrs.filter(arrs => arrs.word.search(str) !== -1);
  //console.log(arr, str)
  for (var i2 = 0; i2 < arr.length; i2++) {
    ct = arr[i2].word.charCodeAt(0) - 65;
    if (ct < 0) {
      bodys.content[26].push(
        arr[i2]
      );
    }
    else {
      bodys.content[ct].push(
        arr[i2]
      );
    }
  }

  ress.push(bodys);
  //console.log(bodys)
  //console.log(ress)
  return ress;
}
function get_by_chinese(str) {
  let arrs = words.value;
  let ress = [];
  let bodys = {
    "tag": str + " results",
    "content": []
  };
  for (var i2 = 0; i2 < 100; i2++)bodys.content.push([]);
  let arr = arrs.filter(arrs => arrs.meaning.search(str) !== -1);
  //console.log(arr, str)
  for (var i2 = 0; i2 < arr.length; i2++) {
    var ct = arr[i2].word.charCodeAt(0) - 65;
    if (ct < 0) {
      bodys.content[26].push(
        arr[i2]
      );
    }
    else {
      bodys.content[ct].push(
        arr[i2]
      );
    }
  }

  ress.push(bodys);
  //console.log(bodys)
  //console.log(ress)
  return ress;
}
function get_by_mg_tag(tags) {
  let arrs = words.value;
  let ress = [];

  for (var i = 0; i < tags.length; i++) {
    let bodys = {
      "tag": tags[i],
      "content": []
    };
    for (var i2 = 0; i2 < 100; i2++)bodys.content.push([]);
    for (var i2 = 0; i2 < arrs.length; i2++) {
      if (!arrs[i2]) continue;
      var ct = arrs[i2].word.charCodeAt(0) - 65;
      if (ct > 26) {
        arrs[i2].word = String.fromCharCode(arrs[i2].word.charCodeAt(0) - 32) + arrs[i2].word.slice(1);
      }
      ct = arrs[i2].word.charCodeAt(0) - 65;
      //console.log(arrs[i2], ct)
      if (arrs[i2].tag === tags[i] || input_text.value.length === 0) {
        if (ct < 0) {
          bodys.content[26].push(
            arrs[i2]
          );
        }
        else {
          bodys.content[ct].push(
            arrs[i2]
          );
        }
      }

    }
    ress.push(bodys);
  }
  //console.log(ress)
  return ress;
}
let input_text = ref("");
function get_input_text() {
  return input_text.value.split(' ')
}
function add_tags_in_text(str) {
  if (input_text.value.length > 0) {
    input_text.value += ' ';
  }

  input_text.value += str;
}
let insert_words_data = ref(
  {
    word: "",
    tag: "",
    pos: "",
    meaning: "",
  }
)
async function insert_words() {
  try {
    const { data } = await axios.post(
      'http://localhost:3001/word_data/insert_new_word',
      {
        word: insert_words_data.value.word,
        tag: insert_words_data.value.tag,
        pos: insert_words_data.value.pos,
        meaning: insert_words_data.value.meaning
      }
    );
    // 成功
    alert(data.message);          // 单词已创建
  } catch (e: any) {
    // 失败：400/500 都会进这里
    const msg = e.response?.data?.error || '未知错误';
    alert(msg);                   // 缺少必填字段 / 已经有了单词 / 服务器内部错误
  }
  words.value = (await axios.get('http://localhost:3001/word_data/get_all_word')).data;          // 真正数据在 data 里
  tags_dict.value = (await axios.get('http://localhost:3001/word_data/get_all_tag')).data;
  get_words(sreach_mode.value)
}
</script>

<template>
  <div class="head-menu">
    <!-- 搜索行 -->
    <div class="search-bar">
      <select v-model="sreach_mode" required>
        <option value="">请选择搜索模式 默认标签交集搜索</option>
        <option value="tag_together">标签并集搜索</option>
        <option value="tag_megin">标签交集搜索</option>
        <option value="english">英语搜索</option>
        <option value="chinese">中文搜索</option>
      </select>
      <input class="input-place" v-model="input_text" placeholder="输入关键词" />
    </div>

    <!-- 添加单词行 -->
    <div class="add-bar">
      <span class="label">添加新单词</span>
      <span class="label">中文</span>
      <input class="input-place" v-model="insert_words_data.meaning" />
      <span class="label">英文</span>
      <input class="input-place" v-model="insert_words_data.word" />
      <span class="label">词性</span>
      <input class="input-place" v-model="insert_words_data.pos" />
      <span class="label">英语标签</span>
      <input class="input-place" v-model="insert_words_data.tag" />
      <button class="add-btn" @click="insert_words">添加到学习库</button>
    </div>
  </div>
<div class="three-col">
  <!-- 左侧 tag 池 -->
  <aside class="side-tag">
    <h2 class="side-title">All tags · 单击添加</h2>
    <ul class="tag-pool">
      <li v-for="t in tags_dict" :key="t.tag">
        <span class="tag-btn" @click="add_tags_in_text(t.tag)">
          {{ t.tag }}
        </span>
      </li>
    </ul>
  </aside>

  <!-- 中间单词列表 -->
  <main class="word-main-col">
    <div v-for="grp in get_words(sreach_mode)" :key="grp.tag" class word-group>
      <h1 class="group-title">{{ grp.tag }}</h1>

      <div v-for="(list, idx) in grp.content" :key="idx">
        <h2 v-if="list.length" class="letter-head">
          {{ idx >= 26 ? '#' : String.fromCharCode(65 + idx) }}
        </h2>

        <ul class="word-list">
          <li class="word-row" v-for="w in list" :key="w.id">
            <span class="word-txt">{{ w.word }} · {{ w.meaning }} · {{ w.pos }}</span>
            <span class="tag-pill">{{ w.tag }}</span>
            <span class="star">{{ w.is_collected ? '♥' : '♡' }}</span>
          </li>
        </ul>
      </div>
    </div>
  </main>

  <!-- 右侧占位/扩展栏 -->
  <aside class="side-extra"></aside>
</div>


</template>

<style scoped>
/* 顶部控制栏 */
.head-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.search-bar,
.add-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
select,
.input-place {
  height: 36px;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #f5f7fa;
  color: #303133;
  transition: border-color 0.2s;
}
select:focus,
.input-place:focus {
  outline: none;
  border-color: #409eff;
}
.input-place {
  flex: 1 1 120px;
  min-width: 120px;
}
.label {
  font-size: 0.9rem;
  color: #606266;
  white-space: nowrap;
}
.add-btn {
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #409eff;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}
.add-btn:hover {
  background: #66b1ff;
}

/* 三栏骨架 */
.three-col {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #fafafa;
  min-height: 100vh;
}
.side-tag,
.side-extra {
  flex: 0 0 220px;
}
.word-main-col {
  flex: 1 1 600px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 16px 20px;
}

/* 左侧 tag 池 */
.side-title {
  font-size: 1.1rem;
  color: #303133;
  margin-bottom: 12px;
}
.tag-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
}
.tag-btn {
  padding: 4px 10px;
  background: #e0f7fa;
  color: #006064;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.tag-btn:hover {
  background: #b2ebf2;
}

/* 单词列表 */
.group-title {
  font-size: 1.4rem;
  color: #409eff;
  margin: 0 0 12px 0;
  border-bottom: 2px solid #409eff;
  padding-bottom: 4px;
}
.letter-head {
  font-size: 1.1rem;
  color: #555;
  margin: 12px 0 6px 0;
  font-weight: 600;
}
.word-list {
  list-style: none;
  padding: 0;
}
.word-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
  transition: background 0.2s;
}
.word-row:hover {
  background: #f5f7fa;
}
.word-txt {
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #303133;
}
.tag-pill {
  flex-shrink: 0;
  padding: 2px 8px;
  background: #e0f7fa;
  color: #006064;
  border-radius: 6px;
  font-size: 0.8rem;
}
.star {
  flex-shrink: 0;
  font-size: 1.1rem;
  color: #ff4757;
  cursor: pointer;
}

/* 窄屏变上下栏 */
@media (max-width: 900px) {
  .three-col {
    flex-direction: column;
  }
  .side-tag,
  .side-extra {
    flex: 0 0 auto;
  }
}
</style>
