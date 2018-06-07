import { TcmdFunc } from "../../misc/contextType";
import { AInfoDummy } from "../info/info";
import { _, Role, bot, search, Embed, Constants, Command, sleep, paginate, GuildMember } from "../../misc/d";
import { Collection, Guild, GuildEmoji, GuildChannel } from "discord.js";
import { SearchType } from "../../funcs/parsers/search";

/**
 * Only get props of that type
 * @template T The type to get props of
 * @template C The type that props should be
 */
export type OnlyPropsOf<T, C> = {
  [P in keyof T]: T[P] extends C ? P : never;
}[keyof T];

/**
 * Used to get all keys of an Union Type
 * @template T The type to get props of
 */
export type PossibleProps<T> = T extends any ? keyof T : never;

/**
 * Only get props that aren't of that type
 * @template T The type to get props of
 * @template C The type that props shouldn't be
 */
export type NoPropsOf<T, C> = {
  [P in keyof T]: T[P] extends C ? never : P;
}[keyof T];

type PossibleListing = GuildMember | GuildEmoji | Role | GuildChannel;

type MultiInfoDummy = AInfoDummy & {
  data?: {
    noArgCont: string;
    noArgInvalid: string;
    noArgTitle: string;

    argCont: string;
    argInvalid: string;
    argTitle: string;

    /**
     * Type to search when using subject wide collection
     */
    type: SearchType;
    sort: (a: PossibleListing, b: PossibleListing) => number;
    textWorker: (val: PossibleListing, arr: PossibleListing[], isGuild: boolean, isAndroid: boolean) => string;
    filterer?: (val: PossibleListing, guild: Guild) => boolean;

    /**
     * for subjectWide collection
     */
    subjectProp?: PossibleProps<PossibleListing>;
    /**
     * for guildWide collection
     */
    guildProp: OnlyPropsOf<Guild, Collection<string, PossibleListing>>;
  }
};

const datas: { [prop: string]: MultiInfoDummy["data"] } = {
  roles: {
    noArgCont: "Here are the server's roles:",
    noArgInvalid: "This server has no roles (other than the default)!",
    noArgTitle: "All Roles",

    argCont: "Here are {user.tag}'s roles:",
    argInvalid: "That member has no roles (other than the default)!",
    argTitle: "{user.tag}'s Roles",

    type: "user",
    sort: (a: Role, b: Role) => b.position - a.position,
    textWorker: (role: Role, arr: Role[], isGuild: boolean, isAndroid: boolean) => {
      const rolePos = arr.indexOf(role);
      const position = arr.length - rolePos; // rolesArr length - rolePos to reverse the sorting
      const roleText = isAndroid ?
        role.name.replace(/<([@#])/, "<\\$1") :
        `<@&${role.id}>`;
      return `**${isNaN(position) ? `${position}:` : `\`${position}.\``}** ${roleText}`;
    },
    filterer: (v: Role, g: Guild) => v.id !== g.id,

    subjectProp: "members",
    guildProp: "roles"
  }
};

const func: TcmdFunc<MultiInfoDummy> = async function(msg, {
  args, author, arrArgs, send, reply, prefix: p, botmember, dummy, guild, guildId, perms, searcher, promptAmbig,
  channel, self, member, sendIt
}) {
  if (!perms["info.roles"]) return reply("Missing permission `info roles`! :frowning:");
  channel.startTyping();
  const {
    android, action, arg: _arg, trArg,
    data: {
      noArgCont,
      noArgInvalid,
      noArgTitle,

      argCont,
      argInvalid,
      argTitle,

      type,
      sort,
      textWorker,
      filterer = () => true,

      subjectProp,
      guildProp
    } = datas.roles
  } = dummy || {} as never;
  const arg = trArg || _arg || args;
  /**
   * Content to send with msg
   */
  let content: string;
  /**
   * Text to send if invalid input was given
   */
  let invalid: string;
  /**
   * Embed title
   */
  let title: string;

  /**
   * List of roles/subjects to use
   */
  let subjects: Collection<string, PossibleListing>;
  /**
   * Page to use
   */
  let page: number;
  /**
   * Page specified
   */
  let strPage: string;
  /**
   * Search term-
   */
  let argu: string;
  const sepArg = arg.split(" ");
  if (/^\d+$/.test(sepArg[sepArg.length - 1])) {
    strPage = sepArg.pop();
  } else {
    strPage = "1";
  }
  argu = sepArg.join(" ");
  if (!arg || /^\d{1,5}$/.test(arg)) { // all from guild
    subjects = guild[guildProp];
    content = noArgCont;
    invalid = noArgInvalid;
    title = noArgTitle;
  } else { // all from a sub-subject (member for roles, role for members)
    let subSubject: PossibleListing;
    const searched = await (search(arg, "user", self, { allowForeign: false }));
    if (searched.subject) {
      subSubject = guild.member(searched.subject);
    } else {
      return;
    }
    subjects = _.at(subSubject, [subjectProp as any])[0] as any;
    content = `Here are ${member.user.tag}'s roles:`;
    invalid = "That member has no roles (other than the default)!";
    title = `${member.user.tag}'s Roles`;
  }
  const rolesArr = roles.array().sort((a, b) => b.position - a.position).filter(r => r.id !== guild.id);
  if (rolesArr.length < 1) return reply(invalid);
  const isGRoles = roles === guild.roles;
  const pages = paginate(rolesArr);
  if (strPage.length > 5) {
    page = 1;
  } else {
    page = Number(strPage);
  }
  const gen = (page: number) => {
    page = _.clamp(isNaN(page) ? 1 : page, 1, pages.length);
    const emb = new Embed()
      .setAuthor(title);
    if (pages.length > 1) emb.setFooter(`To go to a specific page, write ${p}info roles \
${argu ? argu + "<page>" : "<page>"}.`);
    let desc = "";
    for (const role of pages[page - 1]) {
      if (role.id === guild.id) continue;
      const rolePos = rolesArr.indexOf(role);
      const position = rolePos < 1 ?
      (isGRoles ? "Top" : "Highest") :
      (
        rolePos === rolesArr.length - 1 ?
          (isGRoles ? "Bottom" : "Lowest") :
          rolesArr.length - 1 - rolePos // rolesArr length - rolePos to reverse the sorting; - 1 to keep zero-indexed
      );
      desc += `**${isNaN(position) ? `${position}:` : `${position}.`}** <@&${role.id}> \n`;
    }
    emb.setDescription(_.trim(desc));
    return emb;
  };
  const paginateObj = {
    page,
    maxPage: pages.length,
    pages,
    usePages: true,
    format: gen,
    content
  };
  await sleep(100); // to maek typing count
  return sendIt(gen(page), { content, paginate: paginateObj });
};

export const serverinfo = new Command({
  description: "View info of current server",
  func,
  name: "serverinfo",
  perms: "info.server",
  args: {},
  guildOnly: true,
  category: "Info",
  example: `
{p}{name}`,
  default: true,
  aliases: {
    guildinfo: {
      description: "View info of current server",
      action: "serverinfo"
    },
    serverid: {
      description: "View ID of current server",
      action: "serverid"
    },
    guildid: {
      description: "View ID of current server",
      action: "serverid"
    }
  }
});