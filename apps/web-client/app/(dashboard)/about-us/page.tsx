'use client';

/**
 * About MedPi (Brilliant: Student Desktop / About) — what the portal is, how
 * to report a problem, and the team (admin-managed via the team-members API).
 */

import type * as React from 'react';
import { Mail, Users } from 'lucide-react';
import type { TeamMember } from '@medical-portal/shared';
import { PageTransition } from '@/components/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/states/EmptyState';
import { useTeamMembers } from '@/hooks/use-team-members';

// Brand glyphs (GitHub / Instagram / LinkedIn). The pinned lucide-react@1.17
// has no brand icons, so these are inlined as currentColor fill paths.
function BrandIcon({ path }: { path: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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

function MemberCard({ member }: { member: TeamMember }) {
  const links = [
    member.email ? { key: 'email', href: `mailto:${member.email}`, label: `Email ${member.full_name}`, icon: <Mail size={16} /> } : null,
    member.github_url ? { key: 'github', href: member.github_url, label: `${member.full_name} on GitHub`, icon: <BrandIcon path={GITHUB_PATH} /> } : null,
    member.linkedin_url ? { key: 'linkedin', href: member.linkedin_url, label: `${member.full_name} on LinkedIn`, icon: <BrandIcon path={LINKEDIN_PATH} /> } : null,
    member.instagram_url ? { key: 'instagram', href: member.instagram_url, label: `${member.full_name} on Instagram`, icon: <BrandIcon path={INSTAGRAM_PATH} /> } : null,
  ].filter(Boolean) as { key: string; href: string; label: string; icon: React.ReactNode }[];

  return (
    <li className="flex flex-col items-center rounded-2xl border border-slate-200/70 bg-white p-5 text-center shadow-subtle">
      <div className="h-16 w-16 overflow-hidden rounded-full bg-brand-subtle">
        {member.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand-hover">{initialsOf(member.full_name)}</div>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-ink-1">{member.full_name}</p>
      <p className="text-xs font-medium text-brand-hover">{member.role}</p>
      {member.bio ? <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-2">{member.bio}</p> : null}
      {links.length > 0 ? (
        <div className="mt-auto flex gap-1 pt-3">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target={link.key === 'email' ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={link.label}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-brand-subtle hover:text-brand-hover"
            >
              {link.icon}
            </a>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export default function AboutPage() {
  const { data: members = [], isLoading } = useTeamMembers();
  const contact = members.find((member) => member.email)?.email;

  return (
    <PageTransition className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-subtle sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-hover">About MedPi</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-1 sm:text-3xl">Every lecture you missed, in one calm place</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2 sm:text-base">
            MedPi is built by students for students. We collect the lecture recordings, slides and schedules your faculty shares and
            organise them by year, subject and section, so you spend your time studying, not searching.
          </p>
        </section>
        <section className="flex flex-col justify-between gap-4 rounded-2xl bg-brand-hover p-6 text-white shadow-subtle">
          <div>
            <h2 className="text-base font-semibold">Found a problem?</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              A broken link, a missing lecture or a bug: tell us and we usually fix it within a day.
            </p>
          </div>
          {contact ? (
            <a
              href={`mailto:${contact}?subject=${encodeURIComponent('MedPi: problem report')}`}
              className="inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-brand-hover transition-colors hover:bg-white/90"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Report an issue
            </a>
          ) : null}
        </section>
      </div>

      <section className="space-y-4" aria-labelledby="team">
        <h2 id="team" className="text-lg font-semibold tracking-tight text-ink-1">
          The team
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState compact icon={Users} title="Team coming soon" description="The people behind MedPi will be listed here." />
        ) : (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </ul>
        )}
      </section>
    </PageTransition>
  );
}
