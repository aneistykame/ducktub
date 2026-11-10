<template>
  <main class="chat">
    <header class="chat-header">
      <q-icon :name="channel.type === 'private' ? 'lock' : 'tag'" size="22px" />
      <span class="title" :title="channel.name">{{ channel.name }}</span>
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

    <CommandToast :feedback="feedback" />

    <CommandBar @submit="onSubmit" />

    <ProfileDialog v-model="profileOpen" :user="profileUser" />

    <LeaveChannelDialog v-model="leaveOpen" :channel="leaveTarget" @left="show" />

    <div v-if="isDev" class="simulate">
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
import CommandToast from './CommandToast.vue'
import LeaveChannelDialog from './LeaveChannelDialog.vue'
import { useCommands } from '../composables/useCommands'
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

const TOP_OFFSET = 100
const BOTTOM_OFFSET = 150
const loading = ref(false)

const items = computed(() =>
  channelMessages.value.map((m, i, arr) => ({
    m,
    first: i === 0 || arr[i - 1].authorId !== m.authorId,
    last: i === arr.length - 1 || arr[i + 1].authorId !== m.authorId,
  })),
)

// Near the top: fetch the previous page from the server and keep the view where it was
async function onScroll() {
  const el = messagesEl.value
  if (!el || loading.value || !chat.activeHasMore) return
  if (el.scrollTop > TOP_OFFSET) return

  loading.value = true
  const channelId = chat.activeId
  const heightBefore = el.scrollHeight
  const topBefore = el.scrollTop

  try {
    await chat.loadOlderMessages(channelId)
    await nextTick()
    if (chat.activeId === channelId) el.scrollTop = topBefore + (el.scrollHeight - heightBefore)
  } finally {
    loading.value = false
  }
}

async function scrollToEnd() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

const nearBottom = () => {
  const el = messagesEl.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_OFFSET
}

const { feedback, run, show, leaveOpen, leaveTarget } = useCommands()

async function onSubmit(text) {
  if (run(text)) return

  const res = await chat.sendMessage(text)
  if (!res.ok) show(res)
}

const isDev = import.meta.env.DEV

// Waits a moment so you can switch to another tub or window and see the notification
function simulate(withMention) {
  requestNotificationPermission()

  setTimeout(async () => {
    const res = await chat.simulateMessage(withMention)
    if (!res.ok) show(res)
  }, 3000)
}

onMounted(scrollToEnd)

watch(
  () => chat.activeId,
  () => {
    loading.value = false
    scrollToEnd()
  },
)

// A new message at the bottom: follow it if it's mine or the reader was already at the end
watch(
  () => channelMessages.value.at(-1)?.id,
  (id, oldId) => {
    if (id === undefined || id === oldId) return
    const last = channelMessages.value.at(-1)
    if (oldId === undefined || last.authorId === chat.me?.id || nearBottom()) scrollToEnd()
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
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
