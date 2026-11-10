/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"signup"]],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.session.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.session.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.session.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['profile.session.destroy']['types'],
  },
  'channels.store': {
    methods: ["POST"],
    pattern: '/api/v1/channels',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"]],
    types: placeholder as Registry['channels.store']['types'],
  },
  'channels.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"]],
    types: placeholder as Registry['channels.index']['types'],
  },
  'channels.discover': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels/discover',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[0,"discover"]],
    types: placeholder as Registry['channels.discover']['types'],
  },
  'channels.join': {
    methods: ["POST"],
    pattern: '/api/v1/channels/join',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[0,"join"]],
    types: placeholder as Registry['channels.join']['types'],
  },
  'channels.invite': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/invite',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"invite"]],
    types: placeholder as Registry['channels.invite']['types'],
  },
  'channels.kick': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/kick',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"kick"]],
    types: placeholder as Registry['channels.kick']['types'],
  },
  'channels.revoke': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/revoke',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"revoke"]],
    types: placeholder as Registry['channels.revoke']['types'],
  },
  'channels.leave': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/leave',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"leave"]],
    types: placeholder as Registry['channels.leave']['types'],
  },
  'channels.accept': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/accept',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"accept"]],
    types: placeholder as Registry['channels.accept']['types'],
  },
  'channels.decline': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/decline',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"decline"]],
    types: placeholder as Registry['channels.decline']['types'],
  },
  'messages.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/channels/:id/messages',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"messages"]],
    types: placeholder as Registry['messages.index']['types'],
  },
  'messages.store': {
    methods: ["POST"],
    pattern: '/api/v1/channels/:id/messages',
    tokens: [[0,"api"],[0,"v1"],[0,"channels"],[1,"id"],[0,"messages"]],
    types: placeholder as Registry['messages.store']['types'],
  },
  'users.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/users',
    tokens: [[0,"api"],[0,"v1"],[0,"users"]],
    types: placeholder as Registry['users.index']['types'],
  },
  'messages.simulate': {
    methods: ["POST"],
    pattern: '/api/v1/dev/simulate',
    tokens: [[0,"api"],[0,"v1"],[0,"dev"],[0,"simulate"]],
    types: placeholder as Registry['messages.simulate']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
