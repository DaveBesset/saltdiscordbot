import { _, Constants, Message, User, TextChannel, Embed } from "../../util/deps";
import collectReact, { ICollectReactFunc } from "../../funcs/bot/collectReact";
import paginateReactions from "../../funcs/util/paginateReactions";
import mkEmj from "../../funcs/parsers/mkEmoji";
import rejctF from "../../funcs/util/rejctF";
import { MessageOptions, StringResolvable, MessageReaction, Collection, Guild } from "discord.js";
import editF = require("../../funcs/bot/edit");
import { DjsChannel } from "../../misc/contextType";

export type ExtendedSendUnit<O extends object = ExtendedMsgOptions> = { // tslint:disable-line:interface-over-type-literal
  (content: string, options?: O): Promise<Message>;
  (options: O): Promise<Message> };

export type ExtendedSendArr<O extends object = ExtendedMsgOptions> = { // tslint:disable-line:interface-over-type-literal
  (content: string[], options?: O): Promise<Message[]>;
  (options: O): Promise<Message[]> };

export type ExtendedSend<O extends object = ExtendedMsgOptions> = ExtendedSendUnit<O> & ExtendedSendArr<O>;

type DankStructure = { isDank: true, content?: string, embed?: Embed };

type Structure = { isDank?: boolean, content?: string, embed?: Embed, [prop: string]: any };

export interface IProtoSendPaginator {
  page?: number;
  maxPage: number;
  pages?: any[];
  // usePages
  usePages?: boolean;
  /**
   * A structure to be omnipresent (optional)
   */
  struct?: Structure;
  /**
   * What to send on each msg
   */
  content: string;
  format?: (newPage: number, struct: Structure, pages: any[]) => Structure;
  // func
  data?: object;
  func?: (
    newPage: number, opts: { pages?: any[], ret: MessageReaction[], coll: MessageReaction[], msg: Message, data?: object }
  ) => void;
}

export interface IPSPartialMessage {
  author: User;
  channel: DjsChannel;
  guild?: Guild;
}

interface ICustomSendType {
  autoCatch?: boolean;
  deletable?: boolean;
  paginate?: IProtoSendPaginator;
}

type Sender = ExtendedSend<object>;

export type ExtendedMsgOptions = MessageOptions & ICustomSendType;

/**
 * generate a sender
 * @param {Message} msg Message as the command handler-triggered msg
 * @param {object} [data] some additional data
 */
export default (msg: IPSPartialMessage, data?: { author?: User }) => {
  const { author, channel, guild } = msg;
  const dankAuthor = data && data.author ? data.author : msg.author;
  return (func: Sender): ExtendedSendUnit<ExtendedMsgOptions> => { // factory for sending functions
    return function sender(
      ogContent: string | ExtendedMsgOptions, options?: ExtendedMsgOptions
    ): Promise<Message> {
      let content: string;
      if (typeof ogContent === "object" && !options && !(ogContent instanceof Array)) {
        options = ogContent;
        content = "";
      } else if (!options) {
        options = {};
        content = ogContent as string;
      }
      const result = func(content, options);
      if (options.autoCatch == null || options.autoCatch) {
        result.catch(rejctF("[PROTOSEND-AUTOCATCH]"));
      }
      return result.then(messg => {
        if (channel.typing) channel.stopTyping();
        if (
          messg && // message was sent successfully
          messg.react && // message was actually sent successfully
          guild ? (
            guild.me.hasPermission(["ADD_REACTIONS"]) && // I can add reactions
            channel instanceof TextChannel && // ????
            channel.permissionsFor(guild.me).has(["ADD_REACTIONS"]) // I can definitely add reactions
          ) : true
        ) {
          let procceeded = false; // if pagination was done
          const { deletable, paginate } = options;
          console.log("ISPAG", paginate);
          if (paginate) { // paginate
            const { page: sPage = 1, maxPage } = paginate;
            const { left, right } = Constants.emoji.arrows;
            const page = _.clamp(sPage, 1, maxPage);
            const dPage = maxPage - page + 1;
            const emojis = paginateReactions(page, maxPage, { left, right });
            console.log(page, emojis);
            if (emojis.length > 0) {
              procceeded = true;
              if (deletable) emojis.unshift(Constants.emoji.resolved.rjt.DELETE);

              const onSuccess: ICollectReactFunc = async (ret, coll, mssg) => {
                const emjzero = coll[0].emoji; // emoji reacted
                const re = emjzero.id ? mkEmj(emjzero.id, emjzero.name) : emjzero.name;
                console.log("RE", re, coll);
                if (re === Constants.emoji.rjt.DELETE) return collectReact.funcs.DELETE_MSG(ret, coll, mssg);
                await collectReact.funcs.REMOVE_ALL(ret, coll, mssg);
                let newPage;
                const { SKIP: supSkip, SPECIALS: specialSup, DIVIDE_BY: divideBy } = Constants.numbers.pagination.super;
                if (Object.values(left).includes(re)) {
                  const { END: end, SUP: sup, ONE: one } = left;
                  if (re === end) {
                    newPage = 1;
                  } else if (re === one) {
                    newPage = page - 1;
                  } else if (re === sup) {
                    const quant = page < 2 ?
                      0 :
                      _.clamp(Math.floor(maxPage / divideBy), 2, supSkip);
                    newPage = page - quant;
                  }
                } else if (Object.values(right).includes(re)) {
                  const { END: end, SUP: sup, ONE: one } = right;
                  if (re === end) {
                    newPage = maxPage;
                  } else if (re === one) {
                    newPage = page + 1;
                  } else {
                    const quant = dPage < 2 ?
                      0 :
                      _.clamp(Math.floor(maxPage / divideBy), 2, supSkip);
                    newPage = page + quant;
                  }
                }
                if (typeof paginate.func !== "undefined") {
                  await paginate.func(
                    _.clamp(newPage || page, 1, maxPage),
                    { pages: paginate.pages, data: paginate.data, ret, coll, msg: mssg }
                  );
                } else if (paginate.usePages) {
                  const { content, struct } = paginate;
                  let structToUse = struct;
                  if (typeof paginate.format === "function") {
                    structToUse = await paginate.format(_.clamp(newPage || page, 1, maxPage), struct, paginate.pages);
                  }
                  const coolCont: string = typeof structToUse === "string" ?
                    structToUse :
                    (typeof structToUse === "object" && structToUse.isDank && structToUse.content ?
                      structToUse.content :
                      null
                    );
                  const embedT = typeof structToUse === "object" ?
                    (
                      structToUse.isDank ?
                        structToUse.embed :
                        (
                          structToUse instanceof Embed ?
                            structToUse :
                            undefined
                        )
                    ) :
                    undefined;
                  const { default: edit }: typeof editF = require("../../funcs/bot/edit"); // lazy require to not mess things up
                  await edit(
                     mssg,
                    { author: (data || msg).author },
                    (coolCont || content || undefined),
                    {
                      embed: embedT, deletable,
                      paginate: Object.assign({}, paginate, { page: newPage })
                    }
                  );
                }
              };
              collectReact(messg, emojis, dankAuthor.id, {
                rawReact: true, onSuccess
              });
            }
          }
          if (deletable && !procceeded) { // react with a deleting emoji
            collectReact(messg, Constants.emoji.WASTEBASKET, dankAuthor.id)
              .catch(rejctF("[TRASH-REACT-1]"));
          }
        }
        return messg;
      });
    };
  };
};