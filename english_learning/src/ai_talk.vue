<script setup lang="ts">
import { ref } from 'vue'
import { chatSync } from '@/ai_chat'
import { nextTick } from 'vue'
/* ---------- 原有变量 ---------- */
const msgList = ref<Array<{ role: 'user' | 'assistant'; text: string }>>([])
const input = ref('')
const loading = ref(false)
const speaking = ref(false)

/* ---------- 语音识别 ---------- */
const recogText = ref('')          // 实时识别结果
const isRecording = ref(false)     // 是否正在录音

const recognition = new (window as any).webkitSpeechRecognition()  // Chrome 内核
recognition.lang = 'en-US'         // 英文识别
recognition.interimResults = false
recognition.continuous = true

/* ---------- 实时识别 ---------- */
const interimText = ref('')        // 中间结果

recognition.lang = 'en-US'
recognition.interimResults = true   // ← 关键：开启中间结果
recognition.continuous = true


async function scrollToBottom() {
    await nextTick()
    const chatBox = document.querySelector('.chat-area') as HTMLElement
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight
}
recognition.onend = () => {
    isRecording.value = false
    interimText.value = ''
    if (recogText.value.trim()) {
        input.value = recogText.value
        nextTick(send)   // 识别结束自动发送
    }
}

const finalText = ref('')        // 累加的最终文本
/* 每一句最终结果累加 */
recognition.onresult = (e: any) => {
    const last = e.results[e.results.length - 1]
    if (last.isFinal) finalText.value += last[0].transcript + ' '
}

/* 手动结束 */
recognition.onend = () => {
    isRecording.value = false
    if (finalText.value.trim()) {
        input.value = finalText.value.trim()
        nextTick(send)   // 自动发送
        
    }
}

function startRecord() {
  input.value='';
    if (!('webkitSpeechRecognition' in window)) {
        alert('请使用 Chrome/Edge 以支持语音输入')
        return
    }
    finalText.value = ''
    isRecording.value = true
    recognition.start()
}

function stopRecord() {
    recognition.stop()
}

function toggleRecord() {
    isRecording.value ? stopRecord() : startRecord()
}



/* ---------- 发送 ---------- */
async function send() {
    if (!input.value.trim() || loading.value || speaking.value) return
    const userText = input.value.trim()
    msgList.value.push({ role: 'user', text: userText })
    input.value = ''
    loading.value = true

    try {
        const reply = await chatSync(userText)
        msgList.value.push({ role: 'assistant', text: reply })
        await scrollToBottom() // 👈 立即底部

        /* 语音播报 */
        speaking.value = true
        const utter = new SpeechSynthesisUtterance(reply)
        utter.lang = 'en-US'
        utter.onend = async () => {
            speaking.value = false
            await scrollToBottom() // 👈 读完再底部（防止气泡撑高）
        }
        speechSynthesis.speak(utter)
    } catch (e: any) {
        msgList.value.push({ role: 'assistant', text: '出错啦：' + (e.message || e) })
    } finally {
        loading.value = false
    }
}

/* ---------- 回车 ---------- */
function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        send()
    }
}
recognition.onresult = (e: any) => {
  let finalChunk = ''
  let interimChunk = ''
  for (let i = e.resultIndex; i < e.results.length; ++i) {
    if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript + ' '
    else interimChunk += e.results[i][0].transcript
  }
  if (finalChunk) {
    finalText.value += finalChunk
    input.value = finalText.value          // ← 实时写入文本框
  }
  interimText.value = interimChunk
}
</script>

<template>
    <div class="ai-talk">
  <div class="talk-card">
    <h1 class="title">AI 对话页面</h1>

    <!-- 聊天记录 -->
    <div class="chat-area">
      <template v-if="msgList.length">
        <div v-for="(msg, idx) in msgList" :key="idx" :class="['bubble', msg.role]">
          {{ msg.text }}
        </div>
      </template>
      <p v-else class="placeholder">快来和 AI 聊聊吧~</p>
    </div>

    <!-- 输入控制区：一体化底部栏 -->
    <div class="control-box">
      <div class="input-bar">
        <textarea
  v-model="input"
  class="chat-input"
  placeholder="输入消息，Ctrl+Enter 发送"
  :disabled="loading || speaking || isRecording"
  @keydown="onKeydown"
  aria-label="消息输入框"
  enterkeyhint="send"
  rows="1"
