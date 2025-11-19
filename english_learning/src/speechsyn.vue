<template>
  <!-- 1 初始页 -->
  <section v-if="phase === 'init'" class="init">
    <h2>英语听写</h2>

    <!-- 进度 + 复选框 横向一行 -->
    <div class="last-progress">
      上次进度：第 <strong>{{ lastPointer }}</strong> 题 / 共 <strong>{{ words.length }}</strong> 题
      <span v-if="lastPointer >= words.length" style="color:#67c23a"> 已完成✔</span>
    </div>

    <label>
      <input type="checkbox" v-model="restart"> 重新听写（否则继续上次进度）
    </label>

    <!-- 数量选择与按钮合并一行 -->
    <div class="row">
      <span>听写数量：</span>
      <input v-model.number="wanted" type="number" min="1" :max="wordPool.length" @blur="checkWanted">
      <small>剩余可用单词：{{ wordPool.length }}</small>
      <button class="btn primary" @click="start">开始</button>
    </div>
  </section>

  <!-- 2 听写页 -->
  <section v-else-if="phase === 'spelling'" class="spelling">
    <div class="progress">{{ index + 1 }} / {{ list.length }}</div>
    <div class="Chinese">{{ current.meaning }}</div>

    <!-- 播放 / 提示 / 输入 / 提交 四合一区域 -->
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <!-- 第一行：播放 + 提示 -->
      <div style="display:flex;gap:0.5rem">
        <button class="btn" @click="play" :disabled="speaking">🔊 播放发音</button>
        <button class="btn" @click="showTip = true">提示</button>
      </div>

      <!-- 提示条 -->
      <transition name="fade">
        <div v-if="showTip" class="tip">
          {{ current.word }}
        </div>
      </transition>

      <!-- 第二行：输入 + 提交 -->
      <div style="display:flex;gap:0.5rem">
        <input v-model="input" placeholder="请输入单词" @keyup.enter="submit" :disabled="showAns"
               style="flex:1;font-size: 20px;">
        <button v-if="!showAns" class="btn primary" @click="submit">提交</button>
      </div>
    </div>

    <!-- 结果 -->
    <transition name="fade">
      <div v-if="showAns" class="result" :class="right ? 'right' : 'wrong'">
        <p v-if="right">✔ 正确！</p>
        <p v-else>✘ 错误！正确答案：<strong>{{ current.word }}</strong></p>
        <button class="btn" @click="next">
          {{ index === list.length - 1 ? '查看总结' : '下一个' }}
        </button>
      </div>
    </transition>
  </section>

  <!-- 3 总结页 -->
  <section v-else class="summary">
    <h2>听写完成</h2>
    <p>共 {{ list.length }} 题，正确 {{ correct }} 题，正确率 {{ rate }}%</p>

    <!-- 正确 / 错误列表左右分栏 -->
    <div style="display:flex;gap:1.5rem;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">
        <h3>正确列表</h3>
        <ul>
          <li v-for="w in rightList" :key="w.id">{{ w.word }} · {{ w.meaning }}</li>
        </ul>
      </div>
      <div style="flex:1;min-width:200px">
        <h3>错误列表</h3>
        <ul>
          <li v-for="w in wrongList" :key="w.id">{{ w.word }} · {{ w.meaning }}</li>
        </ul>
      </div>
    </div>

    <button class="btn primary" @click="backToInit">退出</button>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { words } from './main'
import { getProgress, resetProgress, setLearningCount, updatePointer } from './speechsyn'

type Phase = 'init' | 'spelling' | 'summary'

/* ---------- 状态 ---------- */
const phase       = ref<Phase>('init')
const restart     = ref(true)
const wanted      = ref(3)
const list        = ref<any[]>([])
const index       = ref(0)
const input       = ref('')
const showAns     = ref(false)
const right       = ref(false)
const showTip     = ref(false)
const speaking    = ref(false)
const correct     = ref(0)
const lastPointer = ref(0)   // 全局绝对位置

/* ---------- 计算 ---------- */
// ★ 不再过滤 _done，只从指针往后切片
const wordPool = computed(() => {
  const prog = lastPointer.value
  return restart.value ? words.value : words.value.slice(prog)
})

const current   = computed(() => list.value[index.value])
const rate      = computed(() => (list.value.length ? Math.round((correct.value / list.value.length) * 100) : 0))
const rightList = computed(() => list.value.filter((w: any) => w._right))
const wrongList = computed(() => list.value.filter((w: any) => !w._right))

/* ---------- 生命周期 ---------- */
onMounted(async () => {
  const prog = await getProgress()
  lastPointer.value = prog.learning_pointer
  restart.value = prog.learning_pointer === 0 || prog.learning_pointer >= words.value.length
  wanted.value  = prog.learning_count || 5
})

/* ---------- 方法 ---------- */
function checkWanted() {
  if (wanted.value > wordPool.value.length) wanted.value = wordPool.value.length
}

