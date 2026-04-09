const apiBase = import.meta.env.VITE_API_URL || '';

const getBackendOrigin = () => {
  if (!apiBase) {
    return window.location.origin;
  }

  try {
    return new URL(apiBase, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
};

export const toStoredImagePath = (value) => {
  if (!value) return '';

  const text = String(value).trim();
  if (!text) return '';

  if (text.startsWith('/uploads/')) {
    return text;
  }

  if (text.startsWith('uploads/')) {
    return `/${text}`;
  }

  if (/^https?:\/\//i.test(text)) {
    return text;
  }

  return text;
};

export const normalizeImageUrl = (value) => {
  const normalizedPath = toStoredImagePath(value);
  if (!normalizedPath) return '';

  if (/^(data|blob):/i.test(normalizedPath)) {
    return normalizedPath;
  }

  const backendOrigin = getBackendOrigin();
  return `${backendOrigin}/api/upload/file?src=${encodeURIComponent(normalizedPath)}`;
};
