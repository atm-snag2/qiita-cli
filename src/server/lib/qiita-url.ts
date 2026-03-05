import process from "node:process";
import { URL } from "node:url";

import { config } from "../../lib/config";

const getDomainName = async () => {
  const credential = await config.getCredential().catch(() => ({
    domain: undefined,
  }));
  if (credential.domain) {
    return credential.domain;
  }

  if (process.env.QIITA_DOMAIN) {
    return process.env.QIITA_DOMAIN;
  }

  return "qiita.com";
};

const getBaseUrl = async () => {
  const domainName = await getDomainName();
  return `https://${domainName}/`;
};

export const itemUrl = async ({
  id,
  userId,
  secret = false,
}: {
  id: string;
  userId: string;
  secret?: boolean;
}) => {
  const baseUrl = await getBaseUrl();
  const subdir = secret ? "private" : "items";
  const path = `/${userId}/${subdir}/${id}`;

  return new URL(path, baseUrl).toString();
};
