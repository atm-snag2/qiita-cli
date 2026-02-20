import { handleError } from "../lib/error-handler";
import { packageUpdateNotice } from "../lib/package-update-notice";
import { help, helpText } from "./help";
import { init } from "./init";
import { login } from "./login";
import { newArticles } from "./newArticles";
import { preview } from "./preview";
import { publish } from "./publish";
import { pull } from "./pull";
import { version } from "./version";
import { search } from "./search";
import { get } from "./get";
import { post } from "./post";

export const exec = async (commandName: string, commandArgs: string[]) => {
  const commands = {
    init,
    login,
    new: newArticles,
    preview,
    publish,
    pull,
    help,
    version,
    search,
    get,
    post,
    "--help": help,
    "--version": version,
  };

  const isCommand = (key: string): key is keyof typeof commands => {
    return commands.hasOwnProperty(key);
  };

  if (!isCommand(commandName)) {
    console.error(`Unknown command '${commandName}'`);
    console.error();
    console.error(helpText);
    process.exit(1);
  }

  const updateMessage = await packageUpdateNotice();
  if (updateMessage) {
    console.log(updateMessage);
  }

  try {
    await commands[commandName](commandArgs);
  } catch (err) {
    console.error(err);
    await handleError(err as Error);
    process.exit(1);
  }
};
