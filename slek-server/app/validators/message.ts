import vine from '@vinejs/vine'

export const sendMessageValidator = vine.create({
  content: vine.string().trim().minLength(1).maxLength(2000),
})

export const listMessagesValidator = vine.create({
  before: vine.number().withoutDecimals().positive().optional(),
  limit: vine.number().withoutDecimals().range([1, 100]).optional(),
})
