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

    <div ref="messagesEl" class="messages" @scroll.passive="onScroll">
      <div v-if="loading" class="row justify-center q-my-md">
        <q-spinner color="secondary" size="28px" />
      </div>

      <MessageBubble
        v-for="i in items"
        :key="i.m.id"
        :message="i.m"
        :author="authorOf(i.m)"
        :mine="i.m.authorId === chat.me.id"
        :mention="i.m.mentions.includes(chat.me.nickName)"
        :show-meta="i.first"
        :show-avatar="i.last"
        @open-profile="openProfile"
      />
    </div>

    <TypingIndicator v-if="typing" :nick="typing.nick" :draft="typing.draft" />

    <CommandBar @submit="onSubmit" />

    <ProfileDialog v-model="profileOpen" :user="profileUser" />

    <div class="simulate">
      <q-btn flat no-caps label="Simulate message" @click="simulate(false)" />
      <q-btn flat no-caps label="Simulate mention" @click="simulate(true)" />
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import MessageBubble from './MessageBubble.vue'
import CommandBar from './CommandBar.vue'
import TypingIndicator from './TypingIndicator.vue'
import ProfileDialog from './ProfileDialog.vue'
import { requestNotificationPermission } from '../utils/notifications'

defineProps({
  membersOpen: Boolean,
  showMembersButton: Boolean,
})

const emit = defineEmits(['toggle-members'])

const chat = useChatStore()

const typingByChannel = {
  1: { nick: 'ed', draft: 'I can bring dess' },
}

const typing = computed(() => {
  const t = typingByChannel[chat.activeId]
  if (!t) return null

  const user = chat.users.find((u) => u.nickName === t.nick)
  if (!user || user.id === chat.me.id) return null

  return chat.activeChannel.memberIds.includes(user.id) ? t : null
})

const messagesEl = ref(null)

const profileOpen = ref(false)
const profileUser = ref(null)

function openProfile(user) {
  profileUser.value = user
  profileOpen.value = true
}

const channel = computed(() => chat.activeChannel)
const channelMessages = computed(() => chat.activeMessages)
const authorOf = (m) => chat.users.find((u) => u.id === m.authorId)

const PAGE = 30
const TOP_OFFSET = 100
const loaded = ref(PAGE)
const loading = ref(false)

const hasMore = computed(() => loaded.value < channelMessages.value.length)

const visibleMessages = computed(() => channelMessages.value.slice(-loaded.value))

const items = computed(() =>
  visibleMessages.value.map((m, i, arr) => ({
    m,
    first: i === 0 || arr[i - 1].authorId !== m.authorId,
    last: i === arr.length - 1 || arr[i + 1].authorId !== m.authorId,
  })),
)

function onScroll() {
  const el = messagesEl.value
  if (!el || loading.value || !hasMore.value) return
  if (el.scrollTop > TOP_OFFSET) return

  loading.value = true

  setTimeout(async () => {
    const heightBefore = el.scrollHeight
    const topBefore = el.scrollTop

    loaded.value += PAGE
    await nextTick()

    el.scrollTop = topBefore + (el.scrollHeight - heightBefore)
    loading.value = false
  }, 400)
}

async function scrollToEnd() {
  await nextTick()
  messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function onSubmit(text) {
  if (text.startsWith('/')) return

  chat.sendMessage(text)
  loaded.value++
  scrollToEnd()
}

function simulate(withMention) {
  const ed = chat.users.find((u) => u.nickName === 'ed')
  const target =
    chat.myChannels.find((c) => c.id !== chat.activeId && c.memberIds.includes(ed.id)) ??
    chat.activeChannel

  requestNotificationPermission()

  setTimeout(() => {
    chat.receiveMessage({
      channelId: target.id,
      authorId: ed.id,
      text: withMention
        ? `Hey @${chat.me.nickName}, are you coming to the meeting later today?`
        : 'Ducks <3',
    })
  }, 3000)
}

onMounted(scrollToEnd)

watch(
  () => chat.activeId,
  () => {
    loaded.value = PAGE
    loading.value = false
    scrollToEnd()
  },
)
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

.title {
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
  padding: 15px 0;
}

.members-btn {
  flex: none;
  margin-left: auto;
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
  word-break: break-word;
  overflow-wrap: anywhere;
}

.simulate {
  display: flex;
  gap: 8px;
  padding: 0 24px 8px;
}
</style>
