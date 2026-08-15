// ============================================================
// FIREBASE CONFIG
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyA9xIIgwbaZ5NKRgGHDGz7lju6q2saTzAc",
    authDomain: "partia-cd6f6.firebaseapp.com",
    databaseURL: "https://partia-cd6f6-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "partia-cd6f6",
    storageBucket: "partia-cd6f6.firebasestorage.app",
    messagingSenderId: "475319454951",
    appId: "1:475319454951:web:71c094e33294dd867f2642",
    measurementId: "G-5H68M6P64D"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) link.classList.add('active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
}

// ============================================================
// ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE
// ============================================================
async function loadData(path) {
    const snapshot = await database.ref(path).once('value');
    return snapshot.val();
}

async function loadMembers() {
    const data = await loadData('members');
    if (!data) return [];
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
}

async function loadNews() {
    const data = await loadData('news');
    if (!data) return [];
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
}

async function loadUsers() {
    const data = await loadData('users');
    if (!data) return [];
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
}

// ============================================================
// УПРАВЛЕНИЕ РЕЖИМОМ ТЕХНИЧЕСКИХ РАБОТ
// ============================================================
let maintenanceMode = false;
let isAdminLoggedIn = false;

async function checkMaintenanceMode() {
    const settings = await loadData('settings');
    maintenanceMode = settings && settings.maintenanceMode === true;

    // Проверяем, авторизован ли админ
    isAdminLoggedIn = localStorage.getItem('admin_logged_in') === 'true';

    const overlay = document.getElementById('maintenanceOverlay');
    const mainContent = document.getElementById('mainHeader');

    if (maintenanceMode && !isAdminLoggedIn) {
        // Показываем заглушку, скрываем основной контент
        overlay.style.display = 'flex';
        mainContent.style.display = 'none';
        document.querySelectorAll('.page-section').forEach(el => el.style.display = 'none');
        document.querySelector('main .container').style.display = 'none';
        document.querySelector('footer').style.display = 'none';
    } else {
        // Показываем сайт
        overlay.style.display = 'none';
        mainContent.style.display = 'block';
        document.querySelectorAll('.page-section').forEach(el => el.style.display = '');
        document.querySelector('main .container').style.display = '';
        document.querySelector('footer').style.display = '';
    }

    // Обновляем чекбокс в настройках
    const cb = document.getElementById('maintenanceMode');
    if (cb) cb.checked = maintenanceMode;
}

// Кнопка входа на заглушке
document.getElementById('maintenanceLoginBtn').addEventListener('click', function() {
    openModal('loginModal');
});

// ============================================================
// РЕНДЕР КОМПОНЕНТОВ
// ============================================================
async function renderNews() {
    const news = await loadNews();
    const homeGrid = document.getElementById('newsGridHome');
    const pressList = document.getElementById('pressArticlesList');
    const adminList = document.getElementById('adminNewsList');

    if (homeGrid) {
        homeGrid.innerHTML = news.map(item => `
            <div class="news-card">
                <div class="date">${item.date}</div>
                <h4>${item.title}</h4>
                <p>${item.text}</p>
                <a href="#" class="read-more" data-page="press">Читать →</a>
            </div>
        `).join('');
    }

    if (pressList) {
        pressList.innerHTML = news.map(item => `
            <div class="press-article">
                <div class="date">${item.date}</div>
                <h4>${item.title}</h4>
                <p>${item.text}</p>
            </div>
        `).join('');
    }

    if (adminList) {
        adminList.innerHTML = news.map(item => `
            <div class="admin-news-item">
                <div class="info">
                    <div class="title">${item.title}</div>
                    <div class="date">${item.date}</div>
                </div>
                <button class="btn btn-danger btn-sm" data-news-id="${item.id}">Удалить</button>
            </div>
        `).join('');

        adminList.querySelectorAll('[data-news-id]').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.dataset.newsId;
                if (confirm('Удалить эту новость?')) {
                    await database.ref(`news/${id}`).remove();
                    await renderNews();
                }
            });
        });
    }
}

