import { Page } from "../types";

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--primary)] text-[var(--primary-foreground)]">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-[var(--accent)] rounded-sm flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l4-8 4 3 3-6 4 11" />
              <path d="M3 21h18" />
            </svg>
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">Horizon Reizen</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate("home")}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              currentPage === "home"
                ? "bg-white/10 text-white"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate("student")}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              currentPage === "student"
                ? "bg-white/10 text-white"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            Studentenportaal
          </button>
          <button
            onClick={() => onNavigate("admin")}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              currentPage === "admin"
                ? "bg-[var(--accent)] text-white"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </nav>
  );
}
