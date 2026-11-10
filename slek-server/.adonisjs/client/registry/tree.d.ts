/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    session: {
      store: typeof routes['auth.session.store']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    session: {
      destroy: typeof routes['profile.session.destroy']
    }
  }
  channels: {
    store: typeof routes['channels.store']
    index: typeof routes['channels.index']
    discover: typeof routes['channels.discover']
    join: typeof routes['channels.join']
    invite: typeof routes['channels.invite']
    kick: typeof routes['channels.kick']
    revoke: typeof routes['channels.revoke']
    leave: typeof routes['channels.leave']
    accept: typeof routes['channels.accept']
    decline: typeof routes['channels.decline']
  }
  messages: {
    index: typeof routes['messages.index']
    store: typeof routes['messages.store']
    simulate: typeof routes['messages.simulate']
  }
  users: {
    index: typeof routes['users.index']
  }
}
