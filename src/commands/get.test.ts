import { getQiitaApiInstance } from "../lib/get-qiita-api-instance";
import { get } from "./get";
import type { QiitaApi, Item } from "../qiita-api"; // QiitaApiとItemの型定義をインポート

jest.mock("../lib/get-qiita-api-instance");
const mockGetQiitaApiInstance = jest.mocked(getQiitaApiInstance);

describe("get", () => {
  let mockQiitaApi: jest.Mocked<QiitaApi>;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  const mockItem: Item = {
    body: "## Mock Article Body",
    id: "mock_article_id",
    private: false,
    tags: [{ name: "mocktag" }],
    title: "Mock Article Title",
    organization_url_name: null,
    coediting: false,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
    slide: false,
  };

  beforeEach(() => {
    mockQiitaApi = {
      getItem: jest.fn(),
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

  it("記事IDがない場合、エラーを表示して終了する", async () => {
    await expect(get([])).rejects.toThrow("process.exit() was called.");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "記事IDを指定してください。例: npx qiita get <article_id>",
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("指定されたIDの記事を人間が読みやすい形式で表示する", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);

    await get(["mock_article_id"]);

    expect(mockQiitaApi.getItem).toHaveBeenCalledWith("mock_article_id");
    expect(consoleLogSpy).toHaveBeenCalledWith("Title:", mockItem.title);
    expect(consoleLogSpy).toHaveBeenCalledWith("ID:", mockItem.id);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "URL:",
      `https://qiita.com/users/${mockItem.id}`,
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("Private:", mockItem.private);
    expect(consoleLogSpy).toHaveBeenCalledWith("Tags:", mockItem.tags[0].name);
    expect(consoleLogSpy).toHaveBeenCalledWith(`
--- Body ---
`);
    expect(consoleLogSpy).toHaveBeenCalledWith(mockItem.body);
  });

  it("指定されたIDの記事をJSON形式で表示する", async () => {
    mockQiitaApi.getItem.mockResolvedValueOnce(mockItem);

    await get(["mock_article_id", "--json"]);

    expect(mockQiitaApi.getItem).toHaveBeenCalledWith("mock_article_id");
    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify(
        {
          id: mockItem.id,
          title: mockItem.title,
          body: mockItem.body,
          url: `https://qiita.com/users/${mockItem.id}`,
          organization_url_name: mockItem.organization_url_name,
          private: mockItem.private,
          tags: mockItem.tags.map((tag) => tag.name),
        },
        null,
        2,
      ),
    );
  });

  it("記事が見つからない場合、エラーを表示して終了する", async () => {
    mockQiitaApi.getItem.mockRejectedValueOnce({ status: 404 });

    await expect(get(["non_existent_id"])).rejects.toThrow(
      "process.exit() was called.",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "記事ID 'non_existent_id' の記事は見つかりませんでした。",
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it("APIエラーが発生した場合、エラーを表示して終了する", async () => {
    const errorMessage = "Network error";
    mockQiitaApi.getItem.mockRejectedValueOnce({ message: errorMessage });

    await expect(get(["mock_article_id"])).rejects.toThrow(
      "process.exit() was called.",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "記事の取得中にエラーが発生しました:",
      errorMessage,
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
