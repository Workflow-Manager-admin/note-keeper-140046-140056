import React, { useState, useEffect } from "react";
import "./App.css";
import "./MinimalNotes.css";

// --- Top Navigation Bar ---
function TopNav() {
  return (
    <nav className="nav-top">
      <div className="nav-title">Note Keeper</div>
    </nav>
  );
}

// --- Sidebar for Folders/Tags ---
function Sidebar({ folders, currentFolder, onSelectFolder, onAddFolder }) {
  const [adding, setAdding] = useState(false);
  const [inputValue, setInputValue] = useState("");

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Folders</div>
      <ul className="folder-list">
        {folders.map((f) => (
          <li
            key={f}
            className={f === currentFolder ? "active" : ""}
            onClick={() => onSelectFolder(f)}
          >
            {f}
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        {adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue.trim()) {
                onAddFolder(inputValue.trim());
                setInputValue("");
                setAdding(false);
              }
            }}
          >
            <input
              aria-label="Add folder"
              className="sidebar-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
          </form>
        ) : (
          <button className="sidebar-btn" onClick={() => setAdding(true)}>
            + New Folder
          </button>
        )}
      </div>
    </aside>
  );
}

// --- Notes List ---
function NotesList({ notes, currentId, onSelect, onCreate }) {
  return (
    <div className="notes-list">
      <div className="notes-list-header">
        <span>Notes</span>
        <button className="notes-list-add" onClick={onCreate} aria-label="New note">+</button>
      </div>
      <ul className="notes-ul">
        {notes.length === 0 && (
          <li className="notes-empty">No notes yet.</li>
        )}
        {notes.map((note) => (
          <li
            key={note.id}
            className={note.id === currentId ? "active" : ""}
            onClick={() => onSelect(note.id)}
          >
            <div className="notes-title">{note.title || "Untitled Note"}</div>
            <div className="notes-meta">{note.updatedAt && new Date(note.updatedAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Note Details / Editor ---
function NoteDetails({ note, folders, onChange, onDelete, onSave }) {
  const [editNote, setEditNote] = useState(note || {});
  useEffect(() => {
    setEditNote(note || {});
  }, [note]);

  if (!note) {
    return <div className="note-details note-empty">Select a note<br />or create one.</div>;
  }

  return (
    <div className="note-details">
      <form
        className="note-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...editNote, updatedAt: Date.now() });
        }}
      >
        <input
          className="note-title"
          aria-label="Note title"
          placeholder="Title"
          value={editNote.title || ""}
          onChange={e => setEditNote(n => ({ ...n, title: e.target.value }))}
        />
        <select
          className="note-folder"
          aria-label="Note folder"
          value={editNote.folder || folders[0] || ""}
          onChange={e => setEditNote(n => ({ ...n, folder: e.target.value }))}
        >
          {folders.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <textarea
          className="note-content"
          aria-label="Note content"
          placeholder="Type your note here..."
          value={editNote.content || ""}
          onChange={e => setEditNote(n => ({ ...n, content: e.target.value }))}
          rows={15}
        />
        <div className="note-actions">
          <button type="submit" className="note-save-btn">Save</button>
          <button type="button" className="note-delete-btn" onClick={() => onDelete(editNote.id)}>Delete</button>
        </div>
      </form>
    </div>
  );
}

// --- Utilities: CRUD in localStorage ---
const LS_KEY = "notes-app-notes-v1";
function loadNotes() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
    return [];
  } catch {
    return [];
  }
}
function saveNotes(notes) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

// PUBLIC_INTERFACE
function App() {
  const [folders, setFolders] = useState(["General"]);
  const [notes, setNotes] = useState([]);
  const [currentFolder, setCurrentFolder] = useState("General");
  const [currentNoteId, setCurrentNoteId] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loadedNotes = loadNotes();
    setNotes(loadedNotes);
    const uniqueFolders = ["General", ...[...new Set(loadedNotes.map(n => n.folder || "General"))]];
    setFolders(uniqueFolders);
  }, []);

  // Save to localStorage on notes change
  useEffect(() => {
    saveNotes(notes);
    setFolders((prevFolders) =>
      Array.from(new Set(["General", ...notes.map(n => n.folder || "General")]))
    );
  }, [notes]);

  // Derived list of visible notes (filtered by folder)
  const visibleNotes = notes.filter(n => (n.folder || "General") === currentFolder);

  // PUBLIC_INTERFACE
  const handleSelectFolder = (folder) => {
    setCurrentFolder(folder);
    const firstInFolder = notes.filter(n => (n.folder || "General") === folder)[0];
    setCurrentNoteId(firstInFolder ? firstInFolder.id : null);
  };

  // PUBLIC_INTERFACE
  const handleAddFolder = (folderName) => {
    if (!folders.includes(folderName)) setFolders([...folders, folderName]);
    setCurrentFolder(folderName);
  };

  // PUBLIC_INTERFACE
  const handleCreateNote = () => {
    const note = {
      id: Math.random().toString(36).slice(2, 10),
      title: "",
      content: "",
      folder: currentFolder,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setNotes([note, ...notes]);
    setCurrentNoteId(note.id);
  };

  // PUBLIC_INTERFACE
  const handleSelectNote = (noteId) => setCurrentNoteId(noteId);

  // PUBLIC_INTERFACE
  const handleSaveNote = (editedNote) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === editedNote.id ? { ...n, ...editedNote } : n))
    );
    setCurrentNoteId(editedNote.id);
  };

  // PUBLIC_INTERFACE
  const handleDeleteNote = (noteId) => {
    setNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
    setCurrentNoteId(null);
  };

  const currentNote = notes.find((n) => n.id === currentNoteId);

  return (
    <div className="app-shell">
      <TopNav />
      <div className="main-row">
        <Sidebar
          folders={folders}
          currentFolder={currentFolder}
          onSelectFolder={handleSelectFolder}
          onAddFolder={handleAddFolder}
        />
        <div className="main-content">
          <NotesList
            notes={visibleNotes}
            currentId={currentNoteId}
            onSelect={handleSelectNote}
            onCreate={handleCreateNote}
          />
          <NoteDetails
            note={currentNote}
            folders={folders}
            onChange={() => {}}
            onDelete={handleDeleteNote}
            onSave={handleSaveNote}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