async function start() {
  if (wanted.value <= 0) return
  const prog = await getProgress()
  const startIdx = prog.learning_pointer
  let pool = words.value.slice(startIdx)          // 从指针往后
  if (restart.value) {
    await resetProgress()
    pool = words.value                            // 重置后全表
  }
  if (wanted.value > pool.length) wanted.value = pool.length
  await setLearningCount(wanted.value)

  list.value = pool.slice(0, wanted.value).map((w: any) => ({ ...w, _right: false }))
  index.value  = 0
  correct.value= 0
  phase.value  = 'spelling'
  nextTick(play)
}

function play() {
  if (!current.value) return
  speaking.value = true
  const utter = new SpeechSynthesisUtterance(current.value.word)
  utter.lang = 'en-US'
  utter.onend = () => speaking.value = false
  speechSynthesis.speak(utter)
}

async function submit() {
  if (!input.value.trim()) return
  right.value = input.value.trim().toLowerCase() === current.value.word.toLowerCase()
  current.value._right = right.value
  if (right.value) correct.value++

  /* ★ 无论对错，立即全局 +1 */
  await updatePointer(1)

  showAns.value = true
  showTip.value = false
}

async function next() {
  input.value   = ''
  showAns.value = false
  /* 不再 +1，已在 submit 里完成 */
  if (index.value < list.value.length - 1) {
    index.value++
    nextTick(play)
  } else {
    phase.value = 'summary'
  }
}

async function backToInit() {
  /* 不再 +length，每题都已 +1；仅刷新显示 */
  phase.value = 'init'
  const prog = await getProgress()
  lastPointer.value = prog.learning_pointer
  restart.value = prog.learning_pointer >= words.value.length
}
</script>

<style scoped>
/* 整体布局优化 */
.init,
.spelling,
.summary {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.04);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
}

/* 标题样式 */
h2 {
  text-align: center;
  margin: 0 0 1.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 进度卡片现代化 */
.last-progress {
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  color: #64748b;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-left: 4px solid #3b82f6;
}

.last-progress strong {
  color: #1e40af;
  font-weight: 700;
}

/* 表单元素美化 */
.row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.25rem 0;
  flex-wrap: wrap;
}

.row span {
  font-weight: 500;
  color: #374151;
  min-width: 80px;
}

input[type="number"] {
  width: 80px;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

input[type="number"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 复选框样式优化 */
label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.3s ease;
}

label:hover {
  background: #f1f5f9;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #cbd5e1;
  accent-color: #3b82f6;
}

/* 按钮组全面升级 */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #475569;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transition: left 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.12),
    0 3px 6px rgba(0, 0, 0, 0.1);
  color: #1e40af;
}

.btn.primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
}

.btn.primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 听写页面专用样式 */
.spelling {
  text-align: center;
}

.progress {
  text-align: right;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.Chinese {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin: 1.5rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border-radius: 12px;
  border-left: 4px solid #f59e0b;
}

/* 输入框现代化 */
input[type="text"] {
  width: 100%;
  height: 50px;
  padding: 0 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.1rem;
  background: #ffffff;
  transition: all 0.3s ease;
  margin: 1rem 0;
}

input[type="text"]:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 
    0 0 0 4px rgba(59, 130, 246, 0.1),
    0 4px 12px rgba(59, 130, 246, 0.1);
  background: #ffffff;
}

/* 提示和结果样式优化 */
.tip {
  margin: 1rem 0;
  font-size: 0.9rem;
  color: #475569;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  border-left: 4px solid #10b981;
  font-weight: 500;
}

.result {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.5;
  animation: slideUp 0.3s ease;
}

.result.right {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-left: 4px solid #10b981;
  color: #047857;
}

.result.wrong {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-left: 4px solid #ef4444;
  color: #dc2626;
}

.result strong {
  font-weight: 700;
  color: inherit;
}

/* 总结页面列表美化 */
.summary h3 {
  margin: 1.5rem 0 1rem 0;
  color: #374151;
  font-size: 1.25rem;
  font-weight: 600;
}

.summary ul {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.summary li {
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
  transition: all 0.3s ease;
}

.summary li:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

/* 动画效果增强 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计优化 */
@media (max-width: 480px) {
  .init,
  .spelling,
  .summary {
    margin: 1rem;
    padding: 1.5rem;
    border-radius: 16px;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  .Chinese {
    font-size: 1.25rem;
    padding: 0.75rem;
  }
  
  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
    width: 100%;
    margin: 0.25rem 0;
  }
  
  .row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  input[type="number"] {
    width: 100%;
  }
}

/* 小屏幕额外优化 */
@media (max-width: 360px) {
  .init,
  .spelling,
  .summary {
    margin: 0.5rem;
    padding: 1.25rem;
  }
  
  .last-progress {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>