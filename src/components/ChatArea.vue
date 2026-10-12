<template>
  <main class="chat">
    <header class="chat-header">
      <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="22px" />
      <span class="title">{{ channel.name }}</span>
      <q-btn
        v-if="showMembersButton"
        class="members-btn"
        flat
        round
        icon="group"
        :color="membersOpen ? 'secondary' : 'white'"
        @click="emit('toggle-members')"
      />
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
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { users } from '../mock/data'
import { useChatStore } from '../stores/chat'
import MessageBubble from './MessageBubble.vue'
import CommandBar from './CommandBar.vue'
import TypingIndicator from './TypingIndicator.vue'

defineProps({
  membersOpen: Boolean,
  showMembersButton: Boolean,
})

const emit = defineEmits(['toggle-members'])

const chat = useChatStore()
const me = chat.me
const typing = { nick: 'ed', draft: 'I can bring dess' }

const messagesEl = ref(null)

const channel = computed(() => chat.activeChannel)
const channelMessages = computed(() => chat.activeMessages)
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

  chat.sendMessage(text)
  scrollToEnd()
}

onMounted(scrollToEnd)
watch(() => chat.activeId, scrollToEnd)
</script>

<style lang="scss" scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: $dark-page;
  color: $text-light;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 64px;
  padding: 0 24px;
  font-size: 20px;
  font-weight: 700;
}

@media (max-width: 1123px) {
  .chat-header {
    padding-left: 64px;
  }
}

.members-btn {
  margin-left: auto;
}

.messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 24px 16px;
}
</style>
