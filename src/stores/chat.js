import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { users as mockUsers, channels as mockChannels, messages as mockMessages } from '../mock/data'
import { showMessageNotification } from '../utils/notifications'
export const DEMO_PASSWORD = 'quack123'
export const KICKS_TO_BAN = 3

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
      bannedIds: [],
      kickedBy: {},
      mentionCount: 0,
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

  const activeIsPublic = computed(() => activeChannel.value?.type === 'public')
  const activeIsAdmin = computed(() => !!me.value && activeChannel.value?.adminId === me.value.id)
  const canInviteToActive = computed(() => activeIsPublic.value || activeIsAdmin.value)

  function setActive(id) {
    activeId.value = id
    const channel = channels.value.find((c) => c.id === id)
    if (channel) {
      channel.unread = 0
      channel.mentionCount = 0
    }
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
      mentionCount: 0,
      lastActivity: Date.now(),
      memberIds: [me.value.id],
      invitedIds: [],
      bannedIds: [],
      kickedBy: {},
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
    const channel = activeChannel.value
    if (!channel || !canInviteToActive.value) return
    if (channel.memberIds.includes(user.id)) return

    if (channel.bannedIds.includes(user.id)) {
      if (!activeIsAdmin.value) return
      channel.bannedIds = channel.bannedIds.filter((id) => id !== user.id)
      delete channel.kickedBy[user.id]
    }

    if (!channel.invitedIds.includes(user.id)) channel.invitedIds.push(user.id)
  }

  // Results keep the channel name separate so the UI can shorten it
  function inviteByNick(nick) {
    const channel = activeChannel.value
    const say = (ok, before, inChannel = false, after = '') => ({
      ok,
      before,
      channel: inChannel ? channel.name : null,
      after,
      message: inChannel ? `${before}#${channel.name}${after}` : before,
    })

    const name = nick.replace(/^@/, '')
    if (!name) return say(false, 'Usage: /invite nickName')

    const user = users.value.find((u) => u.nickName.toLowerCase() === name.toLowerCase())
    if (!user) return say(false, `No duck called @${name}`)
    if (user.id === me.value.id) return say(false, 'You’re already in this tub')
    if (channel.memberIds.includes(user.id)) return say(false, `@${user.nickName} is already in `, true)
    if (!canInviteToActive.value) return say(false, 'Only the admin can invite people to this private channel')

    const wasBanned = channel.bannedIds.includes(user.id)
    if (wasBanned && !activeIsAdmin.value) {
      return say(false, `@${user.nickName} is banned here. Only the admin can let them back in`)
    }
    if (channel.invitedIds.includes(user.id)) return say(false, `@${user.nickName} is already invited`)

    inviteToActive(user)
    return wasBanned
      ? say(true, `Lifted the ban and invited @${user.nickName} to `, true)
      : say(true, `Invited @${user.nickName} to `, true, '. Quack!')
  }

  function canKick(userId) {
    const channel = activeChannel.value
    if (!channel || !channel.memberIds.includes(userId)) return false
    if (userId === me.value.id || userId === channel.adminId) return false
    return activeIsPublic.value || activeIsAdmin.value
  }

  function banFromActive(userId) {
    const channel = activeChannel.value
    if (!channel.bannedIds.includes(userId)) channel.bannedIds.push(userId)
  }

  function kickPreview(userId) {
    const kickers = activeChannel.value?.kickedBy[userId] ?? []
    const counted = !!me.value && kickers.includes(me.value.id)
    const kicks = kickers.length
    const next = counted ? kicks : kicks + 1

    if (!activeIsPublic.value) return { action: 'remove', kicks, next, counted, bans: false }
    if (activeIsAdmin.value) return { action: 'ban', kicks, next, counted, bans: true }
    return { action: 'kick', kicks, next, counted, bans: next >= KICKS_TO_BAN }
  }

  function kickFromActive(userId) {
    if (!canKick(userId)) return
    const channel = activeChannel.value
    const { action, bans } = kickPreview(userId)

    channel.memberIds = channel.memberIds.filter((id) => id !== userId)

    if (action === 'kick') {
      const kickers = channel.kickedBy[userId] ?? []
      if (!kickers.includes(me.value.id)) channel.kickedBy[userId] = [...kickers, me.value.id]
    }
    if (bans) banFromActive(userId)
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

  const notifyOnlyMentions = ref(false)

  function shouldNotify(message) {
    if (!me.value || me.value.status !== 'online') return false
    if (message.authorId === me.value.id) return false
    if (notifyOnlyMentions.value && !message.mentions.includes(me.value.nickName)) return false
    return true
  }

  function receiveMessage({ channelId, authorId, text }) {
    const message = {
      id: Date.now(),
      channelId,
      authorId,
      text,
      time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      mentions: (text.match(/@\w+/g) || []).map((t) => t.slice(1)),
    }
    messages.value.push(message)

    const mentionsMe = !!me.value && message.mentions.includes(me.value.nickName)

    const channel = channels.value.find((c) => c.id === channelId)
    if (channel) {
      channel.lastActivity = Date.now()
      if (channelId !== activeId.value) {
        channel.unread = (channel.unread ?? 0) + 1
        if (mentionsMe) channel.mentionCount = (channel.mentionCount ?? 0) + 1
      }
    }

    if (shouldNotify(message)) {
      showMessageNotification(users.value.find((u) => u.id === authorId), message, {
        channel,
        active: channelId === activeId.value,
        mention: mentionsMe,
        onOpen: () => setActive(channelId),
      })
    }
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
    activeIsPublic,
    activeIsAdmin,
    canInviteToActive,
    setActive,
    login,
    register,
    logout,
    acceptInvite,
    declineInvite,
    createChannel,
    leaveChannel,
    inviteToActive,
    inviteByNick,
    canKick,
    kickPreview,
    kickFromActive,
    setStatus,
    sendMessage,
    receiveMessage,
    notifyOnlyMentions,
  }
})
