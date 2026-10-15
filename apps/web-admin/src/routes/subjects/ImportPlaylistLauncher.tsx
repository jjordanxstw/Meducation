/**
 * "Import playlist" from outside a subject (dashboard, subjects list): pick the
 * subject, then the tree editor opens with the importer, where the section is
 * chosen and the lectures are reviewed before saving.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type SubjectOption = { id: string; code: string; name: string; year_level: number };

export function ImportPlaylistLauncher({
  open,
  onOpenChange,
  subjects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: SubjectOption[];
}) {
  const navigate = useNavigate();
  const [subjectId, setSubjectId] = useState('');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSubjectId('');
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Import a YouTube playlist</DialogTitle>
          <DialogDescription className="text-xs">Choose the subject first — you’ll pick the section next.</DialogDescription>
        </DialogHeader>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger aria-label="Subject">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((subject) => (
              <SelectItem key={subject.id} value={subject.id}>
                {subject.code} · {subject.name} <span className="text-ink-3">(Year {subject.year_level})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!subjectId}
            onClick={() => {
              onOpenChange(false);
              navigate(`/subjects/edit/${subjectId}?import=1`);
            }}
          >
            <ListVideo />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
