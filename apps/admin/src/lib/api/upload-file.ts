import { appClient } from "./app-client";
import { withApiFeedback } from "./utils";

export async function uploadPublicFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("visibility", "public");

  const res = await withApiFeedback(appClient.api.upload.$post)({
    body: formData,
  });
  const data = await res.json();

  return data.url;
}
