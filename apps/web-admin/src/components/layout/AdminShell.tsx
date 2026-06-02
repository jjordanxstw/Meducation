import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGetIdentity, useLogout, useMenu } from '@refinedev/core';
import { ChevronRight, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
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

const navRowClass = (active: boolean) =>
  cn(
    'flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors [&_svg]:size-[18px]',
    active
      ? 'bg-brand-subtle font-semibold text-brand [&_svg]:text-brand'
      : 'font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 [&_svg]:text-slate-400',
  );

type AdminIdentity = { name?: string; avatar?: string; email?: string };

function getInitials(name: string | undefined): string {
  if (!name) return 'A';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5" aria-label="MedPi Admin">
      <span className="font-serif text-base font-semibold tracking-tight text-slate-900">
        MedPi <span className="text-brand">Admin</span>
      </span>
    </Link>
  );
}

/** A single navigable row (used for top-level leaves and nested children). */
function NavLeaf({
  item,
  pathname,
  onNavigate,
  nested = false,
}: {
  item: MenuNode;
  pathname: string;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const route = item.route ?? '/';
  const active = isRouteActive(pathname, route);
  return (
    <Link
      to={route}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(navRowClass(active), nested && 'py-2 text-[13px]')}
    >
      {item.icon}
      <span>{item.label ?? item.name}</span>
    </Link>
  );
}

/** A parent row that is itself a link, with a chevron that expands its children. */
function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: MenuNode;
  pathname: string;
  onNavigate?: () => void;
}) {
  const route = item.route ?? '/';
  const children = item.children ?? [];
  const selfActive = isRouteActive(pathname, route);
  const childActive = children.some((c) => isRouteActive(pathname, c.route));
  // Auto-open when this branch is active; `null` defers to that until the user
  // toggles manually (then their choice sticks).
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? (selfActive || childActive);

  return (
    <div>
      <div className="flex items-center gap-1">
        <NavLeaf item={item} pathname={pathname} onNavigate={onNavigate} />
        <button
          type="button"
          onClick={() => setManualOpen(!open)}
          aria-label={open ? `Collapse ${item.label ?? item.name}` : `Expand ${item.label ?? item.name}`}
          aria-expanded={open}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <ChevronRight className={cn('size-4 transition-transform duration-200', open && 'rotate-90')} />
        </button>
      </div>
      {open && (
        <div className="mt-1 space-y-1 border-l border-slate-200/70 pl-3 ml-4">
          {children.map((child) => (
            <NavLeaf key={child.key} item={child} pathname={pathname} onNavigate={onNavigate} nested />
          ))}
        </div>
      )}
    </div>
  );
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { menuItems } = useMenu();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary">
      {(menuItems as MenuNode[]).map((item) =>
        item.children && item.children.length > 0 ? (
          <NavGroup key={item.key} item={item} pathname={pathname} onNavigate={onNavigate} />
        ) : (
          <NavLeaf key={item.key} item={item} pathname={pathname} onNavigate={onNavigate} />
        ),
      )}
    </nav>
  );
}

function UserBlock({ identity, onLogout }: { identity?: AdminIdentity; onLogout: () => void }) {
  return (
    <div className="border-t border-slate-200/70 p-3">
      <div className="flex items-center gap-3 rounded-xl p-1.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
          {getInitials(identity?.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900">
            {identity?.name ?? 'Admin'}
          </span>
          {identity?.email ? (
            <span className="block truncate text-xs text-slate-400">{identity.email}</span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <LogOut className="size-4" />
        </button>
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
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200/70 bg-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        <NavList pathname={pathname} />
        <UserBlock identity={identity} onLogout={handleLogout} />
      </aside>

      {/* Content column */}
      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex size-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="flex-1" />
          {identity?.name ? (
            <span className="text-sm font-medium text-slate-600">{identity.name}</span>
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>

      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="p-0">
          <SheetTitle>Navigation</SheetTitle>
          <div className="flex h-16 items-center px-5">
            <Brand />
          </div>
          <NavList pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
          <UserBlock identity={identity} onLogout={handleLogout} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
