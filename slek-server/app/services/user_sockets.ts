import type { AuthenticatedSocket } from '@rlanz/socket/types'
import type User from '#models/user'

const idsByUser = new Map<number, Set<string>>()

async function socketService() {
  const { default: service } = await import('@rlanz/socket/services/main')
  return service
}

export async function trackSocket(socket: AuthenticatedSocket<User>) {
  const service = await socketService()
  const userId = socket.getUserOrFail().id

  const ids = idsByUser.get(userId) ?? new Set<string>()
  for (const id of ids) if (!service.getSocket(id)) ids.delete(id) // forget closed sockets
  ids.add(socket.id)
  idsByUser.set(userId, ids)
}

export async function disconnectUser(userId: number) {
  const service = await socketService()
  for (const id of idsByUser.get(userId) ?? []) service.getSocket(id)?.disconnect()
  idsByUser.delete(userId)
}
