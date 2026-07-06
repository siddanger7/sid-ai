import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMessage, sendMessageStream, uploadFile } from "@/services/api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const TOKEN_KEY = "sidai-token";

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

function okResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response;
}

function errResponse(status: number, body = "error") {
  return {
    ok: false,
    status,
    text: () => Promise.resolve(body),
    json: () => Promise.resolve({}),
  } as Response;
}

function streamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      for (const c of chunks) {
        controller.enqueue(encoder.encode(c));
      }
      controller.close();
    },
  });
  return {
    ok: true,
    status: 200,
    body,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  } as unknown as Response;
}

describe("sendMessage", () => {
  it("sends POST with auth header and returns response", async () => {
    localStorage.setItem(TOKEN_KEY, "test-jwt");
    mockFetch.mockResolvedValue(okResponse({ response: "Hello!" }));

    const result = await sendMessage("hi", [{ role: "user", content: "hello" }]);
    expect(result.message.role).toBe("assistant");
    expect(result.message.content).toBe("Hello!");

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toContain("/chat");
    expect(call[1].headers.Authorization).toBe("Bearer test-jwt");
  });

  it("throws on 401 and clears token", async () => {
    localStorage.setItem(TOKEN_KEY, "expired-jwt");
    mockFetch.mockResolvedValue(errResponse(401));

    await expect(sendMessage("hi")).rejects.toThrow("Session expired");
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("throws on server error", async () => {
    mockFetch.mockResolvedValue(errResponse(500, "Internal error"));
    await expect(sendMessage("hi")).rejects.toThrow("Internal error");
  });
});

describe("sendMessageStream", () => {
  it("calls onToken for each SSE data frame", async () => {
    const chunks = [
      'data: {"token":"Hel"}\n',
      'data: {"token":"lo"}\n',
      "data: [DONE]\n",
    ];
    mockFetch.mockResolvedValue(streamResponse(chunks));

    const tokens: string[] = [];
    const onToken = (t: string) => tokens.push(t);
    const onDone = vi.fn();
    const onError = vi.fn();

    await sendMessageStream(
      [{ role: "user", content: "hi" }],
      onToken,
      onDone,
      onError
    );

    expect(tokens).toEqual(["Hel", "lo"]);
    expect(onDone).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("calls onError on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network down"));

    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await sendMessageStream(
      [{ role: "user", content: "hi" }],
      onToken,
      onDone,
      onError
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe("uploadFile", () => {
  it("sends FormData and returns UploadResponse", async () => {
    localStorage.setItem(TOKEN_KEY, "test-jwt");
    const data = {
      id: "f1",
      file_name: "test.pdf",
      file_size: 100,
      content_type: "application/pdf",
      chunks_indexed: 5,
    };
    mockFetch.mockResolvedValue(okResponse(data));

    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    const result = await uploadFile(file);
    expect(result.file_name).toBe("test.pdf");
    expect(result.chunks_indexed).toBe(5);

    const call = mockFetch.mock.calls[0];
    expect(call[0]).toContain("/upload");
    expect(call[1].method).toBe("POST");
    expect(call[1].body).toBeInstanceOf(FormData);
  });

  it("throws on 401", async () => {
    localStorage.setItem(TOKEN_KEY, "expired");
    mockFetch.mockResolvedValue(errResponse(401));

    const file = new File(["x"], "test.txt", { type: "text/plain" });
    await expect(uploadFile(file)).rejects.toThrow("Session expired");
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("throws with server detail on failure", async () => {
    localStorage.setItem(TOKEN_KEY, "valid");
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: "File too large" }),
    } as Response);

    const file = new File(["x"], "test.txt", { type: "text/plain" });
    await expect(uploadFile(file)).rejects.toThrow("File too large");
  });
});
