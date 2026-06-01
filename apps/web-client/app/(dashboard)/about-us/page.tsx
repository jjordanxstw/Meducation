'use client';

/**
 * About Us Page - Team members and creators
 * Features a horizontal slider with team member cards
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="snap-center shrink-0 w-[220px] rounded-2xl bg-white border border-slate-200/70 shadow-subtle p-5 cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:z-1 group relative">
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
      <div className="absolute inset-0 rounded-2xl bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

export default function AboutUsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const pointerStartX = useRef<number | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  // Scroll a card index into view (wrapping so the carousel loops endlessly).
  const goTo = useCallback((index: number) => {
    const len = teamMembers.length;
    const wrapped = ((index % len) + len) % len;
    setCurrent(wrapped);
    const el = scrollRef.current;
    const child = el?.children[wrapped] as HTMLElement | undefined;
    if (el && child) {
      el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: 'smooth' });
    }
  }, []);

  const goNext = useCallback(() => goTo(currentRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(currentRef.current - 1), [goTo]);

  // Auto-advance every 3s; pause while the user is interacting with the slider.
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(goNext, 3000);
    return () => window.clearInterval(id);
  }, [goNext, paused]);

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
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900">
          About Us
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Meet the team behind MedPi Portal
        </p>
      </section>

      {/* Team Member Slider — arrows sit outside the scroll track */}
      <div
        className="flex items-center gap-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        {/* Left Arrow Button */}
        <button
          onClick={goPrev}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-brand transition"
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Scrollable Cards Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="flex min-w-0 flex-1 gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} />
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={goNext}
          className="shrink-0 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-brand transition"
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Team members">
        {teamMembers.map((member, index) => (
          <button
            key={index}
            type="button"
            role="tab"
            onClick={() => goTo(index)}
            aria-label={`Go to ${member.name}`}
            aria-selected={index === current}
            className={`h-2 rounded-full transition-all duration-300 ease-out ${
              index === current ? 'w-6 bg-brand' : 'w-2 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>

      {/* Additional Info Section */}
      <Card className="mt-8">
        <div className="p-5">
          <h3 className="mb-2 font-serif text-xl font-semibold tracking-tight text-slate-900">Our Mission</h3>
          <p className="text-sm leading-relaxed text-slate-600">
            We are a dedicated team of developers, designers, and educators working together to
            create the best learning experience for medical students. Our goal is to make
            medical education more accessible, organized, and engaging through technology.
          </p>
        </div>
      </Card>

      {/* Contact Section */}
      <Card>
        <div className="p-5">
          <h3 className="mb-2 font-serif text-xl font-semibold tracking-tight text-slate-900">Get in Touch</h3>
          <p className="text-sm text-slate-600">
            Have questions or feedback? We&apos;d love to hear from you. Reach out to us through
            the MedPi Portal team.
          </p>
        </div>
      </Card>
    </PageTransition>
  );
}
