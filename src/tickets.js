import { ChannelType, PermissionFlagsBits } from "discord.js";

export async function createTicketChannel({ guild, user, config, store }) {
  const existing = (await store.list()).find((ticket) => ticket.guildId === guild.id &&
    ticket.ownerId === user.id && ticket.status === "open");
  if (existing) {
    const channel = await guild.channels.fetch(existing.channelId).catch(() => null);
    if (channel) return { channel, created: false };
  }

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }
  ];
  if (config.supportRoleId) {
    overwrites.push({ id: config.supportRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }

  const channel = await guild.channels.create({
    name: `ticket-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
    type: ChannelType.GuildText,
    parent: config.categoryId || undefined,
    permissionOverwrites: overwrites,
    topic: `Ticket owner: ${user.id}`
  });
  try {
    await store.create({ guildId: guild.id, channelId: channel.id, ownerId: user.id });
  } catch (error) {
    await channel.delete("Ticket metadata could not be saved").catch(() => {});
    throw error;
  }
  return { channel, created: true };
}

export async function closeTicket({ channel, user, store, config }) {
  const ticket = await store.findByChannel(channel.id);
  if (!ticket || ticket.status !== "open") return { ok: false, reason: "not_a_ticket" };
  const isOwner = ticket.ownerId === user.id;
  const isSupport = Boolean(config.supportRoleId && channel.guild.members.cache
    .get(user.id)?.roles.cache.has(config.supportRoleId));
  const isAdmin = channel.guild.members.cache.get(user.id)?.permissions.has(PermissionFlagsBits.ManageChannels);
  if (!isOwner && !isSupport && !isAdmin) return { ok: false, reason: "not_authorized" };
  const closed = await store.close(channel.id, user.id);
  if (!closed) return { ok: false, reason: "already_closed" };
  await channel.permissionOverwrites.edit(ticket.ownerId, { SendMessages: false }).catch(() => {});
  return { ok: true, ticket: closed };
}
