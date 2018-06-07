export default {
  HAS_DECIMAL: /\.(?!0+$)/,
  NAME_AND_DISCRIM: /^([^]{1,32})#(\d{4})$/,
  ID: /^(\d{16,21})$/,
  MENTION: /^<@!?(\d{16,21})>$/,
  ROLE_MENTION: /^<@&(\d{16,21})>$/,
  CHANNEL_MENTION: /^<#(\d{16,21})>$/,
  EMOJI_MENTION: /^<:\w+:(\d{16,21})>$/,
  EMOJI_TEXT: /^<:(\w+):(\d{16,21})>$/,
  EMOJI_RESOLVED: /^(\w+):(\d{16,21})$/,
  BAN_MATCH: /^([^]+?(?:#\d{4})?)(?:\s+([^]*))?$/,
  CASE_MATCH: /^(?:([\s\S]+)\s+(\d+)\s+([\s\S]+)|([\s\S]+)\s+([\s\S]+)|([\s\S]+))/,
  LIST_WARNS_MATCH: /^([\s\S]{1,32}|[\s\S]{1,32}\#\d{4})\s+(\d+)|([\s\S]{1,32}|[\s\S]{1,32}\#\d{4})$/,
  LIST_PUNISH_MATCH: `
  ^(?:((?:all|kick|ban|unban|unmute|softban|mute|warn)s?)(?:\\s+(\\d+))?)|(?:([\\s\\S]{1,32}|[\\s\\S]{1,32}\\#\\d{4})\\s+["']*
  ((?:all|kick|ban|unban|unmute|softban|mute|warn)s?)["']*(?![^\\s])(?:\\s+(\\d+))?)|([\\s\\S]{1,32}|[\\s\\S]{1,32}\\#\\d{4})$`,
  MUTE: {
    /**
     * Mute regex.
     * @param {number} type One of 1 (user match), 2 (time match) and 3 (reason match).
     * @returns {RegExp}
     */
    /* MATCH: (type: 1 | 2 | 3) => {
      let regexs: [string|RegExp];
      if (type === 1) {
        regexs = [
          "^([^]{1,32}?(?:#\\d{4})?)(?:(?:\\s+(?:\"|'|'')?(?:\\d+|(?:\\d+\\s*(?:s(?:ec(?:ond)s?)",
          "|m(?:in(?:ute)?s?)?|(?:h(?:ours?)?)|(?:d(?:ays?)?)|(?:w(?:eeks?)?)|(?:mo(?:nths?)?))+))(?:\"|'|'')?)",
          "(?:\\s+[^]*)?|(?:\\s+[^]*))?$",
        ];
      } else if (type === 2) {
        regexs = [
          "^(?:[^]{1,32}?(?:#\\d{4})?)(?:(?:\\s+(?:\"|'|'')?(\\d+|(?:\\d+\\s*(?:s(?:ec(?:ond)s?)",
          "|m(?:in(?:ute)?s?)?|(?:h(?:ours?)?)|(?:d(?:ays?)?)|(?:w(?:eeks?)?)|(?:mo(?:nths?)?))+))(?:\"|'|'')?)",
          "(?:\\s+[^]*)?|(?:\\s+[^]*))?$",
        ];
      } else if (type === 3) {
        regexs = [
          "^(?:[^]{1,32}?(?:#\\d{4})?)(?:(?:\\s+(?:\"|'|'')?(?:\\d+|(?:\\d+\\s*(?:s(?:ec(?:ond)s?)",
          "|m(?:in(?:ute)?s?)?|(?:h(?:ours?)?)|(?:d(?:ays?)?)|(?:w(?:eeks?)?)|(?:mo(?:nths?)?))+))(?:\"|'|'')?)",
          "(\\s+[^]*)?|(\\s+[^]*))?$",
        ];
      } else {
        throw new RangeError(`Invalid type, must be one of 1, 2, 3, but was given ${type}!`);
      }
      return combineRegex(regexs, "i");
    }, */
    MATCH_REG: `
    ^ # Start of string.
    (?: # User & Time.
      ( # Possibility 1 starts here. This group is the user name
        [\\s\\S]{1,32} # Any character up to 32 times
        |[\\s\\S]{1,32} # Or, up to 32 times...
        \\#\\d{4} # ...and a discrim.
      )
      \\s+ # Any whitespace
      ["']* # Optional quotes
      ( # The group of time units.
        (?: # First time unit.
          \\d+ # Amount of it.
          \\s* # Whitespace if you desire.
          (?: # Entering valid time units.
            (?:mo|(?:months?)) # mo, month, months
            |(?:s|(sec|second)s?) # s, sec, secs, second, seconds
            |(?:m|(?:min|minute)s?) # m, min, mins, minute, minutes
            |(?:h|(?:hours?)) # h, hour, hours
            |(?:d|(?:days?)) # d, day, days
            |(?:w|(?:weeks?)) # w, week, weeks
            |(?:y|(?:years?)) # y, year, years
          ) # Leaving valid time units.
        ) # End of first time unit.
        (?: # Holder for any extra time units.
          \\s* # Whitespace if you want.
          \\d+ # Amount of time unit.
          \\s* # Optional Whitespace.
          (?: # Once again, entering valid time units.
            (?:mo|(?:months?)) # mo, month, months
            |(?:s|(sec|second)s?) # s, sec, secs, second, seconds
            |(?:m|(?:min|minute)s?) # m, min, mins, minute, minutes
            |(?:h|(?:hours?)) # h, hour, hours
            |(?:d|(?:days?)) # d, day, days
            |(?:w|(?:weeks?)) # w, week, weeks
            |(?:y|(?:years?)) # y, year, years
          ) # Leaving valid time units.
        )* # Exiting holder for extra time units. Can be any amount.
      ) # Exiting the group of time units.
      ["']* # Optional quotes
      (?! # Do not match if there's...
        [^\\s] # ...Anything other than whitespace after this.
      )
      | # Possibility 1 ends here. Possibility 2 starts here.
      ( # User name matching.
        [^\\s]{1,32} # Any character, matching up to 32 times.
      )
      \\s+ # Whitespaces
      ["']* # Optional quotes
      ( # Match...
        \\d+ # ...Numbers. (Naked numbers are converted to minutes)
      )
      ["']* # Optional quotes
      (?! # Do not match if there's...
        [^\\s] # ...Anything other than whitespace after this.
      )
      | # Possibility 2 ends here, and Possibility 3 starts here.
      ( # User name matcing.
        [^\\s]{1,32} # Any character up to 32 times.
        \\#\\d{4} # Discriminator.
      )
      \\s+ # Whitespaces
      ["']* # Optional quotes
      ( # Match...
        \\d+ # ...Numbers. (Naked numbers are converted to minutes)
      )
      ["']* # Optional quotes
      (?! # Do not match if there's...
        [^\\s] # ...Anything other than whitespace after this.
      )
      | # Possibility 3 ends here, Possibility 4 starts here.
      ( # Just user name. (Default to 10 min)
        [^\\s]{1,32} # Match any character up to 32 times...
        |[^\\s]{1,32} # Or, any character up to 32 times with...
        \\#\\d{4}# ...A discrim.
      ) # Possibility 4 ends here.
    ) # All the matching ends here. Phew!
    (?: # Reason group.
      \\s+ # Whitespace to indicate reason.
      ([^]+) # The reason itself, any character any amount of times.
    )? # It is also optional.
    $ # End of string.`,
    IS_JUST_NUMBER: /^(?:"|'|'')?(\d+)(?:"|'|'')?$/,
    IS_NOTHING: /^(?:|\s+|(?:"|'|'')\s*(?:"|'|''))$/,
    TIME_MATCH:
    /\d+\s*(?:(?:mo|(?:months?))|(?:s|(?:sec|second)s?)|(?:m|(?:min|minute?s?))|(?:h|(?:hours?))|(?:d|(?:days?))|(?:w|(?:weeks?))|(?:y|(?:years?)))/g,
    SINGLE_TIME_MATCH: (isNumber: boolean) => {
      return isNumber ? /^(\d+)\s*\w+$/ : /^\d+\s*(\w+)$/;
    }
  }
};