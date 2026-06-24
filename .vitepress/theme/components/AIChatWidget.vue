<script setup lang="ts">
import { nextTick, ref } from "vue";

type Suggestion = {
  title: string;
  route: string;
  reason?: string;
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
  suggestions?: Suggestion[];
};

const open = ref(false);
const loading = ref(false);
const input = ref("");
const bodyRef = ref<HTMLDivElement | null>(null);
const messages = ref<ChatMessage[]>([
  {
    role: "assistant",
    content:
      "可以直接问我：`我想先学 PPO`、`有哪些 Agent 相关文章`、`从 RLHF 入门该看什么`。",
  },
]);

async function scrollToBottom() {
  await nextTick();
  if (bodyRef.value) {
    bodyRef.value.scrollTop = bodyRef.value.scrollHeight;
  }
}

async function send() {
  const message = input.value.trim();
  if (!message || loading.value) {
    return;
  }

  messages.value.push({ role: "user", content: message });
  input.value = "";
  loading.value = true;
  await scrollToBottom();

  try {
    const response = await fetch("/api/ai-nav", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    messages.value.push({
      role: "assistant",
      content: payload.answer || "我先帮你整理了一些相关内容。",
      suggestions: payload.suggestions || [],
    });
  } catch (error) {
    messages.value.push({
      role: "assistant",
      content:
        "当前没有连接到 AI 导航接口，不过博客主体已经可用。部署到 Vercel 并配置 `DEEPSEEK_API_KEY` 后，这里会提供更智能的推荐。",
    });
    console.error(error);
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}
</script>

<template>
  <div class="ai-widget">
    <button class="ai-widget__toggle" type="button" @click="open = !open">
      {{ open ? "收起导航" : "AI 导航" }}
    </button>

    <transition name="ai-widget-fade">
      <section v-if="open" class="ai-widget__panel">
        <header>
          <div>
            <p>DeepSeek Navigator</p>
            <h3>内容推荐助手</h3>
          </div>
        </header>

        <div ref="bodyRef" class="ai-widget__body">
          <article
            v-for="(message, index) in messages"
            :key="`${message.role}-${index}`"
            :class="['ai-widget__message', `is-${message.role}`]"
          >
            <p>{{ message.content }}</p>
            <ul v-if="message.suggestions?.length">
              <li v-for="item in message.suggestions" :key="item.route">
                <a :href="item.route">{{ item.title }}</a>
                <span>{{ item.reason }}</span>
              </li>
            </ul>
          </article>
        </div>

        <form class="ai-widget__form" @submit.prevent="send">
          <textarea
            v-model="input"
            rows="3"
            placeholder="比如：我想按从浅到深了解 PPO 和 RLHF"
          />
          <button type="submit" :disabled="loading">
            {{ loading ? "思考中..." : "发送" }}
          </button>
        </form>
      </section>
    </transition>
  </div>
</template>

<style scoped>
.ai-widget {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 60;
  display: grid;
  justify-items: end;
  gap: 0.9rem;
}

.ai-widget__toggle {
  border: 0;
  border-radius: 999px;
  padding: 0.85rem 1.15rem;
  background: linear-gradient(135deg, #14756c, #0f5f58);
  color: #f8f4ed;
  font-weight: 700;
  box-shadow: 0 18px 44px rgba(20, 117, 108, 0.32);
  cursor: pointer;
}

.ai-widget__panel {
  width: min(380px, calc(100vw - 24px));
  max-height: min(640px, calc(100vh - 100px));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 251, 244, 0.96);
  border: 1px solid rgba(31, 42, 55, 0.1);
  box-shadow: 0 24px 80px rgba(31, 42, 55, 0.18);
  backdrop-filter: blur(18px);
}

.ai-widget__panel header {
  padding: 1rem 1rem 0.8rem;
  border-bottom: 1px solid rgba(31, 42, 55, 0.08);
}

.ai-widget__panel p {
  margin: 0;
}

.ai-widget__panel header p {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #14756c;
  font-weight: 700;
}

.ai-widget__panel header h3 {
  margin: 0.35rem 0 0;
}

.ai-widget__body {
  overflow: auto;
  padding: 1rem;
  display: grid;
  gap: 0.9rem;
}

.ai-widget__message {
  padding: 0.85rem 0.95rem;
  border-radius: 18px;
  font-size: 0.94rem;
}

.ai-widget__message.is-assistant {
  background: rgba(20, 117, 108, 0.08);
}

.ai-widget__message.is-user {
  background: rgba(31, 42, 55, 0.08);
}

.ai-widget__message ul {
  list-style: none;
  padding: 0;
  margin: 0.8rem 0 0;
  display: grid;
  gap: 0.65rem;
}

.ai-widget__message li {
  display: grid;
  gap: 0.18rem;
}

.ai-widget__message a {
  font-weight: 700;
  color: #1f2a37;
}

.ai-widget__message span {
  font-size: 0.85rem;
  color: #526173;
}

.ai-widget__form {
  padding: 0.95rem;
  border-top: 1px solid rgba(31, 42, 55, 0.08);
  display: grid;
  gap: 0.8rem;
}

.ai-widget__form textarea {
  width: 100%;
  resize: vertical;
  min-height: 84px;
  border: 1px solid rgba(31, 42, 55, 0.12);
  border-radius: 16px;
  padding: 0.8rem 0.9rem;
  background: rgba(255, 255, 255, 0.92);
}

.ai-widget__form button {
  justify-self: end;
  border: 0;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  background: #1f2a37;
  color: #f8f4ed;
  cursor: pointer;
}

.ai-widget__form button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.ai-widget-fade-enter-active,
.ai-widget-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.ai-widget-fade-enter-from,
.ai-widget-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 640px) {
  .ai-widget {
    right: 12px;
    left: 12px;
    justify-items: stretch;
  }

  .ai-widget__toggle {
    justify-self: end;
  }

  .ai-widget__panel {
    width: 100%;
  }
}
</style>
