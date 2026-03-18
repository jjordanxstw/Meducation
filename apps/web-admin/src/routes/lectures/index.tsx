/**
 * Lectures List Page
 * Migrated from src/app/lectures/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Lecture, Section, Subject } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const LecturesList = () => {
  const t = useTranslate();
  const { tableProps, setFilters, filters } = useTable<Lecture>({
    syncWithLocation: true,
  });

  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });
  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const sections = useMemo(() => sectionsData?.data || [], [sectionsData?.data]);
  const subjects = useMemo(() => subjectsData?.data || [], [subjectsData?.data]);
  const sectionMap = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const filteredSections = useMemo(() => {
    if (!subjectId) {
      return sections;
    }

    return sections.filter((section) => section.subject_id === subjectId);
  }, [sections, subjectId]);

  const buildFilters = useCallback((searchValue: string) => {
    const nextFilters: Array<{ field: string; operator: 'eq' | 'contains'; value: unknown }> = [];
    if (searchValue.trim()) {
      nextFilters.push({ field: 'search', operator: 'contains', value: searchValue.trim() });
    }
    if (subjectId) {
      nextFilters.push({ field: 'subject_id', operator: 'eq', value: subjectId });
    }
    if (sectionId) {
      nextFilters.push({ field: 'section_id', operator: 'eq', value: sectionId });
    }
    if (typeof isActive === 'boolean') {
      nextFilters.push({ field: 'is_active', operator: 'eq', value: isActive });
    }
    return nextFilters;
  }, [isActive, sectionId, subjectId]);

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const subjectValue = getFilterValue(filters, 'subject_id');
    const sectionValue = getFilterValue(filters, 'section_id');
    const activeValue = getFilterValue(filters, 'is_active');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setSubjectId(typeof subjectValue === 'string' ? subjectValue : undefined);
    setSectionId(typeof sectionValue === 'string' ? sectionValue : undefined);
    setIsActive(typeof activeValue === 'boolean' ? activeValue : undefined);

    hasHydratedFromUrl.current = true;
  }, [filters]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) {
      return;
    }
    setFilters(buildFilters(debouncedSearch), 'replace');
  }, [buildFilters, debouncedSearch, setFilters]);

  useEffect(() => {
    if (!subjectId || !sectionId) {
      return;
    }

    const selectedSection = sectionMap.get(sectionId);
    if (selectedSection && selectedSection.subject_id !== subjectId) {
      setSectionId(undefined);
    }
  }, [sectionId, sectionMap, subjectId]);

  useEffect(() => {
    if (subjectId || !sectionId) {
      return;
    }

    const selectedSection = sectionMap.get(sectionId);
    if (selectedSection?.subject_id) {
      setSubjectId(selectedSection.subject_id);
    }
  }, [sectionId, sectionMap, subjectId]);

  const resetFilters = () => {
    setSearch('');
    setSubjectId(undefined);
    setSectionId(undefined);
    setIsActive(undefined);
    setFilters([], 'replace');
  };

  return (
    <List createButtonProps={{ children: t('buttons.create', {}, 'Create') }}>
      <Space wrap size="small" style={{ marginBottom: 12 }} className="resource-filter-bar">
        <Input.Search
          className="resource-filter-control"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('common.searchPlaceholder', {}, 'Search')}
          style={{ width: 240 }}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={subjectId}
          onChange={(value) => {
            setSubjectId(value);
            setSectionId(undefined);
          }}
          placeholder={t('pages.lectures.fields.subject', {}, 'Subject')}
          style={{ width: 280 }}
          options={subjects.map((subject) => ({
            label: `${subject.code} - ${subject.name}`,
            value: subject.id,
          }))}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={sectionId}
          onChange={(value) => setSectionId(value)}
          placeholder={t('pages.lectures.fields.section', {}, 'Section')}
          style={{ width: 280 }}
          options={filteredSections.map((section) => ({
            label: section.name,
            value: section.id,
          }))}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={isActive}
          onChange={(value) => setIsActive(value)}
          placeholder={t('common.status', {}, 'Status')}
          style={{ width: 160 }}
          options={[
            { label: t('common.active', {}, 'Active'), value: true },
            { label: t('common.inactive', {}, 'Inactive'), value: false },
          ]}
        />
        <Button className="resource-filter-button" onClick={resetFilters}>{t('common.clearFilters', {}, 'Clear')}</Button>
      </Space>

      <Table
        {...tableProps}
        rowKey="id"
        size="small"
        scroll={{ x: 'max-content' }}
      >
        <Table.Column
          dataIndex="section_id"
          title={t('pages.lectures.fields.section', {}, 'Section')}
          ellipsis
          render={(value) => sectionMap.get(value)?.name || value}
        />
        <Table.Column
          title={t('pages.lectures.fields.subject', {}, 'Subject')}
          ellipsis
          render={(_, record: Lecture) => {
            const section = sectionMap.get(record.section_id);
            if (!section) {
              return t('common.notAvailable', {}, '-');
            }

            const subject = subjectMap.get(section.subject_id);
            return subject ? `${subject.code} - ${subject.name}` : t('common.notAvailable', {}, '-');
          }}
        />
        <Table.Column dataIndex="title" title={t('pages.lectures.fields.title', {}, 'Lecture Title')} ellipsis />
        <Table.Column
          dataIndex="lecture_date"
          title={t('pages.lectures.fields.lectureDate', {}, 'Lecture Date')}
          width={120}
          render={(value) => value ? dayjs(value).format('DD/MM/YYYY') : t('common.notAvailable', {}, '-')}
        />
        <Table.Column dataIndex="lecturer_name" title={t('pages.lectures.fields.lecturerName', {}, 'Lecturer')} ellipsis />
        <Table.Column
          dataIndex="order_index"
          title={t('common.order', {}, 'Order')}
          width={80}
          sorter
        />
        <Table.Column
          dataIndex="is_active"
          title={t('common.status', {}, 'Status')}
          width={100}
          render={(value) => (
            <Tag color={value ? 'green' : 'red'}>
              {value ? t('common.active', {}, 'Active') : t('common.inactive', {}, 'Inactive')}
            </Tag>
          )}
        />
        <Table.Column
          title={t('common.actions', {}, 'Actions')}
          fixed="right"
          width={10}
          render={(_, record: Lecture) => (
            <Space size="small">
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
};

export default LecturesList;
