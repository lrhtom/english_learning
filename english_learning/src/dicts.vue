<script setup lang="ts">
import { createApp, ref ,computed } from 'vue';
/* ========== 类型约束 ========== */
interface IeltsLink {
  id: number;
  title: string;
  label: string;
  url: string;
  theme: 'primary' | 'secondary' | 'tertiary'; // 限定按钮色系
}

/* ========== 唯一需要维护的数据 ========== */
const linkList = ref<IeltsLink[]>([
  {
    id: 1,
    title: '官方机考报名',
    label: '跳转',
    url: 'https://ielts.neea.cn/?utm_source=chinaielts&utm_medium=banner&utm_campaign=chinaieltspromopilot&utm_id=chinaieltspromo&utm_term=chinaieltspromopilot&utm_content=chinaieltspromopilot',
    theme: 'primary',
  },
  {
    id: 2,
    title: '高质量题库',
    label: '新东方雅思模考',
    url: 'https://liuxue.koolearn.com/ielts/mock/?kid=0e7542c0e4fb42c6a3e5e1c8cafe4f42&utm_item=%E9%9B%85%E6%80%9D%E8%B5%84%E8%AE%AF%E9%A1%B5-%E9%9B%85%E6%80%9D%E5%85%A8%E7%9C%9F%E6%A8%A1%E8%80%83&a_id=5115187575f14eaf84fba9e0353d3916&ctx=&basePath=http%3A%2F%2Fun.koolearn.com%3A80%2F',
    theme: 'secondary',
  },
  {
        id: 3,
    title: '官方机考入口',
    label: '免费模考（1:1界面）',
    url: 'https://britishcouncil.gelielts.cn/',
    theme: 'tertiary',
  }
]);
</script>
<template>
  <section class="ielts-links">
    <h1 class="title">雅思冲刺资源</h1>

    <!-- 一条 v-for 维护所有链接 -->
    <article
      v-for="item in linkList"
      :key="item.id"
      class="link-card"
    >
      <h2>{{ item.title }}</h2>
      <a
        :href="item.url"
        target="_blank"
        rel="noopener"
        :class="['btn', item.theme]"
      >
        {{ item.label }}
      </a>
    </article>
  </section>
</template>




<style scoped>
.ielts-links {
  padding: 2rem;
  max-width: 800px;
  margin: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.title {
  text-align: center;
  font-size: 2rem;
  color: #003366;
  margin-bottom: 2rem;
}

.link-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  transition: transform 0.2s;
}
.link-card:hover {
  transform: translateY(-2px);
}

.link-card h2 {
  font-size: 1.25rem;
  color: #00509e;
  margin: 0 0 0.75rem;
}

.btn {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}
.btn.primary {
  background: #00509e;
  color: #fff;
}
.btn.primary:hover {
  background: #003d7a;
}
.btn.secondary {
  background: #f0f4f8;
  color: #00509e;
  border: 1px solid #00509e;
}
.btn.secondary:hover {
  background: #e0e9f2;
}
.btn.tertiary {
  background: linear-gradient(135deg, #ff9a00, #ff6a00);
  color: #fff;
}
.btn.tertiary:hover {
  background: linear-gradient(135deg, #ff8a00, #ff5a00);
}
</style>