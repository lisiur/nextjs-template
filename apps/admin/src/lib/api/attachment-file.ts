import { appClient } from "./app-client";
import { withApiFeedback } from "./utils";

export async function uploadPublicFile(
  file: File,
  bizType: string,
  bizId: string,
): Promise<string> {
  const res = await withApiFeedback(appClient.api.attachment.$post)({
    form: { file, visibility: "public", bizType, bizId },
  });
  const data = await res.json();

  return data.url;
}
