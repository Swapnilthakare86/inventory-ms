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
    return text;
  }

  return text;
};
