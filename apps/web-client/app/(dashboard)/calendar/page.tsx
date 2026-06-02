'use client';

/**
 * Calendar Page — the academic calendar on its own route (moved off the home
 * dashboard, which now leads with Hot News). Tailwind + Radix only.
 */

import { CalendarSection } from '@/components/CalendarSection';
import { PageTransition } from '@/components/PageTransition';

export default function CalendarPage() {
  return (
    <PageTransition>
      <CalendarSection />
    </PageTransition>
  );
}
