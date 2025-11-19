<template>
  <div class="page">
    <h1>IELTS Essay AI 批改</h1>

    <!-- ===== 剑桥编号 & Test & 作文类型 ===== -->
    <div class="ctrl-bar">
      <label>
        剑桥系列：
        <input
          type="text"
          v-model="cambridgeSeries"
          placeholder="例：15"
          maxlength="2"
          style="width: 50px"
        />
      </label>

      <label>
        Test：
        <select v-model="testNumber">
          <option v-for="t in 4" :key="t" :value="t">Test {{ t }}</option>
        </select>
      </label>

      <label>
        作文类型：
        <select v-model="taskType">
          <option value="task1">小作文 Task 1</option>
          <option value="task2">大作文 Task 2</option>
        </select>
      </label>
    </div>

    <div class="editor-box">
      <!-- 左侧输入 -->
      <section class="pane left">
        <h2>输入作文（{{ taskType === 'task1' ? 'Task 1' : 'Task 2' }}）</h2>
        <textarea
          v-model="essay"
          :placeholder="`剑桥${cambridgeSeries}-Test${testNumber} ${taskType === 'task1' ? 'Task 1' : 'Task 2'}`"
          :disabled="loading"
        />
        <button @click="handleSubmit" :disabled="loading || !essay.trim()">
          {{ loading ? '批改中...' : '一键批改' }}
        </button>
      </section>

      <!-- 右侧结果 -->
      <section class="pane right">
        <h2>AI 批改报告</h2>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-else-if="result" class="report" v-html="result" />
        <div v-else class="placeholder">批改结果将显示在这里</div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { chatSync } from '@/ai_write';
import {cambridgeSeries,testNumber,taskType,aiSystem } from './ai_write'

const essay = ref('')
const result = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  //console.log(`剑桥${cambridgeSeries.value} Test ${testNumber.value} ${taskType.value}`);
  loading.value = true
  error.value = ''
  result.value = ''
  try {
    const prompt = `${essay.value}`
    const reply = await chatSync(prompt,aiSystem)
    result.value = reply.replace(/\n/g, '<br>')
  } catch (e: any) {
    error.value = e.message || '网络异常'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ---------- 设计变量 ---------- */
:root {
  --ielts-blue: #2f6bff;
  --ielts-blue-dark: #1e4fcc;
  --ielts-blue-light: #e6f0ff;
  --ielts-bg: #f4f7fc;
  --radius: 16px;
  --shadow-sm: 4px 4px 12px rgba(0, 0, 0, .05),
               -4px -4px 12px rgba(255, 255, 255, .8);
  --shadow-md: 6px 6px 18px rgba(0, 0, 0, .06),
               -6px -6px 18px rgba(255, 255, 255, .7);
  --transition: all .3s cubic-bezier(.4, 0, .2, 1);
}

/* ---------- 全局 ---------- */
.page {
  padding: 32px 24px;
  max-width: 1200px;
  margin: auto;
  background: var(--ielts-bg);
  min-height: 100vh;
  font-family: "Inter", "Helvetica Neue", sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 28px;
  font-size: 2rem;
  letter-spacing: 1px;
  color: var(--ielts-blue-dark);
  font-weight: 600;
}

/* ---------- 控制栏 ---------- */
.ctrl-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  padding: 16px 20px;
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.ctrl-bar label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #3a3a3a;
}

.ctrl-bar input,
.ctrl-bar select {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #f8fafc;
  transition: var(--transition);
}

.ctrl-bar input:focus,
.ctrl-bar select:focus {
  border-color: var(--ielts-blue);
  box-shadow: 0 0 0 3px var(--ielts-blue-light);
  outline: none;
}

/* ---------- 编辑区 ---------- */
.editor-box {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.pane {
  flex: 1 1 480px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  padding: 24px;
  transition: var(--transition);
}

.pane:hover {
  transform: translateY(-2px);
  box-shadow: 8px 8px 24px rgba(0, 0, 0, .07),
             -8px -8px 24px rgba(255, 255, 255, .65);
}

.pane h2 {
  font-size: 1.1rem;
  color: var(--ielts-blue-dark);
  margin: 0 0 8px;
}

/* ---------- 文本域 ---------- */
textarea {
  width: 100%;
  height: 400px;
  resize: vertical;
  padding: 14px;
  border: 1px solid #e0e6ed;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.7;
  background: #f8fafc;
  transition: var(--transition);
}

textarea:focus {
  border-color: var(--ielts-blue);
  box-shadow: 0 0 0 3px var(--ielts-blue-light);
  outline: none;
}

/* ---------- 按钮 ---------- */
button {
  align-self: flex-end;
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--ielts-blue) 0%, var(--ielts-blue-dark) 100%);
  color: #59d8ff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: 0 4px 12px rgba(47, 107, 255, .25);
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(47, 107, 255, .35);
}

button:disabled {
  opacity: .55;
  cursor: not-allowed;
  transform: none;
}

/* ---------- 结果 ---------- */
.report {
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}

.error {
  color: #f56c6c;
  font-weight: 500;
}

.placeholder {
  color: #909399;
  text-align: center;
  padding: 60px 0;
}

/* ---------- 呼吸点缀 ---------- */
@keyframes breath {
  50% { box-shadow: 0 0 0 4px rgba(47, 107, 255, .15); }
}

.pane.right:has(.report) {
  animation: breath 4s ease-in-out infinite;
}
</style>