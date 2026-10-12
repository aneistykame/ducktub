import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { users as mockUsers, channels as mockChannels, messages as mockMessages } from '../mock/data'

export const useChatStore = defineStore('chat', () => {
  const users = ref(mockUsers.map((u) => ({ ...u })))
  const me = users.value[0]

  const channels = ref(mockChannels.map((c) => ({ ...c, memberIds: [...(c.memberIds ?? [])], invitedIds: [] })))
  const messages = ref([...mockMessages])
  const activeId = ref(1)

  const activeChannel = computed(() => channels.value.find((c) => c.id === activeId.value))
  const activeMessages = computed(() => messages.value.filter((m) => m.channelId === activeId.value))

  function setActive(id) {
    activeId.value = id
    const channel = channels.value.find((c) => c.id === id)
    if (channel) channel.unread = 0
  }

  function acceptInvite(channel) {
    channel.invited = false
    if (!channel.memberIds.includes(me.id)) channel.memberIds.push(me.id)
  }

  function declineInvite(channel) {
    channels.value = channels.value.filter((c) => c.id !== channel.id)
  }

  function createChannel({ name, type }) {
    const id = Math.max(0, ...channels.value.map((c) => c.id)) + 1
    channels.value.unshift({
      id,
      name,
      type,
      adminId: me.id,
      unread: 0,
      invited: false,
      lastActivity: Date.now(),
      memberIds: [me.id],
      invitedIds: [],
    })
    setActive(id)
  }

  // Leaving as the admin deletes the channel for everyone
  function leaveChannel(channel) {
    if (channel.adminId === me.id) {
      messages.value = messages.value.filter((m) => m.channelId !== channel.id)
    } else {
      channel.memberIds = channel.memberIds.filter((id) => id !== me.id)
    }
    channels.value = channels.value.filter((c) => c.id !== channel.id)

    if (activeId.value === channel.id) {
      const next = channels.value.find((c) => !c.invited)
      activeId.value = next ? next.id : null
      if (next) next.unread = 0
    }
  }

  function inviteToActive(user) {
    const ids = activeChannel.value.invitedIds
    if (!ids.includes(user.id)) ids.push(user.id)
  }

  function setStatus(status) {
    me.status = status
  }

  function sendMessage(text) {
    const mentions = (text.match(/@\w+/g) || []).map((t) => t.slice(1))

    messages.value.push({
      id: Date.now(),
      channelId: activeId.value,
      authorId: me.id,
      text,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      mentions,
    })
    activeChannel.value.lastActivity = Date.now()
  }

  return {
    me,
    users,
    channels,
    activeId,
    activeChannel,
    activeMessages,
    setActive,
    acceptInvite,
    declineInvite,
    createChannel,
    leaveChannel,
    inviteToActive,
    setStatus,
    sendMessage,
  }
})
