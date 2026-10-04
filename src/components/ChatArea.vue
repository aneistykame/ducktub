<template>
  <main class="chat">
    <header class="chat-header">
      <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="22px" />
      <span class="title">{{ channel.name }}</span>
    </header>

    <div ref="messagesEl" class="messages">
      <MessageBubble
        v-for="i in items"
        :key="i.m.id"
        :message="i.m"
        :author="authorOf(i.m)"
        :mine="i.m.authorId === me.id"
        :mention="i.m.mentions.includes(me.nickName)"
        :show-meta="i.first"
        :show-avatar="i.last"
      />
    </div>

    <TypingIndicator :nick="typing.nick" :draft="typing.draft" />

    <CommandBar @submit="onSubmit" />
  </main>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { users, channels, messages } from '../mock/data'
import MessageBubble from './MessageBubble.vue'
import CommandBar from './CommandBar.vue'
import TypingIndicator from './TypingIndicator.vue'

const me = users[0]
const channelId = 1
const typing = { nick: 'ed', draft: 'I can bring dess' }

const allMessages = ref([...messages])
const messagesEl = ref(null)

const channel = computed(() => channels.find((c) => c.id === channelId))
const channelMessages = computed(() => allMessages.value.filter((m) => m.channelId === channelId))
const authorOf = (m) => users.find((u) => u.id === m.authorId)

const items = computed(() =>
  channelMessages.value.map((m, i, arr) => ({
    m,
    first: i === 0 || arr[i - 1].authorId !== m.authorId,
    last: i === arr.length - 1 || arr[i + 1].authorId !== m.authorId,
  })),
)

async function scrollToEnd() {
  await nextTick()
  messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function onSubmit(text) {
  if (text.startsWith('/')) return

  const mentions = (text.match(/@\w+/g) || []).map((t) => t.slice(1))

  allMessages.value.push({
    id: Date.now(),
    channelId,
    authorId: me.id,
    text,
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    mentions,
  })

  scrollToEnd()
}

onMounted(scrollToEnd)
</script>

<style lang="scss" scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $dark-page;
  color: $text-light;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px 12px 64px;
  font-size: 20px;
  font-weight: 700;
}

.messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 24px 16px;
}
</style>
