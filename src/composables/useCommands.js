import { ref } from 'vue'
import { useChatStore } from '../stores/chat'

const FEEDBACK_MS = 4000

// Shared so the toast survives a /join that swaps the empty state for the chat
const feedback = ref(null)
let timer = null

// /cancel asks for confirmation through the leave dialog in ChatArea
const leaveOpen = ref(false)
const leaveTarget = ref(null)

export function useCommands() {
  const chat = useChatStore()

  function show(result) {
    clearTimeout(timer)
    feedback.value = { ...result, id: Date.now() }
    timer = setTimeout(() => (feedback.value = null), FEEDBACK_MS)
  }

  function say(ok, before) {
    show({ ok, before, channel: null, after: '', message: before })
  }

  function run(text) {
    if (!text.startsWith('/')) return false

    const [raw, ...args] = text.slice(1).trim().split(/\s+/)
    const command = raw.toLowerCase()

    if (command === 'join') {
      show(chat.joinChannel(args[0] ?? '', args[1]?.toLowerCase() === 'private'))
    } else if (command === 'cancel') {
      if (chat.activeChannel) {
        leaveTarget.value = chat.activeChannel
        leaveOpen.value = true
      } else {
        say(false, 'Open a channel first, then /cancel')
      }
    } else if (command === 'invite') {
      if (chat.activeChannel) show(chat.inviteByNick(args[0] ?? ''))
      else say(false, 'Open a channel first, then /invite nickName')
    } else {
      say(false, `Unknown command /${raw}`)
    }
    return true
  }

  return { feedback, show, say, run, leaveOpen, leaveTarget }
}
