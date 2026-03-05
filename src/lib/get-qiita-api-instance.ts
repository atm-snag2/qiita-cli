import { QiitaApi } from "../qiita-api";
import { config } from "./config";
import { PackageSettings } from "./package-settings";

let qiitaApi: QiitaApi;

export const getQiitaApiInstance = async (options?: {
  token?: string;
  domain?: string;
}) => {
  if (!qiitaApi) {
    const credential =
      options?.token != null ? undefined : await config.getCredential();
    qiitaApi = new QiitaApi({
      token: options?.token ?? credential!.accessToken,
      userAgent: userAgent(),
      domain: options?.domain ?? credential?.domain,
    });
  }
  return qiitaApi;
};

const userAgent = () => {
  return `${PackageSettings.userAgentName}/${PackageSettings.version}`;
};
