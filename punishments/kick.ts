import { GuildMember, Message, MessageEmbed, TextChannel, User, Guild } from "discord.js";
import { Time } from "ztimespan";
import { endChar, escMarkdown, rejct, rejctF, textAbstract } from "../funcs/funcs";
import Punishment from "./punishment";
import { Context } from "../misc/contextType";

class Kick extends Punishment {

  /**
   * Kick someone.
   * @param {GuildMember} member The member that is being punished.
   * @param {Object} [options] Options to pass.
   * @param {GuildMember} [options.author] The author of the punishment.
   * @param {string} [options.reason] The reason of the punishment.
   * @param {string} [options.auctPrefix] A prefix to be included on the audit logs.
   * @param {BaseContext<GuildChannel>} [options.context] The context of the command.
   * @returns {Promise<void>}
   */
  public async punish(
    member: GuildMember, {
      author, reason, auctPrefix, context
    }: { author: GuildMember, reason?: string, auctPrefix?: string, context: Context }
  ): Promise<void> {
    const guild: Guild = member.guild;
    const botmember: GuildMember = guild.me;
    const def = (...args) => Promise.resolve(null);
    const { reply = def as never, send = def as never, actionLog = def as never } = context;
    if (author) {
      if (member.roles.highest.position > botmember.roles.highest.position) {
        return void reply("That member's highest role is higher in position than mine!");
      } else if (member.id === botmember.id) {
        return void reply("I refuse to kick myself! :frowning:");
      } else if (member.roles.highest.position === botmember.roles.highest.position) {
        return void reply("That member's highest role is the same in position as mine!");
      } else if (member.roles.highest.position > author.roles.highest.position && author.id !== guild.owner.id) {
        return void reply("That member's highest role is higher in position than yours!");
      } else if (member.roles.highest.position === author.roles.highest.position && author.id !== guild.owner.id) {
        return void reply("That member's highest role is the same in position as yours!");
      } else if (member.id === guild.owner.id) {
        return void reply("That member is the owner!");
      } else if (!member.kickable) {
        return void reply("That member is not kickable (being generic here). \
Check the conditions for being kicked (e.g. must not be owner, etc)!");
      }
    }
    const sentKickMsg: Message = await send(`Kicking ${member.user.tag}... (Sending DM...)`);
    const edit = (text: string) => sentKickMsg instanceof Message ?
      sentKickMsg.edit(text) :
      Promise.resolve(null) as never;
    const reasonEmbed: MessageEmbed = new MessageEmbed();
    reasonEmbed
      .setColor("ORANGE")
      .setDescription(reason || "None")
      .setTimestamp(new Date());
    const finish = () => {
      edit(`Kicked ${member.user.tag} successfully.`).catch(rejctF("[KICK-SUCCESSFUL-EDIT-MSG]"));
      actionLog({
        target: member,
        guild,
        type: "k",
        author: member,
        reason: reason || "None"
      }).catch(rejctF("[KICK-ACTIONLOG]"));
    };
    const fail = err => {
      rejct(err);
      edit(`The kick failed! :frowning:`).catch(rejctF("[KICK-FAIL-EDIT-MSG]"));
    };
    const executeKick = () => {
      // const kickPrefix = origin ? `[Kick command executed by ${origin.tag}] ` : "";
      const compressedText = textAbstract(endChar(auctPrefix) + (reason || "No reason given"), 512);
      member.kick(compressedText).then(finish).catch(fail);
    };
    let sent = false;
    let timeoutRan = false;
    const escapedName: string = escMarkdown(guild.name);
    member.send(`You were kicked at the server **${escapedName}** for the reason of:`, { embed: reasonEmbed })
      .then(() => {
        if (timeoutRan) {
          return;
        }
        sent = true;
        edit(`Kicking ${member.user.tag}... (DM Sent. Kicking...)`).catch(rejctF("[KICK-DM SENT-MSG-EDIT]"));
        executeKick();
      }).catch(err => {
        rejct(err);
        if (timeoutRan) {
          return;
        }
        sent = true;
        edit(`Kicking ${member.user.tag}... (DM Failed. Kicking anyway...)`);
        executeKick();
      });
    setTimeout(() => {
      if (!sent) {
        timeoutRan = true;
        executeKick();
      }
    }, Time.seconds(2.8));
  }
}

export default new Kick();
