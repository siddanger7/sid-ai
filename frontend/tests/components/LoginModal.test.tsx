import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/context/AuthContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    googleLogin: vi.fn(),
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    logout: vi.fn(),
  });
});

describe("LoginModal", () => {
  it("renders welcome text when open", () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText("Welcome to SID.AI")).toBeDefined();
    expect(screen.getByText("Sign in to start chatting")).toBeDefined();
  });

  it("does not render when closed", () => {
    render(<LoginModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Welcome to SID.AI")).toBeNull();
  });
});
