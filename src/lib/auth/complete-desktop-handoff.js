import * as authApi from "@/lib/api/auth-api";
import {
  clearDesktopAuthParams,
  desktopReturnPath,
  readDesktopAuthParams,
} from "@/lib/auth/desktop-flow";

/**
 * If desktop PKCE params are pending, issue a code and return the return-page path.
 * Otherwise return null so the caller can continue the normal SPA auth destination.
 * @returns {Promise<string | null>}
 */
export async function completeDesktopHandoffIfNeeded() {
  const params = readDesktopAuthParams();
  if (!params) return null;

  const data = await authApi.issueDesktopAuthCode({
    code_challenge: params.code_challenge,
    state: params.state || null,
    redirect_uri: params.redirect_uri,
  });

  clearDesktopAuthParams();

  return desktopReturnPath({
    code: data.code,
    state: data.state,
    redirect_uri: data.redirect_uri,
  });
}
