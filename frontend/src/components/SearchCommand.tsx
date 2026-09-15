import { FileText, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Document } from "../types";

type Props = {
  documents: Document[];
  onOpen: (document: Document) => void;
};

const formatDate = (value: string) => new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
}).format(new Date(value));

export function SearchCommand({ documents, onOpen }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return documents.slice(0, 5);
    return documents.filter((document) => {
      const searchable = [
        document.original_filename,
        document.status,
        ...document.fields.flatMap((field) => [field.field_name, field.field_value]),
      ].join(" ").toLocaleLowerCase();
      return searchable.includes(normalized);
    }).slice(0, 7);
  }, [documents, query]);

  const choose = (document: Document) => {
    onOpen(document);
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  useEffect(() => setActiveIndex(0), [query, open]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
        input.current?.blur();
      }
      if (open && results.length && event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % results.length);
      }
      if (open && results.length && event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + results.length) % results.length);
      }
      if (open && results.length && event.key === "Enter") {
        event.preventDefault();
        choose(results[activeIndex] || results[0]);
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, results, activeIndex]);

  return (
    <div className="search-shell" ref={root}>
      <div className={open ? "search-box active" : "search-box"}>
        <Search size={17} strokeWidth={1.9} />
        <input
          ref={input}
          aria-label="Search documents"
          placeholder="Search by document, field or value…"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {query ? (
          <button className="search-clear" aria-label="Clear search" onClick={() => { setQuery(""); input.current?.focus(); }}><X size={14} /></button>
        ) : null}
      </div>
      {open && (
        <div className="search-results">
          <div className="search-results-head">
            <span>{query ? "Search results" : "Recent documents"}</span>
            {!!results.length && <small>{results.length} shown</small>}
          </div>
          {results.map((document, index) => (
            <button className={activeIndex === index ? "search-result active" : "search-result"} key={document.id} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(document)}>
              <span className="search-pdf"><FileText size={17} /></span>
              <span className="search-result-copy">
                <strong>{document.original_filename}</strong>
                <small>{document.fields.length} fields · {document.page_count} pages</small>
              </span>
              <span className={`search-status ${document.status}`}>{document.status}</span>
              <time>{formatDate(document.created_at)}</time>
            </button>
          ))}
          {!results.length && (
            <div className="search-empty">
              <span><Search size={18} /></span>
              <strong>{documents.length ? "Nothing matched your search" : "No documents to search yet"}</strong>
              <small>{documents.length ? "Try a filename, field name or extracted value." : "Upload a PDF and it will become searchable here."}</small>
            </div>
          )}
          <div className="search-hint"><span><kbd>↑</kbd><kbd>↓</kbd> browse</span><span><kbd>Esc</kbd> close</span></div>
        </div>
      )}
    </div>
  );
}
