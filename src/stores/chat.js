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

const errorOf = (err, fallback) => err.response?.data?.errors?.[0]?.message ?? fallback

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
  const publicChannels = ref([])

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
    channel.listen('channel:state', applyState)
    try {
      await connecting
      await channel.subscribe()
    } catch {
      subscriptions.delete(channelId)
    }
  }

  function subscribeUser() {
    const channel = socket.channel(`users/${me.value.id}`)
    channel.listen('invitation:new', () => loadChannels({ keepActive: true }))
    channel.listen('channel:removed', ({ channelId }) => dropChannel(channelId))
    connecting.then(() => channel.subscribe()).catch(() => {})
  }

  function applyState({ channelId, memberIds, invitedIds, bannedIds, kickedBy }) {
    const channel = channels.value.find((c) => c.id === channelId)
    if (!channel) return
    Object.assign(channel, { memberIds, invitedIds, bannedIds, kickedBy })
    if (memberIds.some((id) => !users.value.some((u) => u.id === id))) loadUsers()
  }

  function upsertChannel(c) {
    const fresh = channelFromServer(c)
    const i = channels.value.findIndex((x) => x.id === fresh.id)
    if (i === -1) channels.value.unshift(fresh)
    else channels.value[i] = { ...channels.value[i], ...fresh, unread: channels.value[i].unread }
  }

  function dropChannel(channelId) {
    channels.value = channels.value.filter((c) => c.id !== channelId)
    messages.value = messages.value.filter((m) => m.channelId !== channelId)
    loadedChannelIds.delete(channelId)
    if (activeId.value === channelId) openFirstChannel()
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
    subscribeUser()
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
      memberIds: c.memberIds ?? (invited ? [] : [me.value.id]),
      invitedIds: c.invitedIds ?? (invited ? [me.value.id] : []),
      bannedIds: c.bannedIds ?? [],
      kickedBy: c.kickedBy ?? {},
    }
  }

  async function loadChannels({ keepActive = false } = {}) {
    const { channels: mine, invitations } = await channelService.list()
    const previous = new Map(channels.value.map((c) => [c.id, c]))
    channels.value = [
      ...mine.map((c) => channelFromServer(c)),
      ...invitations.map((c) => channelFromServer(c, { invited: true })),
    ].map((c) => ({
      ...c,
      unread: previous.get(c.id)?.unread ?? 0,
      mentionCount: previous.get(c.id)?.mentionCount ?? 0,
    }))
    if (!keepActive || !myChannels.value.some((c) => c.id === activeId.value)) openFirstChannel()
  }

  async function discoverChannels(q) {
    try {
      publicChannels.value = await channelService.discover(q)
    } catch {
      publicChannels.value = []
    }
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
        publicChannels.value = []
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
      upsertChannel(created)
      setActive(created.id)
      return result(true, 'Created ', name)
    } catch (err) {
      return result(false, errorOf(err, 'Could not create the channel'))
    }
  }

  // Leaving as the admin deletes the channel for everyone
  async function leaveChannel(channel) {
    try {
      const { deleted } = await channelService.leave(channel.id)
      dropChannel(channel.id)
      return result(true, deleted ? 'Deleted ' : 'Left ', channel.name)
    } catch {
      return result(false, 'Could not leave the channel')
    }
  }

  function inviteToActive(user) {
    return inviteByNick(user.nickName)
  }

  async function acceptInvite(channel) {
    try {
      const joined = await channelService.accept(channel.id)
      upsertChannel({ ...joined, lastActivityAt: new Date().toISOString() })
    } catch {
      // the invitation is no longer valid
      dropChannel(channel.id)
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

  const nickOf = (name) =>
    users.value.find((u) => u.nickName.toLowerCase() === name.toLowerCase())?.nickName ?? name

  // Results keep the channel name separate so the UI can shorten it
  async function inviteByNick(nick) {
    const channel = activeChannel.value
    const name = nick.replace(/^@/, '')
    if (!channel) return result(false, 'Open a channel first, then /invite nickName')
    if (!name) return result(false, 'Usage: /invite nickName')

    try {
      const { liftedBan, state } = await channelService.invite(channel.id, name)
      applyState({ channelId: channel.id, ...state })
      return liftedBan
        ? result(true, `Lifted the ban and invited @${nickOf(name)} to `, channel.name)
        : result(true, `Invited @${nickOf(name)} to `, channel.name, '. Quack!')
    } catch (err) {
      return result(false, errorOf(err, 'Could not send the invite'))
    }
  }

  // Creates the channel if it doesn't exist, otherwise joins it (public, or private with an invite)
  async function joinChannel(rawName, isPrivate = false) {
    const name = rawName.replace(/^#/, '')
    if (!name) return result(false, 'Usage: /join channelName [private]')
    if (!/^[\w-]+$/.test(name)) return result(false, 'Channel names use only letters, numbers, - and _')
    if (name.length > CHANNEL_NAME_MAX) {
      return result(false, `Channel names can be at most ${CHANNEL_NAME_MAX} characters`)
    }

    try {
      const { status, channel } = await channelService.join({
        name,
        type: isPrivate ? 'private' : 'public',
      })
      upsertChannel(channel)
      setActive(channel.id)
      publicChannels.value = publicChannels.value.filter((c) => c.id !== channel.id)

      if (status === 'already') return result(true, 'You’re already in ', channel.name)
      if (status === 'joined') return result(true, 'Joined ', channel.name, '. Quack!')
      return result(true, channel.type === 'private' ? 'Created the secret tub ' : 'Created ', channel.name, '. Quack!')
    } catch (err) {
      return result(false, errorOf(err, 'Could not join the tub'))
    }
  }

  function canKick(userId) {
    const channel = activeChannel.value
    if (!channel || !channel.memberIds.includes(userId)) return false
    if (userId === me.value.id || userId === channel.adminId) return false
    return activeIsPublic.value || activeIsAdmin.value
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

  // In a private channel the admin's kick only removes; in a public one it is a vote or, from the admin, a ban
  async function kickByNick(nick) {
    const channel = activeChannel.value
    const name = nick.replace(/^@/, '')
    if (!channel) return result(false, 'Open a channel first, then /kick nickName')
    if (!name) return result(false, 'Usage: /kick nickName')

    try {
      const { action, kicks, state } = await channelService.kick(channel.id, name)
      applyState({ channelId: channel.id, ...state })
      const who = `@${nickOf(name)}`
      if (action === 'banned') return result(true, `Banned ${who} from `, channel.name)
      if (action === 'removed') return result(true, `Removed ${who} from `, channel.name)
      return result(true, `Kicked ${who} out of `, channel.name, ` (${kicks} of ${KICKS_TO_BAN})`)
    } catch (err) {
      return result(false, errorOf(err, 'Could not kick'))
    }
  }

  function kickFromActive(userId) {
    const user = users.value.find((u) => u.id === userId)
    return kickByNick(user?.nickName ?? '')
  }

  // Admin only: remove a member or cancel a pending invitation, without a ban
  async function revokeByNick(nick) {
    const channel = activeChannel.value
    const name = nick.replace(/^@/, '')
    if (!channel) return result(false, 'Open a channel first, then /revoke nickName')
    if (!name) return result(false, 'Usage: /revoke nickName')

    try {
      const { action, state } = await channelService.revoke(channel.id, name)
      applyState({ channelId: channel.id, ...state })
      return action === 'uninvited'
        ? result(true, `Cancelled the invite for @${nickOf(name)} to `, channel.name)
        : result(true, `Removed @${nickOf(name)} from `, channel.name)
    } catch (err) {
      return result(false, errorOf(err, 'Could not revoke access'))
    }
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
      return result(false, errorOf(err, 'Your quack didn’t reach the tub. Try again'))
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
      return result(false, errorOf(err, 'Could not simulate a message'))
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
    publicChannels,
    discoverChannels,
    kickByNick,
    revokeByNick,
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
