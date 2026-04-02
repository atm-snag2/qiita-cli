import { QiitaApi } from "./index";
import type { Item } from "./index";

const mockItem: Item = {
  body: "Mock Body",
  id: "mock_id",
  url: "https://qiita.com/mock_user/items/mock_id",
  private: false,
  tags: [{ name: "test" }],
  title: "Mock Title",
  organization_url_name: null,
  coediting: false,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z",
  slide: false,
};

const makeApi = () =>
  new QiitaApi({ token: "test_token", userAgent: "test-agent" });

const mockFetch = (body: unknown, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  });
};

describe("QiitaApi", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("patchItem", () => {
    it("commit_messageなしでリクエストボディを送信する", async () => {
      mockFetch(mockItem);
      const api = makeApi();

      await api.patchItem({
        uuid: "mock_id",
        rawBody: "Updated Body",
        title: "Mock Title",
        tags: ["test"],
        isPrivate: false,
        organizationUrlName: null,
        slide: false,
      });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const sentBody = JSON.parse(options.body);
      expect(sentBody).not.toHaveProperty("commit_message");
    });

    it("commit_messageありでリクエストボディに含める", async () => {
      mockFetch(mockItem);
      const api = makeApi();

      await api.patchItem({
        uuid: "mock_id",
        rawBody: "Updated Body",
        title: "Mock Title",
        tags: ["test"],
        isPrivate: false,
        organizationUrlName: null,
        slide: false,
        commitMessage: "コメント機能を追加",
      });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const sentBody = JSON.parse(options.body);
      expect(sentBody.commit_message).toBe("コメント機能を追加");
    });

    it("正しいエンドポイントにPATCHリクエストを送る", async () => {
      mockFetch(mockItem);
      const api = makeApi();

      await api.patchItem({
        uuid: "mock_id",
        rawBody: "body",
        title: "title",
        tags: ["tag"],
        isPrivate: false,
        organizationUrlName: null,
        slide: false,
      });

      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("/api/v2/items/mock_id");
      expect(options.method).toBe("PATCH");
    });
  });
});
