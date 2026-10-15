import { createElement } from 'react';
import {
  Activity,
  Baby,
  Bone,
  BookOpen,
  Brain,
  Bug,
  Dna,
  Droplet,
  Ear,
  Eye,
  FlaskConical,
  HeartPulse,
  Hospital,
  Microscope,
  Pill,
  ShieldPlus,
  Siren,
  Soup,
  Stethoscope,
  Users,
  Venus,
  Wind,
  type LucideIcon,
} from 'lucide-react';

/**
 * Line-art glyph for a subject card cover, picked from the subject name
 * (there is no icon column in the schema). Order matters: the first match wins.
 */
const RULES: Array<[RegExp, LucideIcon]> = [
  [/cardio|heart|cvs/i, HeartPulse],
  [/respir|lung|pulmon|chest/i, Wind],
  [/renal|kidney|urin|nephro/i, Droplet],
  [/gastro|\bgi\b|digest|hepat|liver|nutrition/i, Soup],
  [/endocrin|hormone|pharmac|drug/i, FlaskConical],
  [/biochem|genetic|molecular|dna/i, Dna],
  [/neuro|nervous|brain|psychi/i, Brain],
  [/ortho|musculo|bone|anatom/i, Bone],
  [/paediat|pediat|child|neonat/i, Baby],
  [/obstet|gynae|gyneco|women/i, Venus],
  [/microbio|infect|immun/i, Bug],
  [/patho|histo|cell/i, Microscope],
  [/emergen|trauma|resus/i, Siren],
  [/ophthal|eye/i, Eye],
  [/\bent\b|otolar|ear/i, Ear],
  [/physiol/i, Activity],
  [/surg/i, ShieldPlus],
  [/family|communit|public health/i, Users],
  [/clinical|skills|medicine|internal/i, Stethoscope],
  [/therap|pill/i, Pill],
  [/extern|clerk|rotation|ward/i, Hospital],
];

export function subjectGlyph(name: string): LucideIcon {
  return RULES.find(([pattern]) => pattern.test(name))?.[1] ?? BookOpen;
}

export function SubjectGlyph({ name, className }: { name: string; className?: string }) {
  return createElement(subjectGlyph(name), { className, strokeWidth: 1.5, 'aria-hidden': true });
}
