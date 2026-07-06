import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, signup, fetchMe } from "@/services/auth";

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

describe("login", () => {
  it("returns AuthResponse on success", async () => {
    const data = {
      access_token: "jwt",
      token_type: "bearer",
      user: { id: "1", email: "a@b.com", username: "a", created_at: "now" },
    };
    mockFetch.mockResolvedValue(okResponse(data));

    const result = await login("a@b.com", "pass123");
    expect(result.access_token).toBe("jwt");
    expect(result.user.email).toBe("a@b.com");
  });

  it("throws on failure", async () => {
    mockFetch.mockResolvedValue(errResponse(401, "Invalid credentials"));
    await expect(login("a@b.com", "wrong")).rejects.toThrow("Invalid credentials");
  });
});

describe("signup", () => {
  it("returns AuthResponse on success", async () => {
    const data = {
      access_token: "jwt",
      token_type: "bearer",
      user: { id: "2", email: "new@b.com", username: "newuser", created_at: "now" },
    };
    mockFetch.mockResolvedValue(okResponse(data));

    const result = await signup("new@b.com", "pass123", "newuser");
    expect(result.access_token).toBe("jwt");
  });

  it("throws error with detail from response body", async () => {
    mockFetch.mockResolvedValue(errResponse(400, "Email already registered"));
    await expect(signup("dup@b.com", "pass123", "dup")).rejects.toThrow(
      "Email already registered"
    );
  });
});

describe("fetchMe", () => {
  it("returns user when token is valid", async () => {
    const user = { id: "1", email: "a@b.com", username: "a", created_at: "now" };
    mockFetch.mockResolvedValue(okResponse(user));

    const result = await fetchMe("valid-jwt");
    expect(result.email).toBe("a@b.com");
  });

  it("throws when token is invalid", async () => {
    mockFetch.mockResolvedValue(errResponse(401, "Invalid token"));
    await expect(fetchMe("bad-jwt")).rejects.toThrow("Session expired");
  });
});
