'use client';

/**
 * About Us Page - Team members and creators
 * Features a horizontal slider with team member cards
 */

import { useRef } from 'react';
import { Card } from '@nextui-org/react';
import { FiChevronLeft, FiChevronRight, FiUsers } from 'react-icons/fi';

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
    <div className="snap-center shrink-0 w-[220px] rounded-2xl bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 p-5 cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:shadow-2xl hover:z-10 hover:border-blue-300 dark:hover:border-blue-500/50 group relative">
      {/* Profile Image */}
      <div className="w-full aspect-square rounded-xl bg-slate-100 dark:bg-white/5 mb-4 overflow-hidden">
        {member.image ? (
          <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-300 dark:text-white/30">
            {member.initials}
          </div>
        )}
      </div>

      {/* Info */}
      <p className="font-bold text-slate-900 dark:text-white text-sm">{member.name}</p>
      <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">{member.role}</p>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-2xl bg-blue-500/5 dark:bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

export default function AboutUsPage() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -240 : 240,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="text-center py-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          About Us
        </h1>
        <p className="text-slate-500 dark:text-white/50 mt-2 text-sm">
          รู้จักกับทีมงานผู้สร้างเว็บไซต์นี้
        </p>
      </section>

      {/* Family Tree Subheading */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-white/80 flex items-center justify-center gap-2">
          <FiUsers className="text-blue-500" />
          Family Tree
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/40 mt-1">
          รวมหน้าทุกๆคนไว้เป็นแขนง ใครชื่อไรตำแหน่งไร
        </p>
      </div>

      {/* Team Member Slider */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition"
          aria-label="Scroll left"
        >
          <FiChevronLeft size={18} />
        </button>

        {/* Scrollable Cards Container */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory px-12 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {teamMembers.map((member, index) => (
            <TeamMemberCard key={index} member={member} />
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white dark:bg-[#0d1b2e] border border-slate-200 dark:border-white/10 shadow-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition"
          aria-label="Scroll right"
        >
          <FiChevronRight size={18} />
        </button>
      </div>

      {/* Additional Info Section */}
      <Card className="glass-card mt-8">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Our Mission
          </h3>
          <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">
            We are a dedicated team of developers, designers, and educators working together to
            create the best learning experience for medical students. Our goal is to make
            medical education more accessible, organized, and engaging through technology.
          </p>
        </div>
      </Card>

      {/* Contact Section */}
      <Card className="glass-card">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Get in Touch
          </h3>
          <p className="text-sm text-slate-600 dark:text-white/70">
            Have questions or feedback? We&apos;d love to hear from you. Reach out to us through
            the MedPi Portal team.
          </p>
        </div>
      </Card>
    </div>
  );
}
