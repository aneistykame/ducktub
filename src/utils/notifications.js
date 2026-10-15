import { ref } from 'vue'
import { AppVisibility } from 'quasar'

export const toasts = ref([])
let seq = 0

export function dismissToast(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function pushToast(toast) {
  const id = ++seq
  toasts.value = [...toasts.value, { id, ...toast }].slice(-3)
  setTimeout(() => dismissToast(id), 6000)
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
