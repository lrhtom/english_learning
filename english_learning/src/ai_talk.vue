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

recognition.onresult = (e: any) => {
    let finalChunk = '';
    let interimChunk = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalChunk += e.results[i][0].transcript + ' ';
        else interimChunk += e.results[i][0].transcript;
    }
    if (finalChunk) recogText.value += finalChunk;   // 累加
    interimText.value = interimChunk;                // 中间结果仅展示
};
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

            <!-- 输入控制区 -->
            <div class="control-box">
                <!-- 1. 文本输入 -->
                <input v-model="input" class="chat-input" placeholder="输入消息，回车发送"
                    :disabled="loading || speaking || isRecording" @keydown="onKeydown" />

                <!-- 2. 语音按钮 + 实时识别 -->
                <button class="voice-btn" :class="{ active: isRecording }" @click="toggleRecord"
                    :disabled="loading || speaking">
                    {{ isRecording ? '🔴 结束录音' : '🎤 点击说英语' }}
                </button>

                <!-- 实时累加文本 -->
                <div v-if="isRecording" class="live-text">
                    {{ finalText }}
                </div>

                <!-- 3. 发送按钮 -->
                <button class="send-btn" :disabled="loading || speaking" @click="send">
                    {{ loading ? '发送中…' : speaking ? '播报中…' : '发送' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ---------- 全屏背景 ---------- */
.control-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 1rem 1.5rem;
    background: #fff;
    border-top: 1px solid #e4e7ed;
}

.voice-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.live-text {
    margin-top: 8px;
    font-size: 0.95rem;
    color: #303133;
    min-height: 1.4rem;
    white-space: pre-wrap;
}

.live-text .final {
    font-weight: 500;
}

.live-text .interim {
    color: #909399;
}

/* 移动端自动撑宽 */
@media (max-width: 600px) {
    .control-box {
        padding: 1rem;
    }

    .chat-input,
    .voice-btn,
    .send-btn {
        width: 100%;
    }
}

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

/* ---------- 输入区 ---------- */
.input-area {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: #fff;
    border-top: 1px solid #e4e7ed;
}

.chat-input {
    flex: 1;
    height: 40px;
    padding: 0 12px;
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;
}

.chat-input:focus {
    outline: none;
    border-color: #409eff;
}

.send-btn {
    padding: 0 1.2rem;
    height: 40px;
    border: none;
    border-radius: 8px;
    background: #409eff;
    color: #fff;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.send-btn:hover:not(:disabled) {
    background: #66b1ff;
}

.send-btn:disabled {
    background: #c0c4cc;
    cursor: not-allowed;
}

/* ---------- 响应式 ---------- */
@media (max-width: 600px) {
    .talk-card {
        border-radius: 0;
        height: 100vh;
        max-width: 100%;
    }

    .title {
        border-radius: 0;
    }
}

.live-text {
    margin-top: 8px;
    font-size: 0.95rem;
    color: #303133;
    min-height: 1.4rem;
}

.interim {
    color: #909399;
    /* 中间结果淡色 */
}
</style>