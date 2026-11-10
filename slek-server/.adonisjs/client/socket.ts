export interface AppSocket {

  readonly channels: {

    readonly 'channels/:channelId': {

      readonly params: {

        readonly 'channelId': string | number

      }

      readonly channel: typeof import('#channels/tub_channel').default

      readonly handlers: {

      }

    }

    readonly 'users/:userId': {

      readonly params: {

        readonly 'userId': string | number

      }

      readonly channel: typeof import('#channels/user_channel').default

      readonly handlers: {

      }

    }

  }

}

