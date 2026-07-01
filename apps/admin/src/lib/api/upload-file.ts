import { appClient } from "./app-client";
import { withApiFeedback } from "./utils";

export async function uploadPublicFile(file: File): Promise<string> {
  const res = await withApiFeedback(appClient.api.upload.$post)({
    form: { file, visibility: "public" },
  });
  const data = await res.json();

  return data.url;
}
