/**
 * News categories & Event types (Brilliant: 04 Admin — Categories & Event
 * types): two short inline-edited lists side by side. Rename and recolour in
 * place, drag to set the order students see. Both /news-categories and
 * /event-types land here.
 */
import type * as React from 'react';
import { useMemo, useState } from 'react';
import { useCreate, useDelete, useList, useUpdate, type BaseRecord } from '@refinedev/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, GripVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { cn } from '@/lib/utils';
import { notify } from '../../utils/notify';
import { useDndSensors } from '../subjects/tree/dnd';

type Item = BaseRecord & { id: string; name: string; color: string; sort_order: number };

const PALETTE = ['#2f80ed', '#16a34a', '#7c3aed', '#dc2626', '#d97706', '#0891b2', '#475569'];

function Swatches({ value, onPick }: { value: string; onPick: (color: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Colour">
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value.toLowerCase() === color}
          aria-label={color}
          onClick={() => onPick(color)}
          className={cn('size-5 rounded-full ring-offset-2 transition', value.toLowerCase() === color && 'ring-2 ring-slate-400')}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function Row({
  item,
  count,
  countLabel,
  editing,
  onEdit,
  onDone,
  onDelete,
  deleteHint,
}: {
  item: Item;
  count: number;
  countLabel: (n: number) => string;
  editing: boolean;
  onEdit: () => void;
  onDone: (values: { name: string; color: string }) => void;
  onDelete: () => void;
  deleteHint: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('border-b border-slate-100 last:border-0', editing && 'bg-slate-50/70', isDragging && 'relative z-10 bg-white shadow-lg')}
    >
      <div className="flex items-center gap-2.5 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-label={`Drag to reorder ${item.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="size-5 shrink-0 rounded-md" style={{ backgroundColor: editing ? color : item.color }} aria-hidden />
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onDone({ name, color });
              }
            }}
            aria-label="Name"
            className="h-8 min-w-0 flex-1 rounded-md border border-brand bg-white px-2.5 text-[13px] text-ink-1 outline-none"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold capitalize text-ink-1">{item.name}</span>
        )}
        <span className="w-20 shrink-0 text-right text-[11px] tabular-nums text-ink-3">{countLabel(count)}</span>
        <button
          type="button"
          onClick={editing ? () => onDone({ name, color }) : onEdit}
          className="w-12 shrink-0 text-right text-xs font-semibold text-brand hover:text-brand-hover"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      {editing ? (
        <div className="flex items-center justify-between gap-3 px-3 pb-2.5 pl-[3.75rem]">
          <Swatches value={color} onPick={setColor} />
          {count === 0 ? (
            <ConfirmButton
              title={`Delete “${item.name}”?`}
              description="You can undo this within a few seconds."
              confirmLabel="Delete"
              onConfirm={onDelete}
              trigger={
                <button type="button" className="text-xs font-semibold text-red-600 hover:text-red-700">
                  Delete
                </button>
              }
            />
          ) : (
            <span className="text-[11px] text-ink-3" title={deleteHint}>
              In use — can’t delete
            </span>
          )}
        </div>
      ) : null}
    </li>
  );
}

