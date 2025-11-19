// src/api/ai.ts
import { ref } from 'vue';
const BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const API_KEY = '4c335d77-5b75-468a-aff2-164f240ecc85';
const MODEL = 'ep-20251010224847-h9g7p';
export let cambridgeSeries = ref(1); // 字符串，方便拼接
export let testNumber = ref<1 | 2 | 3 | 4>(1);
export let taskType = ref<'小作文' | '大作文'>('小作文');
// 严格版 IELTS Writing 批改系统提示（剑桥系列专用）
function get_zw() {
   return `
【角色 | 身份】
英国文化协会（BC）注册雅思考官，工号 BC-IELTS-2024，持有 2024 版 Band Descriptors 完整电子档案（学术类 & 培训类 Task 1 + Task 2），具备剑桥真题题库级题目溯源能力。

【题目来源】（必须首先输出，禁止省略）
作文题目来源：剑桥 ${cambridgeSeries.value} Test ${testNumber.value} ${taskType.value}

【评分总纲】
1. 题型自动识别与动态权重
   - 小作文 Academic：TA 30% | CC 25% | LR 25% | GRA 20%
   - 小作文 General：TA 30% | CC 25% | LR 25% | GRA 20%
   - 大作文 Task 2：TR 35% | CC 25% | LR 20% | GRA 20%

2. 零容忍 PDF 级细项（自动扫描）
   - 指代不清 → 0.5 档
   - 衔接误用/过度 → 0.5 档
   - 数据遗漏 ≥1 主要特征 → TA 直降 1 档
   - 复杂句比例＜阈值（小作文 35%，大作文 40%）→ GRA 直降 1 档
   - 学术搭配错误 ≥3 → LR 直降 1 档
   - 拼写/构词错误妨碍交流 → 该项封顶 6

3. 字数 Penalty（精确到 0.1 档）
   Task 1:
     <100  按 x/100×0.3×最终分扣减
     100-120  TA 直降 3 档
     120-150  TA 降 2 档
     150-170  TA 降 1 档
     170-190  TA 降 0.5 档
     190-210  正常
     >210  每超 20 词 CC 降 0.5（封顶 1 档）

   Task 2:
     <150  按 x/300×0.3×最终分扣减
     150-190  TR 直降 3 档
     190-220  TR 降 2 档
     220-255  TR 降 1 档
     255-270  TR 降 0.5 档
     270-300  正常
     >300  每超 20 词 CC 降 0.5（封顶 1 档）

【强制输出格式 | 中文 Markdown】
- **TA/TR**: X.X 分 → ≤25 字（含「数据覆盖/扣题」关键词）
- **CC**: X.X 分 → ≤25 字（含「逻辑链/衔接」关键词）
- **LR**: X.X 分 → ≤25 字（含「学术词汇/搭配」关键词）
- **GRA**: X.X 分 → ≤25 字（含「复杂结构/语法错误」关键词）
- **Overall Band**: X.X 分（四舍五入到 0.5）
- **字数 Penalty**: -X.X 档（如有）

【智能问题清单 | ≥3 条，逐句定位】
格式：
1. 原句：「...」→ 类型（语法/词汇/逻辑/数据/拼写/字数）→ 修改句：「...」
2. ...

【亮点与提升 | ≤80 字】
先亮点后提升，禁止空泛形容词。

【关键词必现】
数据覆盖、扣题、逻辑链、衔接、学术词汇、搭配、复杂结构、语法错误、修改句、字数 Penalty

【绝对禁止】
寒暄、模板、整篇重写、非评分内容、英文原文重复、任何解释性前缀

【评分态度】
鸡蛋里挑骨头，错 0.01 档即降档，无同情分，无区间缓冲。
`;;
}

export let aiSystem = get_zw();
/** 非流式一次性返回答案 */
export async function chatSync(
  userContent: string,
  systemContent: string = aiSystem
): Promise<string> {
  systemContent = get_zw();
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      // ① 指定模型版本（必需）
      // 使用常量 MODEL 避免魔法字符串，方便后续切换 v4 / gpt-4 等
      model: MODEL,

      // ② 对话历史数组（必需，至少 1 条）
      // 0.2 温度下建议把 system 放第一条，用户输入放第二条，可减少角色错位
      messages: [
        // ②-1 system 角色：全局指令 + 评分规则 + 预检结果占位符
        // 内容通过 getAiSystem() 运行时拼接，保证剑桥系列号/题型实时响应
        { role: 'system', content: systemContent },

        // ②-2 user 角色：考生原文（已去首尾空格，避免空 token 浪费）
        // 长度若 > 模型上限，需在外层截断或分段发送
        { role: 'user', content: userContent }
      ],

      // ③ 采样温度：0 ≤ T ≤ 2
      // 0.2 = 极低随机性，保证「扣分表 + 四单项分数」格式稳定，
      // 同时保留少量多样性（避免百分百重复）。
      // 若仍出现格式漂移，可再降 0.1 或加 top_p = 0.95 做双保险。
      temperature: 0.2,

      // ④（可选但强烈建议）最大 token 数 = 输入 + 输出总和
      // 雅思作文 600 词 ≈ 800-900 tokens；留 1200 给输出足够覆盖
      // 不写时厂商默认 2k-4k，既浪费钱又可能截断报告。
      max_tokens: 2048,

      // ⑤（可选）top_p = 1 表示从整个分布采样；< 1 可进一步削减低概率词，
      // 与 temperature 二选一即可，这里保持默认 1。
      // top_p: 0.95,
      top_p : 0.95,
      // ⑥（可选）存在用户唯一标识时传入，用于并发统计或限速。
      // user: userId,

      // ⑦（可选）false = 不在返回包里含 prompt 原文，节省流量。
      // echo: false,
    })
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`${res.status} ${msg}`);
  }
  const json = await res.json() as any;
  return json.choices?.[0]?.message?.content ?? '';
}