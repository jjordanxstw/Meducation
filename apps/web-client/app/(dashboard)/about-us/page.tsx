'use client';

/**
 * About Us Page - the team that built MedPi Portal.
 * Featured-center carousel: the active card is emphasised while neighbours peek
 * and dim. Data is admin-managed via the team-members API.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Mail, Users } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { useTeamMembers } from '@/hooks/use-team-members';
import type { TeamMember } from '@medical-portal/shared';

// Brand glyphs (GitHub / Instagram / LinkedIn). The pinned lucide-react@1.17
// has no brand icons, so these are inlined as currentColor fill paths.
function BrandIcon({ size = 16, path }: { size?: number; path: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const GITHUB_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';
const INSTAGRAM_PATH =
  'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.332.014 7.052.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z';
const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// One social link in the card footer. Rendered only when `href` resolves.
function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-brand/10 hover:text-brand"
    >
      {children}
    </a>
  );
}

function TeamMemberCard({ member, active }: { member: TeamMember; active: boolean }) {
  const links = [
    member.email ? { key: 'email', href: `mailto:${member.email}`, label: `Email ${member.full_name}`, icon: <Mail size={16} /> } : null,
    member.instagram_url ? { key: 'instagram', href: member.instagram_url, label: `${member.full_name} on Instagram`, icon: <BrandIcon path={INSTAGRAM_PATH} /> } : null,
    member.linkedin_url ? { key: 'linkedin', href: member.linkedin_url, label: `${member.full_name} on LinkedIn`, icon: <BrandIcon path={LINKEDIN_PATH} /> } : null,
    member.github_url ? { key: 'github', href: member.github_url, label: `${member.full_name} on GitHub`, icon: <BrandIcon path={GITHUB_PATH} /> } : null,
  ].filter(Boolean) as { key: string; href: string; label: string; icon: React.ReactNode }[];

  return (
    <div
      className={`shrink-0 w-[260px] rounded-2xl bg-white border p-6 text-center transition-all duration-300 ease-out ${
        active
          ? 'scale-100 opacity-100 border-brand/30 shadow-soft'
          : 'scale-90 opacity-60 border-slate-200/70 shadow-subtle'
      }`}
    >
      {/* Avatar */}
      <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-slate-100">
        {member.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-300">
            {initialsOf(member.full_name)}
          </div>
        )}
      </div>

      <p className="font-bold text-slate-900">{member.full_name}</p>
      <p className="mt-0.5 text-xs font-medium text-brand">{member.role}</p>
      {member.bio ? (
        <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-4">{member.bio}</p>
      ) : null}

      {links.length > 0 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {links.map((link) => (
            <SocialLink key={link.key} href={link.href} label={link.label}>
              {link.icon}
            </SocialLink>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="shrink-0 w-[260px] rounded-2xl border border-slate-200/70 bg-white p-6 shadow-subtle">
      <div className="mx-auto mb-4 h-24 w-24 animate-pulse rounded-full bg-slate-100" />
      <div className="mx-auto h-4 w-28 animate-pulse rounded bg-slate-100" />
      <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-slate-100" />
      <div className="mx-auto mt-4 h-3 w-full animate-pulse rounded bg-slate-100" />
      <div className="mx-auto mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

// Card geometry — the track is translated so the active card sits dead-centre.
const CARD_WIDTH = 260;
const CARD_GAP = 24; // matches gap-6
const STRIDE = CARD_WIDTH + CARD_GAP;

export default function AboutUsPage() {
  const { data: members = [], isLoading } = useTeamMembers();

  const observerRef = useRef<ResizeObserver | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const pointerStartX = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  const count = members.length;
  // Derived (never stored) so a shrinking dataset can't leave `current` out of
  // bounds — avoids clamping via setState inside an effect.
  const activeIndex = count > 0 ? Math.min(current, count - 1) : 0;

  useEffect(() => {
    currentRef.current = activeIndex;
  }, [activeIndex]);

  // Measure the viewport so we can centre the active card. A callback ref (not a
  // plain effect) is used because the viewport only mounts in the loaded,
  // non-empty branch — an effect with [] deps runs during the initial loading
  // render when the node is still null and would never re-attach afterwards,
  // leaving viewportWidth at 0 and the active card mis-centred.
  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!node) {
      observerRef.current = null;
      return;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setViewportWidth(entry.contentRect.width);
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Offset that places the centre of the active card at the viewport centre.
  const trackOffset = viewportWidth / 2 - CARD_WIDTH / 2 - activeIndex * STRIDE;

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      const wrapped = ((index % count) + count) % count;
      setCurrent(wrapped);
    },
    [count],
  );

  const goNext = useCallback(() => goTo(currentRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(currentRef.current - 1), [goTo]);

  // Auto-advance every 3s; pause on interaction. Only when there's more than one.
  useEffect(() => {
    if (paused || count <= 1) return;
    const id = window.setInterval(goNext, 3000);
    return () => window.clearInterval(id);
  }, [goNext, paused, count]);

  // Keyboard navigation while the page is active.
  useEffect(() => {
    if (count <= 1) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPrev();
      else if (event.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, count]);

  // Swipe support via pointer events.
  const handlePointerDown = (event: React.PointerEvent) => {
    pointerStartX.current = event.clientX;
  };
  const handlePointerUp = (event: React.PointerEvent) => {
    if (pointerStartX.current === null) return;
    const delta = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNext();
      else goPrev();
    }
  };

  return (
    <PageTransition className="space-y-6">
      {/* Header */}
      <section className="py-6 text-center">
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">About Us</h1>
        <p className="mt-2 text-sm text-slate-500">Meet the team behind MedPi Portal</p>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center gap-5 py-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : count === 0 ? (
        <Card>
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Users className="h-12 w-12 text-brand/35" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No team members yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Team members added in the admin panel will appear here.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Team Member Slider — active card centred, neighbours peek, ends clipped */}
          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {/* Viewport clips the track horizontally; generous vertical padding
                gives card shadows room so they're never cut at the edge. */}
            <div
              ref={setViewportRef}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              className="overflow-hidden px-1 py-8"
            >
              <div
                className={`flex items-center gap-6 will-change-transform ${
                  viewportWidth > 0 ? 'transition-transform duration-500 ease-out' : ''
                }`}
                style={{ transform: `translate3d(${trackOffset}px, 0, 0)` }}
              >
                {members.map((member, index) => (
                  <TeamMemberCard key={member.id} member={member} active={index === activeIndex} />
                ))}
              </div>
            </div>

            <button
              onClick={goPrev}
              className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-brand"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-slate-50 hover:text-brand"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Dot indicators */}
          {count > 1 ? (
            <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Team members">
              {members.map((member, index) => (
                <button
                  key={member.id}
                  type="button"
                  role="tab"
                  onClick={() => goTo(index)}
                  aria-label={`Go to ${member.full_name}`}
                  aria-selected={index === activeIndex}
                  className={`h-2 rounded-full transition-all duration-300 ease-out ${
                    index === activeIndex ? 'w-6 bg-brand' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* Additional Info Section */}
      <Card className="mt-8">
        <div className="p-5">
          <h3 className="mb-2 font-serif text-xl font-semibold tracking-tight text-slate-900">Our Mission</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            We are a dedicated team of developers, designers, and educators working together to create the best
            learning experience for medical students. Our goal is to make medical education more accessible,
            organized, and engaging through technology.
          </p>
        </div>
      </Card>

      {/* Contact Section */}
      <Card>
        <div className="p-5">
          <h3 className="mb-2 font-serif text-xl font-semibold tracking-tight text-slate-900">Get in Touch</h3>
          <p className="text-sm text-slate-600">
            Have questions or feedback? We&apos;d love to hear from you. Reach out to us through the MedPi Portal
            team.
          </p>
        </div>
      </Card>
    </PageTransition>
  );
}
