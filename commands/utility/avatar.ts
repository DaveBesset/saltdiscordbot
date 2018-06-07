const Command = require("../../classes/command");
const d = require("../../misc/d");

function getAvatarEmb(author) {
  const avatarRegex = /^((?:https?:\/\/)?cdn\.discordapp\.com\/avatars\/\d+\/\w+\.(?:jpe?g|png|gif|webp))\?size=\d+$/;
  const embed = new d.Embed();
  const tag = `${author.username}#${author.discriminator}`;
  const urlz = author.displayAvatarURL();
  const avatarUrl = avatarRegex.test(urlz) ?
  urlz.match(avatarRegex)[1]
  : urlz;

  embed.setAuthor(`${tag}'s Avatar`, avatarUrl, avatarUrl)
    .setImage(avatarUrl)
    .setFooter(`User's ID: ${author.id}`);

  return embed;
}

const func = async function (msg, {
  channel, guildId, author, args, arrArgs, send, reply, searcher, promptAmbig, perms, guild
}) {
  if (guild && !perms.avatar) return reply("Missing permission `avatar`! :frowning:");
  channel.startTyping();
  if (!args) {
    send({ embed: getAvatarEmb(author), deletable: true });
  } else if (!(channel instanceof d.TextChannel)) {
    send(
      "This is a DM and there is nobody here other than me and you, so here's my avatar.",
      { embed: getAvatarEmb(d.bot.user), deletable: true }
    );
  } else {
    if (/^<@\d+>$/.test(args)) {
      const user = d.bot.users.get(args.match(/^<@(\d+)>$/)[1]);
      if (!user) {
        return reply("Invalid member given!");
      }
      const embed = getAvatarEmb(user);
      return send({ embed, deletable: true });
    }
    const members = searcher.searchMember(args);
    d.logger.debug(args);
    if (members.length < 1) {
      return reply("Member not found!");
    }
    if (members.length > 1 && members.length < 10) {
      const ambResult = await promptAmbig(members);
      if (ambResult.cancelled) {
        return;
      }
      if (ambResult.subject) {
        const member = ambResult.subject;
        const embed = getAvatarEmb(member.user);
        send({ embed, deletable: true });
        return;
      }
    }
    if (members.length === 1) {
      const embed = getAvatarEmb(members[0].user);
      send({ embed, deletable: true });
      return;
    }
    return reply("Multiple members were found in your search. Please be more specific.");
  }
};
module.exports = new Command({
  func,
  name: "avatar",
  perms: "avatar",
  default: true,
  description: "View the avatar of you or someone else.",
  example: "{p}avatar",
  category: "Utility",
  args: {member: true},
  guildOnly: false
});
