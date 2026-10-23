document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggleSidebarBtn');
  const notesColumn = document.getElementById('notesColumn');
  const notesListContainer = document.getElementById('notesListContainer');
  const newNoteBtn = document.getElementById('newNoteBtn');
  const searchInput = document.getElementById('searchInput');
  const docTitle = document.getElementById('docTitle');
  const docBody = document.getElementById('docBody');
  const docMeta = document.getElementById('docMeta');

  const prevNoteBtn = document.getElementById('prevNoteBtn');
  const nextNoteBtn = document.getElementById('nextNoteBtn');
  const deleteNoteBtn = document.getElementById('deleteNoteBtn');

  let currentNotes = [];
  let selectedNoteId = null;

  const WEEKDAYS = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  const MONTHS_GENITIVE = [
    'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
    'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
  ];

  // Переключение ширины панели
  toggleBtn.addEventListener('click', () => {
    notesColumn.classList.toggle('minimized');
  });

  // Фильтрация заметок по поисковой строке
  function getVisibleNotes() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return currentNotes;
    return currentNotes.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content.toLowerCase().includes(query)
    );
  }

  // Группировка заметок по месяцам (от новых к старым)
  function groupNotesByMonth(notesList) {
    const groups = {};

    notesList.forEach(note => {
      const d = new Date(note.createdAt);
      const year = d.getFullYear();
      const month = d.getMonth();
      const groupKey = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!groups[groupKey]) {
        const monthName = d.toLocaleString('ru-RU', { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        groups[groupKey] = {
          label: `${capitalizedMonth} ${year}`,
          items: []
        };
      }
      groups[groupKey].items.push(note);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => groups[key]);
  }

  // Обновление доступности кнопок навигации < и >
  function updateNavButtons() {
    const list = getVisibleNotes();
    const index = list.findIndex(n => n.id === selectedNoteId);

    if (index === -1) {
      prevNoteBtn.disabled = true;
      nextNoteBtn.disabled = true;
      deleteNoteBtn.disabled = true;
      return;
    }

    deleteNoteBtn.disabled = false;
    prevNoteBtn.disabled = (index <= 0);
    nextNoteBtn.disabled = (index >= list.length - 1);
  }

  // Отрисовка списка с разделением по месяцам
  function renderList() {
    const list = getVisibleNotes();
    notesListContainer.innerHTML = '';

    if (list.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.padding = '20px 16px';
      emptyMsg.style.fontSize = '12px';
      emptyMsg.style.color = 'var(--text-muted)';
      emptyMsg.textContent = 'Заметок не найдено';
      notesListContainer.appendChild(emptyMsg);
      updateNavButtons();
      return;
    }

    const monthGroups = groupNotesByMonth(list);

    monthGroups.forEach(group => {
      const groupLabel = document.createElement('div');
      groupLabel.className = 'group-label';
      groupLabel.textContent = group.label;
      notesListContainer.appendChild(groupLabel);

      group.items.forEach(note => {
        const d = new Date(note.createdAt);
        const day = String(d.getDate()).padStart(2, '0');
        const weekday = WEEKDAYS[d.getDay()];

        const card = document.createElement('div');
        card.className = `note-card ${note.id === selectedNoteId ? 'active' : ''}`;
        card.dataset.id = note.id;

        const firstLine = note.content.split('\n').find(l => l.trim().length > 0) || 'Нет текста...';

        card.innerHTML = `
          <div class="date-badge">
            <span class="day-num">${day}</span>
            <span class="day-week">${weekday}</span>
          </div>
          <div class="note-preview">
            <div class="note-title">${note.title || 'Без названия'}</div>
            <div class="note-snippet">${firstLine}</div>
          </div>
        `;

        card.addEventListener('click', () => {
          selectedNoteId = note.id;
          displaySelectedNote();
          renderList();
        });

        notesListContainer.appendChild(card);
      });
    });

    updateNavButtons();
  }

  // Отображение выбранной заметки в окне редактора
  function displaySelectedNote() {
    const note = currentNotes.find(n => n.id === selectedNoteId);
    if (!note) {
      docTitle.value = '';
      docBody.textContent = '';
      docMeta.textContent = '--';
      docTitle.disabled = true;
      docBody.contentEditable = 'false';
      updateNavButtons();
      return;
    }

    docTitle.disabled = false;
    docBody.contentEditable = 'true';
    docTitle.value = note.title;
    docBody.textContent = note.content;

    const d = new Date(note.createdAt);
    const day = d.getDate();
    const month = MONTHS_GENITIVE[d.getMonth()];
    const year = d.getFullYear();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    docMeta.textContent = `${day} ${month} ${year}, ${time}`;

    updateNavButtons();
  }

  // Навигация кнопками < и >
  prevNoteBtn.addEventListener('click', () => {
    const list = getVisibleNotes();
    const index = list.findIndex(n => n.id === selectedNoteId);
    if (index > 0) {
      selectedNoteId = list[index - 1].id;
      displaySelectedNote();
      renderList();
    }
  });

  nextNoteBtn.addEventListener('click', () => {
    const list = getVisibleNotes();
    const index = list.findIndex(n => n.id === selectedNoteId);
    if (index !== -1 && index < list.length - 1) {
      selectedNoteId = list[index + 1].id;
      displaySelectedNote();
      renderList();
    }
  });

  // Удаление заметки
  deleteNoteBtn.addEventListener('click', async () => {
    if (!selectedNoteId) return;

    const list = getVisibleNotes();
    const currentIndex = list.findIndex(n => n.id === selectedNoteId);

    await NotesAPI.delete(selectedNoteId);
    currentNotes = currentNotes.filter(n => n.id !== selectedNoteId);

    const remainingList = getVisibleNotes();
    if (remainingList.length > 0) {
      const nextIndex = currentIndex < remainingList.length ? currentIndex : remainingList.length - 1;
      selectedNoteId = remainingList[nextIndex].id;
    } else {
      selectedNoteId = null;
    }

    displaySelectedNote();
    renderList();
  });

  // Редактирование в реальном времени
  docTitle.addEventListener('input', () => {
    const note = currentNotes.find(n => n.id === selectedNoteId);
    if (!note) return;
    note.title = docTitle.value;
    NotesAPI.update(note.id, { title: note.title });
    renderList();
  });

  docBody.addEventListener('input', () => {
    const note = currentNotes.find(n => n.id === selectedNoteId);
    if (!note) return;
    note.content = docBody.textContent;
    NotesAPI.update(note.id, { content: note.content });
    renderList();
  });

  // Создание новой заметки
  newNoteBtn.addEventListener('click', async () => {
    const newNote = await NotesAPI.create();
    currentNotes.unshift(newNote);
    selectedNoteId = newNote.id;
    searchInput.value = '';
    renderList();
    displaySelectedNote();
    docTitle.focus();
  });

  // Поиск по заметкам
  searchInput.addEventListener('input', () => {
    renderList();
    updateNavButtons();
  });

  // Инициализация
  currentNotes = await NotesAPI.fetchAll();
  if (currentNotes.length > 0) {
    selectedNoteId = currentNotes[0].id;
    displaySelectedNote();
  }
  renderList();
});