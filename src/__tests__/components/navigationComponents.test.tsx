import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import AnimatedSidebar from "@/components/layout/AnimatedSidebar";
import DashboardLayout from "@/components/layout/DashboardLayout";
import * as layoutExports from "@/components/layout";

let mockPathname = "/";
const mockRouterReplace = jest.fn();

jest.mock("@/app/i18n/routing", () => ({
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: jest.fn(),
    replace: mockRouterReplace,
  }),
}));

let mockLocale = "en";
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => mockLocale,
}));

let mockSession: any = {
  data: {
    user: { name: "Dr. Jane Doe", email: "jane@publish-ai.com", role: "user" },
  },
  status: "authenticated",
};

jest.mock("next-auth/react", () => ({
  useSession: () => mockSession,
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ priority, ...props }: any) => <img {...props} alt={props.alt || "mocked image"} />,
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, layoutId, ...props }: any) => <div {...props}>{children}</div>,
    nav: ({ children, layoutId, ...props }: any) => <nav {...props}>{children}</nav>,
    aside: ({ children, layoutId, ...props }: any) => <aside {...props}>{children}</aside>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe("Navigation Components Audit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/";
    mockLocale = "en";
    mockSession = {
      data: {
        user: { name: "Dr. Jane Doe", email: "jane@publish-ai.com", role: "user" },
      },
      status: "authenticated",
    };
  });

  describe("Barrel Exports", () => {
    it("exports all layout components from @/components/layout", () => {
      expect(layoutExports.DashboardLayout).toBeDefined();
      expect(layoutExports.Header).toBeDefined();
      expect(layoutExports.Sidebar).toBeDefined();
      expect(layoutExports.AnimatedSidebar).toBeDefined();
      expect(layoutExports.Footer).toBeDefined();
      expect(layoutExports.DynamicBackground).toBeDefined();
    });
  });

  describe("Header Component", () => {
    it("renders mobile burger menu with proper touch target and triggers onOpenMobileMenu", () => {
      const handleOpen = jest.fn();
      render(
        <Header
          showSidebar={true}
          isMobileMenuOpen={false}
          onOpenMobileMenu={handleOpen}
        />
      );

      const burgerButton = screen.getByRole("button", { name: "openMenu" });
      expect(burgerButton).toBeInTheDocument();
      expect(burgerButton).toHaveAttribute("aria-expanded", "false");
      expect(burgerButton).toHaveAttribute("aria-controls", "mobile-sidebar");

      // Verify touch target >= 44x44px class
      expect(burgerButton.className).toContain("min-w-[44px]");
      expect(burgerButton.className).toContain("min-h-[44px]");

      fireEvent.click(burgerButton);
      expect(handleOpen).toHaveBeenCalledTimes(1);
    });

    it("renders public navigation links with active state styling based on current route", () => {
      mockPathname = "/papers";
      render(<Header showSidebar={false} />);

      const papersLink = screen.getByRole("link", { name: /myPapers/i });
      expect(papersLink).toBeInTheDocument();
      expect(papersLink).toHaveAttribute("aria-current", "page");
      expect(papersLink.className).toContain("bg-sky-50");
      expect(papersLink.className).toContain("text-sky-700");

      const homeLink = screen.getByRole("link", { name: /^home$/i });
      expect(homeLink).not.toHaveAttribute("aria-current");
    });

    it("toggles language between en and he when language button is clicked", () => {
      mockLocale = "en";
      render(<Header showSidebar={false} />);

      const langButtons = screen.getAllByRole("button", { name: /switchLanguage/i });
      fireEvent.click(langButtons[0]);
      expect(mockRouterReplace).toHaveBeenCalledWith("/", { locale: "he" });
    });
  });

  describe("Sidebar Component", () => {
    it("renders navigation items and applies active state styling to current route", () => {
      mockPathname = "/papers";
      render(<Sidebar />);

      const papersLink = screen.getByRole("link", { name: /myPapers/i });
      expect(papersLink).toHaveAttribute("aria-current", "page");
      expect(papersLink.className).toContain("text-sky-800");

      const homeLink = screen.getByRole("link", { name: /^home$/i });
      expect(homeLink).not.toHaveAttribute("aria-current");
    });

    it("matches subpaths as active for parent routes", () => {
      mockPathname = "/papers/42";
      render(<AnimatedSidebar />);

      const papersLink = screen.getByRole("link", { name: /myPapers/i });
      expect(papersLink).toHaveAttribute("aria-current", "page");
    });

    it("renders accessible close button with min 44x44px touch target on mobile drawer", () => {
      const handleClose = jest.fn();
      render(<Sidebar onClose={handleClose} />);

      const closeButton = screen.getByRole("button", { name: "closeMenu" });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.className).toContain("min-w-[44px]");
      expect(closeButton.className).toContain("min-h-[44px]");

      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("shows admin items when user is admin or isAdmin prop is true", () => {
      render(<Sidebar isAdmin={true} />);
      expect(screen.getByRole("link", { name: /admin/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /learning/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /architecture/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /flowchart/i })).toBeInTheDocument();
    });
  });

  describe("DashboardLayout Integration", () => {
    it("renders layout with Header, Main with max-w-full, and Footer", () => {
      render(
        <DashboardLayout>
          <div data-testid="page-content">Child Content</div>
        </DashboardLayout>
      );

      expect(screen.getByTestId("page-content")).toBeInTheDocument();
      const main = screen.getByRole("main");
      expect(main).toBeInTheDocument();
      expect(main.className).toContain("max-w-full");
      expect(main.className).not.toContain("max-w-[100vw]");
    });

    it("applies invisible md:visible to closed mobile drawer to prevent layout clipping", () => {
      const { container } = render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const drawer = container.querySelector("#mobile-sidebar");
      expect(drawer).toBeInTheDocument();
      expect(drawer?.className).toContain("invisible");
      expect(drawer?.className).toContain("md:visible");
    });

    it("opens mobile drawer when burger menu is clicked", () => {
      const { container } = render(
        <DashboardLayout>
          <div>Content</div>
        </DashboardLayout>
      );

      const burgerButton = screen.getByRole("button", { name: "openMenu" });
      fireEvent.click(burgerButton);

      const drawer = container.querySelector("#mobile-sidebar");
      expect(drawer?.className).toContain("translate-x-0");
      expect(drawer?.className).toContain("visible");
    });
  });
});
