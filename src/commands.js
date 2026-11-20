import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Post the public ticket creation panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map((command) => command.toJSON());

export function panelPayload() {
  const button = new ButtonBuilder()
    .setCustomId("ticketforge:create")
    .setLabel("Open a support ticket")
    .setStyle(ButtonStyle.Primary);
  return {
    content: "Need help? Press the button below to open a private support channel.",
    components: [new ActionRowBuilder().addComponents(button)]
  };
}

export function closePayload() {
  const button = new ButtonBuilder()
    .setCustomId("ticketforge:close")
    .setLabel("Close ticket")
    .setStyle(ButtonStyle.Danger);
  return { content: "A staff member can close this ticket when the conversation is complete.", components: [new ActionRowBuilder().addComponents(button)] };
}
