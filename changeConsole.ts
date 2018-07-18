import colors from "chalk";

/**
 * Edits console
 * @param {boolean} isMng if this was invoked by Manager or not
 * @param {Object} [shardIDObj] Object with id property to use
 */
export default function editConsole(isMng: boolean, shardIDObj?: { id: number }) {
  if (!(console.log as any).__wasChanged) {
    (console as any).oldLog = console.log;
    console.log = (...args) => {
      args.unshift(colors.bgYellow.bold(isMng ? `[MNG]` : `[S${shardIDObj.id == null ? "?" : shardIDObj.id}]`) + " ");
      return (console as any).oldLog(...args);
    };
    Object.defineProperty(console.log, "__wasChanged", { value: true });
  }
  if (!(console.error as any).__wasChanged) {
    (console as any).oldError = console.error;
    console.error = (...args) => {
      args.unshift(colors.bgYellow.bold(isMng ? `[MNG]` : `[S${shardIDObj.id == null ? "?" : shardIDObj.id}]`) + " ");
      return (console as any).oldError(...args);
    };
    Object.defineProperty(console.error, "__wasChanged", { value: true });
  }
}
