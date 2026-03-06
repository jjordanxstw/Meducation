/**
 * Custom Data Provider for Refine
 * Connects to our Express API
 */

import type { DataProvider } from '@refinedev/core';
import axios from 'axios';

const axiosInstance = axios.create({ withCredentials: true });

// Cookies (httpOnly session) are sent automatically via `withCredentials`.

export const dataProvider = (apiUrl: string): DataProvider => ({
  getList: async ({ resource, pagination, filters, sorters }) => {
    const { current = 1, pageSize = 15 } = pagination ?? {};

    const params: Record<string, unknown> = {
      page: current,
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

    const { data } = await axiosInstance.get(`${apiUrl}/${resource}`, { params });

    return {
      data: data.data || [],
      total: data.pagination?.total || data.data?.length || 0,
    };
  },

  getOne: async ({ resource, id }) => {
    const { data } = await axiosInstance.get(`${apiUrl}/${resource}/${id}`);
    return { data: data.data };
  },

  create: async ({ resource, variables }) => {
    const { data } = await axiosInstance.post(`${apiUrl}/${resource}`, variables);
    return { data: data.data };
  },

  update: async ({ resource, id, variables }) => {
    const { data } = await axiosInstance.put(`${apiUrl}/${resource}/${id}`, variables);
    return { data: data.data };
  },

  deleteOne: async ({ resource, id }) => {
    const { data } = await axiosInstance.delete(`${apiUrl}/${resource}/${id}`);
    return { data: data.data };
  },

  getMany: async ({ resource, ids }) => {
    const responses = await Promise.all(
      ids.map((id) => axiosInstance.get(`${apiUrl}/${resource}/${id}`))
    );
    return {
      data: responses.map((response) => response.data.data),
    };
  },

  createMany: async ({ resource, variables }) => {
    const { data } = await axiosInstance.post(`${apiUrl}/${resource}/bulk`, {
      [resource]: variables,
    });
    return { data: data.data };
  },

  deleteMany: async ({ resource, ids }) => {
    await Promise.all(
      ids.map((id) => axiosInstance.delete(`${apiUrl}/${resource}/${id}`))
    );
    return { data: [] };
  },

  updateMany: async ({ resource, ids, variables }) => {
    await Promise.all(
      ids.map((id) => axiosInstance.put(`${apiUrl}/${resource}/${id}`, variables))
    );
    return { data: [] };
  },

  custom: async ({ url, method, filters, sorters, payload, query, headers }) => {
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
