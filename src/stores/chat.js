import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { users as mockUsers, channels as mockChannels, messages as mockMessages } from '../mock/data'
export const DEMO_PASSWORD = 'quack123'

export const useChatStore = defineStore('chat', () => {
  const users = ref(mockUsers.map((u) => ({ ...u })))
  const passwords = new Map(mockUsers.map((u) => [u.id, DEMO_PASSWORD]))

  const meId = ref(users.value[0].id)
  const me = computed(() => users.value.find((u) => u.id === meId.value) ?? null)
  const isLoggedIn = computed(() => !!me.value)

  const channels = ref(
    mockChannels.map(({ invited, ...c }) => ({
      ...c,
      memberIds: [...(c.memberIds ?? [])],
      invitedIds: invited ? [mockUsers[0].id] : [],
    })),
  )
  const messages = ref([...mockMessages])
  const activeId = ref(1)

  const myChannels = computed(() =>
    me.value ? channels.value.filter((c) => c.memberIds.includes(me.value.id)) : [],
  )
  const myInvitations = computed(() =>
    me.value
      ? channels.value.filter((c) => c.invitedIds.includes(me.value.id) && !c.memberIds.includes(me.value.id))
      : [],
  )

  const activeChannel = computed(() => myChannels.value.find((c) => c.id === activeId.value))
  const activeMessages = computed(() => messages.value.filter((m) => m.channelId === activeId.value))

  function setActive(id) {
    activeId.value = id
    const channel = channels.value.find((c) => c.id === id)
    if (channel) channel.unread = 0
  }

  function openFirstChannel() {
    const first = myChannels.value[0]
    if (first) setActive(first.id)
    else activeId.value = null
  }

  function login({ login, password }) {
    const key = login.trim().toLowerCase()
    const user = users.value.find((u) => u.email.toLowerCase() === key || u.nickName.toLowerCase() === key)
    if (!user || passwords.get(user.id) !== password) return 'Wrong email, nickname or password'

    meId.value = user.id
    user.status = 'online'
    openFirstChannel()
    return null
  }

  function register({ firstName, lastName, nickName, email, password }) {
    if (users.value.some((u) => u.nickName.toLowerCase() === nickName.toLowerCase())) {
      return { field: 'nickName', message: 'Nickname is already taken' }
    }
    if (users.value.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { field: 'email', message: 'Email is already registered' }
    }

    const id = Math.max(0, ...users.value.map((u) => u.id)) + 1
    users.value.push({ id, firstName, lastName, nickName, email, status: 'online' })
    passwords.set(id, password)

    meId.value = id
    openFirstChannel()
    return null
  }

  function logout() {
    if (me.value) me.value.status = 'offline'
    meId.value = null
    activeId.value = null
  }

  function acceptInvite(channel) {
    channel.invitedIds = channel.invitedIds.filter((id) => id !== me.value.id)
    if (!channel.memberIds.includes(me.value.id)) channel.memberIds.push(me.value.id)
  }

  function declineInvite(channel) {
    channel.invitedIds = channel.invitedIds.filter((id) => id !== me.value.id)
  }

  function createChannel({ name, type }) {
    const id = Math.max(0, ...channels.value.map((c) => c.id)) + 1
    channels.value.unshift({
      id,
      name,
      type,
      adminId: me.value.id,
      unread: 0,
      lastActivity: Date.now(),
      memberIds: [me.value.id],
      invitedIds: [],
    })
    setActive(id)
  }

  // Leaving as the admin deletes the channel for everyone
  function leaveChannel(channel) {
    if (channel.adminId === me.value.id) {
      messages.value = messages.value.filter((m) => m.channelId !== channel.id)
      channels.value = channels.value.filter((c) => c.id !== channel.id)
    } else {
      channel.memberIds = channel.memberIds.filter((id) => id !== me.value.id)
    }

    if (activeId.value === channel.id) openFirstChannel()
  }

  function inviteToActive(user) {
    const ids = activeChannel.value.invitedIds
    if (!ids.includes(user.id)) ids.push(user.id)
  }

  function setStatus(status) {
    me.value.status = status
  }

  function sendMessage(text) {
    const mentions = (text.match(/@\w+/g) || []).map((t) => t.slice(1))

    messages.value.push({
      id: Date.now(),
      channelId: activeId.value,
      authorId: me.value.id,
      text,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      mentions,
    })
    activeChannel.value.lastActivity = Date.now()
  }

  return {
    me,
    isLoggedIn,
    users,
    channels,
    myChannels,
    myInvitations,
    activeId,
    activeChannel,
    activeMessages,
    setActive,
    login,
    register,
    logout,
    acceptInvite,
    declineInvite,
    createChannel,
    leaveChannel,
    inviteToActive,
    setStatus,
    sendMessage,
  }
})
