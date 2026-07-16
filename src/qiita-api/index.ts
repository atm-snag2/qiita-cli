import { URL, URLSearchParams } from "node:url";
import {
  QiitaBadRequestError,
  QiitaFetchError,
  QiitaForbiddenError,
  QiitaInternalServerError,
  QiitaNotFoundError,
  QiitaRateLimitError,
  QiitaUnauthorizedError,
  QiitaUnknownError,
  QiitaUnprocessableEntityError,
} from "./errors";
import { qiitaApiDebugger } from "./lib/debugger";

export * from "./errors";

export interface Reaction {
  name: string;
  image_url: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Comment {
  id: string;
  body: string;
  rendered_body: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
  };
}

export interface PostingCampaign {
  uuid: string;
  title: string;
  banner_url: string;
  link_url: string;
  term_url: string | null;
  start_at: string;
  end_at: string;
  is_after_end: boolean;
}

export interface Item {
  body: string;
  id: string;
  url: string;
  private: boolean;
  tags: {
    name: string;
  }[];
  title: string;
  organization_url_name: string | null;
  coediting: boolean;
  group_url_name: string | null;
  created_at: string;
  updated_at: string;
  slide: boolean;
  posting_campaign_uuid: string | null;
}

export class QiitaApi {
  private readonly token: string;
  private readonly userAgent: string;
  private readonly domain?: string;

  static agentName = "QiitaApi";
  static version = "0.0.1";

  constructor({
    token,
    userAgent,
    domain,
  }: {
    token: string;
    userAgent?: string;
    domain?: string;
  }) {
    this.token = token;
    this.userAgent = userAgent ? userAgent : QiitaApi.defaultUserAgent();
    this.domain = domain;
  }

  static defaultUserAgent() {
    return `${QiitaApi.agentName}/${QiitaApi.version}`;
  }

  private getUrlScheme() {
    return "https";
  }

  public getDomainName() {
    if (this.domain) {
      return this.domain;
    }
    return process.env.QIITA_DOMAIN ? process.env.QIITA_DOMAIN : "qiita.com";
  }

  private getBaseUrl() {
    const hostname = this.getDomainName();
    return `${this.getUrlScheme()}://${hostname}/`;
  }

  private getPreviewUrl() {
    return `${this.getUrlScheme()}://${this.getDomainName()}`;
  }

