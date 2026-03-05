import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { search } from "./search";
import type { QiitaApi } from "../qiita-api"; // QiitaApiの型定義をインポート

jest.mock("../lib/get-qiita-api-instance");
const mockGetQiitaApiInstance = jest.mocked(getQiitaApiInstance);

describe("search", () => {
  let mockQiitaApi: jest.Mocked<QiitaApi>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    mockQiitaApi = {
      items: jest.fn(),
      getDomainName: jest.fn().mockReturnValue("qiita.com"),
    } as Partial<jest.Mocked<QiitaApi>> as jest.Mocked<QiitaApi>;
    mockGetQiitaApiInstance.mockReturnValue(Promise.resolve(mockQiitaApi));

    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit() was called.");
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it("検索ワードがない場合、エラーを表示して終了する", async () => {
    await expect(search([])).rejects.toThrow("process.exit() was called."); // process.exitが呼び出されることを期待
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "検索ワードを指定してください。例: npx qiita search 'Qiita CLI'",
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("検索結果が見つからない場合、メッセージを表示する", async () => {
    mockQiitaApi.items.mockResolvedValueOnce([]);

    await search(["test"]);

    expect(mockQiitaApi.items).toHaveBeenCalledWith(1, 20, "test");
    expect(consoleLogSpy).toHaveBeenCalledWith("見つかりませんでした。");
  });

  it("検索結果がある場合、タイトルとURLを表示する", async () => {
    const mockItems = [
      {
        body: "Mock body 1",
        id: "123",
        url: "https://qiita.com/user1/items/123",
        private: false,
        tags: [{ name: "tag1" }],
        title: "Test Article 1",
        organization_url_name: null,
        coediting: false,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        slide: false,
      },
      {
        body: "Mock body 2",
        id: "456",
        url: "https://qiita.com/user2/items/456",
        private: false,
        tags: [{ name: "tag2" }],
        title: "Test Article 2",
        organization_url_name: "test_org",
        coediting: false,
        created_at: "2023-01-02T00:00:00Z",
        updated_at: "2023-01-02T00:00:00Z",
        slide: false,
      },
    ];

    mockQiitaApi.items.mockResolvedValueOnce(mockItems);

    await search(["react", "hook"]);

    expect(mockQiitaApi.items).toHaveBeenCalledWith(1, 20, "react hook");
    expect(consoleLogSpy).toHaveBeenCalledTimes(4);
    expect(consoleLogSpy).toHaveBeenNthCalledWith(1, "Test Article 1");
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      2,
      "  https://qiita.com/user1/items/123",
    );
    expect(consoleLogSpy).toHaveBeenNthCalledWith(3, "Test Article 2");
    expect(consoleLogSpy).toHaveBeenNthCalledWith(
      4,
      "  https://qiita.com/user2/items/456",
    );
  });

  it("ページと件数を指定して検索する", async () => {
    mockQiitaApi.items.mockResolvedValueOnce([]);

    await search(["--page", "2", "--per-page", "50", "nextjs"]);

    expect(mockQiitaApi.items).toHaveBeenCalledWith(2, 50, "nextjs");
  });

  it("検索結果をJSON形式で表示する", async () => {
    const mockItems = [
      {
        body: "Mock body 1",
        id: "123",
        url: "https://qiita.com/user1/items/123",
        private: false,
        tags: [{ name: "tag1" }],
        title: "Test Article 1",
        organization_url_name: null,
        coediting: false,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
        slide: false,
      },
    ];

    mockQiitaApi.items.mockResolvedValueOnce(mockItems);

    await search(["react", "--json"]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify(
        [
          {
            id: mockItems[0].id,
            title: mockItems[0].title,
            url: mockItems[0].url,
            organization_url_name: mockItems[0].organization_url_name,
          },
        ],
        null,
        2,
      ),
    );
  });
});
