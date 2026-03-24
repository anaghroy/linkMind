const textCleaner = (text) => {
  if (!text) return "";

  return text
    .replace(/<[^>]*>/g, "") // remove HTML
    .replace(/\s+/g, " ") // remove extra spaces
    .replace(/[^\w\s.,!?]/g, "") // remove weird chars
    .trim();
};

export default textCleaner;