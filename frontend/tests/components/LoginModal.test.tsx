import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/context/AuthContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockLogin = vi.fn();
const mockSignup = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    login: mockLogin,
    signup: mockSignup,
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    logout: vi.fn(),
  });
});

function clickSubmit() {
  const buttons = screen.getAllByText("Sign In");
  const submit = buttons.find(
    (b) => b.getAttribute("type") === "submit"
  )!;
  fireEvent.click(submit);
}

describe("LoginModal", () => {
  it("renders login form when open", () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeDefined();
    expect(screen.getByPlaceholderText("At least 6 characters")).toBeDefined();
    expect(screen.getAllByText("Sign In").length).toBe(2);
  });

  it("does not render when closed", () => {
    render(<LoginModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText("Sign In")).toBeNull();
  });

  it("switches to signup tab", () => {
    render(<LoginModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText("Sign Up"));
    expect(screen.getByPlaceholderText("Your name")).toBeDefined();
    expect(screen.getByText("Create Account")).toBeDefined();
  });

  it("calls login and onClose on successful submit", async () => {
    mockLogin.mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<LoginModal isOpen={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "pass123" },
    });
    clickSubmit();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("a@b.com", "pass123");
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows error message on failed login", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));
    const onClose = vi.fn();

    render(<LoginModal isOpen={true} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "wrong" },
    });
    clickSubmit();

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeDefined();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls signup on signup tab submit", async () => {
    mockSignup.mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<LoginModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByText("Sign Up"));

    fireEvent.change(screen.getByPlaceholderText("Your name"), {
      target: { value: "newuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "new@b.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 6 characters"), {
      target: { value: "pass123" },
    });
    fireEvent.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith("new@b.com", "pass123", "newuser");
      expect(onClose).toHaveBeenCalled();
    });
  });
});
