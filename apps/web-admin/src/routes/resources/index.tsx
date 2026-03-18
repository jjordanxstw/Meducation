/**
 * Resources List Page
 * Migrated from src/app/resources/page.tsx
 */

import { useList, useTranslate } from '@refinedev/core';
import { List, useTable, EditButton, DeleteButton } from '@refinedev/antd';
import { Button, Input, Select, Space, Table, Tag } from 'antd';
import { ResourceType } from '@medical-portal/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Resource, Lecture, Section, Subject } from '@medical-portal/shared';
import { getFilterValue, useDebouncedValue } from '../../utils/table-filters';

const resourceTypeColors: Record<string, string> = {
  [ResourceType.YOUTUBE]: 'red',
  [ResourceType.GDRIVE_VIDEO]: 'blue',
  [ResourceType.GDRIVE_PDF]: 'green',
  [ResourceType.EXTERNAL]: 'purple',
};

const ResourcesList = () => {
  const t = useTranslate();
  const { tableProps, setFilters, filters } = useTable<Resource>({
    syncWithLocation: true,
  });

  const resourceTypeOptions = [
    { label: `🎬 ${t('pages.resources.types.youtube', {}, 'YouTube')}`, value: ResourceType.YOUTUBE },
    { label: `📹 ${t('pages.resources.types.gdriveVideo', {}, 'Google Drive Video')}`, value: ResourceType.GDRIVE_VIDEO },
    { label: `📄 ${t('pages.resources.types.gdrivePdf', {}, 'Google Drive PDF')}`, value: ResourceType.GDRIVE_PDF },
    { label: `🔗 ${t('pages.resources.types.external', {}, 'External Link')}`, value: ResourceType.EXTERNAL },
  ];

  const { data: lecturesData } = useList<Lecture>({
    resource: 'lectures',
  });
  const { data: sectionsData } = useList<Section>({
    resource: 'sections',
  });
  const { data: subjectsData } = useList<Subject>({
    resource: 'subjects',
  });

  const lectures = lecturesData?.data || [];
  const sections = sectionsData?.data || [];
  const subjects = subjectsData?.data || [];
  const lectureMap = useMemo(() => new Map(lectures.map((l) => [l.id, l])), [lectures]);
  const sectionMap = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections]);

  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [lectureId, setLectureId] = useState<string | undefined>(undefined);
  const [resourceType, setResourceType] = useState<string | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const debouncedSearch = useDebouncedValue(search, 350);
  const hasHydratedFromUrl = useRef(false);

  const filteredSections = useMemo(() => {
    if (!subjectId) {
      return sections;
    }

    return sections.filter((section) => section.subject_id === subjectId);
  }, [sections, subjectId]);

  const filteredLectures = useMemo(() => {
    if (!sectionId) {
      return [];
    }
    return lectures.filter((lecture) => lecture.section_id === sectionId);
  }, [lectures, sectionId]);

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
    if (lectureId) {
      nextFilters.push({ field: 'lecture_id', operator: 'eq', value: lectureId });
    }
    if (resourceType) {
      nextFilters.push({ field: 'type', operator: 'eq', value: resourceType });
    }
    if (typeof isActive === 'boolean') {
      nextFilters.push({ field: 'is_active', operator: 'eq', value: isActive });
    }
    return nextFilters;
  }, [isActive, lectureId, resourceType, sectionId, subjectId]);

  useEffect(() => {
    if (hasHydratedFromUrl.current) {
      return;
    }

    const searchValue = getFilterValue(filters, 'search');
    const subjectValue = getFilterValue(filters, 'subject_id');
    const sectionValue = getFilterValue(filters, 'section_id');
    const lectureValue = getFilterValue(filters, 'lecture_id');
    const typeValue = getFilterValue(filters, 'type');
    const activeValue = getFilterValue(filters, 'is_active');

    setSearch(typeof searchValue === 'string' ? searchValue : '');
    setSubjectId(typeof subjectValue === 'string' ? subjectValue : undefined);
    setSectionId(typeof sectionValue === 'string' ? sectionValue : undefined);
    setLectureId(typeof lectureValue === 'string' ? lectureValue : undefined);
    setResourceType(typeof typeValue === 'string' ? typeValue : undefined);
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
      setLectureId(undefined);
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

  useEffect(() => {
    if (!sectionId || !lectureId) {
      return;
    }

    const selectedLecture = lectureMap.get(lectureId);
    if (selectedLecture && selectedLecture.section_id !== sectionId) {
      setLectureId(undefined);
    }
  }, [lectureId, lectureMap, sectionId]);

  useEffect(() => {
    if (sectionId || !lectureId) {
      return;
    }

    const selectedLecture = lectureMap.get(lectureId);
    if (selectedLecture?.section_id) {
      setSectionId(selectedLecture.section_id);
    }
  }, [lectureId, lectureMap, sectionId]);

  const resetFilters = () => {
    setSearch('');
    setSubjectId(undefined);
    setSectionId(undefined);
    setLectureId(undefined);
    setResourceType(undefined);
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
            setLectureId(undefined);
          }}
          placeholder={t('pages.resources.fields.subject', {}, 'Subject')}
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
          onChange={(value) => {
            setSectionId(value);
            setLectureId(undefined);
          }}
          placeholder={t('pages.resources.fields.section', {}, 'Section')}
          style={{ width: 280 }}
          options={filteredSections.map((section) => ({
            label: section.name,
            value: section.id,
          }))}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={lectureId}
          onChange={(value) => setLectureId(value)}
          placeholder={t('pages.resources.fields.lecture', {}, 'Lecture')}
          style={{ width: 280 }}
          disabled={!sectionId}
          options={filteredLectures.map((lecture) => ({
            label: lecture.title,
            value: lecture.id,
          }))}
        />
        <Select
          className="resource-filter-control"
          allowClear
          value={resourceType}
          onChange={(value) => setResourceType(value)}
          placeholder={t('pages.resources.fields.type', {}, 'Resource Type')}
          style={{ width: 220 }}
          options={resourceTypeOptions}
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
          dataIndex="lecture_id"
          title={t('pages.resources.fields.lecture', {}, 'Lecture')}
          ellipsis
          render={(value) => lectureMap.get(value)?.title || value}
        />
        <Table.Column dataIndex="label" title={t('pages.resources.fields.label', {}, 'Button Label')} ellipsis />
        <Table.Column
          dataIndex="type"
          title={t('pages.resources.fields.type', {}, 'Resource Type')}
          width={150}
          render={(value) => (
            <Tag color={resourceTypeColors[value] || 'default'}>
              {resourceTypeOptions.find((o) => o.value === value)?.label || value}
            </Tag>
          )}
        />
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
          width={120}
          render={(_, record: Resource) => (
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

export default ResourcesList;
