import fs from "node:fs";
import process from "node:process";

export async function readBody(options: {
  body?: string;
  bodyFile?: string;
  errorMessage?: string;
}): Promise<string> {
  const { body, bodyFile } = options;
  const errorMessage =
    options.errorMessage ??
    "--body or --body-file is required, or provide via standard input.";

  if (body !== undefined && bodyFile !== undefined) {
    const chalk = (await import("chalk")).default;
    console.error(
      chalk.red("Error: --body and --body-file cannot be used together."),
    );
    process.exit(1);
  }

  if (body !== undefined) {
    return body;
  }

  if (bodyFile !== undefined) {
    const chalk = (await import("chalk")).default;
    try {
      return await fs.promises.readFile(bodyFile, "utf-8");
    } catch (err) {
      console.error(
        chalk.red(
          `Error: Failed to read file '${bodyFile}': ${(err as NodeJS.ErrnoException).message}`,
        ),
      );
      process.exit(1);
    }
  }

  if (!process.stdin.isTTY) {
    return new Promise<string>((resolve) => {
      let data = "";
      process.stdin.on("data", (chunk) => {
        data += chunk;
      });
      process.stdin.on("end", () => {
        resolve(data);
      });
    });
  }

  const chalk = (await import("chalk")).default;
  console.error(chalk.red(`Error: ${errorMessage}`));
  process.exit(1);
}
