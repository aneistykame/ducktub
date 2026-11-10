import { BaseSeeder } from "@adonisjs/lucid/seeders";
import { DateTime } from "luxon";
import User from "#models/user";
import Channel from "#models/channel";
import Message from "#models/message";

const PASSWORD = "quack123";

const USERS = [
  [1, "Mia", "Kovar", "pip", "online"],
  [2, "Ed", "Novak", "ed", "online"],
  [3, "Jana", "Klinth", "jana", "online"],
  [4, "Tom", "Varga", "tom", "dnd"],
  [5, "Lea", "Szabo", "lea", "offline"],
  [6, "Rosa", "Kovac", "rosa", "online"],
  [7, "Otto", "Varga", "otto", "offline"],
  [8, "Mabel", "Szabo", "mabel", "dnd"],
  [9, "Nina", "Horvath", "nina", "online"],
  [10, "Viktor", "Novak", "viktor", "offline"],
  [11, "Zuzana", "Kovac", "zuza", "dnd"],
  [12, "Otto", "Varga", "tto", "offline"],
  [13, "Mabel", "Szabo", "abel", "dnd"],
  [14, "Nina", "Horvath", "ina", "online"],
  [15, "Viktor", "Novak", "iktor", "offline"],
  [16, "Zuzana", "Kovac", "uza", "dnd"],
] as const;

const CHANNELS = [
  [1, "the-pond", "public", 3, 5, [1, 2, 3, 4, 5]],
  [2, "kitchen", "public", 1, 60, [1, 2, 3, 6]],
  [3, "school", "public", 2, 180, [1, 2, 7]],
  [4, "hideout", "private", 1, 1440, [1, 8, 6]],
  [5, "secret-lake", "private", 4, 2880, [4, 6]],
] as const;

const MESSAGES: [number, number, string, string][] = [
  [1, 3, "Morning, everyone! Anyone up for a swim later?", "09:12"],
  [1, 2, "Count me in, as long as the water is warm.", "09:14"],
  [1, 4, "I just fed the ducks by the bridge. They were very loud.", "09:20"],
  [1, 3, "@pip did you finish the slides for Friday?", "09:31"],
  [1, 1, "Almost! I only need to add the screenshots.", "09:35"],
  [1, 2, "Quick reminder: the meeting moved to 3 pm.", "10:02"],
  [1, 5, "Thanks Ed, I would have missed that.", "10:05"],
  [1, 4, "@lea can you bring the laptop charger?", "10:11"],
  [1, 5, "Sure thing, I will pack it tonight.", "10:14"],
  [1, 1, "Lunch at noon? I found a place with great soup.", "11:40"],
  [1, 3, "Yes please! @pip send me the address.", "11:42"],
  [1, 1, "On it. It is five minutes from the station.", "11:44"],
  [2, 2, "Who is cooking tonight?", "14:02"],
  [2, 3, "@pip it is your turn, a promise is a promise!", "14:03"],
  [2, 2, "Yeah!", "14:05"],
  [3, 2, "The project deadline is on the 6th of December.", "08:50"],
  [3, 1, "Got it. We should split the work evenly.", "08:55"],
  [4, 1, "This is our secret nest. No humans allowed.", "20:10"],
];

const PHRASES = [
  "Anyone up for bread later?",
  "The pond is freezing today.",
  "Quack quack!",
  "Did you see the new update?",
  "I will be late for the meeting.",
  "Who brought the snacks?",
  "Ducks <3",
  "Can someone review my PR?",
  "Lunch at noon?",
  "Just finished the migration plan.",
  "That is hilarious.",
  "I can bring dessert.",
  "Back in five minutes.",
  "Great idea, let us do it.",
  "Not sure about that, can we talk?",
  "Splashing into the weekend!",
];

const pick = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export default class extends BaseSeeder {
  async run() {
    const now = DateTime.now();

    await User.createMany(
      USERS.map(([id, firstName, lastName, nickName, status]) => ({
        id,
        firstName,
        lastName,
        nickName,
        status,
        email: `${nickName}@example.com`,
        password: PASSWORD,
      })),
    );
    const nickById = new Map<number, string>(USERS.map((u) => [u[0], u[3]]));
    const idByNick = new Map<string, number>(USERS.map((u) => [u[3], u[0]]));

    for (const [id, name, type, adminId, minutesAgo, memberIds] of CHANNELS) {
      const channel = await Channel.create({
        id,
        name,
        type,
        adminId,
        lastActivityAt: now.minus({ minutes: minutesAgo }),
      });
      await channel.related("members").attach(
        Object.fromEntries(
          memberIds.map((uid) => [uid, { joined_at: now.toSQL() }]),
        ),
      );
    }

    const lake = await Channel.findByOrFail("name", "secret-lake");
    await lake.related("invitedUsers").attach({ 1: { invited_by_id: 4 } });

    // the hand-written messages are from today
    const today = now.startOf("day");
    const rows = MESSAGES.map(([channelId, authorId, text, time]) => {
      const [h, m] = time.split(":").map(Number);
      return { channelId, authorId, text, at: today.set({ hour: h, minute: m }) };
    });

    // the generated ones are from yesterday
    for (const [channelId, memberIds] of [
      [1, [1, 2, 3, 4, 5]],
      [2, [1, 2, 3, 6]],
      [3, [1, 2, 7]],
      [4, [1, 8, 6]],
    ] as const) {
      let author = pick(memberIds);
      for (let i = 0; i < 100; i++) {
        if (Math.random() < 0.45) author = pick(memberIds);
        let text = pick(PHRASES);
        if (Math.random() < 0.1) text = `@${nickById.get(pick(memberIds))} ${text}`;
        const at = today.minus({ days: 1 }).plus({ minutes: i * 5 });
        rows.push({ channelId, authorId: author, text, at });
      }
    }

    // insert oldest first, so message ids follow time (pagination pages by id)
    rows.sort((a, b) => a.at.toMillis() - b.at.toMillis());

    for (const { channelId, authorId, text, at } of rows) {
      const message = await Message.create({
        channelId,
        authorId,
        content: text,
        createdAt: at,
      });

      const mentionedIds = [...text.matchAll(/@(\w+)/g)]
        .map((x) => idByNick.get(x[1]))
        .filter((x): x is number => x !== undefined);
      if (mentionedIds.length) {
        await message.related("mentions").sync([...new Set(mentionedIds)]);
      }
    }
  }
}
