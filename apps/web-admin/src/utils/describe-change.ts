import { actorName } from './relative-time';

/** One audit row as returned by /admin/statistics/summary. */
export type Change = {
  id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  table_name: string;
  record_id: string | null;
  user_email: string | null;
  created_at: string;
  record_label: string | null;
  is_tree_save: boolean;
};

export const NOUNS: Record<string, string> = {
  subjects: 'subject',
  sections: 'section',
  lectures: 'lecture',
  resources: 'file',
  calendar_events: 'calendar event',
  event_types: 'event type',
  announcements: 'announcement',
  news: 'news post',
  news_categories: 'news category',
  learning_resources: 'Learning Hub item',
  team_members: 'team member',
  profiles: 'student',
};
const VERBS: Record<string, string> = { INSERT: 'added', UPDATE: 'updated', DELETE: 'deleted' };

/** "nok updated CVS 201 tree", "Jordan added announcement Exam week". */
export function describeChange(change: Change): string {
  const who = actorName(change.user_email);
  const verb = VERBS[change.action] ?? change.action.toLowerCase();
  if (change.is_tree_save) return `${who} updated ${change.record_label ?? 'a subject'} tree`;
  const noun = NOUNS[change.table_name] ?? change.table_name.replace(/_/g, ' ');
  return `${who} ${verb} ${noun}${change.record_label ? ` ${change.record_label}` : ''}`;
}