async function renderComposition() {
    const members = await loadMembers();
    const container = document.getElementById('compositionContainer');
    if (!container) return;

    const leaders = members.filter(m => m.role === 'leader');
    const deputies = members.filter(m => m.role === 'deputy');
    const membersList = members.filter(m => m.role === 'member');

    let html = '';
    if (leaders.length) {
        html += `<div class="comp-section"><h2>Руководство</h2><div class="comp-grid">`;
        leaders.forEach(m => {
            const photoHtml = m.photo && m.photo.startsWith('data:image') ?
                `<img class="comp-photo" src="${m.photo}" alt="${m.name}" />` :
                `<div class="comp-photo" style="display:flex;align-items:center;justify-content:center;background:var(--light-gray);color:var(--dark-blue);font-size:32px;font-weight:700;">${m.name.charAt(0)}</div>`;
            html += `
                <div class="comp-card">
                    ${photoHtml}
                    <div class="name">${m.name}</div>
                    <div class="position">${m.position || 'Без должности'}</div>
                    <div class="role">Руководство</div>
                </div>
            `;
        });
        html += `</div></div>`;
    }
    if (deputies.length) {
        html += `<div class="comp-section"><h2>Депутаты</h2><div class="comp-grid">`;
        deputies.forEach(m => {
            const photoHtml = m.photo && m.photo.startsWith('data:image') ?
                `<img class="comp-photo" src="${m.photo}" alt="${m.name}" />` :
                `<div class="comp-photo" style="display:flex;align-items:center;justify-content:center;background:var(--light-gray);color:var(--dark-blue);font-size:32px;font-weight:700;">${m.name.charAt(0)}</div>`;
            html += `
                <div class="comp-card">
                    ${photoHtml}
                    <div class="name">${m.name}</div>
                    <div class="position">${m.position || 'Депутат'}</div>
                    <div class="role">Депутат</div>
                </div>
            `;
        });
        html += `</div></div>`;
    }
    if (membersList.length) {
        html += `<div class="comp-section"><h2>Члены партии</h2><div class="comp-grid">`;
        membersList.forEach(m => {
            const photoHtml = m.photo && m.photo.startsWith('data:image') ?
                `<img class="comp-photo" src="${m.photo}" alt="${m.name}" />` :
                `<div class="comp-photo" style="display:flex;align-items:center;justify-content:center;background:var(--light-gray);color:var(--dark-blue);font-size:32px;font-weight:700;">${m.name.charAt(0)}</div>`;
            html += `
                <div class="comp-card">
                    ${photoHtml}
                    <div class="name">${m.name}</div>
                    <div class="position">${m.position || 'Член партии'}</div>
                    <div class="role">Член партии</div>
                </div>
            `;
        });
        html += `</div></div>`;
    }
    container.innerHTML = html || '<p>Состав пока пуст.</p>';
    document.getElementById('totalMembers').textContent = members.length;
}

async function renderApplications() {
    const users = await loadUsers();
    const applications = users.filter(u => u.status !== undefined);
    const list = document.getElementById('applicationsList');
    if (!list) return;

    if (applications.length === 0) {
        list.innerHTML = '<p>Заявок пока нет.</p>';
        return;
    }

    list.innerHTML = applications.map(user => `
        <div class="application-item">
            <div class="app-header">
                <span class="app-name">${user.fullName}</span>
                <span class="app-status ${user.status}">${user.status === 'pending' ? 'На рассмотрении' : user.status === 'approved' ? 'Одобрена' : 'Отклонена'}</span>
            </div>
            <div class="app-details">
                <p><strong>Возраст (IC):</strong> ${user.icAge} | <strong>OOC:</strong> ${user.oocAge}</p>
                <p><strong>Паспорт:</strong> ${user.passport} | <strong>Discord:</strong> ${user.discord}</p>
                <p><strong>Идеология:</strong> ${user.ideology || 'Не указана'}</p>
                <p><strong>Почему наша партия:</strong> ${user.reason || 'Не указано'}</p>
                <p><strong>Поддержка:</strong> ${user.support}</p>
                ${user.passportLink ? `<p><strong>Ссылка на паспорт:</strong> <a href="${user.passportLink}" target="_blank">${user.passportLink}</a></p>` : ''}
            </div>
            ${user.status === 'pending' ? `
            <div class="app-actions">
                <button class="btn btn-success btn-sm" data-user-id="${user.id}" data-action="approve">Одобрить</button>
                <button class="btn btn-danger btn-sm" data-user-id="${user.id}" data-action="reject">Отклонить</button>
            </div>` : ''}
        </div>
    `).join('');

    list.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const userId = this.dataset.userId;
            const action = this.dataset.action;
            const usersList = await loadUsers();
            const user = usersList.find(u => u.id === userId);
            if (!user) return;

            if (action === 'approve') {
                user.status = 'approved';
                await database.ref(`users/${userId}`).update({ status: 'approved' });
                await database.ref('members').push({
                    name: user.fullName,
                    position: 'Член партии',
                    photo: '',
                    role: 'member'
                });
                await renderApplications();
                await renderComposition();
                await renderAdminMembers();
            } else if (action === 'reject') {
                user.status = 'rejected';
                await database.ref(`users/${userId}`).update({ status: 'rejected' });
                await renderApplications();
            }
        });
    });
}

