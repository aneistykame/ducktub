import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(6).maxLength(32)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  firstName: vine.string().trim().minLength(1).maxLength(20),
  lastName: vine.string().trim().minLength(1).maxLength(20),
  nickName: vine
    .string()
    .trim()
    .regex(/^[\w-]+$/)
    .maxLength(20)
    .unique({ table: 'users', column: 'nick_name' }),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
})

/**
 * Validator to use before validating user credentials
 * during login ("login" is either the email or the nickname)
 */
export const loginValidator = vine.create({
  login: vine.string().trim(),
  password: vine.string(),
})
