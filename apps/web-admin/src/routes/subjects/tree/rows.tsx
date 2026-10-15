/**
 * Compact rows for the subject tree editor (Brilliant: 04 Admin — Tree editor):
 * a section header row, one grid row per lecture, and link rows inside an
 * expanded lecture. Everything reads the form through useFormContext.
 */
import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { onSortEnd, useDndSensors } from './dnd';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, Check, ChevronDown, ChevronRight, Ellipsis, Eye, EyeOff, GripVertical, ListVideo, Plus, Trash2, X } from 'lucide-react';
import { ResourceType } from '@medical-portal/shared';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { ConfirmButton } from '@/components/ui/confirm-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { StatusPill } from '../../../components/StatusPill';
import { detectResource, emptyLecture, emptyResource, type TreeValues } from './model';

/** Text field that looks like plain text until hovered/focused. */
const cellInput =
  'h-8 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2.5 text-[13px] text-ink-1 outline-none transition-colors placeholder:text-ink-4 hover:border-slate-300 focus:border-brand aria-[invalid=true]:border-red-400';

function DragHandle({ label, ...props }: { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-slate-300 hover:text-slate-500 active:cursor-grabbing"
      aria-label={label}
      {...props}
    >
      <GripVertical className="size-4" />
    </button>
  );
}

function VisibilityToggle({ visible, onToggle, label }: { visible: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!visible}
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      title={visible ? 'Visible to students — click to hide' : 'Hidden from students — click to show'}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-4 transition-colors hover:bg-slate-100 hover:text-ink-2"
    >
      {visible ? <Eye className="size-4" /> : <EyeOff className="size-4 text-amber-600" />}
    </button>
  );
}

const TYPE_LABELS: Record<ResourceType, string> = {
  [ResourceType.YOUTUBE]: 'YouTube',
  [ResourceType.GDRIVE_VIDEO]: 'Drive video',
  [ResourceType.GDRIVE_PDF]: 'Drive PDF',
  [ResourceType.EXTERNAL]: 'Link',
};

/** What the link looks like vs. the chosen type ("YouTube detected", or a mismatch warning). */
function linkStatus(url: string, type: ResourceType): { tone: 'ok' | 'warn' | 'plain'; text: string; hint?: string } {
  const trimmed = url.trim();
  if (!trimmed) return { tone: 'plain', text: TYPE_LABELS[type] };
  const guess = detectResource(trimmed, type);
  if (!guess) return { tone: 'warn', text: 'Not a link', hint: 'Paste a full https:// link.' };
  const isDrive = guess.type === ResourceType.GDRIVE_PDF || guess.type === ResourceType.GDRIVE_VIDEO;
  if (type === ResourceType.YOUTUBE && guess.type === ResourceType.YOUTUBE) return { tone: 'ok', text: 'YouTube detected' };
  if ((type === ResourceType.GDRIVE_PDF || type === ResourceType.GDRIVE_VIDEO) && isDrive) {
    return { tone: 'ok', text: TYPE_LABELS[type], hint: 'Students need access — set sharing to “Anyone with the link” in Google Drive.' };
  }
  if (type === ResourceType.EXTERNAL && guess.type === ResourceType.EXTERNAL) return { tone: 'ok', text: 'Link' };
  return { tone: 'warn', text: `${TYPE_LABELS[type]} · looks like ${TYPE_LABELS[guess.type]}` };
}

