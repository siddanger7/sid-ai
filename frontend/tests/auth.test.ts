import { describe, it, expect, vi, beforeEach } from "vitest";
import { googleLogin, fetchMe } from "@/services/auth";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

function okResponse(data: unknown) {
  return { ok: true, json: () => Promise.resolve(data) } as Response;
}

function errResponse(status: number, detail: string) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ detail }),
  } as Response;
}

describe("googleLogin", () => {
  it("returns AuthResponse on success", async () => {
    const data = {
      access_token: "jwt",
      token_type: "bearer",
      user: { id: "1", email: "a@gmail.com", username: "a", created_at: "now" },
    };
    mockFetch.mockResolvedValue(okResponse(data));

    const result = await googleLogin("google-id-token");
    expect(result.access_token).toBe("jwt");
    expect(result.user.email).toBe("a@gmail.com");
  });

  it("throws on failure", async () => {
    mockFetch.mockResolvedValue(errResponse(401, "Invalid Google token"));
    await expect(googleLogin("bad-token")).rejects.toThrow("Invalid Google token");
  });
});

describe("fetchMe", () => {
  it("returns user when token is valid", async () => {
    const user = { id: "1", email: "a@gmail.com", username: "a", created_at: "now" };
    mockFetch.mockResolvedValue(okResponse(user));

    const result = await fetchMe("valid-jwt");
    expect(result.email).toBe("a@gmail.com");
  });

  it("throws when token is invalid", async () => {
    mockFetch.mockResolvedValue(errResponse(401, "Invalid token"));
    await expect(fetchMe("bad-jwt")).rejects.toThrow("Session expired");
  });
});