async function renderAdminMembers() {
    const members = await loadMembers();
    const list = document.getElementById('adminMembersList');
    if (!list) return;
    if (members.length === 0) {
        list.innerHTML = '<p>В составе никого нет.</p>';
        return;
    }
    list.innerHTML = members.map(m => `
        <div class="admin-news-item">
            <div class="info">
                <div class="title">${m.name}</div>
                <div class="date">${m.position || 'Без должности'} • ${m.role === 'leader' ? 'Руководство' : m.role === 'deputy' ? 'Депутат' : 'Член партии'}</div>
            </div>
            <div class="btn-group">
                <button class="btn btn-danger btn-sm" data-member-id="${m.id}">Удалить</button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('[data-member-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.memberId;
            if (confirm('Удалить этого члена из состава?')) {
                await database.ref(`members/${id}`).remove();
                await renderAdminMembers();
                await renderComposition();
            }
        });
    });
}

async function renderAdminUsers() {
    const users = await loadUsers();
    const list = document.getElementById('adminUsersList');
    if (!list) return;
    if (users.length === 0) {
        list.innerHTML = '<p>Пользователей пока нет.</p>';
        return;
    }
    list.innerHTML = users.map(u => `
        <div class="admin-news-item">
            <div class="info">
                <div class="title">${u.fullName}</div>
                <div class="date">Паспорт: ${u.passport} • Роль: ${u.role || 'пользователь'}</div>
            </div>
            <div class="btn-group">
                <button class="btn btn-danger btn-sm" data-user-id="${u.id}">Удалить</button>
            </div>
        </div>
    `).join('');

    list.querySelectorAll('[data-user-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.userId;
            if (confirm('Удалить этого пользователя?')) {
                await database.ref(`users/${id}`).remove();
                await renderAdminUsers();
            }
        });
    });
}

async function renderElections() {
    const elections = await loadData('elections');
    const container = document.getElementById('electionsBlockContainer');
    if (!container) return;

    if (!elections || !elections.parties || elections.parties.length === 0) {
        container.innerHTML = '<p>Данные о выборах временно отсутствуют.</p>';
        return;
    }

    let html = `
        <div class="election-results">
            <h3>Итоги выборов</h3>
    `;
    elections.parties.forEach(p => {
        html += `
            <div class="result-item">
                <span class="party">${p.name}</span>
                <span class="percent">${p.percent}%</span>
            </div>
        `;
    });
    html += `
            <div class="election-date">
                🗳️ Предстоящие выборы: ${elections.date || 'Не указана'} &nbsp; ${elections.time || ''}
            </div>
        </div>
    `;

    if (elections.footer || elections.footerDate) {
        html += `
            <div style="background:var(--white); border-radius:var(--radius); padding:20px 22px; box-shadow:var(--shadow); margin-top:20px; border-left:4px solid var(--red);">
                <p style="font-weight:600; color:var(--dark-blue);">🇷🇺 ${elections.footer || ''}</p>
                ${elections.footerDate ? `<p style="font-size:12px; color:var(--red); font-weight:600; margin-top:4px;">${elections.footerDate}</p>` : ''}
            </div>
        `;
    }

    container.innerHTML = html;
}

async function renderSymbols() {
    const settings = await loadData('settings');
    const container = document.getElementById('symbolsContainer');
    if (!container) return;

    const symbols = [
        { key: 'symbol_gerb', label: 'Герб ВЦПП', desc: 'Официальный герб партии.' },
        { key: 'symbol_stamp', label: 'Штамп', desc: 'Официальный штамп организации.' },
        { key: 'symbol_seal', label: 'Печать', desc: 'Официальная печать партии.' }
    ];

    let html = '';
    symbols.forEach(s => {
        const imgData = settings && settings[s.key];
        const imgHtml = imgData && imgData.startsWith('data:image') ?
            `<img src="${imgData}" alt="${s.label}" style="max-width:200px; max-height:200px; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />` :
            `<div style="width:200px; height:200px; display:flex; align-items:center; justify-content:center; background:var(--light-gray); border-radius:12px; color:#6a7a8e; font-size:14px;">Изображение не загружено</div>`;
        html += `
            <div class="symbol-card">
                <div class="symbol-image">${imgHtml}</div>
                <h3>${s.label}</h3>
                <p>${s.desc}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ============================================================
// НАСТРОЙКИ ВИДИМОСТИ И КОНТЕНТА
// ============================================================
async function loadVisibilitySettings() {
    const settings = await loadData('settings');
    const visibility = settings && settings.visibility ? settings.visibility : {};
    const checkboxes = ['showElections', 'showComposition', 'showPress', 'showSymbols', 'showAbout', 'showJoin', 'showHistory', 'showDocs'];
    checkboxes.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = visibility[id] !== false;
    });
    applyVisibility(visibility);
}

function applyVisibility(visibility) {
    document.querySelectorAll('#mainNav a').forEach(link => {
        const page = link.dataset.page;
        const map = {
            about: 'showAbout',
            symbols: 'showSymbols',
            composition: 'showComposition',
            press: 'showPress',
            join: 'showJoin',
            history: 'showHistory',
            docs: 'showDocs'
        };
        if (page && map[page]) {
            link.style.display = visibility[map[page]] !== false ? '' : 'none';
        }
    });
}

async function loadContentSettings() {
    const settings = await loadData('settings');
    const content = settings && settings.content ? settings.content : {};
    const heroTitleInput = document.getElementById('heroTitleInput');
    const heroSubtitleInput = document.getElementById('heroSubtitleInput');
    const missionTextInput = document.getElementById('missionTextInput');
    if (heroTitleInput) heroTitleInput.value = content.heroTitle || '';
    if (heroSubtitleInput) heroSubtitleInput.value = content.heroSubtitle || '';
    if (missionTextInput) missionTextInput.value = content.missionText || '';
    applyContent(content);
}

function applyContent(content) {
    const heroTitle = document.getElementById('heroTitle');
    const heroSubtitle = document.getElementById('heroSubtitle');
    const missionText = document.getElementById('missionText');
    if (heroTitle) heroTitle.innerHTML = content.heroTitle || 'Построим будущее вместе с «Новой Россией»';
    if (heroSubtitle) heroSubtitle.textContent = content.heroSubtitle || 'Наша программа, история и цели для создания лучшего завтра. Присоединяйтесь к движению на сервере Рублевка RMRP.';
    if (missionText) missionText.textContent = content.missionText || 'Всероссийская центристская политическая партия «Новая Россия» — это политическая сила, объединяющая граждан, стремящихся к построению свободного, справедливого и процветающего общества. Мы верим в силу демократических институтов, верховенство права и свободу личности. Наша цель — создание условий, при которых каждый гражданин сможет реализовать свой потенциал.';
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
async function initApp() {
    await checkMaintenanceMode();

    // Если сайт в режиме техработ и админ не залогинен – не грузим остальное
    if (maintenanceMode && !isAdminLoggedIn) {
        console.log('🔧 Режим технических работ. Доступ только для администратора.');
        return;
    }

    await renderNews();
    await renderComposition();
    await renderApplications();
    await renderAdminMembers();
    await renderElections();
    await renderSymbols();
    await renderAdminUsers();
    await loadVisibilitySettings();
    await loadContentSettings();

    const members = await loadMembers();
    document.getElementById('totalMembers').textContent = members.length;

    // Восстановление состояния админа
    if (localStorage.getItem('admin_logged_in') === 'true') {
        document.getElementById('loginBtn').textContent = 'Админ-панель';
        document.getElementById('loginBtn').classList.add('logged-in');
    }
    console.log('✅ Приложение инициализировано');
}

// ============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {

    // ----- НАВИГАЦИЯ -----
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) showPage(page);
        });
    });

    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', function(e) {
            const page = this.dataset.page;
            if (page) {
                e.preventDefault();
                showPage(page);
            }
        });
    });

    // ----- КНОПКА "ВХОД" (админ) -----
    document.getElementById('loginBtn').addEventListener('click', function() {
        if (localStorage.getItem('admin_logged_in') === 'true') {
            openModal('adminModal');
            renderApplications();
            renderAdminMembers();
            renderAdminUsers();
            loadVisibilitySettings();
            loadContentSettings();
        } else {
            openModal('loginModal');
        }
    });

    // ----- КНОПКА "ЛИЧНЫЙ КАБИНЕТ" -----
    document.getElementById('profileBtn').addEventListener('click', function() {
        openModal('profileModal');
        const userId = localStorage.getItem('user_id');
        if (userId) {
            loadUsers().then(users => {
                const user = users.find(u => u.id === userId && u.status === 'registered');
                if (user) {
                    showProfileContent(user);
                } else {
                    document.getElementById('profileLoginForm').style.display = 'block';
                    document.getElementById('profileContent').style.display = 'none';
                }
            });
        } else {
            document.getElementById('profileLoginForm').style.display = 'block';
            document.getElementById('profileContent').style.display = 'none';
        }
    });

    // ----- ЗАКРЫТИЕ МОДАЛОК -----
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) modal.classList.remove('open');
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('open');
        });
    });

    // ----- ЛОГИН АДМИНА -----
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        if (username === 'admin' && password === 'admin') {
            localStorage.setItem('admin_logged_in', 'true');
            document.getElementById('loginBtn').textContent = 'Админ-панель';
            document.getElementById('loginBtn').classList.add('logged-in');
            closeModal('loginModal');
            openModal('adminModal');
            renderApplications();
            renderAdminMembers();
            renderAdminUsers();
            loadVisibilitySettings();
            loadContentSettings();
            // Перезапускаем проверку техработ, чтобы скрыть заглушку
            checkMaintenanceMode();
        } else {
            alert('Неверный логин или пароль!');
        }
    });

    // ----- ВЫХОД ИЗ АДМИНКИ -----
    document.getElementById('adminLogoutBtn').addEventListener('click', function() {
        localStorage.removeItem('admin_logged_in');
        document.getElementById('loginBtn').textContent = 'Вход';
        document.getElementById('loginBtn').classList.remove('logged-in');
        closeModal('adminModal');
        checkMaintenanceMode();
    });

    // ----- РЕГИСТРАЦИЯ (с паролем) -----
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const fullName = document.getElementById('regFullName').value.trim();
        const district = document.getElementById('regDistrict').value.trim();
        const passport = document.getElementById('regPassport').value.trim();
        const age = parseInt(document.getElementById('regAge').value);
        const discord = document.getElementById('regDiscord').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        if (!fullName || !district || !passport || !age || !discord || !password) {
            alert('Заполните все поля!');
            return;
        }

        const users = await loadUsers();
        if (users.some(u => u.passport === passport)) {
            alert('Пользователь с таким паспортом уже зарегистрирован.');
            return;
        }

        const newUser = { fullName, district, passport, age, discord, password, role: 'user', status: 'registered' };
        await database.ref('users').push(newUser);
        alert('✅ Регистрация успешна! Теперь войдите в личный кабинет.');
        closeModal('registerModal');
        document.getElementById('profileLoginForm').style.display = 'block';
        document.getElementById('profileContent').style.display = 'none';
        this.reset();
    });

    // ----- ПЕРЕКЛЮЧЕНИЕ МЕЖДУ ВХОДОМ И РЕГИСТРАЦИЕЙ -----
    document.getElementById('switchToRegister').addEventListener('click', function(e) {
        e.preventDefault();
        closeModal('profileModal');
        openModal('registerModal');
    });

    document.getElementById('switchToLogin').addEventListener('click', function(e) {
        e.preventDefault();
        closeModal('registerModal');
        openModal('profileModal');
    });

    // ----- ВХОД В ЛИЧНЫЙ КАБИНЕТ (с паролем) -----
    document.getElementById('profileLogin').addEventListener('submit', async function(e) {
        e.preventDefault();
        const passport = document.getElementById('profileLoginPassport').value.trim();
        const password = document.getElementById('profileLoginPassword').value.trim();
        if (!passport || !password) {
            alert('Введите паспорт и пароль.');
            return;
        }
        const users = await loadUsers();
        const user = users.find(u => u.passport === passport && u.status === 'registered');
        if (user && user.password === password) {
            localStorage.setItem('user_id', user.id);
            showProfileContent(user);
            alert('✅ Добро пожаловать в личный кабинет!');
            document.getElementById('profileLoginPassword').value = '';
        } else {
            alert('Неверный паспорт или пароль.');
        }
    });

    // ----- ВЫХОД ИЗ ЛИЧНОГО КАБИНЕТА -----
    document.getElementById('profileLogoutBtn').addEventListener('click', function() {
        localStorage.removeItem('user_id');
        document.getElementById('profileLoginForm').style.display = 'block';
        document.getElementById('profileContent').style.display = 'none';
        document.getElementById('profileLoginPassport').value = '';
        closeModal('profileModal');
    });

    // ----- ПОКАЗ ПРОФИЛЯ -----
    function showProfileContent(user) {
        document.getElementById('profileLoginForm').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';
        document.getElementById('profileInfo').innerHTML = `
            <h3 style="margin-bottom:8px;">${user.fullName}</h3>
            <p><strong>Федеральный округ:</strong> ${user.district || 'Не указан'}</p>
            <p><strong>Номер паспорта:</strong> ${user.passport}</p>
            <p><strong>Возраст:</strong> ${user.age || 'Не указан'}</p>
            <p><strong>Discord:</strong> ${user.discord || 'Не указан'}</p>
            <p><strong>Роль:</strong> ${user.role || 'пользователь'}</p>
        `;
        document.getElementById('editProfileFullName').value = user.fullName || '';
        document.getElementById('editProfileDistrict').value = user.district || '';
        document.getElementById('editProfileAge').value = user.age || '';
        document.getElementById('editProfileDiscord').value = user.discord || '';
        document.getElementById('editProfilePassword').value = '';
    }

    // ----- РЕДАКТИРОВАНИЕ ПРОФИЛЯ (с возможностью смены пароля) -----
    document.getElementById('editProfileToggleBtn').addEventListener('click', function() {
        const form = document.getElementById('profileEditForm');
        if (form.style.display === 'none') {
            form.style.display = 'block';
            this.textContent = '❌ Отменить редактирование';
        } else {
            form.style.display = 'none';
            this.textContent = '✏️ Редактировать профиль';
        }
    });

    document.getElementById('cancelEditProfileBtn').addEventListener('click', function() {
        document.getElementById('profileEditForm').style.display = 'none';
        document.getElementById('editProfileToggleBtn').textContent = '✏️ Редактировать профиль';
    });

    document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const userId = localStorage.getItem('user_id');
        if (!userId) {
            alert('Войдите в аккаунт.');
            return;
        }
        const fullName = document.getElementById('editProfileFullName').value.trim();
        const district = document.getElementById('editProfileDistrict').value.trim();
        const age = parseInt(document.getElementById('editProfileAge').value);
        const discord = document.getElementById('editProfileDiscord').value.trim();
        const newPassword = document.getElementById('editProfilePassword').value.trim();

        if (!fullName || !district || !age || !discord) {
            alert('Все поля (кроме пароля) обязательны для заполнения!');
            return;
        }

        const updateData = { fullName, district, age, discord };
        if (newPassword) {
            updateData.password = newPassword;
        }

        await database.ref(`users/${userId}`).update(updateData);
        alert('✅ Данные профиля обновлены!');
        const users = await loadUsers();
        const user = users.find(u => u.id === userId);
        if (user) showProfileContent(user);
        document.getElementById('profileEditForm').style.display = 'none';
        document.getElementById('editProfileToggleBtn').textContent = '✏️ Редактировать профиль';
        document.getElementById('editProfilePassword').value = '';
    });

    // ----- ЗАЯВКА НА ВСТУПЛЕНИЕ -----
    document.getElementById('joinForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const fullName = document.getElementById('joinFullName').value.trim();
        const icAge = parseInt(document.getElementById('joinIcAge').value);
        const oocAge = parseInt(document.getElementById('joinOocAge').value);
        const passport = document.getElementById('joinPassport').value.trim();
        const passportLink = document.getElementById('joinPassportLink').value.trim();
        const ideology = document.getElementById('joinIdeology').value.trim();
        const reason = document.getElementById('joinReason').value.trim();
        const support = document.getElementById('joinSupport').value.trim();
        const discord = document.getElementById('joinDiscord').value.trim();

        if (!fullName || !icAge || !oocAge || !passport || !ideology || !reason || !support || !discord) {
            alert('Заполните все обязательные поля!');
            return;
        }

        const users = await loadUsers();
        if (users.some(u => u.passport === passport || u.fullName === fullName)) {
            alert('Пользователь с таким ФИО или паспортом уже подавал заявку.');
            return;
        }

        await database.ref('users').push({
            fullName, icAge, oocAge, passport, passportLink, ideology, reason, support, discord, status: 'pending'
        });
        alert('✅ Заявка успешно отправлена! Ожидайте решения администрации.');
        this.reset();
        await renderApplications();
    });

    // ----- ДОБАВЛЕНИЕ НОВОСТИ -----
    document.getElementById('addNewsForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const title = document.getElementById('newsTitle').value;
        const date = document.getElementById('newsDate').value;
        const text = document.getElementById('newsText').value;
        if (title && date && text) {
            await database.ref('news').push({ title, date, text });
            this.reset();
            await renderNews();
        } else {
            alert('Заполните все поля!');
        }
    });

    // ----- ДОБАВЛЕНИЕ ЧЛЕНА В СОСТАВ -----
    document.getElementById('addMemberForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('memberName').value.trim();
        const position = document.getElementById('memberPosition').value.trim();
        const fileInput = document.getElementById('memberPhoto');
        const role = document.getElementById('memberRole').value;

        if (!name || !position) {
            alert('Введите ФИО и должность!');
            return;
        }

        let photoData = '';
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите файл изображения.');
                return;
            }
            photoData = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        await database.ref('members').push({ name, position, photo: photoData, role });
        await renderAdminMembers();
        await renderComposition();
        this.reset();
        fileInput.value = '';
    });

    // ----- ДОБАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (админ) -----
    document.getElementById('addUserForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const fullName = document.getElementById('adminUserName').value.trim();
        const passport = document.getElementById('adminUserPassport').value.trim();
        const role = document.getElementById('adminUserRole').value;

        if (!fullName || !passport) {
            alert('Заполните все поля!');
            return;
        }

        const users = await loadUsers();
        if (users.some(u => u.passport === passport)) {
            alert('Пользователь с таким паспортом уже существует.');
            return;
        }

        await database.ref('users').push({ fullName, passport, role, status: 'registered' });
        await renderAdminUsers();
        this.reset();
        alert('✅ Пользователь добавлен!');
    });

    // ----- ОЧИСТКА РАССМОТРЕННЫХ ЗАЯВОК -----
    document.getElementById('clearProcessedBtn').addEventListener('click', async function() {
        if (!confirm('Удалить все уже рассмотренные заявки?')) return;
        const users = await loadUsers();
        const processed = users.filter(u => u.status === 'approved' || u.status === 'rejected');
        if (processed.length === 0) {
            alert('Нет рассмотренных заявок для удаления.');
            return;
        }
        for (const user of processed) {
            await database.ref(`users/${user.id}`).remove();
        }
        await renderApplications();
        alert(`Удалено ${processed.length} заявок.`);
    });

    // ----- СОХРАНЕНИЕ НАСТРОЕК (включая техработы) -----
    document.getElementById('settingsForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const newSettings = {
            showElections: document.getElementById('showElections').checked,
            showComposition: document.getElementById('showComposition').checked,
            showPress: document.getElementById('showPress').checked,
            showSymbols: document.getElementById('showSymbols').checked,
            showAbout: document.getElementById('showAbout').checked,
            showJoin: document.getElementById('showJoin').checked,
            showHistory: document.getElementById('showHistory').checked,
            showDocs: document.getElementById('showDocs').checked,
            maintenanceMode: document.getElementById('maintenanceMode').checked
        };

        const settings = await loadData('settings') || {};
        // Обновляем только переданные ключи
        settings.visibility = {
            showElections: newSettings.showElections,
            showComposition: newSettings.showComposition,
            showPress: newSettings.showPress,
            showSymbols: newSettings.showSymbols,
            showAbout: newSettings.showAbout,
            showJoin: newSettings.showJoin,
            showHistory: newSettings.showHistory,
            showDocs: newSettings.showDocs
        };
        settings.maintenanceMode = newSettings.maintenanceMode;

        await database.ref('settings').set(settings);
        applyVisibility(settings.visibility);
        await checkMaintenanceMode();
        alert('✅ Настройки сохранены!');
    });

    // ----- СОХРАНЕНИЕ КОНТЕНТА -----
    document.getElementById('contentForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const newContent = {
            heroTitle: document.getElementById('heroTitleInput').value,
            heroSubtitle: document.getElementById('heroSubtitleInput').value,
            missionText: document.getElementById('missionTextInput').value
        };
        const settings = await loadData('settings') || {};
        settings.content = newContent;
        await database.ref('settings').set(settings);
        applyContent(newContent);
        alert('✅ Контент обновлён!');
    });

    // ----- ВЫБОРЫ: ДОБАВЛЕНИЕ ПАРТИИ -----
    document.getElementById('addPartyBtn').addEventListener('click', function() {
        const container = document.getElementById('partiesContainer');
        const div = document.createElement('div');
        div.className = 'party-field';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <input type="text" class="party-name" placeholder="Название партии" style="flex:2; padding: 8px 12px; border: 2px solid var(--light-gray); border-radius: var(--radius); font-family: inherit; font-size: 14px;" />
            <input type="number" class="party-percent" placeholder="%" style="flex:0.5; padding: 8px 12px; border: 2px solid var(--light-gray); border-radius: var(--radius); font-family: inherit; font-size: 14px; width: 80px;" />
            <button type="button" class="btn btn-danger remove-party-btn" style="padding: 4px 12px; font-size: 14px;">✕</button>
        `;
        container.appendChild(div);
        div.querySelector('.remove-party-btn').addEventListener('click', function() {
            if (container.children.length > 1) container.removeChild(div);
            else alert('Должна быть хотя бы одна партия.');
        });
    });

    // ----- СОХРАНЕНИЕ ВЫБОРОВ -----
    document.getElementById('electionsForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const date = document.getElementById('electionsDate').value.trim();
        const time = document.getElementById('electionsTime').value.trim();
        const footer = document.getElementById('electionsFooter').value.trim();
        const footerDate = document.getElementById('electionsFooterDate').value.trim();

        const partyFields = document.querySelectorAll('.party-field');
        const parties = [];
        partyFields.forEach(field => {
            const name = field.querySelector('.party-name').value.trim();
            const percent = parseFloat(field.querySelector('.party-percent').value);
            if (name && !isNaN(percent)) parties.push({ name, percent });
        });

        if (parties.length === 0) {
            alert('Добавьте хотя бы одну партию с корректными данными.');
            return;
        }

        await database.ref('elections').set({ parties, date, time, footer, footerDate });
        await renderElections();
        alert('✅ Данные о выборах обновлены!');
    });

    // ----- ФОН: ПРИМЕНИТЬ -----
    document.getElementById('applyBgBtn').addEventListener('click', async function() {
        const fileInput = document.getElementById('bgImage');
        if (!fileInput.files || !fileInput.files[0]) {
            alert('Выберите изображение.');
            return;
        }
        const file = fileInput.files[0];
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите файл изображения.');
            return;
        }
        const photoData = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        const settings = await loadData('settings') || {};
        settings.background = photoData;
        await database.ref('settings').set(settings);
        document.body.style.backgroundImage = `url(${photoData})`;
        alert('Фон успешно обновлён!');
        fileInput.value = '';
    });

    // ----- ФОН: СБРОСИТЬ -----
    document.getElementById('resetBgBtn').addEventListener('click', async function() {
        if (!confirm('Сбросить фоновое изображение?')) return;
        const settings = await loadData('settings') || {};
        delete settings.background;
        await database.ref('settings').set(settings);
        document.body.style.backgroundImage = '';
        alert('Фон сброшен.');
    });

    // ----- АДМИН-ВКЛАДКИ (заполнение данных при переключении) -----
    document.querySelectorAll('.admin-tabs button').forEach(tab => {
        tab.addEventListener('click', async function() {
            document.querySelectorAll('.admin-tabs button').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const tabName = this.dataset.tab;
            document.querySelectorAll('.admin-panel-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(`adminTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
            if (target) target.classList.add('active');

            if (tabName === 'applications') await renderApplications();
            if (tabName === 'members') await renderAdminMembers();
            if (tabName === 'users') await renderAdminUsers();
            if (tabName === 'elections') {
                const elections = await loadData('elections');
                if (elections) {
                    document.getElementById('electionsDate').value = elections.date || '';
                    document.getElementById('electionsTime').value = elections.time || '';
                    document.getElementById('electionsFooter').value = elections.footer || '';
                    document.getElementById('electionsFooterDate').value = elections.footerDate || '';
                }
                const container = document.getElementById('partiesContainer');
                if (container && elections && elections.parties) {
                    container.innerHTML = '';
                    elections.parties.forEach(p => {
                        const div = document.createElement('div');
                        div.className = 'party-field';
                        div.style.display = 'flex';
                        div.style.gap = '10px';
                        div.style.marginBottom = '10px';
                        div.style.alignItems = 'center';
                        div.innerHTML = `
                            <input type="text" class="party-name" value="${p.name}" style="flex:2; padding: 8px 12px; border: 2px solid var(--light-gray); border-radius: var(--radius); font-family: inherit; font-size: 14px;" />
                            <input type="number" class="party-percent" value="${p.percent}" style="flex:0.5; padding: 8px 12px; border: 2px solid var(--light-gray); border-radius: var(--radius); font-family: inherit; font-size: 14px; width: 80px;" />
                            <button type="button" class="btn btn-danger remove-party-btn" style="padding: 4px 12px; font-size: 14px;">✕</button>
                        `;
                        container.appendChild(div);
                        div.querySelector('.remove-party-btn').addEventListener('click', function() {
                            if (container.children.length > 1) container.removeChild(div);
                            else alert('Должна быть хотя бы одна партия.');
                        });
                    });
                }
            }
            if (tabName === 'settings') await loadVisibilitySettings();
            if (tabName === 'content') await loadContentSettings();
        });
    });

    // ============================================================
    // ЗАПУСК
    // ============================================================
    initApp();
});
