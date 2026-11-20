import { REST, Routes } from "discord.js";
import { loadConfig } from "./config.js";
import { commands } from "./commands.js";

const config = loadConfig();
const rest = new REST({ version: "10" }).setToken(config.token);
await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
console.log("TicketForge guild commands registered.");
