import { ref, computed } from 'vue'
import { AppVisibility } from 'quasar'

const MAX_VISIBLE = 3
const MAX_QUEUED = 50
const TOAST_MS = 6000
const DRAIN_MS = 800

const queue = ref([])
const timers = new Map()
let drain = null
let seq = 0

export const toasts = computed(() => queue.value.slice(0, MAX_VISIBLE))
export const hiddenToastCount = computed(() => Math.max(0, queue.value.length - MAX_VISIBLE))

function startTimers() {
  for (const t of queue.value.slice(0, MAX_VISIBLE)) {
    if (!timers.has(t.id)) {
      timers.set(t.id, setTimeout(() => dismissToast(t.id), TOAST_MS))
    }
  }
}

function stopDrain() {
  clearInterval(drain)
  drain = null
}

function updateDrain() {
  if (queue.value.length <= MAX_VISIBLE) {
    stopDrain()
    return
  }
  if (drain) return
  drain = setInterval(() => {
    if (queue.value.length > MAX_VISIBLE) dismissToast(queue.value[0].id)
    else stopDrain()
  }, DRAIN_MS)
}

export function dismissToast(id) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  queue.value = queue.value.filter((t) => t.id !== id)
  startTimers()
  updateDrain()
}

function pushToast(toast) {
  queue.value = [...queue.value, { id: ++seq, ...toast }].slice(-MAX_QUEUED)
  startTimers()
  updateDrain()
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'default') await Notification.requestPermission()
  return Notification.permission === 'granted'
}

function preview(text) {
  return text.length > 120 ? text.slice(0, 120) + '…' : text
}

export function showMessageNotification(author, message, { channel, active, mention, onOpen } = {}) {
  const text = preview(message.text)

  if (AppVisibility.appVisible) {
    if (active) return
    pushToast({ author, channel, text, mention: !!mention, onOpen })
    return
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const title = channel ? `${author.nickName} in #${channel.name}` : author.nickName
  const n = new Notification(title, { body: text })
  n.onclick = () => {
    window.focus()
    onOpen?.()
    n.close()
  }
}