/>
        <div class="btn-group">
          <!-- 语音 -->
          <button
            class="voice-btn"
            :class="{ active: isRecording }"
            @click="toggleRecord"
            :disabled="loading || speaking"
            aria-label="语音输入"
            type="button"
          >
            <svg v-if="!isRecording" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="9" y="2" width="6" height="20" rx="3"/>
              <rect x="2" y="9" width="20" height="6" rx="3"/>
            </svg>
          </button>

          <!-- 发送 -->
          <button
            class="send-btn"
            @click="send"
            :disabled="loading || speaking || !input.trim()"
            aria-label="发送消息"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</div>
</template>

<style scoped>
/* ========= 全屏背景 ========= */
.ai-talk {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

/* ---------- 卡片 ---------- */
.talk-card {
  width: 100%;
  max-width: 720px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.title {
  margin: 0;
  padding: 1.2rem 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #409eff 0%, #79bbff 100%);
  letter-spacing: 0.5px;
}

/* ---------- 聊天内容区 ---------- */
.chat-area {
  flex: 1;
  padding: 1rem 1.5rem;
  min-height: 320px;
  max-height: 50vh;
  overflow-y: auto;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.placeholder {
  color: #909399;
  text-align: center;
  margin: auto;
}

/* 气泡 */
.bubble {
  max-width: 70%;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  line-height: 1.4;
  font-size: 0.95rem;
}

.bubble.user {
  align-self: flex-end;
  background: #409eff;
  color: #fff;
}

.bubble.assistant {
  align-self: flex-start;
  background: #f1f1f1;
  color: #303133;
}

/* ========= 一体化底部栏 ========= */
.control-box {
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.input-bar {
  position: relative;   /* 供内部按钮绝对定位 */
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 药丸输入框（Kimi 风） */
/* 可滚动药丸输入框 */
.chat-input {
  flex: 1;
  max-height: 96px;               /* 3 行后不再增高 */
  padding: 12px 52px 12px 16px;   /* 留按钮位置 */
  border: 2px solid #d1d5db;
  border-radius: 24px;
  background: #ffffff;
  color: #111827;
  font-size: 1.05rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  resize: none;                   /* 禁止手动拖拽 */
  overflow-y: auto;               /* 超出即滚动 */
  outline: none;
  transition: all .2s ease;
  line-height: 1.4;
  field-sizing: content;          /* Chrome 自动高 */
}
.chat-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, .25);
}
.chat-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

/* 滚动条样式（可选） */
.chat-input::-webkit-scrollbar {
  width: 6px;
}
.chat-input::-webkit-scrollbar-thumb {
  background: #c4c4c4;
  border-radius: 3px;
}

/* 按钮组：绝对定位在输入框内部右侧 */
.btn-group {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
}

/* 语音按钮 */
.voice-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #f3f4f6;
  color: #4b5563;
  cursor: pointer;
  transition: all .2s ease;
  display: grid;
  place-items: center;
}
.voice-btn:hover:not(:disabled) {
  background: #e5e7eb;
}
.voice-btn.active {
  background: #fee2e2;
  color: #dc2626;
}
.voice-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* 发送按钮 */
.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  transition: all .2s ease;
  display: grid;
  place-items: center;
}
.send-btn:hover:not(:disabled) {
  background: #1d4ed8;
}
.send-btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* 实时识别文字 */
.live-text {
  margin-top: 8px;
  font-size: 0.95rem;
  color: #303133;
  white-space: pre-wrap;
}
.live-text .interim {
  color: #909399;
}

/* 移动端微调 */
@media (max-width: 600px) {
  .input-bar {
    gap: 6px;
  }
  .btn-group {
    right: 2px;
  }
}
</style>