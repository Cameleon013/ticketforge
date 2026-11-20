import { Client, Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits } from "discord.js";
import { loadConfig } from "./config.js";
import { TicketStore } from "./store.js";
import { createTicketChannel, closeTicket } from "./tickets.js";
import { panelPayload, closePayload } from "./commands.js";

const config = loadConfig();
const store = new TicketStore(config.dataFile);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once(Events.ClientReady, (readyClient) => console.log(`TicketForge online as ${readyClient.user.tag}`));

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "ticket-panel") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server to post the ticket panel.", flags: MessageFlags.Ephemeral });
        return;
      }
      await interaction.channel.send(panelPayload());
      await interaction.reply({ content: "Ticket panel posted.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (!interaction.isButton() || !interaction.customId.startsWith("ticketforge:")) return;
    if (!interaction.guild) {
      await interaction.reply({ content: "Tickets can only be used inside a server.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (interaction.customId === "ticketforge:create") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await createTicketChannel({ guild: interaction.guild, user: interaction.user, config, store });
      if (result.created) {
        await result.channel.send({ content: `<@${interaction.user.id}> Your ticket is open. Please describe the issue.`, ...closePayload() });
      }
      await interaction.editReply({ content: `Your ticket: <#${result.channel.id}>` });
      return;
    }

    if (interaction.customId === "ticketforge:close") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const result = await closeTicket({ channel: interaction.channel, user: interaction.user, store, config });
      const messages = {
        not_a_ticket: "This channel is not an open TicketForge ticket.",
        not_authorized: "Only the ticket owner or support staff can close this ticket.",
        already_closed: "This ticket has already been closed."
      };
      if (!result.ok) {
        await interaction.editReply({ content: messages[result.reason] ?? "Could not close this ticket." });
        return;
      }
      await interaction.editReply({ content: "Ticket closed. Staff can archive or delete this channel when appropriate." });
      if (config.logChannelId) {
        const log = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
        if (log?.isTextBased()) await log.send(`Ticket ${interaction.channel.id} closed by ${interaction.user.tag}.`).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Interaction failed:", error);
    const message = "Something went wrong while processing this ticket action.";
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, flags: MessageFlags.Ephemeral }).catch(() => {});
    } else {
      await interaction.reply({ content: message, flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

client.on(Events.Error, (error) => console.error("Discord client error:", error));
process.on("unhandledRejection", (error) => console.error("Unhandled rejection:", error));
await client.login(config.token);
