import type * as React from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGetIdentity, useLogout, useMenu } from '@refinedev/core';
import { Cross, Ellipsis, ExternalLink, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Minimal shape of a Refine menu node (a resource with optional nested children
// when a child resource declares `meta.parent`).
type MenuNode = {
  key: string;
  name: string;
  label?: string;
  icon?: React.ReactNode;
  route?: string;
  children?: MenuNode[];
};

function isRouteActive(pathname: string, route?: string): boolean {
  if (!route || route === '/') return pathname === route;
  return pathname === route || pathname.startsWith(`${route}/`);
}

type AdminIdentity = { name?: string; avatar?: string; email?: string };

/** Where "Open student site" points; override per environment with VITE_STUDENT_SITE_URL. */
const STUDENT_SITE_URL = import.meta.env.VITE_STUDENT_SITE_URL || 'http://localhost:3001';

function getInitials(name: string | undefined): string {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="MedPi Admin">
      <span className="flex size-8 items-center justify-center rounded-lg bg-ink-1 text-white">
        <Cross className="size-4" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight text-ink-1">MedPi Admin</span>
        <span className="block text-[11px] text-ink-3">Content studio</span>
      </span>
    </Link>
  );
}

/**
 * Sidebar groups (Brilliant: 04 Admin). Child resources (event types, news
 * categories) are flattened so every destination is one click away; resources
 * not listed fall into "More".
 */
const NAV_SECTIONS: Array<{ label: string | null; names: string[] }> = [
  { label: null, names: ['dashboard'] },
  { label: 'Content', names: ['subjects', 'resources', 'learning-resources', 'news', 'announcements'] },
  { label: 'Schedule', names: ['calendar', 'event-types'] },
  { label: 'People & system', names: ['profiles', 'team-members', 'audit-logs'] },
];
/** Reachable from their parent page instead of the sidebar. */
const HIDDEN = new Set(['news-categories']);

function flatten(items: MenuNode[]): MenuNode[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { menuItems } = useMenu();
  const items = flatten(menuItems as MenuNode[]).filter((item) => !HIDDEN.has(item.name));
  const listed = new Set(NAV_SECTIONS.flatMap((section) => section.names));
  const sections = [
    ...NAV_SECTIONS.map((section) => ({
      label: section.label,
      items: section.names
        .map((name) => items.find((item) => item.name === name))
        .filter((item): item is MenuNode => Boolean(item)),
    })),
    { label: 'More', items: items.filter((item) => !listed.has(item.name)) },
  ].filter((section) => section.items.length > 0);

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2" aria-label="Primary">
      {sections.map((section) => (
        <div key={section.label ?? 'top'}>
          {section.label ? (
            <p className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">{section.label}</p>
          ) : null}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const route = item.route ?? '/';
              const active = isRouteActive(pathname, route);
              return (
                <Link
                  key={item.key}
                  to={route}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors [&_svg]:size-4',
                    active
                      ? 'bg-brand-subtle font-semibold text-brand-hover [&_svg]:text-brand'
                      : 'font-medium text-ink-2 hover:bg-slate-100 hover:text-ink-1 [&_svg]:text-ink-3',
                  )}
                >
                  {item.icon}
                  <span>{item.label ?? item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UserBlock({ identity, onLogout }: { identity?: AdminIdentity; onLogout: () => void }) {
  return (
    <div className="border-t border-slate-200/70 p-3">
      <div className="flex items-center gap-2.5 rounded-xl p-1">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-hover">
          {getInitials(identity?.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink-1">{identity?.name ?? 'Admin'}</span>
          {identity?.email ? <span className="block truncate text-[11px] text-ink-3">{identity.email}</span> : null}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-slate-100 hover:text-ink-1"
          >
            <Ellipsis className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
            <DropdownMenuItem asChild>
              <a href={STUDENT_SITE_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                Open student site
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger" onSelect={onLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const { mutate: logout } = useLogout();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => logout();

  return (
    <div className="relative min-h-screen">
      {/* Desktop sidebar — no top bar on desktop; page headers carry the actions. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-slate-200/70 bg-white lg:flex">
        <div className="flex h-16 items-center px-4">
          <Brand />
        </div>
        <NavList pathname={pathname} />
        <UserBlock identity={identity} onLogout={handleLogout} />
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-56">
        {/* Mobile/tablet top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex size-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
          >
            <Menu className="size-5" />
          </button>
          <Brand />
        </header>

        <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-8 lg:py-8">{children}</main>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetTitle>Navigation</SheetTitle>
          <div className="flex h-16 items-center px-4">
            <Brand />
          </div>
          <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          <UserBlock identity={identity} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
