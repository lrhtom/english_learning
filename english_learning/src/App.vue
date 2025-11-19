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


</script>

<template>
  <nav class="nav-bar">
    <router-link to="/">错题本</router-link>
    <router-link to="/ai_talk">AI 外教页面</router-link>
    <router-link to="/ai_writing">AI 写作批改</router-link>
    <router-link to="/dicts">有用链接</router-link>
    <router-link to="/speechsyn">听写</router-link>
  </nav>
  <router-view />
</template>

<style scoped>
/* ---------- 导航栏容器 ---------- */
.nav-bar {
  display: flex;
  justify-content: center;
  /* 居中 */
  align-items: center;
  gap: 2rem;
  /* 按钮间距 */
  padding: 1rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 0 0 12px 12px;
  margin-bottom: 1.5rem;
}

/* ---------- 链接按钮 ---------- */
.nav-bar a {
  position: relative;
  padding: 0.6rem 1.2rem;
  color: #fff;
  font-weight: 500;
  font-size: 1rem;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.3s, transform 0.2s;
}

/* 悬停效果 */
.nav-bar a:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* 当前路由高亮 */
.nav-bar a.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 0 2px #fff inset;
}

/* ---------- 响应式：窄屏自动换行 ---------- */
@media (max-width: 480px) {
  .nav-bar {
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.8rem 0.5rem;
  }

  .nav-bar a {
    font-size: 0.9rem;
    padding: 0.5rem 0.8rem;
  }
}
</style>