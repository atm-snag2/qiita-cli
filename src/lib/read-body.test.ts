jest.mock("node:fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

import fs from "node:fs";
import { readBody } from "./read-body";

const mockReadFile = jest.mocked(fs.promises.readFile);

describe("readBody", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit() was called.");
    });
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("--body が指定されたらその値を返す", async () => {
    const result = await readBody({ body: "hello" });
    expect(result).toBe("hello");
  });

  it("--body-file が指定されたらファイルの内容を返す", async () => {
    mockReadFile.mockResolvedValueOnce("file content");
    const result = await readBody({ bodyFile: "/path/to/file.md" });
    expect(result).toBe("file content");
    expect(mockReadFile).toHaveBeenCalledWith("/path/to/file.md", "utf-8");
  });

  it("--body と --body-file の両方が指定されたらエラー", async () => {
    await expect(
      readBody({ body: "hello", bodyFile: "/path/to/file.md" }),
    ).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--body and --body-file cannot be used together"),
    );
  });

  it("--body-file のファイルが存在しない場合エラー", async () => {
    mockReadFile.mockRejectedValueOnce(
      Object.assign(new Error("ENOENT: no such file or directory"), {
        code: "ENOENT",
      }),
    );
    await expect(
      readBody({ bodyFile: "/nonexistent/file.md" }),
    ).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to read file"),
    );
  });

  it("どちらも未指定で TTY の場合エラー", async () => {
    await expect(readBody({})).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("--body or --body-file is required"),
    );
  });

  it("カスタムエラーメッセージを使用できる", async () => {
    await expect(readBody({ errorMessage: "カスタムエラー" })).rejects.toThrow(
      "process.exit() was called.",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("カスタムエラー"),
    );
  });
});
