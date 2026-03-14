/**
 * Custom Data Provider for Refine
 * Connects to our API with Bearer token authentication
 */

import type { DataProvider } from '@refinedev/core';
import { authAxios } from './auth-provider';

// Use authAxios which includes Bearer token automatically
const axiosInstance = authAxios;

const ADMIN_RESOURCE_SET = new Set([
  'subjects',
  'sections',
  'lectures',
  'resources',
  'calendar',
  'profiles',
  'audit-logs',
]);

function resolveResourcePath(resource: string): string {
  return ADMIN_RESOURCE_SET.has(resource) ? `admin/${resource}` : resource;
}

export const dataProvider = (apiUrl: string): DataProvider => ({
  getList: async ({ resource, pagination, filters, sorters }) => {
    const resourcePath = resolveResourcePath(resource);
    const page = pagination?.current ?? 1;
    const pageSize = pagination?.pageSize ?? 15;

    const params: Record<string, unknown> = {
      page,
      pageSize,
    };

    // Add filters
    filters?.forEach((filter) => {
      if ('field' in filter && filter.value !== undefined) {
        params[filter.field] = filter.value;
      }
    });

    // Add sorting
    if (sorters && sorters.length > 0) {
      params.sortBy = sorters[0].field;
      params.sortOrder = sorters[0].order;
    }

    const { data } = await axiosInstance.get(`${apiUrl}/${resourcePath}`, { params });

    return {
      data: data.data || [],
      total: data.pagination?.total || data.data?.length || 0,
    };
  },

  getOne: async ({ resource, id }) => {
    const resourcePath = resolveResourcePath(resource);
    const { data } = await axiosInstance.get(`${apiUrl}/${resourcePath}/${id}`);
    return { data: data.data };
  },

  create: async ({ resource, variables }) => {
    const resourcePath = resolveResourcePath(resource);
    const { data } = await axiosInstance.post(`${apiUrl}/${resourcePath}`, variables);
    return { data: data.data };
  },

  update: async ({ resource, id, variables }) => {
    const resourcePath = resolveResourcePath(resource);
    const { data } = await axiosInstance.put(`${apiUrl}/${resourcePath}/${id}`, variables);
    return { data: data.data };
  },

  deleteOne: async ({ resource, id }) => {
    const resourcePath = resolveResourcePath(resource);
    const { data } = await axiosInstance.delete(`${apiUrl}/${resourcePath}/${id}`);
    return { data: data.data };
  },

  getMany: async ({ resource, ids }) => {
    const resourcePath = resolveResourcePath(resource);
    const responses = await Promise.all(
      ids.map((id) => axiosInstance.get(`${apiUrl}/${resourcePath}/${id}`))
    );
    return {
      data: responses.map((response) => response.data.data),
    };
  },

  createMany: async ({ resource, variables }) => {
    const resourcePath = resolveResourcePath(resource);
    const { data } = await axiosInstance.post(`${apiUrl}/${resourcePath}/bulk`, {
      [resource]: variables,
    });
    return { data: data.data };
  },

  deleteMany: async ({ resource, ids }) => {
    const resourcePath = resolveResourcePath(resource);
    await Promise.all(
      ids.map((id) => axiosInstance.delete(`${apiUrl}/${resourcePath}/${id}`))
    );
    return { data: [] };
  },

  updateMany: async ({ resource, ids, variables }) => {
    const resourcePath = resolveResourcePath(resource);
    await Promise.all(
      ids.map((id) => axiosInstance.put(`${apiUrl}/${resourcePath}/${id}`, variables))
    );
    return { data: [] };
  },

  custom: async ({ url, method, payload, query, headers }) => {
    let requestUrl = url;

    if (query) {
      const params = new URLSearchParams(query as Record<string, string>);
      requestUrl = `${url}?${params.toString()}`;
    }

    const { data } = await axiosInstance({
      url: requestUrl,
      method: method || 'get',
      data: payload,
      headers,
    });

    return { data };
  },

  getApiUrl: () => apiUrl,
});
