import vine from '@vinejs/vine'

export const createChannelValidator = vine.create({
  name: vine
    .string()
    .trim()
    .regex(/^[\w-]+$/)
    .maxLength(30)
    .unique({ table: 'channels', column: 'name' }),
  type: vine.enum(['public', 'private']),
})

/**
 * /join channelName [private]: the type only matters when the channel is created.
 */
export const joinChannelValidator = vine.create({
  name: vine
    .string()
    .trim()
    .regex(/^#?[\w-]+$/)
    .maxLength(31)
    .transform((name) => name.replace(/^#/, '')),
  type: vine.enum(['public', 'private']).optional(),
})

/**
 * /invite, /kick and /revoke take a nickName, with or without the @.
 */
export const nickNameValidator = vine.create({
  nickName: vine
    .string()
    .trim()
    .minLength(1)
    .transform((nick) => nick.replace(/^@/, '')),
})
