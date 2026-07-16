import { handleError } from "../lib/error-handler";
import { packageUpdateNotice } from "../lib/package-update-notice";
import { help, helpText } from "./help";
import { init } from "./init";
import { login } from "./login";
import { newArticles } from "./newArticles";
import { postingCampaigns } from "./postingCampaigns";
import { preview } from "./preview";
import { publish } from "./publish";
import { pull } from "./pull";
import { version } from "./version";
import { search } from "./search";
import { get } from "./get";
import { groups } from "./groups";
import { post } from "./post";
import { comment } from "./comment";
import { reaction } from "./reaction";
import { api } from "./api";

export const exec = async (commandName: string, commandArgs: string[]) => {
  const commands = {
    api,
    init,
    login,
    new: newArticles,
    "posting-campaigns": postingCampaigns,
    preview,
    publish,
    pull,
    help,
    version,
    search,
    get,
    groups,
    post,
    comment,
    reaction,
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
