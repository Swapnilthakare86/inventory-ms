exports.normalizeImagePath = (value) => {
  if (!value) return null;

  const text = String(value).trim();
  if (!text) return null;

  if (text.startsWith('/uploads/')) {
    return text;
  }

  if (text.startsWith('uploads/')) {
    return `/${text}`;
  }

  if (/^https?:\/\//i.test(text)) {
    try {
      const parsed = new URL(text);
      if (parsed.pathname.startsWith('/uploads/')) {
        return parsed.pathname;
      }
    } catch {
      return text;
    }
  }

  return text;
};
