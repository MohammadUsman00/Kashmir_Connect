export function setPageMeta({ title, description, image, url }) {
  if (title) document.title = title;

  const setMeta = (property, content, isName = false) => {
    if (!content) return;
    const attr = isName ? "name" : "property";
    let el = document.querySelector(`meta[${attr}="${property}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, property);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  setMeta("description", description, true);
  setMeta("og:title", title);
  setMeta("og:description", description);
  setMeta("og:image", image);
  setMeta("og:url", url || window.location.href);
  setMeta("twitter:card", "summary_large_image", true);
  setMeta("twitter:title", title, true);
  setMeta("twitter:description", description, true);
}
