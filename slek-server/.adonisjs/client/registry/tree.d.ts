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
    leave: typeof routes['channels.leave']
    accept: typeof routes['channels.accept']
    decline: typeof routes['channels.decline']
  }
}
