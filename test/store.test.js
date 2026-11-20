import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TicketStore } from "../src/store.js";

test("creates, finds, and closes a ticket persistently", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ticketforge-"));
  try {
    const store = new TicketStore(join(dir, "tickets.json"));
    const created = await store.create({ guildId: "g", channelId: "c", ownerId: "u" });
    assert.equal(created.status, "open");
    assert.equal((await store.findByChannel("c")).ownerId, "u");
    const closed = await store.close("c", "staff");
    assert.equal(closed.status, "closed");
    assert.equal(await store.close("c", "staff"), null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("prevents duplicate channel records", async () => {
  const dir = await mkdtemp(join(tmpdir(), "ticketforge-"));
  try {
    const store = new TicketStore(join(dir, "tickets.json"));
    await store.create({ guildId: "g", channelId: "c", ownerId: "u" });
    await assert.rejects(() => store.create({ guildId: "g", channelId: "c", ownerId: "u2" }), /already exists/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
