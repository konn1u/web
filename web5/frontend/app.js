import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { NotesAPI } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggleSidebarBtn');
  const notesColumn = document.getElementById('notesColumn');
  const notesListContainer = document.getElementById('notesListContainer');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const searchInput = document.getElementById('searchInput');
  const docTitle = document.getElementById('docTitle');
  const docMeta = document.getElementById('docMeta');
  const saveStatus = document.getElementById('saveStatus');
  const editorToolbar = document.getElementById('editorToolbar');
  const prevNoteBtn = document.getElementById('prevNoteBtn');
  const nextNoteBtn = document.getElementById('nextNoteBtn');
  const deleteNoteBtn = document.getElementById('deleteNoteBtn');

  let currentNotes = [];
  let selectedNoteId = null;
  let searchSequence = 0;
  let isHydratingEditor = false;
  const saveTimers = new Map();

  const WEEKDAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const MONTHS_GENITIVE = [
    'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
    'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
  ];
  const EMPTY_DOCUMENT = { type: 'doc', content: [{ type: 'paragraph' }] };

  const debounce = (callback, delay) => {
    let timer;
    const debounced = (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => callback(...args), delay);
    };
    debounced.cancel = () => clearTimeout(timer);
    return debounced;
  };

  const setStatus = (message, state = '') => {
    saveStatus.textContent = message;
    saveStatus.dataset.state = state;
  };

  let editor;
  editor = new Editor({
    element: document.getElementById('docBody'),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: 'Начните писать заметку…' })
    ],
    content: EMPTY_DOCUMENT,
    editable: false,
    editorProps: {
      attributes: { spellcheck: 'true', 'aria-label': 'Текст заметки' }
    },
    onUpdate: ({ editor: activeEditor }) => {
      if (isHydratingEditor) return;
      const note = currentNotes.find(item => item.id === selectedNoteId);
      if (!note) return;
      note.content = activeEditor.getJSON();
      note.contentText = activeEditor.getText({ blockSeparator: '\n' });
      scheduleSave(note.id);
      renderList();
    },
    onSelectionUpdate: updateToolbar,
    onTransaction: updateToolbar
  });

  toggleBtn.addEventListener('click', () => notesColumn.classList.toggle('minimized'));

  function groupNotesByMonth(notesList) {
    const groups = {};
    notesList.forEach(note => {
      const date = new Date(note.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        const month = date.toLocaleString('ru-RU', { month: 'long' });
        groups[key] = {
          label: `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`,
          items: []
        };
      }
      groups[key].items.push(note);
    });
    return Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(key => groups[key]);
  }

  function updateNavButtons() {
    const index = currentNotes.findIndex(note => note.id === selectedNoteId);
    const unavailable = index === -1;
    deleteNoteBtn.disabled = unavailable;
    prevNoteBtn.disabled = unavailable || index <= 0;
    nextNoteBtn.disabled = unavailable || index >= currentNotes.length - 1;
  }

  function renderList() {
    notesListContainer.replaceChildren();
    if (!currentNotes.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-notes';
      empty.textContent = searchInput.value.trim() ? 'Заметок не найдено' : 'Создайте первую заметку';
      notesListContainer.appendChild(empty);
      updateNavButtons();
      return;
    }

    groupNotesByMonth(currentNotes).forEach(group => {
      const label = document.createElement('div');
      label.className = 'group-label';
      label.textContent = group.label;
      notesListContainer.appendChild(label);

      group.items.forEach(note => {
        const date = new Date(note.createdAt);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `note-card ${note.id === selectedNoteId ? 'active' : ''}`;
        card.dataset.id = note.id;

        const dateBadge = document.createElement('span');
        dateBadge.className = 'date-badge';
        dateBadge.innerHTML = `<span class="day-num">${String(date.getDate()).padStart(2, '0')}</span><span class="day-week">${WEEKDAYS[date.getDay()]}</span>`;
        const preview = document.createElement('span');
        preview.className = 'note-preview';
        const title = document.createElement('span');
        title.className = 'note-title';
        title.textContent = note.title || 'Без названия';
        const snippet = document.createElement('span');
        snippet.className = 'note-snippet';
        snippet.textContent = note.contentText?.split('\n').find(line => line.trim()) || 'Нет текста…';
        preview.append(title, snippet);
        card.append(dateBadge, preview);
        card.addEventListener('click', () => selectNote(note.id));
        notesListContainer.appendChild(card);
      });
    });
    updateNavButtons();
  }

  function selectNote(id) {
    selectedNoteId = id;
    displaySelectedNote();
    renderList();
  }

  function displaySelectedNote() {
    const note = currentNotes.find(item => item.id === selectedNoteId);
    isHydratingEditor = true;
    if (!note) {
      docTitle.value = '';
      docTitle.disabled = true;
      docMeta.textContent = '--';
      editor.commands.setContent(EMPTY_DOCUMENT, { emitUpdate: false });
      editor.setEditable(false);
      setStatus('');
    } else {
      docTitle.disabled = false;
      docTitle.value = note.title;
      editor.commands.setContent(note.content || EMPTY_DOCUMENT, { emitUpdate: false });
      editor.setEditable(true);
      const date = new Date(note.createdAt);
      const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      docMeta.textContent = `${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}, ${time}`;
      setStatus('Сохранено', 'saved');
    }
    isHydratingEditor = false;
    updateToolbar();
    updateNavButtons();
  }

  function scheduleSave(id) {
    clearTimeout(saveTimers.get(id));
    setStatus('Сохранение…', 'saving');
    saveTimers.set(id, setTimeout(() => saveNote(id), 700));
  }

  async function saveNote(id) {
    saveTimers.delete(id);
    const note = currentNotes.find(item => item.id === id);
    if (!note) return;
    try {
      const saved = await NotesAPI.update(id, {
        title: note.title,
        content: note.content,
        contentText: note.contentText
      });
      note.updatedAt = saved.updatedAt;
      if (selectedNoteId === id) setStatus('Сохранено', 'saved');
    } catch (error) {
      if (selectedNoteId === id) setStatus('Ошибка сохранения', 'error');
      console.error(error);
    }
  }

  function updateToolbar() {
    if (!editorToolbar || !editor) return;
    const activeActions = {
      bold: editor.isActive('bold'), italic: editor.isActive('italic'),
      strike: editor.isActive('strike'), code: editor.isActive('code'),
      heading1: editor.isActive('heading', { level: 1 }),
      heading2: editor.isActive('heading', { level: 2 }),
      bulletList: editor.isActive('bulletList'), orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote')
    };
    editorToolbar.querySelectorAll('[data-action]').forEach(button => {
      button.classList.toggle('active', Boolean(activeActions[button.dataset.action]));
      button.disabled = !editor.isEditable ||
        (button.dataset.action === 'undo' && !editor.can().chain().focus().undo().run()) ||
        (button.dataset.action === 'redo' && !editor.can().chain().focus().redo().run());
    });
  }

  editorToolbar.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const commands = {
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      strike: () => editor.chain().focus().toggleStrike().run(),
      code: () => editor.chain().focus().toggleCode().run(),
      heading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      bulletList: () => editor.chain().focus().toggleBulletList().run(),
      orderedList: () => editor.chain().focus().toggleOrderedList().run(),
      blockquote: () => editor.chain().focus().toggleBlockquote().run(),
      undo: () => editor.chain().focus().undo().run(),
      redo: () => editor.chain().focus().redo().run(),
      clear: () => editor.chain().focus().unsetAllMarks().clearNodes().run()
    };
    commands[button.dataset.action]?.();
    updateToolbar();
  });

  prevNoteBtn.addEventListener('click', () => {
    const index = currentNotes.findIndex(note => note.id === selectedNoteId);
    if (index > 0) selectNote(currentNotes[index - 1].id);
  });

  nextNoteBtn.addEventListener('click', () => {
    const index = currentNotes.findIndex(note => note.id === selectedNoteId);
    if (index >= 0 && index < currentNotes.length - 1) selectNote(currentNotes[index + 1].id);
  });

  deleteNoteBtn.addEventListener('click', async () => {
    if (!selectedNoteId) return;
    const id = selectedNoteId;
    const index = currentNotes.findIndex(note => note.id === id);
    clearTimeout(saveTimers.get(id));
    saveTimers.delete(id);
    try {
      await NotesAPI.delete(id);
      currentNotes = currentNotes.filter(note => note.id !== id);
      selectedNoteId = currentNotes[Math.min(index, currentNotes.length - 1)]?.id || null;
      displaySelectedNote();
      renderList();
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  docTitle.addEventListener('input', () => {
    const note = currentNotes.find(item => item.id === selectedNoteId);
    if (!note) return;
    note.title = docTitle.value;
    scheduleSave(note.id);
    renderList();
  });

  newNoteBtn.addEventListener('click', async () => {
    try {
      const newNote = await NotesAPI.create();
      searchInput.value = '';
      currentNotes.unshift(newNote);
      selectNote(newNote.id);
      docTitle.focus();
      docTitle.select();
    } catch (error) {
      setStatus(error.message, 'error');
    }
  });

  const runSearch = debounce(async query => {
    const sequence = ++searchSequence;
    notesListContainer.classList.add('loading');
    try {
      await Promise.all([...saveTimers.keys()].map(id => saveNote(id)));
      const notes = await NotesAPI.fetchAll(query);
      if (sequence !== searchSequence) return;
      currentNotes = notes;
      if (!currentNotes.some(note => note.id === selectedNoteId)) {
        selectedNoteId = currentNotes[0]?.id || null;
        displaySelectedNote();
      }
      renderList();
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      if (sequence === searchSequence) notesListContainer.classList.remove('loading');
    }
  }, 300);

  searchInput.addEventListener('input', () => runSearch(searchInput.value.trim()));

  try {
    currentNotes = await NotesAPI.fetchAll();
    selectedNoteId = currentNotes[0]?.id || null;
    displaySelectedNote();
    renderList();
  } catch (error) {
    notesListContainer.innerHTML = `<div class="empty-notes error-message">${error.message}</div>`;
    setStatus('Нет соединения с API', 'error');
  }
});
