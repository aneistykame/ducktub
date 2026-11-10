import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { showMessageNotification } from '../utils/notifications'
import { useAuthStore } from './auth'
import { channelService, messageService, userService, socket, channelName } from '@/services'
export const KICKS_TO_BAN = 3
export const CHANNEL_NAME_MAX = 30
export const MESSAGES_PAGE = 30

const toTime = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
const nowTime = () => toTime(new Date())
const mentionsIn = (text) => (text.match(/@\w+/g) || []).map((t) => t.slice(1))

const messageFromServer = (m) => ({
  id: m.id,
  channelId: m.channelId,
  authorId: m.authorId,
  text: m.content,
  time: m.createdAt ? toTime(new Date(m.createdAt)) : nowTime(),
  mentions: mentionsIn(m.content),
})

const result = (ok, before, channel = null, after = '') => ({
  ok,
  before,
  channel,
  after,
  message: channel ? `${before}#${channel}${after}` : before,
})

export const useChatStore = defineStore('chat', () => {
  const users = ref([])

  const auth = useAuthStore()
  const me = computed(() => auth.user)
  const isLoggedIn = computed(() => auth.isAuthenticated)

  const channels = ref([])
  const messages = ref([])
  const loadedChannelIds = new Set()
  // channel id -> whether the server has older messages than the ones loaded
  const hasMoreById = ref({})
  const activeId = ref(null)
  const pending = ref([])

  const myChannels = computed(() =>
    me.value
      ? channels.value
        .filter((c) => c.memberIds.includes(me.value.id))
        .sort((a, b) => (b.lastActivity ?? 0) - (a.lastActivity ?? 0))
      : [],
  )
  const myInvitations = computed(() =>
    me.value
      ? channels.value.filter((c) => c.invitedIds.includes(me.value.id) && !c.memberIds.includes(me.value.id))
      : [],
  )

  const activeChannel = computed(() => myChannels.value.find((c) => c.id === activeId.value))
  const activeMessages = computed(() => messages.value.filter((m) => m.channelId === activeId.value))
  const activeHasMore = computed(() => !!hasMoreById.value[activeId.value])

  const activeIsPublic = computed(() => activeChannel.value?.type === 'public')
  const activeIsAdmin = computed(() => !!me.value && activeChannel.value?.adminId === me.value.id)
  const canInviteToActive = computed(() => activeIsPublic.value || activeIsAdmin.value)

  function setActive(id) {
    activeId.value = id
    const channel = channels.value.find((c) => c.id === id)
    if (channel) {
      channel.unread = 0
      channel.mentionCount = 0
      if (channel.memberIds.includes(me.value?.id)) loadMessages(id)
    }
  }

  // The newest page is fetched once per channel; new messages then arrive over the socket
  async function loadMessages(channelId) {
    if (loadedChannelIds.has(channelId)) return
    loadedChannelIds.add(channelId)
    try {
      const page = await messageService.list(channelId, { limit: MESSAGES_PAGE })
      messages.value = [
        ...messages.value.filter((m) => m.channelId !== channelId),
        ...page.messages.map(messageFromServer),
      ]
      hasMoreById.value[channelId] = page.hasMore
    } catch {
      loadedChannelIds.delete(channelId)
    }
  }

  // Older page, above the oldest message we have. Returns how many were added
  async function loadOlderMessages(channelId) {
    const oldest = messages.value.find((m) => m.channelId === channelId)
    if (!oldest || !hasMoreById.value[channelId]) return 0

    const page = await messageService.list(channelId, { before: oldest.id, limit: MESSAGES_PAGE })
    const known = new Set(messages.value.map((m) => m.id))
    const older = page.messages.map(messageFromServer).filter((m) => !known.has(m.id))
    messages.value = [...older, ...messages.value]
    hasMoreById.value[channelId] = page.hasMore
    return older.length
  }

  async function loadUsers() {
    try {
      users.value = await userService.list()
    } catch {
      // keep the users we already know
    }
  }

  // Live messages: one socket channel per chat channel I'm a member of
  let connecting = null
  const subscriptions = new Map()

  async function subscribe(channelId) {
    if (subscriptions.has(channelId)) return
    const channel = socket.channel(channelName(channelId))
    subscriptions.set(channelId, channel)
    channel.listen('message:new', (payload) => receiveMessage(messageFromServer(payload)))
    try {
      await connecting
      await channel.subscribe()
    } catch {
      subscriptions.delete(channelId)
    }
  }

  function unsubscribe(channelId) {
    if (!subscriptions.delete(channelId)) return
    socket.leave(channelName(channelId)).catch(() => {})
  }

  watch(
    () => myChannels.value.map((c) => c.id),
    (ids) => {
      if (!connecting) return
      ids.forEach(subscribe)
      ;[...subscriptions.keys()].filter((id) => !ids.includes(id)).forEach(unsubscribe)
    },
  )

  function connectSocket() {
    connecting = socket.connect().catch((err) => console.warn('Socket connection failed', err))
    myChannels.value.forEach((c) => subscribe(c.id))
  }

  function disconnectSocket() {
    if (!connecting) return
    connecting = null
    subscriptions.clear()
    socket.disconnect()
  }

  function openFirstChannel() {
    const first = myChannels.value[0]
    if (first) setActive(first.id)
    else activeId.value = null
  }

  function channelFromServer(c, { invited = false } = {}) {
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      adminId: c.adminId,
      lastActivity: c.lastActivityAt ? new Date(c.lastActivityAt).getTime() : 0,
      unread: 0,
      mentionCount: 0,
      memberIds: invited ? [] : [me.value.id],
      invitedIds: invited ? [me.value.id] : [],
      bannedIds: [],
      kickedBy: {},
    }
  }

  async function loadChannels() {
    const { channels: mine, invitations } = await channelService.list()
    channels.value = [
      ...mine.map((c) => channelFromServer(c)),
      ...invitations.map((c) => channelFromServer(c, { invited: true })),
    ]
    openFirstChannel()
  }

  watch(
    () => auth.user?.id,
    (id) => {
      disconnectSocket()
      if (id) {
        loadUsers()
        loadChannels()
        connectSocket()
      } else {
        users.value = []
        channels.value = []
        messages.value = []
        pending.value = []
        loadedChannelIds.clear()
        hasMoreById.value = {}
        activeId.value = null
      }
    },
    { immediate: true },
  )

  function updateChannel(channel, { name, type }) {
    if (channel.adminId !== me.value.id) return result(false, 'Only the admin can edit this channel')

    const taken = channels.value.some(
      (c) => c.id !== channel.id && c.name.toLowerCase() === name.toLowerCase(),
    )
    if (taken) return result(false, 'Name is already taken')

    channel.name = name
    channel.type = type
    return result(true, 'Saved ', name)
  }

  async function createChannel({ name, type }) {
    try {
      const created = await channelService.create({ name, type })
      channels.value.unshift(channelFromServer(created))
      setActive(created.id)
      return result(true, 'Created ', name)
    } catch (err) {
      return result(false, err.response?.data?.errors?.[0]?.message ?? 'Could not create the channel')
    }
  }

  // Leaving as the admin deletes the channel for everyone
  async function leaveChannel(channel) {
    try {
      const { deleted } = await channelService.leave(channel.id)
      channels.value = channels.value.filter((c) => c.id !== channel.id)
      if (deleted) messages.value = messages.value.filter((m) => m.channelId !== channel.id)

      if (activeId.value === channel.id) openFirstChannel()
      return result(true, deleted ? 'Deleted ' : 'Left ', channel.name)
    } catch {
      return result(false, 'Could not leave the channel')
    }
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

  async function acceptInvite(channel) {
    try {
      await channelService.accept(channel.id)
      channel.invitedIds = []
      channel.memberIds = [me.value.id]
      channel.lastActivity = Date.now()
    } catch {
      // the invitation is no longer valid
    }
  }

  async function declineInvite(channel) {
    try {
      await channelService.decline(channel.id)
      channels.value = channels.value.filter((c) => c.id !== channel.id)
    } catch {
      // the invitation is no longer valid
    }
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

  function joinChannel(rawName, isPrivate = false) {
    const name = rawName.replace(/^#/, '')
    if (!name) return result(false, 'Usage: /join channelName [private]')
    if (!/^[\w-]+$/.test(name)) return result(false, 'Channel names use only letters, numbers, - and _')
    if (name.length > CHANNEL_NAME_MAX) {
      return result(false, `Channel names can be at most ${CHANNEL_NAME_MAX} characters`)
    }

    const channel = channels.value.find((c) => c.name.toLowerCase() === name.toLowerCase())
    if (!channel) {
      createChannel({ name, type: isPrivate ? 'private' : 'public' })
      return result(true, isPrivate ? 'Created the secret tub ' : 'Created ', name, '. Quack!')
    }

    const myId = me.value.id
    if (channel.memberIds.includes(myId)) {
      setActive(channel.id)
      return result(true, 'You’re already in ', channel.name)
    }
    if (channel.bannedIds.includes(myId)) return result(false, 'You’re banned from ', channel.name)

    const invited = channel.invitedIds.includes(myId)
    if (channel.type === 'private' && !invited) {
      return result(false, '', channel.name, ' is private. Ask the admin for an invite')
    }

    channel.invitedIds = channel.invitedIds.filter((id) => id !== myId)
    channel.memberIds.push(myId)
    channel.lastActivity = Date.now()
    setActive(channel.id)
    return result(true, 'Joined ', channel.name, '. Quack!')
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
    if (status !== 'offline') flushPending()
  }

  // The same message can come back twice: in the HTTP response and over the socket
  function addMessage(message) {
    if (messages.value.some((m) => m.id === message.id)) return false
    messages.value.push(message)
    return true
  }

  async function sendMessage(text) {
    const channel = activeChannel.value
    try {
      const saved = await messageService.send(channel.id, text)
      addMessage(messageFromServer(saved))
      channel.lastActivity = Date.now()
      return result(true, 'Sent')
    } catch (err) {
      return result(false, err.response?.data?.errors?.[0]?.message ?? 'Your quack didn’t reach the tub. Try again')
    }
  }

  const notifyOnlyMentions = ref(false)

  function shouldNotify(message) {
    if (!me.value || me.value.status !== 'online') return false
    if (message.authorId === me.value.id) return false
    if (notifyOnlyMentions.value && !message.mentions.includes(me.value.nickName)) return false
    return true
  }

  function deliverMessage(message, { notify = true } = {}) {
    if (!addMessage(message)) return
    const { channelId, authorId } = message

    // someone who registered after we loaded the user list
    if (!users.value.some((u) => u.id === authorId)) loadUsers()

    const mentionsMe = !!me.value && message.mentions.includes(me.value.nickName)
    const mine = authorId === me.value?.id

    const channel = channels.value.find((c) => c.id === channelId)
    if (channel) {
      channel.lastActivity = Date.now()
      if (channelId !== activeId.value && !mine) {
        channel.unread = (channel.unread ?? 0) + 1
        if (mentionsMe) channel.mentionCount = (channel.mentionCount ?? 0) + 1
      }
    }

    if (notify && shouldNotify(message)) {
      showMessageNotification(users.value.find((u) => u.id === authorId), message, {
        channel,
        active: channelId === activeId.value,
        mention: mentionsMe,
        onOpen: () => setActive(channelId),
      })
    }
  }

  // While Drying Off (offline) incoming messages wait until the duck is back
  function receiveMessage(message) {
    if (me.value?.status === 'offline') {
      pending.value.push(message)
      return
    }
    deliverMessage(message)
  }

  function flushPending() {
    const queued = pending.value
    pending.value = []
    queued.forEach((message) => deliverMessage(message, { notify: false }))
  }

  // Development only: the server makes another member write to one of my channels.
  // The message arrives over the socket like any other
  async function simulateMessage(mention) {
    try {
      await messageService.simulate({ activeChannelId: activeId.value, mention })
      return result(true, 'Quack incoming')
    } catch (err) {
      return result(false, err.response?.data?.errors?.[0]?.message ?? 'Could not simulate a message')
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
    activeHasMore,
    activeIsPublic,
    activeIsAdmin,
    canInviteToActive,
    setActive,
    loadOlderMessages,
    acceptInvite,
    declineInvite,
    createChannel,
    leaveChannel,
    inviteToActive,
    inviteByNick,
    joinChannel,
    updateChannel,
    canKick,
    kickPreview,
    kickFromActive,
    setStatus,
    sendMessage,
    receiveMessage,
    simulateMessage,
    notifyOnlyMentions,
  }
})