function TaxonomyList({
  resource,
  title,
  subtitle,
  counts,
  countLabel,
  deleteHint,
  newName,
  footer,
}: {
  resource: 'news-categories' | 'event-types';
  title: string;
  subtitle: string;
  /** Usage count by item (keyed by id and by name). */
  counts: (item: Item) => number;
  countLabel: (n: number) => string;
  deleteHint: string;
  newName: string;
  footer?: React.ReactNode;
}) {
  const { data, isLoading } = useList<Item>({ resource, pagination: { mode: 'off' }, sorters: [{ field: 'sort_order', order: 'asc' }] });
  const { mutateAsync: update } = useUpdate();
  const { mutateAsync: create, isLoading: creating } = useCreate();
  const { mutate: deleteOne } = useDelete();
  const sensors = useDndSensors();
  const [editing, setEditing] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  const items = useMemo(() => {
    const list = [...(data?.data ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    if (!order) return list;
    const byId = new Map(list.map((item) => [item.id, item]));
    return order.map((id) => byId.get(id)).filter((item): item is Item => Boolean(item));
  }, [data, order]);

  const save = async (item: Item, values: { name: string; color: string }) => {
    const name = values.name.trim();
    if (!name) return notify.error('Enter a name');
    setEditing(null);
    if (name === item.name && values.color === item.color) return;
    await update({ resource, id: item.id, values: { name, color: values.color }, mutationMode: 'pessimistic' }).catch(() => undefined);
  };

  const add = async () => {
    const result = await create({
      resource,
      values: { name: newName, color: PALETTE[items.length % PALETTE.length], sort_order: items.length },
      successNotification: false,
    }).catch(() => null);
    const id = (result?.data as { id?: string } | undefined)?.id;
    if (id) setEditing(id);
  };

  const onDragEnd = async ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (!over || active.id === over.id) return;
    const ids = items.map((item) => item.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setOrder(next);
    try {
      await Promise.all(
        next
          .map((id, index) => ({ id, index }))
          .filter(({ id, index }) => items.find((item) => item.id === id)?.sort_order !== index)
          .map(({ id, index }) =>
            update({ resource, id, values: { sort_order: index }, mutationMode: 'pessimistic', successNotification: false }),
          ),
      );
    } finally {
      setOrder(null);
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink-1">{title}</h2>
          <p className="text-xs text-ink-3">{subtitle}</p>
        </div>
        <Button size="sm" onClick={() => void add()} loading={creating}>
          <Plus />
          Add
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-subtle">
        {isLoading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-ink-3">Nothing here yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul>
                {items.map((item) => (
                  <Row
                    key={`${item.id}-${editing === item.id}`}
                    item={item}
                    count={counts(item)}
                    countLabel={countLabel}
                    editing={editing === item.id}
                    onEdit={() => setEditing(item.id)}
                    onDone={(values) => void save(item, values)}
                    onDelete={() => {
                      setEditing(null);
                      deleteOne({ resource, id: item.id });
                    }}
                    deleteHint={deleteHint}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {footer}
    </section>
  );
}

const TaxonomiesPage = () => {
  // Usage counts: every article / event, grouped on the client (hundreds of rows at most).
  const { data: news } = useList<{ id: string; category_id: string | null }>({ resource: 'news', pagination: { mode: 'off' } });
  const { data: events } = useList<{ id: string; type: string }>({ resource: 'calendar', pagination: { mode: 'off' } });
  const articlesBy = useMemo(() => {
    const map = new Map<string, number>();
    for (const article of news?.data ?? []) if (article.category_id) map.set(article.category_id, (map.get(article.category_id) ?? 0) + 1);
    return map;
  }, [news]);
  const eventsBy = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events?.data ?? []) map.set(event.type, (map.get(event.type) ?? 0) + 1);
    return map;
  }, [events]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <TaxonomyList
        resource="news-categories"
        title="News categories"
        subtitle="Colour shows on cards and filters"
        counts={(item) => articlesBy.get(item.id) ?? 0}
        countLabel={(n) => `${n} ${n === 1 ? 'article' : 'articles'}`}
        deleteHint="Move its articles to another category first."
        newName="New category"
      />
      <TaxonomyList
        resource="event-types"
        title="Event types"
        subtitle="Calendar colours and filters for students"
        counts={(item) => eventsBy.get(item.name) ?? 0}
        countLabel={(n) => `${n} ${n === 1 ? 'event' : 'events'}`}
        deleteHint="Move its events to another type first."
        newName="new type"
        footer={
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="mt-px size-3.5 shrink-0 text-amber-600" aria-hidden />
            A type that’s used by events can’t be deleted. Move its events to another type first (the database blocks it, by design).
          </p>
        }
      />
    </div>
  );
};

export default TaxonomiesPage;
