# TicketForge

TicketForge is a Discord.js ticket workflow with private channel creation,
owner/support access controls, persistent ticket metadata, and close
authorization. It is intended as a self-hosted foundation for support teams.

## Requirements

- Node.js 20+
- Discord bot with `applications.commands` and `bot` scopes
- Bot permissions: Manage Channels, View Channels, Send Messages,
  Read Message History, Manage Roles (for channel overwrites)
- Server Members intent is not required for the current implementation;
  remove it from the client intents if you do not need member cache behavior.

## Setup

```bash
cp .env.example .env
# Set DISCORD_TOKEN, CLIENT_ID, GUILD_ID
npm install
npm test
npm run register
npm start
```

Use a test server first. `ticket-panel` requires Manage Server.

## Configuration

- `SUPPORT_ROLE_ID`: optional role granted access to each ticket.
- `TICKET_CATEGORY_ID`: optional parent category for ticket channels.
- `TICKET_LOG_CHANNEL_ID`: optional close log destination.
- `DATA_FILE`: JSON metadata path; defaults to `./data/tickets.json`.

The JSON store uses serialized writes and atomic rename to reduce the
chance of partial writes. Back up the data file and restrict filesystem
permissions. For multiple bot processes or high-volume deployments, replace
this adapter with a transactional database (for example PostgreSQL).

## Current behavior

- One open ticket per user per server.
- Ticket owner and optional support role can view the channel.
- Owner, support role, or a member with Manage Channels can close it.
- Closing disables the owner's Send Messages permission; it does not
  automatically delete the channel or export a transcript.

## Security notes

Never expose the bot token. Keep the ticket data file private. Do not use
untrusted user-provided text as raw permission overwrites or channel names.
Review role hierarchy and permissions before inviting the bot to a live server.

## Roadmap

Add transcript export, staff claim/assignment, ticket categories, retention
policies, database migrations, rate limits, and integration tests.
