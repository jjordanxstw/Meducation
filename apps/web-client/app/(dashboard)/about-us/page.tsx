'use client';

/**
 * About Us Page - Team members and creators
 * Features a horizontal slider with team member cards
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@heroui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { PageTransition } from '@/components/PageTransition';

// Team member data - customize with actual team members
const teamMembers = [
  { name: 'Alex Chen', role: 'Lead Developer', initials: 'AC', image: null },
  { name: 'Sarah Kim', role: 'UI/UX Designer', initials: 'SK', image: null },
  { name: 'Mike Johnson', role: 'Backend Developer', initials: 'MJ', image: null },
  { name: 'Emma Wilson', role: 'Frontend Developer', initials: 'EW', image: null },
  { name: 'David Lee', role: 'DevOps Engineer', initials: 'DL', image: null },
  { name: 'Lisa Park', role: 'Product Manager', initials: 'LP', image: null },
  { name: 'Tom Brown', role: 'QA Engineer', initials: 'TB', image: null },
  { name: 'Amy Zhang', role: 'Data Analyst', initials: 'AZ', image: null },
];

// Team member card component
function TeamMemberCard({ member }: { member: typeof teamMembers[0] }) {
  return (
    <div className="snap-center shrink-0 w-[220px] rounded-2xl bg-white border border-slate-200 p-5 cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:z-1 group relative">
      {/* Profile Image */}
      <div className="w-full aspect-square rounded-xl bg-slate-100 mb-4 overflow-hidden">
        {member.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-300">
            {member.initials}
          </div>
        )}
      </div>

      {/* Info */}
      <p className="font-bold text-slate-900 text-sm">{member.name}</p>
      <p className="text-xs text-slate-500 mt-0.5">{member.role}</p>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

export default function AboutUsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  // Scroll a given card index into view and mark it active.
  const goTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, teamMembers.length - 1));
    setCurrent(clamped);
    const el = scrollRef.current;
    const child = el?.children[clamped] as HTMLElement | undefined;
    if (el && child) {
      el.scrollTo({ left: child.offsetLeft - el.clientLeft - 48, behavior: 'smooth' });
    }
  }, []);

  const goNext = useCallback(() => goTo(currentRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(currentRef.current - 1), [goTo]);

  // Keyboard navigation while the page is active.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPrev();
      else if (event.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  // Keep the active dot in sync with manual scrolling.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const stride = (el.children[1] as HTMLElement | undefined)
      ? (el.children[1] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft
      : 240;
    const index = Math.round(el.scrollLeft / stride);
    setCurrent(Math.max(0, Math.min(index, teamMembers.length - 1)));
  };

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
      <section className="text-center py-6">
        <h1 className="text-3xl font-bold text-slate-900">
          About Us
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Meet the team behind MedPi Portal
        </p>
      </section>

      {/* Team Member Slider */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition"
          aria-label="Scroll left"
        >
          <FiChevronLeft size={18} />
        </button>

        {/* Scrollable Cards Container with right-edge fade mask */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory px-12 py-4 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            maskImage: 'linear-gradient(to right, black 80%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent)',
          }}
        >
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} />
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition"
          aria-label="Scroll right"
        >
          <FiChevronRight size={18} />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Team members">
        {teamMembers.map((member, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            onClick={() => goTo(index)}
            aria-label={`Go to ${member.name}`}
            aria-selected={index === current}
            className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out ${
              index === current ? 'w-5 bg-blue-500' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>

      {/* Additional Info Section */}
      <Card className="glass-card mt-8">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Our Mission
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            We are a dedicated team of developers, designers, and educators working together to
            create the best learning experience for medical students. Our goal is to make
            medical education more accessible, organized, and engaging through technology.
          </p>
        </div>
      </Card>

      {/* Contact Section */}
      <Card className="glass-card">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Get in Touch
          </h3>
          <p className="text-sm text-slate-600">
            Have questions or feedback? We&apos;d love to hear from you. Reach out to us through
            the MedPi Portal team.
          </p>
        </div>
      </Card>
    </PageTransition>
  );
}
