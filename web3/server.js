import http from 'node:http';

const PORT = 3000;
const HOST = '127.0.0.1';

const pages = {
    '/': {
        title: 'Главная',
        content: `
            <h2>Добро пожаловать!</h2>
            <p>Это главная страница прототипа.</p>
        `
    },
    '/about': {
        title: 'Обо мне',
        content: `
            <h2>Информация об авторе</h2>
            <p>Начинающий разработчик, изучающий архитектуру серверов и протокол HTTP.</p>
        `
    },
    '/contacts': {
        title: 'Контакты',
        content: `
            <h2>Обратная связь</h2>
            <p>Email: <a href="mailto:dev@example.com">dev@example.com</a></p>
            <p>Telegram: @developer</p>
        `
    }
};

const navigation = [
    { path: '/', label: 'Главная' },
    { path: '/about', label: 'Обо мне' },
    { path: '/contacts', label: 'Контакты' }
];

function createHtml(title, currentPath, bodyContent) {
    const navLinks = navigation.map(link => {
        const isActive = link.path === currentPath;
        const style = isActive
            ? 'background: #5A9645; color: #fff; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: bold;'
            : 'color: #333; padding: 6px 12px; text-decoration: none; font-weight: bold;';
        return `<a href="${link.path}" style="${style}">${link.label}</a>`;
    }).join(' | ');

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Прототип</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
        nav { display: flex; gap: 10px; align-items: center; background: #f4f4f4; padding: 12px 16px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #ddd; }
        main { border: 1px solid #e1e4e8; border-radius: 8px; padding: 24px; background: #fafafa; }
        h1 { margin-top: 0; color: #222; }
        h2 { margin-top: 0; color: #5A9645; }
    </style>
</head>
<body>
    <nav>
        ${navLinks}
    </nav>
    <main>
        <h1>${title}</h1>
        <div>${bodyContent}</div>
    </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${pathname}`);

    if (pathname === '/favicon.ico') {
        res.writeHead(204);
        res.end();
        return;
    }

    const currentPage = pages[pathname];

    if (currentPage && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(createHtml(currentPage.title, pathname, currentPage.content));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(createHtml('404 — Не найдено', pathname, `<p>Страница <code>${pathname}</code> не существует.</p>`));
    }
});

server.listen(PORT, HOST, () => {
    console.log(`Сервер-прототип запущен: http://${HOST}:${PORT}`);
});