/**
 * Custom Data Provider for Refine
 * Connects to our API with Bearer token authentication
 */

import type { DataProvider } from '@refinedev/core';
import type {
  BaseRecord,
  GetListParams,
  GetListResponse,
  GetOneParams,
  GetOneResponse,
} from '@refinedev/core';
import { authAxios } from './auth-provider';
import { resolveApiErrorMessage } from '../utils/api-error';

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

const inFlightListRequests = new Map<string, Promise<GetListResponse<BaseRecord>>>();
const inFlightGetOneRequests = new Map<string, Promise<GetOneResponse<BaseRecord>>>();

function resolveResourcePath(resource: string): string {
  return ADMIN_RESOURCE_SET.has(resource) ? `admin/${resource}` : resource;
}

function throwMappedDataProviderError(error: unknown): never {
  throw new Error(resolveApiErrorMessage(error));
}

function normalizeParamValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeParamValue(item)).join(',');
  }

  return String(value);
}

function buildListRequestKey(path: string, params: Record<string, unknown>): string {
  const queryString = Object.entries(params)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(normalizeParamValue(value))}`)
    .join('&');

  return `${path}?${queryString}`;
}

export const dataProvider = (apiUrl: string): DataProvider => ({
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    pagination,
    filters,
    sorters,
  }: GetListParams): Promise<GetListResponse<TData>> => {
    try {
      const resourcePath = resolveResourcePath(resource);
      const page = pagination?.current ?? 1;
      const pageSize = pagination?.pageSize ?? 15;

      const params: Record<string, unknown> = {
        page,
        pageSize,
      };

      filters?.forEach((filter) => {
        if ('field' in filter && filter.value !== undefined) {
          params[filter.field] = filter.value;
        }
      });

      if (sorters && sorters.length > 0) {
        params.sortBy = sorters[0].field;
        params.sortOrder = sorters[0].order;
      }

      const requestPath = `${apiUrl}/${resourcePath}`;
      const requestKey = buildListRequestKey(requestPath, params);

      let requestPromise = inFlightListRequests.get(requestKey);
      if (!requestPromise) {
        requestPromise = axiosInstance
          .get(requestPath, { params })
          .then(({ data }): GetListResponse<BaseRecord> => ({
            data: (data.data || []) as BaseRecord[],
            total: data.pagination?.total || data.data?.length || 0,
          }))
          .finally(() => {
            inFlightListRequests.delete(requestKey);
          });

        inFlightListRequests.set(requestKey, requestPromise);
      }

      return (await requestPromise) as GetListResponse<TData>;
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({
    resource,
    id,
  }: GetOneParams): Promise<GetOneResponse<TData>> => {
    try {
      const resourcePath = resolveResourcePath(resource);
      const requestPath = `${apiUrl}/${resourcePath}/${id}`;

      let requestPromise = inFlightGetOneRequests.get(requestPath);
      if (!requestPromise) {
        requestPromise = axiosInstance
          .get(requestPath)
          .then(({ data }): GetOneResponse<BaseRecord> => ({ data: data.data as BaseRecord }))
          .finally(() => {
            inFlightGetOneRequests.delete(requestPath);
          });

        inFlightGetOneRequests.set(requestPath, requestPromise);
      }

      return (await requestPromise) as GetOneResponse<TData>;
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  create: async ({ resource, variables }) => {
    try {
      const resourcePath = resolveResourcePath(resource);
      const { data } = await axiosInstance.post(`${apiUrl}/${resourcePath}`, variables);
      return { data: data.data };
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  update: async ({ resource, id, variables }) => {
    try {
      const resourcePath = resolveResourcePath(resource);
      const { data } = await axiosInstance.put(`${apiUrl}/${resourcePath}/${id}`, variables);
      return { data: data.data };
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  deleteOne: async ({ resource, id }) => {
    try {
      const resourcePath = resolveResourcePath(resource);
      const { data } = await axiosInstance.delete(`${apiUrl}/${resourcePath}/${id}`);
      return { data: data.data };
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  getMany: async ({ resource, ids }) => {
    try {
      const resourcePath = resolveResourcePath(resource);
      const responses = await Promise.all(
        ids.map((id) => axiosInstance.get(`${apiUrl}/${resourcePath}/${id}`))
      );
      return {
        data: responses.map((response) => response.data.data),
      };
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  createMany: async ({ resource, variables }) => {
    try {
      const resourcePath = resolveResourcePath(resource);
      const { data } = await axiosInstance.post(`${apiUrl}/${resourcePath}/bulk`, {
        [resource]: variables,
      });
      return { data: data.data };
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  deleteMany: async ({ resource, ids }) => {
    try {
      const resourcePath = resolveResourcePath(resource);
      await Promise.all(
        ids.map((id) => axiosInstance.delete(`${apiUrl}/${resourcePath}/${id}`))
      );
      return { data: [] };
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  updateMany: async ({ resource, ids, variables }) => {
    try {
      const resourcePath = resolveResourcePath(resource);
      await Promise.all(
        ids.map((id) => axiosInstance.put(`${apiUrl}/${resourcePath}/${id}`, variables))
      );
      return { data: [] };
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  custom: async ({ url, method, payload, query, headers }) => {
    try {
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
    } catch (error) {
      throwMappedDataProviderError(error);
    }
  },

  getApiUrl: () => apiUrl,
});
