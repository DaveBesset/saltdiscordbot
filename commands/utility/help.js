const Command = require("../../classes/command");

const func = async (msg, { args, send, reply, prefix, botmember }) => {
  const sendIt = (emb => {
    return send({ embed: emb, autocatch: false }).catch(err => err.status === 403 ?
      send("Please make sure I can send embeds in this channel.") :
      void(this.rejct(err)));
  });
  const categories = {};
  Object.entries(this.bot.commands).forEach(([k, v]) => {
    let category = "Uncategorized";
    if (v.category) {
      category = v.category.replace(/^\w/, m => m.toUpperCase());
    }
    if (!categories[category]) {
      categories[category] = {};
    }
    categories[category][v.name] = v;
  });
  if (!args /* || this._.trim(args.toLowerCase()) === "all" */) {
    const embed = new this.Embed();
    embed
      .setColor("RANDOM")
      .setTitle("List of categories")
      .setDescription(`Categories of commands available: (Type \`${prefix}help <category>\` to view its commands)`);
    /* Object.entries(categories).forEach(([k, v]) => {
      let str = "";
      Object.keys(v).forEach(k2 => {
        str += k2 + "\n";
      });
      embed.addField(k, this._.trim(str), true);
    }); */
    Object.getOwnPropertyNames(categories).forEach(cat => {

    });
    sendIt(embed);
  } else if (this._.trim(args.toLowerCase().replace(/^\w/, m => m.toUpperCase())) in categories) {
    const category = this._.trim(args.toLowerCase().replace(/^\w/, m => m.toUpperCase()));
    const embed = new this.Embed();
    embed
      .setColor("RANDOM")
      .setTitle(`List of commands in category "${category}"`)
      .setDescription("All commands available in that category.");
    let str = "";
    Object.values(categories[category]).forEach(cmd => {
      str += cmd.name + "\n";
    });
    str = this._.trim(str);
    embed.addField("Commands", str);
    sendIt(embed);
  } else if (this._.trim(args.toLowerCase()) in this.bot.commands) {
    const cmdn = this._.trim(args.toLowerCase());
    const embed = this.bot.commands[cmdn].help(prefix, true);
    sendIt(embed);
  } else {
    return reply("Unknown command/category!");
    /* let cmdToUse = null;
    Object.values(this.bot.commands).forEach((cmd: Command) => {
      if (cmdToUse) {
        return;
      }
      if (cmd.aliases) {
        Object.values(cmd.aliases).forEach((alias: Command) => {
          if (cmdToUse) {
            return;
          }
          if (alias.name.toLowerCase() === this._.trim(args).toLowerCase()) {
            cmdToUse = alias;
          }
        });
      }
    });
    if (!cmdToUse) {
    }
    sendIt(cmdToUse.help(prefix, true)); */
  }
};
module.exports = new Command({
  func,
  name: "help",
  default: true,
  description: "Show information about commands/a command/a category of commands.",
  example: "{p}help\n{p}help 8ball\n{p}help fun",
  category: "Utility",
  args: {"command or category": true},
  guildOnly: false,
});