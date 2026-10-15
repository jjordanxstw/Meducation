/**
 * Learning Hub (Brilliant: 04 Admin — LH list): every card in the order
 * students see them. Drag a row by its handle to reorder; the new order_index
 * values are saved straight away.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useList, useUpdate } from '@refinedev/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookOpenText, GripVertical, Plus } from 'lucide-react';
import type { LearningResource } from '@medical-portal/shared';
import { notify } from '../../utils/notify';
import { AdminEmptyState } from '../../components/AdminEmptyState';
import { StatusPill } from '../../components/StatusPill';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDndSensors } from '../subjects/tree/dnd';

const GRID = 'grid grid-cols-[1.25rem_minmax(0,2fr)_minmax(0,1fr)_9rem_6rem_3rem] items-center gap-3';

function Row({ item }: { item: LearningResource }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const groups = item.categories?.length ?? 0;
  const links = (item.categories ?? []).reduce((sum, group) => sum + (group.links?.length ?? 0), 0);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={() => navigate(`/learning-resources/edit/${item.id}`)}
      className={`${GRID} cursor-pointer border-b border-slate-100 px-4 py-2.5 text-[13px] last:border-0 hover:bg-slate-50/70 ${isDragging ? 'relative z-10 bg-white shadow-lg' : ''}`}
    >
      <button
        type="button"
        onClick={(event) => event.stopPropagation()}
        className="cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        aria-label={`Drag to reorder ${item.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-subtle text-brand">
          {item.image_url ? <img src={item.image_url} alt="" className="size-full object-cover" /> : <BookOpenText className="size-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-1">{item.title}</p>
          {item.author_name ? <p className="truncate text-[11px] text-ink-3">by {item.author_name}</p> : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap gap-1">
        {(item.technologies ?? []).slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-ink-2">
            {tag}
          </span>
        ))}
      </div>
      <span className="whitespace-nowrap tabular-nums text-ink-2">
        {groups} {groups === 1 ? 'group' : 'groups'} · {links} {links === 1 ? 'link' : 'links'}
      </span>
      <span>{item.is_published ? <StatusPill tone="live">Published</StatusPill> : <StatusPill tone="neutral">Draft</StatusPill>}</span>
      <span className="text-xs font-semibold text-brand">Edit</span>
    </li>
  );
}

const LearningResourcesList = () => {
  const { data, isLoading } = useList<LearningResource>({
    resource: 'learning-resources',
    pagination: { mode: 'off' },
    sorters: [{ field: 'order_index', order: 'asc' }],
  });
  const { mutateAsync: update } = useUpdate();
  const sensors = useDndSensors();
  // Local order while a reorder is saving, so the list doesn't jump back.
  const [order, setOrder] = useState<string[] | null>(null);
  const items = useMemo(() => {
    const list = [...(data?.data ?? [])].sort((a, b) => a.order_index - b.order_index);
    if (!order) return list;
    const byId = new Map(list.map((item) => [item.id, item]));
    return order.map((id) => byId.get(id)).filter((item): item is LearningResource => Boolean(item));
  }, [data, order]);

  const onDragEnd = async ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) => {
    if (!over || active.id === over.id) return;
    const ids = items.map((item) => item.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    setOrder(next);
    const changed = next
      .map((id, index) => ({ id, index }))
      .filter(({ id, index }) => items.find((item) => item.id === id)?.order_index !== index);
    try {
      await Promise.all(
        changed.map(({ id, index }) =>
          update({
            resource: 'learning-resources',
            id,
            values: { order_index: index },
            mutationMode: 'pessimistic',
            successNotification: false,
          }),
        ),
      );
      notify.success('Order saved');
    } catch {
      notify.error('Could not save the new order.');
    } finally {
      setOrder(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Learning Hub"
        description={`${items.length} resources · drag to set the order students see`}
        actions={
          <Button asChild size="sm">
            <Link to="/learning-resources/create">
              <Plus />
              New resource
            </Link>
          </Button>
        }
      />
      <div className="overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-subtle">
        <div className={`${GRID} border-b border-slate-200/70 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3`}>
          <span />
          <span>Resource</span>
          <span>Tags</span>
          <span>Links</span>
          <span>Status</span>
          <span />
        </div>
        {isLoading ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState icon={<BookOpenText />} title="No resources yet" subtitle="Add a card to show it in the student Learning Hub." />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void onDragEnd(event)}>
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul>
                {items.map((item) => (
                  <Row key={item.id} item={item} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};

export default LearningResourcesList;
