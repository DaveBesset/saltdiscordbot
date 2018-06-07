import CommandClient from "../classes/commandClient";

export const bot = new CommandClient({
  disableEveryone: true,
  disabledEvents: ["TYPING_START"],
  fetchAllMembers: true
});
bot.bot = bot;

export default bot;
