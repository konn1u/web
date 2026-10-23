const NotesAPI = {
  _notes: [
    {
      id: '1',
      title: 'Впечатления от поездки в Санкт-Петербург',
      content: `Эта поездка была долгожданной. Мы приехали на поезде «Сапсан» утром. Сразу же направились к Эрмитажу. Очередь была, но это того стоило. Коллекция впечатляет, особенно залы с импрессионистами.

Вечером гуляли по Невскому проспекту, смотрели на развод мостов. Это было поистине волшебно. Город светится огнями, и атмосфера просто невероятная. Нашли уютное кафе «Пышечная» на Конюшенной. Обязательно к посещению!

На следующий день посетили Петергоф. Фонтаны работают великолепно. Очень рад, что удалось вырваться на выходные. Ощущение обновления.

Планы на следующий раз: сходить в Мариинку и поехать в Царское Село.`,
      createdAt: '2026-06-22T10:15:00'
    },
    {
      id: '2',
      title: 'Идеи для отпуска в Карелии',
      content: `Маршрут на 4–5 дней:
1. Горный парк Рускеала и Мраморный каньон.
2. Ладожские шхеры на катере.
3. Водопады Ахинкоски.
4. Домик на озере с баней.`,
      createdAt: '2026-06-20T15:40:00'
    },
    {
      id: '3',
      title: 'Планирование бюджета',
      content: `План на месяц:
• Проверить подписки на сервисы.
• Лимит на доставки и кафе.
• Пополнение подушки безопасности.`,
      createdAt: '2026-06-18T12:00:00'
    },
    {
      id: '4',
      title: 'Список книг для чтения',
      content: `1. Мартин Клеппман — Высоконагруженные приложения
2. Роберт Лав — Разработка ядра Linux
3. Герман Гессе — Игра в бисер`,
      createdAt: '2026-06-13T18:30:00'
    },
    {
      id: '5',
      title: 'Housing / Financial Plan',
      content: `Checklist for lease review:
- Contact landlord.
- Verify utility meter readings.
- Check AC filters.`,
      createdAt: '2026-06-10T09:10:00'
    },
    {
      id: '6',
      title: 'Сетевые конфигурации и стенд',
      content: `Развернуть тестовый стенд с изолированными VLAN. Проверить nftables и отсутствие утечек DNS.`,
      createdAt: '2026-05-28T21:15:00'
    },
    {
      id: '7',
      title: 'Исследование UX заметочников',
      content: `Анализ удобства мобильных и планшетных интерфейсов. Высокая скорость отклика, быстрый фокус на тексте.`,
      createdAt: '2026-05-15T11:20:00'
    },
    {
      id: '8',
      title: 'Тренировочный режим',
      content: `Силовые тренировки 3 раза в неделю. Бег на пульсе 135-140 уд/мин. Сон не менее 8 часов.`,
      createdAt: '2026-04-24T08:30:00'
    }
  ],

  async fetchAll() {
    return Promise.resolve([...this._notes]);
  },

  async create() {
    const newNote = {
      id: Date.now().toString(),
      title: 'Новая заметка',
      content: '',
      createdAt: new Date().toISOString()
    };
    this._notes.unshift(newNote);
    return Promise.resolve(newNote);
  },

  async update(id, updatedFields) {
    const index = this._notes.findIndex(n => n.id === id);
    if (index !== -1) {
      this._notes[index] = { ...this._notes[index], ...updatedFields };
      return Promise.resolve(this._notes[index]);
    }
    return Promise.reject(new Error('Note not found'));
  },

  async delete(id) {
    this._notes = this._notes.filter(n => n.id !== id);
    return Promise.resolve(true);
  }
};