  private async request<T = unknown>(url: string, options: RequestInit) {
    let response;

    try {
      qiitaApiDebugger(`request to`, url, JSON.stringify(options));

      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          "User-Agent": this.userAgent,
        },
        ...options,
      });
    } catch (err) {
      console.error(err);
      throw new QiitaFetchError((err as Error).message);
    }

    if (response.ok) {
      const body = await response.text();

      try {
        return JSON.parse(body) as T;
      } catch {
        return body as T;
      }
    }

    const responseBody = await response.text();
    if (qiitaApiDebugger.enabled) {
      qiitaApiDebugger(
        "request failed",
        JSON.stringify({
          status: response.status,
          responseBody,
        }),
      );
    }

    const errorMessage = responseBody.slice(0, 100);
    switch (response.status) {
      case 400:
        throw new QiitaBadRequestError(errorMessage);
      case 401:
        throw new QiitaUnauthorizedError(errorMessage);
      case 403:
        throw new QiitaForbiddenError(errorMessage);
      case 404:
        throw new QiitaNotFoundError(errorMessage);
      case 422:
        throw new QiitaUnprocessableEntityError(errorMessage);
      case 429:
        throw new QiitaRateLimitError(errorMessage);
      case 500:
        throw new QiitaInternalServerError(errorMessage);
      default:
        throw new QiitaUnknownError(errorMessage);
    }
  }

  private generateApiUrl(path: string) {
    const baseUrl =
      path === "/api/preview" ? this.getPreviewUrl() : this.getBaseUrl();
    return new URL(path, baseUrl).toString();
  }

  private async get<T = unknown>(path: string, options?: RequestInit) {
    const url = this.generateApiUrl(path);
    return await this.request<T>(url, {
      ...options,
      method: "GET",
    });
  }

  private async post<T = unknown>(path: string, options?: RequestInit) {
    const url = this.generateApiUrl(path);
    return await this.request<T>(url, {
      ...options,
      method: "POST",
    });
  }

  private async patch<T = unknown>(path: string, options?: RequestInit) {
    const url = this.generateApiUrl(path);
    return await this.request<T>(url, {
      ...options,
      method: "PATCH",
    });
  }

  private async delete<T = unknown>(path: string, options?: RequestInit) {
    const url = this.generateApiUrl(path);
    return await this.request<T>(url, {
      ...options,
      method: "DELETE",
    });
  }

  async rawRequest(method: string, path: string, body?: string) {
    const upperMethod = method.toUpperCase();
    const options: RequestInit = { method: upperMethod };
    if (body && upperMethod !== "GET" && upperMethod !== "HEAD") {
      options.body = body;
    }
    const url = this.generateApiUrl(path);
    return await this.request(url, options);
  }

  async authenticatedUser() {
    return await this.get<{ id: string }>("/api/v2/authenticated_user");
  }

  async authenticatedUserItems(page?: number, per?: number) {
    const params = new URLSearchParams();
    if (page !== undefined) {
      params.set("page", page.toString());
    }
    if (per !== undefined) {
      params.set("per_page", per.toString());
    }

    const path = `/api/v2/authenticated_user/items?${params}`;

    return await this.get<Item[]>(path);
  }

  async preview(rawBody: string) {
    const body = JSON.stringify({
      parser_type: "qiita_cli",
      raw_body: rawBody,
    });

    return await this.post<string>("/api/preview", {
      body,
    });
  }

  async items(page?: number, per?: number, query?: string) {
    const params = new URLSearchParams();
    if (page !== undefined) {
      params.set("page", page.toString());
    }
    if (per !== undefined) {
      params.set("per_page", per.toString());
    }
    if (query !== undefined) {
      params.set("query", query);
    }

    const path = `/api/v2/items?${params}`;

    return await this.get<Item[]>(path);
  }

  async postItem({
    rawBody,
    tags,
    title,
    isPrivate,
    organizationUrlName,
    slide,
    coediting,
    groupUrlName,
    postingCampaignUuid,
    agreedPostingCampaignTerm,
  }: {
    rawBody: string;
    tags: string[];
    title: string;
    isPrivate: boolean;
    organizationUrlName: string | null;
    slide: boolean;
    coediting?: boolean;
    groupUrlName?: string | null;
    postingCampaignUuid?: string | null;
    agreedPostingCampaignTerm?: boolean;
  }) {
    const payload: Record<string, unknown> = {
      body: rawBody,
      title,
      tags: tags.map((name) => {
        return {
          name,
          versions: [],
        };
      }),
      private: isPrivate,
      organization_url_name: organizationUrlName,
      slide,
    };
    if (coediting !== undefined) {
      payload.coediting = coediting;
    }
    if (groupUrlName !== undefined) {
      payload.group_url_name = groupUrlName;
    }
    if (postingCampaignUuid !== undefined) {
      payload.posting_campaign_uuid = postingCampaignUuid;
    }
    if (agreedPostingCampaignTerm !== undefined) {
      payload.agreed_posting_campaign_term = agreedPostingCampaignTerm;
    }
    const data = JSON.stringify(payload);

    const path = `/api/v2/items`;

    return await this.post<Item>(path, {
      body: data,
    });
  }

  async patchItem({
    uuid,
    rawBody,
    title,
    tags,
    isPrivate,
    organizationUrlName,
    slide,
    coediting,
    groupUrlName,
    postingCampaignUuid,
    agreedPostingCampaignTerm,
    commitMessage,
  }: {
    uuid: string;
    rawBody: string;
    title: string;
    tags: string[];
    isPrivate: boolean;
    organizationUrlName?: string | null;
    slide?: boolean;
    coediting?: boolean;
    groupUrlName?: string | null;
    postingCampaignUuid?: string | null;
    agreedPostingCampaignTerm?: boolean;
    commitMessage?: string;
  }) {
    const payload: Record<string, unknown> = {
      body: rawBody,
      title,
      tags: tags.map((name) => {
        return {
          name,
          versions: [],
        };
      }),
      private: isPrivate,
    };
    if (organizationUrlName !== undefined) {
      payload.organization_url_name = organizationUrlName;
    }
    if (slide !== undefined) {
      payload.slide = slide;
    }
    if (coediting !== undefined) {
      payload.coediting = coediting;
    }
    if (groupUrlName !== undefined) {
      payload.group_url_name = groupUrlName;
    }
    if (commitMessage !== undefined) {
      payload.commit_message = commitMessage;
    }
    if (postingCampaignUuid !== undefined) {
      payload.posting_campaign_uuid = postingCampaignUuid;
    }
    if (agreedPostingCampaignTerm !== undefined) {
      payload.agreed_posting_campaign_term = agreedPostingCampaignTerm;
    }
    const data = JSON.stringify(payload);

    const path = `/api/v2/items/${uuid}`;

    return await this.patch<Item>(path, {
      body: data,
    });
  }

  async getPostingCampaigns(page?: number, per?: number) {
    const params = new URLSearchParams();
    if (page !== undefined) {
      params.set("page", page.toString());
    }
    if (per !== undefined) {
      params.set("per_page", per.toString());
    }

    const path = `/api/v2/posting-campaigns?${params}`;

    return await this.get<PostingCampaign[]>(path);
  }

  async getPostingCampaign(uuid: string) {
    const path = `/api/v2/posting-campaigns/${uuid}`;

    return await this.get<PostingCampaign>(path);
  }

  async getItem(id: string) {
    const path = `/api/v2/items/${id}`;
    return await this.get<Item>(path);
  }

  async getItemComments(itemId: string) {
    const path = `/api/v2/items/${itemId}/comments`;
    return await this.get<Comment[]>(path);
  }

  async getComment(commentId: string) {
    const path = `/api/v2/comments/${commentId}`;
    return await this.get<Comment>(path);
  }

  async postComment(itemId: string, body: string) {
    const path = `/api/v2/items/${itemId}/comments`;
    return await this.post<Comment>(path, {
      body: JSON.stringify({ body }),
    });
  }

  async patchComment(commentId: string, body: string) {
    const path = `/api/v2/comments/${commentId}`;
    return await this.patch<Comment>(path, {
      body: JSON.stringify({ body }),
    });
  }

  async deleteComment(commentId: string) {
    const path = `/api/v2/comments/${commentId}`;
    return await this.delete(path);
  }

  async getItemReactions(itemId: string) {
    const path = `/api/v2/items/${itemId}/reactions`;
    return await this.get<Reaction[]>(path);
  }

  async postItemReaction(itemId: string, name: string) {
    const path = `/api/v2/items/${itemId}/reactions`;
    return await this.post<Reaction>(path, {
      body: JSON.stringify({ name }),
    });
  }

  async getCommentReactions(commentId: string) {
    const path = `/api/v2/comments/${commentId}/reactions`;
    return await this.get<Reaction[]>(path);
  }

  async postCommentReaction(commentId: string, name: string) {
    const path = `/api/v2/comments/${commentId}/reactions`;
    return await this.post<Reaction>(path, {
      body: JSON.stringify({ name }),
    });
  }

  async deleteItemReaction(itemId: string, reactionName: string) {
    const path = `/api/v2/items/${itemId}/reactions/${reactionName}`;
    return await this.delete<void>(path);
  }

  async deleteCommentReaction(commentId: string, reactionName: string) {
    const path = `/api/v2/comments/${commentId}/reactions/${reactionName}`;
    return await this.delete<void>(path);
  }

  async getAssetUrls() {
    return await this.get<{ [key: string]: string }>("/api/qiita-cli/assets");
  }
}
