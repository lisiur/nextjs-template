import { createHmac } from "node:crypto";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  createReadStream: vi.fn(() => Readable.from([Buffer.from("file")])),
}));

vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn(),
  stat: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("#lib/db", () => ({
  prisma: {
    upload: { findUnique: vi.fn() },
    systemConfig: { findUnique: vi.fn() },
  },
}));

import { prisma } from "#lib/db";
import { getFileAccess } from "./upload.service";

const mockPrisma = prisma as unknown as {
  upload: { findUnique: ReturnType<typeof vi.fn> };
  systemConfig: { findUnique: ReturnType<typeof vi.fn> };
};

const publicUpload = {
  id: "upload1",
  path: "public/a/b/file.png",
  mimeType: "image/png",
  size: 4,
  visibility: "public",
  uploaderId: "user1",
  createdAt: new Date(),
};

const privateUpload = {
  ...publicUpload,
  visibility: "private",
};

describe("upload hotlink protection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.UPLOAD_SIGN_SECRET = "test-secret";
  });

  it("serves public file when no hotlink config exists", async () => {
    mockPrisma.upload.findUnique.mockResolvedValue(publicUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue(null);

    const result = await getFileAccess({
      id: "upload1",
      headers: new Headers({ referer: "https://evil.test/page" }),
    });

    expect(result.visibility).toBe("public");
  });

  it("serves public file when hotlink is disabled", async () => {
    mockPrisma.upload.findUnique.mockResolvedValue(publicUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      value: JSON.stringify({
        enabled: false,
        allowedDomains: [],
        allowEmptyReferer: true,
      }),
    });

    const result = await getFileAccess({
      id: "upload1",
      headers: new Headers({ referer: "https://evil.test/page" }),
    });

    expect(result.visibility).toBe("public");
  });

  it("serves public file from an allowed referer", async () => {
    mockPrisma.upload.findUnique.mockResolvedValue(publicUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      value: JSON.stringify({
        enabled: true,
        allowedDomains: ["example.com"],
        allowEmptyReferer: true,
      }),
    });

    const result = await getFileAccess({
      id: "upload1",
      headers: new Headers({ referer: "https://example.com/page" }),
    });

    expect(result.visibility).toBe("public");
  });

  it("rejects public file from a disallowed referer", async () => {
    mockPrisma.upload.findUnique.mockResolvedValue(publicUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      value: JSON.stringify({
        enabled: true,
        allowedDomains: ["example.com"],
        allowEmptyReferer: true,
      }),
    });

    await expect(
      getFileAccess({
        id: "upload1",
        headers: new Headers({ referer: "https://evil.test/page" }),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejects public file from disallowed origin header", async () => {
    mockPrisma.upload.findUnique.mockResolvedValue(publicUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      value: JSON.stringify({
        enabled: true,
        allowedDomains: ["example.com"],
        allowEmptyReferer: true,
      }),
    });

    await expect(
      getFileAccess({
        id: "upload1",
        headers: new Headers({ origin: "https://evil.test" }),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("serves public file when referer is missing and empty referer is allowed", async () => {
    mockPrisma.upload.findUnique.mockResolvedValue(publicUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      value: JSON.stringify({
        enabled: true,
        allowedDomains: ["example.com"],
        allowEmptyReferer: true,
      }),
    });

    const result = await getFileAccess({
      id: "upload1",
      headers: new Headers(),
    });

    expect(result.visibility).toBe("public");
  });

  it("rejects public file when referer is missing and empty referer is disallowed", async () => {
    mockPrisma.upload.findUnique.mockResolvedValue(publicUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      value: JSON.stringify({
        enabled: true,
        allowedDomains: ["example.com"],
        allowEmptyReferer: false,
      }),
    });

    await expect(
      getFileAccess({
        id: "upload1",
        headers: new Headers(),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("fails open when hotlink config json is invalid", async () => {
    mockPrisma.upload.findUnique.mockResolvedValue(publicUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      value: "{not valid json",
    });

    const result = await getFileAccess({
      id: "upload1",
      headers: new Headers({ referer: "https://evil.test/page" }),
    });

    expect(result.visibility).toBe("public");
  });

  it("rejects private signed URL from disallowed referer", async () => {
    const expires = String(Date.now() + 60_000);
    const token = createHmac("sha256", "test-secret")
      .update(`upload1:${expires}`)
      .digest("hex");
    mockPrisma.upload.findUnique.mockResolvedValue(privateUpload);
    mockPrisma.systemConfig.findUnique.mockResolvedValue({
      value: JSON.stringify({
        enabled: true,
        allowedDomains: ["example.com"],
        allowEmptyReferer: true,
      }),
    });

    await expect(
      getFileAccess({
        id: "upload1",
        token,
        expires,
        headers: new Headers({ referer: "https://evil.test/page" }),
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
