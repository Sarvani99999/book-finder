import React, { useEffect, useState, useRef } from "react";
import "./Book1.css";
import libraryBg from "./assets/librarybg.jpg"; // make sure this file exists

export default function Book1() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [numFound, setNumFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const controllerRef = useRef(null);

  // Handle form submit (manual search)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchTerm(query.trim());
    setPage(1);
  };

  // Fetch data when search term or page changes
  useEffect(() => {
    if (!searchTerm) return;
    doFetch(page, searchTerm);
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, page]);

  async function doFetch(pageToFetch, q) {
    setLoading(true);
    setError(null);

    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    const cleanQuery = encodeURIComponent(q.toLowerCase().replace(/[^a-z0-9]+/g, "+"));
    const url = `https://openlibrary.org/search.json?title=${cleanQuery}&page=${pageToFetch}`;

    try {
      const res = await fetch(url, { signal: controllerRef.current.signal });
      if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
      const data = await res.json();

      const docs = (data.docs || []).map((doc) => ({
        key: doc.key,
        title: doc.title,
        author_name: doc.author_name || [],
        first_publish_year: doc.first_publish_year,
        cover_i: doc.cover_i,
        edition_count: doc.edition_count || 0,
      }));

      setResults(docs);
      setNumFound(data.numFound || 0);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Fetch error", err);
      setError(err.message || "An unknown error occurred");
      setResults([]);
      setNumFound(0);
    } finally {
      setLoading(false);
    }
  }

  const coverUrl = (cover_i) =>
    cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg` : null;

  return (
    <div className="bf-app-bg" style={{ backgroundImage: `url(${libraryBg})` }}>
      <div className="bf-card" role="main" aria-labelledby="bf-title">
        <header className="bf-header">
          <h1 id="bf-title" className="bf-title">📚 Book Finder</h1>
          <p className="bf-sub">Search books by title (Open Library)</p>
        </header>

        {/* SEARCH BAR */}
        <form className="bf-search" onSubmit={handleSearchSubmit}>
          <input
            id="search"
            className="bf-input"
            type="text"
            placeholder="Enter book title, e.g. Harry Potter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <button className="bf-button" type="submit" disabled={loading || !query.trim()}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        <div className="bf-meta">
          <div className="bf-info">
            {numFound > 0 ? (
              <>Showing {results.length} of {numFound.toLocaleString()} results (page {page})</>
            ) : (
              <>{searchTerm ? "No results found" : "Type a title and press Search"}</>
            )}
          </div>
          {/* Pager intentionally removed per request */}
        </div>

        <main>
          {error && <div className="bf-error">Error: {error}</div>}

          {!error && !loading && results.length === 0 && searchTerm && (
            <div className="bf-noresults">No books found for "{searchTerm}".</div>
          )}

          <ul className="bf-list">
            {results.map((book) => (
              <li className="bf-item" key={book.key || `${book.title}-${Math.random()}`}>
                <div className="bf-cover">
                  {book.cover_i ? (
                    <img src={coverUrl(book.cover_i)} alt={`Cover of ${book.title}`} />
                  ) : (
                    <div className="bf-nocover">No cover</div>
                  )}
                </div>
                <div className="bf-details">
                  <h2 className="bf-booktitle">{book.title}</h2>
                  <div className="bf-authors">
                    {book.author_name?.length ? book.author_name.slice(0, 3).join(", ") : "Unknown author"}
                  </div>
                  <div className="bf-year">First published: {book.first_publish_year || "—"}</div>
                  <div className="bf-editions">Editions: {book.edition_count}</div>
                </div>
              </li>
            ))}
          </ul>

          {loading && <div className="bf-loading">Loading results...</div>}
        </main>

        <footer className="bf-footer">
          Data from <a href="https://openlibrary.org/" target="_blank" rel="noreferrer">Open Library</a>
        </footer>
      </div>
    </div>
  );
}
