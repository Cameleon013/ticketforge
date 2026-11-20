export function loadConfig(env = process.env) {
  for (const key of ["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID"]) {
    if (!env[key]) throw new Error(`${key} is required`);
  }
  return Object.freeze({
    token: env.DISCORD_TOKEN,
    clientId: env.CLIENT_ID,
    guildId: env.GUILD_ID,
    supportRoleId: env.SUPPORT_ROLE_ID || null,
    categoryId: env.TICKET_CATEGORY_ID || null,
    logChannelId: env.TICKET_LOG_CHANNEL_ID || null,
    dataFile: env.DATA_FILE || "./data/tickets.json"
  });
}
