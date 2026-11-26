const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Не удалось выполнить запрос');
  }

  return response.status === 204 ? null : response.json();
};

export const NotesAPI = {
  fetchAll(query = '') {
    const search = query ? `?q=${encodeURIComponent(query)}` : '';
    return request(`/api/notes${search}`);
  },

  create() {
    return request('/api/notes', { method: 'POST' });
  },

  update(id, fields) {
    return request(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(fields)
    });
  },

  delete(id) {
    return request(`/api/notes/${id}`, { method: 'DELETE' });
  }
};
