// src/components/ChatInput.jsx
import React, { useState, useEffect, useRef } from "react";
import FileUploader from "./FileUploader";
import CollectionsDropdown from "./CollectionsDropdown";
import { computeMentionToken, replaceMentionText } from "../utils/mentionUtils";

/**
 * ChatInput component:
 * - supports @ and # mentions with suggestion list
 * - '@choice' becomes 'from collection <choice> '
 * - '#choice' becomes 'give summary of <choice> '
 *
 * props:
 *  - onSend(sentMessage, fileList, selectedCollection) async
 */
export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [collection, setCollection] = useState("none");

  // suggestions + source list
  const [collectionsList, setCollectionsList] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);
  const [mentionRange, setMentionRange] = useState(null);

  const textareaRef = useRef(null);

  // Fetch collections initially (keeps local cache for suggestions filtering)
  useEffect(() => {
    let cancelled = false;
    async function fetchCollections() {
      try {
        const res = await fetch("http://localhost:9000/collections");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setCollectionsList(data);
      } catch (err) {
        console.warn("Could not fetch collections:", err);
        if (!cancelled) setCollectionsList([]);
      }
    }
    fetchCollections();
    return () => { cancelled = true; };
  }, []);

  // helper to fetch on demand (when user types trigger)
  async function fetchCollectionsNow() {
    try {
      const res = await fetch("http://localhost:9000/collections");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      if (Array.isArray(data)) setCollectionsList(data);
    } catch (err) {
      console.warn("Could not fetch collections:", err);
    }
  }

  // send handler: same behaviour as your previous code (append collection if chosen)
  async function handleSend() {
    if (!text.trim() && files.length === 0) return;

    const rawMessage = text.trim();
    const fileList = [...files];
    const selectedCollection = collection === "none" ? null : collection;

    let sentMessage = rawMessage;
    if (selectedCollection) {
      sentMessage = rawMessage ? `${rawMessage} from collection ${selectedCollection}` : `from collection ${selectedCollection}`;
    }

    setText("");
    setFiles([]);
    setCollection("none");

    await onSend(sentMessage, fileList, selectedCollection);
  }

  // Replace mention (trigger + token) with phrase and set caret
  function acceptSuggestion(choice) {
    if (!mentionRange) return;
    const { newText, caretPosAfter } = (() => {
      const { newText: nt, caretPosAfter: cp } = (() => {
        const r = replaceMentionText(text, mentionRange, choice);
        return { newText: r.newText, caretPosAfter: r.caretPosAfter };
      })();
      return { newText: nt, caretPosAfter: cp };
    })();

    setText(newText);
    setShowSuggestions(false);
    setSuggestions([]);
    setMentionRange(null);

    // set caret after DOM update
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = caretPosAfter;
      }
    });
  }

  // handle typing in textarea
  function handleTextareaChange(e) {
    const value = e.target.value;
    const caretPos = e.target.selectionStart;
    setText(value);

    // if user typed a new trigger char, refresh collections
    if (value[caretPos - 1] === "@" || value[caretPos - 1] === "#") {
      fetchCollectionsNow();
    }

    const mention = computeMentionToken(value, caretPos);
    if (mention) {
      const q = mention.token.toLowerCase();
      const filtered = collectionsList.filter((c) => c.toLowerCase().includes(q));
      setSuggestions(filtered);
      setShowSuggestions(true);
      setSelectedSuggestionIdx(0);
      setMentionRange(mention);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionRange(null);
    }
  }

  // keyboard handling
  function handleKeyDown(e) {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIdx((s) => (s + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIdx((s) => (s - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        setSuggestions([]);
        setMentionRange(null);
        return;
      }
      if (e.key === "Enter") {
        // accept suggestion instead of sending
        e.preventDefault();
        const chosen = suggestions[selectedSuggestionIdx] ?? suggestions[0];
        acceptSuggestion(chosen);
        return;
      }
    }

    // send on Enter without Shift if suggestions not open
    if (e.key === "Enter" && !e.shiftKey && !showSuggestions) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSuggestionClick(idx) {
    const chosen = suggestions[idx];
    acceptSuggestion(chosen);
  }

  // Close suggestions if clicking outside
  useEffect(() => {
    function onDocClick(evt) {
      if (!textareaRef.current) return;
      if (evt.target === textareaRef.current) return;
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionRange(null);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="chat-input">
      <div className="input-container">
        <FileUploader onUploaded={(meta) => setFiles(prev => [...prev, meta])} />
        {/* <CollectionsDropdown
          apiUrl="http://localhost:9000/collections"
          value={collection}
          onChange={(v) => setCollection(v)}
          includeNone={true}
        /> */}

        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            value={text}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-list" role="listbox">
              {suggestions.map((s, idx) => (
                <li
                  key={s}
                  onMouseDown={(ev) => ev.preventDefault()}
                  onClick={() => handleSuggestionClick(idx)}
                  className={`suggestion-item ${idx === selectedSuggestionIdx ? 'selected' : ''}`}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        className="icon-btn send-btn"
        onClick={handleSend}
        aria-label="Send message"
        title="Send (Enter)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path fillRule="evenodd" d="M4.10514201,11.8070619 L2.74013818,2.2520351 L22.236068,12 L2.74013818,21.7479649 L4.10514201,12.1929381 L4.87689437,12 L4.10514201,11.8070619 Z M5.25986182,5.7479649 L5.89485799,10.1929381 L13.1231056,12 L5.89485799,13.8070619 L5.25986182,18.2520351 L17.763932,12 L5.25986182,5.7479649 Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