function ResourceRow({
  sortableId,
  sectionIndex,
  lectureIndex,
  resourceIndex,
  onRemove,
}: {
  sortableId: string;
  sectionIndex: number;
  lectureIndex: number;
  resourceIndex: number;
  onRemove: () => void;
}) {
  const base = `sections.${sectionIndex}.lectures.${lectureIndex}.resources.${resourceIndex}` as const;
  const { register, setValue, getValues, control, getFieldState, formState } = useFormContext<TreeValues>();
  const [url, type, isActive] = useWatch({ control, name: [`${base}.url`, `${base}.type`, `${base}.is_active`] });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
  const status = linkStatus(url ?? '', type);
  const labelError = getFieldState(`${base}.label`, formState).error;
  const urlError = getFieldState(`${base}.url`, formState).error;

  const applyDetection = (value: string) => {
    const guess = detectResource(value, getValues(`${base}.type`));
    if (!guess) return;
    if (guess.type !== getValues(`${base}.type`)) setValue(`${base}.type`, guess.type, { shouldDirty: true });
    if (!getValues(`${base}.label`)?.trim()) setValue(`${base}.label`, guess.label, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex flex-col gap-1', isDragging && 'relative z-10 rounded-md bg-white shadow-lg')}
    >
      <div className="flex items-center gap-2">
        <DragHandle label="Drag to reorder link" {...attributes} {...listeners} />
        <input
          {...register(`${base}.label`)}
          aria-label="Link label"
          aria-invalid={Boolean(labelError)}
          placeholder="Label (e.g. Slides)"
          className={cn(cellInput, 'w-40 shrink-0 sm:w-44', !isActive && 'text-ink-3')}
        />
        <input
          {...register(`${base}.url`, {
            onBlur: (event: React.FocusEvent<HTMLInputElement>) => applyDetection(event.target.value),
          })}
          onPaste={(event) => applyDetection(event.clipboardData.getData('text'))}
          aria-label="Link URL"
          aria-invalid={Boolean(urlError)}
          placeholder="Paste a YouTube, Drive or web link"
          className={cn(cellInput, 'flex-1', status.tone === 'warn' && 'border-amber-400', !isActive && 'text-ink-3')}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-semibold ring-1 ring-inset transition-colors',
              status.tone === 'ok' && 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
              status.tone === 'warn' && 'bg-amber-50 text-amber-700 ring-amber-600/20',
              status.tone === 'plain' && 'bg-slate-100 text-ink-2 ring-slate-500/10',
            )}
            aria-label={`Link type: ${TYPE_LABELS[type]}. Change type`}
          >
            {status.tone === 'ok' ? <Check className="size-3" /> : status.tone === 'warn' ? <AlertTriangle className="size-3" /> : null}
            {status.text}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(TYPE_LABELS) as ResourceType[]).map((value) => (
              <DropdownMenuItem key={value} onSelect={() => setValue(`${base}.type`, value, { shouldDirty: true })}>
                {value === type ? <Check /> : <span className="size-4" />}
                {TYPE_LABELS[value]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <VisibilityToggle
          visible={isActive}
          label="link"
          onToggle={() => setValue(`${base}.is_active`, !isActive, { shouldDirty: true })}
        />
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove link" className="text-ink-4 hover:text-red-600">
          <X />
        </Button>
      </div>
      {labelError || urlError ? (
        <p className="pl-7 text-[11px] text-red-600">{labelError?.message ?? urlError?.message}</p>
      ) : status.hint && status.tone !== 'ok' ? (
        <p className="pl-7 text-[11px] text-amber-700">{status.hint}</p>
      ) : null}
    </div>
  );
}

function LectureRow({
  sortableId,
  sectionIndex,
  lectureIndex,
  number,
  onRemove,
}: {
  sortableId: string;
  sectionIndex: number;
  lectureIndex: number;
  number: number;
  onRemove: () => void;
}) {
  const base = `sections.${sectionIndex}.lectures.${lectureIndex}` as const;
  const { register, control, setValue, getValues, getFieldState, formState } = useFormContext<TreeValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: `${base}.resources` });
  const [isActive, lectureDate] = useWatch({ control, name: [`${base}.is_active`, `${base}.lecture_date`] });
  const isNew = !getValues(`${base}.id`);
  const hasError = Boolean(getFieldState(base, formState).error);
  const [expanded, setExpanded] = useState(() => isNew && getValues(`${base}.resources`).length === 0);
  const open = expanded || hasError;
  const sensors = useDndSensors();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
  const titleError = getFieldState(`${base}.title`, formState).error;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'border-t border-slate-100 px-3 py-1.5',
        isNew && 'bg-emerald-50/40',
        open && !isNew && 'bg-slate-50/60',
        isDragging && 'relative z-10 bg-white shadow-lg',
      )}
    >
      <div className="flex items-center gap-2 pl-5">
        <DragHandle label="Drag to reorder lecture" {...attributes} {...listeners} />
        <span className={cn('w-6 shrink-0 text-right text-xs font-semibold tabular-nums', open ? 'text-brand' : 'text-ink-3')}>{number}</span>
        <input
          {...register(`${base}.title`)}
          aria-label="Lecture title"
          aria-invalid={Boolean(titleError)}
          placeholder="Lecture title"
          className={cn(cellInput, 'flex-[3]', !isActive && 'text-ink-3 line-through decoration-slate-300')}
        />
        <input
          {...register(`${base}.lecturer_name`)}
          aria-label="Lecturer"
          placeholder="Lecturer"
          className={cn(cellInput, 'hidden flex-[2] md:block')}
        />
        <DatePicker
          variant="inline"
          aria-label="Taught on"
          value={lectureDate ?? ''}
          onChange={(value) => setValue(`${base}.lecture_date`, value, { shouldDirty: true })}
          placeholder="Add date"
          className="hidden w-28 shrink-0 md:flex"
        />
        <button
          type="button"
          onClick={() => setExpanded(!open)}
          aria-expanded={open}
          className={cn(
            'h-8 w-16 shrink-0 rounded-md text-left text-xs transition-colors hover:text-brand-hover',
            open ? 'font-semibold text-brand' : fields.length === 0 ? 'font-medium text-amber-700' : 'text-ink-3',
          )}
        >
          {fields.length === 0 ? 'No files' : `${fields.length} ${fields.length === 1 ? 'file' : 'files'}`}
        </button>
        <span className="w-14 shrink-0">
          {isNew ? <StatusPill tone="live">New</StatusPill> : !isActive ? <StatusPill tone="hidden">Hidden</StatusPill> : null}
        </span>
        <VisibilityToggle visible={isActive} label="lecture" onToggle={() => setValue(`${base}.is_active`, !isActive, { shouldDirty: true })} />
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove lecture" className="text-ink-4 hover:text-red-600">
          <Trash2 />
        </Button>
      </div>
      {titleError ? <p className="pl-[4.5rem] pt-1 text-[11px] text-red-600">{titleError.message}</p> : null}

      {open ? (
        <div className="flex flex-col gap-2 pb-2 pl-[4.5rem] pr-2 pt-2">
          <div className="grid gap-2 md:hidden">
            <input {...register(`${base}.lecturer_name`)} aria-label="Lecturer (mobile)" placeholder="Lecturer" className={cellInput} />
            <DatePicker
              value={lectureDate ?? ''}
              onChange={(value) => setValue(`${base}.lecture_date`, value, { shouldDirty: true })}
              placeholder="Taught on"
              className="h-8"
            />
          </div>
          {fields.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSortEnd(fields, move)}>
              <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-1.5">
                  {fields.map((field, resourceIndex) => (
                    <ResourceRow
                      key={field.id}
                      sortableId={field.id}
                      sectionIndex={sectionIndex}
                      lectureIndex={lectureIndex}
                      resourceIndex={resourceIndex}
                      onRemove={() => remove(resourceIndex)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pl-7">
            <button type="button" onClick={() => append(emptyResource())} className="text-xs font-semibold text-brand hover:text-brand-hover">
              + Add file or link
            </button>
            <input
              {...register(`${base}.description`)}
              aria-label="Lecture note"
              placeholder="Note for students (optional)"
              className={cn(cellInput, 'h-7 max-w-sm flex-1 text-xs')}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SectionEditor({
  sortableId,
  sectionIndex,
  numberOffset,
  open,
  reordered,
  onToggle,
  onRemove,
  onImport,
}: {
  sortableId: string;
  sectionIndex: number;
  /** Lectures before this section, so numbering runs across the subject. */
  numberOffset: number;
  open: boolean;
  reordered: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onImport: () => void;
}) {
  const base = `sections.${sectionIndex}` as const;
  const { register, control, setValue, getFieldState, formState } = useFormContext<TreeValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: `${base}.lectures` });
  const isActive = useWatch({ control, name: `${base}.is_active` });
  const sensors = useDndSensors();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sortableId });
  const nameError = getFieldState(`${base}.name`, formState).error;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('border-b border-slate-200/70 last:border-0', isDragging && 'relative z-10 bg-white shadow-lg')}
    >
      <div className={cn('flex items-center gap-2 px-3 py-2', open && 'bg-slate-50/70')}>
        <DragHandle label="Drag to reorder section" {...attributes} {...listeners} />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? 'Collapse section' : 'Expand section'}
          className="flex size-6 shrink-0 items-center justify-center rounded text-ink-3 hover:bg-slate-100"
        >
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <span className="shrink-0 text-[13px] font-semibold text-ink-1 tabular-nums">{sectionIndex + 1} ·</span>
        <input
          {...register(`${base}.name`)}
          aria-label="Section name"
          aria-invalid={Boolean(nameError)}
          placeholder="Section name"
          className="h-8 min-w-0 max-w-md flex-1 rounded-md border border-transparent bg-transparent px-1.5 sm:min-w-32 sm:flex-none sm:[field-sizing:content] text-[13px] font-semibold text-ink-1 outline-none transition-colors placeholder:font-normal placeholder:text-ink-4 hover:border-slate-200 focus:border-brand focus:bg-white aria-[invalid=true]:border-red-400"
        />
        <span className="hidden shrink-0 text-xs text-ink-3 sm:inline">
          {fields.length} {fields.length === 1 ? 'lecture' : 'lectures'}
        </span>
        {reordered ? <StatusPill tone="brand">Reordered</StatusPill> : null}
        <span className="hidden flex-1 sm:block" />
        {open ? (
          <button
            type="button"
            onClick={() => append(emptyLecture())}
            className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-subtle sm:inline-flex"
          >
            <Plus className="size-3.5" />
            Lecture
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setValue(`${base}.is_active`, !isActive, { shouldDirty: true })}
          aria-pressed={!isActive}
          title={isActive ? 'Visible to students — click to hide' : 'Hidden from students — click to show'}
        >
          <StatusPill tone={isActive ? 'neutral' : 'hidden'}>{isActive ? 'Visible' : 'Hidden'}</StatusPill>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Section actions"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-slate-100 hover:text-ink-1"
          >
            <Ellipsis className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => append(emptyLecture())}>
              <Plus />
              Add lecture
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onImport}>
              <ListVideo />
              Import playlist here
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {fields.length === 0 ? (
              <DropdownMenuItem variant="danger" onSelect={onRemove}>
                <Trash2 />
                Remove section
              </DropdownMenuItem>
            ) : (
              <ConfirmButton
                title="Remove this section?"
                description={`Its ${fields.length} ${fields.length === 1 ? 'lecture' : 'lectures'} and their files go too when you save. You can still Discard before saving.`}
                confirmLabel="Remove"
                onConfirm={onRemove}
                trigger={
                  <DropdownMenuItem variant="danger" onSelect={(event) => event.preventDefault()}>
                    <Trash2 />
                    Remove section
                  </DropdownMenuItem>
                }
              />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {nameError ? <p className="px-3 pb-2 pl-[4.25rem] text-[11px] text-red-600">{nameError.message}</p> : null}

      {open ? (
        <div>
          {fields.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSortEnd(fields, move)}>
              <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                {fields.map((field, lectureIndex) => (
                  <LectureRow
                    key={field.id}
                    sortableId={field.id}
                    sectionIndex={sectionIndex}
                    lectureIndex={lectureIndex}
                    number={numberOffset + lectureIndex + 1}
                    onRemove={() => remove(lectureIndex)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <p className="border-t border-slate-100 px-3 py-3 pl-[4.25rem] text-xs text-ink-3">No lectures yet.</p>
          )}
          <div className="flex items-center gap-4 border-t border-slate-100 px-3 py-2 pl-[4.25rem]">
            <button type="button" onClick={() => append(emptyLecture())} className="text-xs font-semibold text-brand hover:text-brand-hover">
              + Add lecture
            </button>
            <button type="button" onClick={onImport} className="text-xs font-medium text-ink-3 hover:text-ink-1">
              Import playlist here
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
