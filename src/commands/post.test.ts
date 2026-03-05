jest.mock("../lib/get-qiita-api-instance");

import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { post } from "./post";
import type { QiitaApi, Item } from "../qiita-api";

const mockGetQiitaApiInstance = jest.mocked(getQiitaApiInstance);

describe("post", () => {
  let mockQiitaApi: jest.Mocked<QiitaApi>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  const mockItem: Item = {
    body: "Mock Body",
    id: "mock_id",
    private: true,
    tags: [{ name: "test" }],
    title: "Mock Title",
    organization_url_name: null,
    coediting: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    slide: false,
  };

  beforeEach(() => {
    mockQiitaApi = {
      getItem: jest.fn(),
      postItem: jest.fn(),
      patchItem: jest.fn(),
      getDomainName: jest.fn().mockReturnValue("qiita.com"),
    } as Partial<jest.Mocked<QiitaApi>> as jest.Mocked<QiitaApi>;
    mockGetQiitaApiInstance.mockReturnValue(Promise.resolve(mockQiitaApi));

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit() was called.");
    });

    // Mock stdin
    Object.defineProperty(process.stdin, "isTTY", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("bodyがない場合、エラーを表示して終了する", async () => {
    await expect(post([])).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error: --body is required"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("新規作成：titleがない場合、エラーを表示して終了する", async () => {
    await expect(post(["--body", "test content"])).rejects.toThrow(
      "process.exit() was called.",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error: --title is required"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("新規作成：tagsがない場合、エラーを表示して終了する", async () => {
    await expect(
      post(["--body", "test content", "--title", "test title"]),
    ).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error: --tags is required"),
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("新規作成：正常に記事を作成できる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce(mockItem);

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
    ]);

    expect(mockQiitaApi.postItem).toHaveBeenCalledWith({
      rawBody: "Mock Body",
      title: "Mock Title",
      tags: ["test"],
      isPrivate: true,
      organizationUrlName: null,
      slide: false,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "https://qiita.com/users/mock_id",
    );
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "https://qiita.com/users/mock_id",
    );
  });

  it("更新：正常に記事を更新できる", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);
    mockQiitaApi.patchItem.mockResolvedValueOnce({
      ...mockItem,
      body: "Updated Body",
    });

    await post(["--id", "mock_id", "--body", "Updated Body"]);

    expect(mockQiitaApi.getItem).toHaveBeenCalledWith("mock_id");
    expect(mockQiitaApi.patchItem).toHaveBeenCalledWith({
      uuid: "mock_id",
      rawBody: "Updated Body",
      title: mockItem.title,
      tags: ["test"],
      isPrivate: mockItem.private,
      organizationUrlName: mockItem.organization_url_name,
      slide: mockItem.slide,
    });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "https://qiita.com/users/mock_id",
    );
  });

  it("JSON形式で出力できる", async () => {
    mockQiitaApi.postItem.mockResolvedValueOnce(mockItem);

    await post([
      "--title",
      "Mock Title",
      "--tags",
      "test",
      "--body",
      "Mock Body",
      "--json",
    ]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify(mockItem, null, 2),
    );
  });
});
