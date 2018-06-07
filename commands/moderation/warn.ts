const Command = require("../../classes/command");
const d = require("../../misc/d");
const warnP = require("../../punishments/warn");

const func = async function (msg, {
  guildId, guild, reply, send, args, prompt, prefix, hasPermission, perms,
  searcher, promptAmbig, author, botmember, member, actionLog, dummy, checkRole,
  setPerms, self, seePerm
}) {
  const hasPerm = await seePerm("warn", perms, setPerms, { srole: "moderator", hperms: "MANAGE_ROLES" });
  if (!hasPerm) {
    return reply(`Missing permission \`warn\`! Could also use this command with the \`Moderator\` SaltRole or \
the \`Manage Roles\` Discord Permission.`);
  }
  if (!args) {
    return reply("Please tell me who to warn!");
  }
  const [user, reason] = d._.tail((args.match(d.Constants.regex.BAN_MATCH) || Array(3)));
  if (!user && !reason) {
    return;
  }
  let memberToUse;
  let membersMatched;
  if (/[^]#\d{4}$/.test(user)) {
    const split = user.split("#");
    const discrim = split.pop();
    const username = split.join("#");
    memberToUse = guild.members.find(m => m.user.username === username && m.user.discriminator === discrim);
  } else if (/^<@!?\d+>$/.test(user)) {
    memberToUse = guild.members.get(user.match(/^<@!?(\d+)>$/)[1]);
  }
  if (!memberToUse) {
    membersMatched = searcher.searchMember(user);
  }
  if (membersMatched && membersMatched.length < 1) {
    return reply("Member not found!");
  } else if (membersMatched && membersMatched.length === 1) {
    memberToUse = membersMatched[0];
  } else if (membersMatched && membersMatched.length > 1 && membersMatched.length < 10) {
    const result = await promptAmbig(membersMatched);
    if (result.cancelled) {
      return;
    }
    memberToUse = result.subject;
  } else if (membersMatched) {
    return reply("Multiple members have matched your search. Please be more specific.");
  }
  if (!memberToUse) {
    return;
  }

  await warnP.punish(memberToUse, {
    author: member, reason, auctPrefix: `[Warn command executed by ${author.tag}] `, context: self, automatic: false
  });
};
module.exports = new Command({
  func,
  name: "warn",
  perms: "warn",
  description: "Warn a member. (Related commands: `warnlimit` and `warnexpire`)",
  example: "{p}warn @EvilGuy#0010 Spamming a bit",
  category: "Moderation",
  args: { member: false, reason: true },
  guildOnly: true,
  default: false
});
