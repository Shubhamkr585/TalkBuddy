import Dexie, { Table } from "dexie";

export interface OutboxMessage {
  clientMsgId: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  text: string;
  queuedAt: number;
}

class TalkBuddyDB extends Dexie {
  outbox!: Table<OutboxMessage, string>;

  constructor() {
    super("talkbuddy");
    this.version(1).stores({
      outbox: "clientMsgId, queuedAt"
    });
  }
}

export const db = new TalkBuddyDB();
