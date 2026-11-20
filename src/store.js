import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export class TicketStore {
  #queue = Promise.resolve();
  constructor(filePath) { this.filePath = filePath; }

  async #read() {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8"));
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.tickets)) {
        throw new Error("Ticket data file has an invalid shape");
      }
      return parsed;
    } catch (error) {
      if (error.code === "ENOENT") return { version: 1, tickets: [] };
      throw error;
    }
  }

  async #write(data) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temp = `${this.filePath}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(data, null, 2), { mode: 0o600 });
    await rename(temp, this.filePath);
  }

  #serialize(operation) {
    const next = this.#queue.then(operation, operation);
    this.#queue = next.catch(() => {});
    return next;
  }

  list() { return this.#serialize(async () => (await this.#read()).tickets); }

  create(ticket) {
    return this.#serialize(async () => {
      const data = await this.#read();
      if (data.tickets.some((item) => item.channelId === ticket.channelId)) {
        throw new Error("A ticket already exists for this channel");
      }
      const record = { ...ticket, id: randomUUID(), status: "open", createdAt: new Date().toISOString() };
      data.tickets.push(record);
      await this.#write(data);
      return record;
    });
  }

  findByChannel(channelId) {
    return this.#serialize(async () => (await this.#read()).tickets.find((ticket) => ticket.channelId === channelId) ?? null);
  }

  close(channelId, closedBy) {
    return this.#serialize(async () => {
      const data = await this.#read();
      const ticket = data.tickets.find((item) => item.channelId === channelId && item.status === "open");
      if (!ticket) return null;
      ticket.status = "closed";
      ticket.closedAt = new Date().toISOString();
      ticket.closedBy = closedBy;
      await this.#write(data);
      return ticket;
    });
  }
}
