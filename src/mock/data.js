export const users = [
  { id: 1, firstName: 'Mia', lastName: 'Kovar', nickName: 'quackmia', email: 'mia@example.com', status: 'online' },
  { id: 2, firstName: 'Ed', lastName: 'Novak', nickName: 'ed', email: 'ed@example.com', status: 'online' },
  { id: 3, firstName: 'Jana', lastName: 'Klinth', nickName: 'jana', email: 'jana@example.com', status: 'online' },
  { id: 4, firstName: 'Tom', lastName: 'Varga', nickName: 'tom', email: 'tom@example.com', status: 'dnd' },
  { id: 5, firstName: 'Lea', lastName: 'Szabo', nickName: 'lea', email: 'lea@example.com', status: 'offline' },
]

export const channels = [
  { id: 1, name: 'the-pond', type: 'public', adminId: 3, unread: 0, invited: false },
  { id: 2, name: 'kitchen', type: 'public', adminId: 1, unread: 2, invited: false },
  { id: 3, name: 'school', type: 'public', adminId: 2, unread: 0, invited: false },
  { id: 4, name: 'hideout', type: 'private', adminId: 1, unread: 0, invited: false },
  { id: 5, name: 'secret-lake', type: 'private', adminId: 4, unread: 0, invited: true },
]

export const messages = [
  // the-pond
  { id: 1, channelId: 1, authorId: 3, text: 'Morning, everyone! Anyone up for a swim later?', time: '09:12', mentions: [] },
  { id: 2, channelId: 1, authorId: 2, text: 'Count me in, as long as the water is warm.', time: '09:14', mentions: [] },
  { id: 3, channelId: 1, authorId: 4, text: 'I just fed the ducks by the bridge. They were very loud.', time: '09:20', mentions: [] },
  { id: 4, channelId: 1, authorId: 3, text: '@quackmia did you finish the slides for Friday?', time: '09:31', mentions: ['quackmia'] },
  { id: 5, channelId: 1, authorId: 1, text: 'Almost! I only need to add the screenshots.', time: '09:35', mentions: [] },
  { id: 6, channelId: 1, authorId: 2, text: 'Quick reminder: the meeting moved to 3 pm.', time: '10:02', mentions: [] },
  { id: 7, channelId: 1, authorId: 5, text: 'Thanks Ed, I would have missed that.', time: '10:05', mentions: [] },
  { id: 8, channelId: 1, authorId: 4, text: '@lea can you bring the laptop charger?', time: '10:11', mentions: ['lea'] },
  { id: 9, channelId: 1, authorId: 5, text: 'Sure thing, I will pack it tonight.', time: '10:14', mentions: [] },
  { id: 10, channelId: 1, authorId: 1, text: 'Lunch at noon? I found a place with great soup.', time: '11:40', mentions: [] },
  { id: 11, channelId: 1, authorId: 3, text: 'Yes please! @quackmia send me the address.', time: '11:42', mentions: ['quackmia'] },
  { id: 12, channelId: 1, authorId: 1, text: 'On it. It is five minutes from the station.', time: '11:44', mentions: [] },

  // kitchen
  { id: 13, channelId: 2, authorId: 2, text: 'Who is cooking tonight?', time: '14:02', mentions: [] },
  { id: 14, channelId: 2, authorId: 3, text: '@quackmia it is your turn, a promise is a promise!', time: '14:03', mentions: ['quackmia'] },
  { id: 15, channelId: 2, authorId: 1, text: 'Fine, fine. Pasta it is.', time: '14:05', mentions: [] },

  // school
  { id: 16, channelId: 3, authorId: 2, text: 'The project deadline is on the 6th of December.', time: '08:50', mentions: [] },
  { id: 17, channelId: 3, authorId: 1, text: 'Got it. We should split the work evenly.', time: '08:55', mentions: [] },

  // hideout (private)
  { id: 18, channelId: 4, authorId: 1, text: 'This is our secret nest. No humans allowed.', time: '20:10', mentions: [] },
]
