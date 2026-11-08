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
