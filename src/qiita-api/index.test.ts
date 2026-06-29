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
  posting_campaign_uuid: null,
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

    it("posting_campaign_uuid 未指定でリクエストボディに含めない", async () => {
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

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const sentBody = JSON.parse(options.body);
      expect(sentBody).not.toHaveProperty("posting_campaign_uuid");
      expect(sentBody).not.toHaveProperty("agreed_posting_campaign_term");
    });

    it("posting_campaign_uuid と agreed_posting_campaign_term を送信できる", async () => {
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
        postingCampaignUuid: "910c5be7d2d6a043a12b",
        agreedPostingCampaignTerm: true,
      });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const sentBody = JSON.parse(options.body);
      expect(sentBody.posting_campaign_uuid).toBe("910c5be7d2d6a043a12b");
      expect(sentBody.agreed_posting_campaign_term).toBe(true);
    });

    it("posting_campaign_uuid に null を送信して登録解除できる", async () => {
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
        postingCampaignUuid: null,
      });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const sentBody = JSON.parse(options.body);
      expect(sentBody.posting_campaign_uuid).toBeNull();
      expect(sentBody).not.toHaveProperty("agreed_posting_campaign_term");
    });
  });

  describe("postItem", () => {
    it("posting_campaign_uuid 未指定でリクエストボディに含めない", async () => {
      mockFetch(mockItem);
      const api = makeApi();

      await api.postItem({
        rawBody: "body",
        title: "title",
        tags: ["tag"],
        isPrivate: false,
        organizationUrlName: null,
        slide: false,
      });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const sentBody = JSON.parse(options.body);
      expect(sentBody).not.toHaveProperty("posting_campaign_uuid");
      expect(sentBody).not.toHaveProperty("agreed_posting_campaign_term");
    });

    it("posting_campaign_uuid と agreed_posting_campaign_term を送信できる", async () => {
      mockFetch(mockItem);
      const api = makeApi();

      await api.postItem({
        rawBody: "body",
        title: "title",
        tags: ["tag"],
        isPrivate: false,
        organizationUrlName: null,
        slide: false,
        postingCampaignUuid: "910c5be7d2d6a043a12b",
        agreedPostingCampaignTerm: true,
      });

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const sentBody = JSON.parse(options.body);
      expect(sentBody.posting_campaign_uuid).toBe("910c5be7d2d6a043a12b");
      expect(sentBody.agreed_posting_campaign_term).toBe(true);
    });
  });

  describe("getPostingCampaigns", () => {
    const mockCampaigns = [
      {
        uuid: "910c5be7d2d6a043a12b",
        title: "Test Campaign",
        banner_url: "https://example.com/banner.jpg",
        link_url: "https://qiita.com/official-events/910c5be7d2d6a043a12b",
        term_url: null,
        start_at: "2026-06-01T10:00:00+09:00",
        end_at: "2026-07-13T23:59:59+09:00",
        is_after_end: false,
      },
    ];

    it("/api/v2/posting-campaigns に GET リクエストを送る", async () => {
      mockFetch(mockCampaigns);
      const api = makeApi();

      await api.getPostingCampaigns();

      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain("/api/v2/posting-campaigns");
      expect(options.method).toBe("GET");
    });

    it("API レスポンスを配列で返す", async () => {
      mockFetch(mockCampaigns);
      const api = makeApi();

      const result = await api.getPostingCampaigns();

      expect(result).toEqual(mockCampaigns);
    });
  });
});
