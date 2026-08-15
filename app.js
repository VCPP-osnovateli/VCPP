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

// ============================================================
// INIT FIREBASE
// ============================================================
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

console.log('✅ Firebase инициализирован');

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================
let isAdminLoggedIn = false;
let currentUser = null;

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function showPage(pageId) {
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.classList.add('active');
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        }
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('open');
        console.log(`✅ Модальное окно ${id} открыто`);
    } else {
        console.error(`❌ Модальное окно с id ${id} не найдено`);
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
}

// ============================================================
// ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE (упрощенные функции)
// ============================================================
async function loadMembers() {
    const snapshot = await database.ref('members').once('value');
    const data = snapshot.val();
    if (!data) return [];
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
}

async function loadNews() {
    const snapshot = await database.ref('news').once('value');
    const data = snapshot.val();
    if (!data) return [];
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
}

async function loadUsers() {
    const snapshot = await database.ref('users').once('value');
    const data = snapshot.val();
    if (!data) return [];
    return Object.keys(data).map(key => ({ id: key, ...data[key] }));
}

// ============================================================
// РЕНДЕР КОМПОНЕНТОВ (упрощенные для теста)
// ============================================================
async function renderNews() {
    const news = await loadNews();
    const homeGrid = document.getElementById('newsGridHome');
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
    // Остальные рендеры для админки пока пропустим для простоты
}

async function renderComposition() {
    const members = await loadMembers();
    const container = document.getElementById('compositionContainer');
    if (!container) return;
    // Простой вывод для теста
    container.innerHTML = members.map(m => `<div>${m.name} - ${m.position}</div>`).join('');
    document.getElementById('totalMembers').textContent = members.length;
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
async function initApp() {
    await renderNews();
    await renderComposition();
    console.log('✅ Приложение инициализировано');
}

// ============================================================
// ОБРАБОТЧИКИ СОБЫТИЙ (ГЛАВНОЕ – ЗДЕСЬ ВСЁ РАБОТАЕТ)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {

    console.log('✅ DOM загружен, навешиваем обработчики...');

    // ----- 1. НАВИГАЦИЯ -----
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                console.log(`✅ Навигация: переход на ${page}`);
                showPage(page);
            }
        });
    });

    // ----- 2. КНОПКА "ВХОД" (админ) -----
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('✅ Нажата кнопка "Вход"');
            if (isAdminLoggedIn) {
                openModal('adminModal');
            } else {
                openModal('loginModal');
            }
        });
    } else {
        console.error('❌ Кнопка loginBtn не найдена');
    }

    // ----- 3. КНОПКА "ЛИЧНЫЙ КАБИНЕТ" -----
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            console.log('✅ Нажата кнопка "Личный кабинет"');
            openModal('profileModal');
        });
    } else {
        console.error('❌ Кнопка profileBtn не найдена');
    }

    // ----- 4. ЛОГИН АДМИНА -----
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('✅ Форма логина отправлена');
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            if (username === 'admin' && password === 'admin') {
                isAdminLoggedIn = true;
                localStorage.setItem('admin_logged_in', 'true');
                document.getElementById('loginBtn').textContent = 'Админ-панель';
                document.getElementById('loginBtn').classList.add('logged-in');
                closeModal('loginModal');
                openModal('adminModal');
                alert('✅ Вы вошли как администратор!');
            } else {
                alert('❌ Неверный логин или пароль!');
            }
        });
    } else {
        console.error('❌ Форма loginForm не найдена');
    }

    // ----- 5. ВЫХОД ИЗ АДМИНКИ -----
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function() {
            console.log('✅ Выход из админки');
            isAdminLoggedIn = false;
            localStorage.removeItem('admin_logged_in');
            document.getElementById('loginBtn').textContent = 'Вход';
            document.getElementById('loginBtn').classList.remove('logged-in');
            closeModal('adminModal');
            alert('✅ Вы вышли из админ-панели');
        });
    }

    // ----- 6. ЗАКРЫТИЕ МОДАЛОК (крестики) -----
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('open');
                console.log('✅ Модальное окно закрыто');
            }
        });
    });

    // ----- 7. ЗАКРЫТИЕ МОДАЛОК ПО КЛИКУ НА ОВЕРЛЕЙ -----
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('open');
                console.log('✅ Модальное окно закрыто по клику на фон');
            }
        });
    });

    // ----- 8. РЕГИСТРАЦИЯ (личный кабинет) -----
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('✅ Форма регистрации отправлена');
            const fullName = document.getElementById('regFullName').value.trim();
            const district = document.getElementById('regDistrict').value.trim();
            const passport = document.getElementById('regPassport').value.trim();
            const age = parseInt(document.getElementById('regAge').value);
            const discord = document.getElementById('regDiscord').value.trim();

            if (!fullName || !district || !passport || !age || !discord) {
                alert('Заполните все поля!');
                return;
            }

            const users = await loadUsers();
            if (users.some(u => u.passport === passport)) {
                alert('Пользователь с таким паспортом уже зарегистрирован.');
                return;
            }

            const newUser = {
                fullName,
                district,
                passport,
                age,
                discord,
                role: 'user',
                status: 'registered'
            };
            await database.ref('users').push(newUser);
            alert('✅ Регистрация успешна! Теперь войдите в личный кабинет.');
            closeModal('registerModal');
            document.getElementById('profileLoginForm').style.display = 'block';
            document.getElementById('profileContent').style.display = 'none';
            this.reset();
        });
    }

    // ----- 9. ПЕРЕКЛЮЧЕНИЕ МЕЖДУ ВХОДОМ И РЕГИСТРАЦИЕЙ -----
    const switchToRegister = document.getElementById('switchToRegister');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('profileModal');
            openModal('registerModal');
        });
    }

    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('registerModal');
            openModal('profileModal');
        });
    }

    // ----- 10. ВХОД В ЛИЧНЫЙ КАБИНЕТ -----
    const profileLogin = document.getElementById('profileLogin');
    if (profileLogin) {
        profileLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('✅ Вход в личный кабинет');
            const passport = document.getElementById('profileLoginPassport').value.trim();
            if (!passport) {
                alert('Введите номер паспорта.');
                return;
            }
            const users = await loadUsers();
            const user = users.find(u => u.passport === passport && u.status === 'registered');
            if (user) {
                currentUser = user;
                localStorage.setItem('user_id', user.id);
                // Показываем профиль
                document.getElementById('profileLoginForm').style.display = 'none';
                document.getElementById('profileContent').style.display = 'block';
                document.getElementById('profileInfo').innerHTML = `
                    <h3>${user.fullName}</h3>
                    <p><strong>Федеральный округ:</strong> ${user.district}</p>
                    <p><strong>Паспорт:</strong> ${user.passport}</p>
                    <p><strong>Возраст:</strong> ${user.age}</p>
                    <p><strong>Discord:</strong> ${user.discord}</p>
                `;
                alert('✅ Добро пожаловать в личный кабинет!');
            } else {
                alert('Пользователь с таким паспортом не найден. Зарегистрируйтесь.');
            }
        });
    }

    // ----- 11. ВЫХОД ИЗ ЛИЧНОГО КАБИНЕТА -----
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', function() {
            currentUser = null;
            localStorage.removeItem('user_id');
            document.getElementById('profileLoginForm').style.display = 'block';
            document.getElementById('profileContent').style.display = 'none';
            document.getElementById('profileLoginPassport').value = '';
            closeModal('profileModal');
            alert('✅ Вы вышли из личного кабинета');
        });
    }

    // ----- 12. ФОРМА ЗАЯВКИ НА ВСТУПЛЕНИЕ -----
    const joinForm = document.getElementById('joinForm');
    if (joinForm) {
        joinForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('✅ Заявка отправлена');
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
                fullName,
                icAge,
                oocAge,
                passport,
                passportLink,
                ideology,
                reason,
                support,
                discord,
                status: 'pending'
            });
            alert('✅ Заявка успешно отправлена! Ожидайте решения администрации.');
            joinForm.reset();
        });
    }

    // ----- 13. ДОБАВЛЕНИЕ НОВОСТИ (админ) -----
    const addNewsForm = document.getElementById('addNewsForm');
    if (addNewsForm) {
        addNewsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('✅ Добавление новости');
            const title = document.getElementById('newsTitle').value;
            const date = document.getElementById('newsDate').value;
            const text = document.getElementById('newsText').value;
            if (title && date && text) {
                await database.ref('news').push({ title, date, text });
                alert('✅ Новость добавлена!');
                this.reset();
                await renderNews();
            } else {
                alert('Заполните все поля!');
            }
        });
    }

    // ----- 14. ДОБАВЛЕНИЕ ЧЛЕНА В СОСТАВ (админ) -----
    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('✅ Добавление члена в состав');
            const name = document.getElementById('memberName').value.trim();
            const position = document.getElementById('memberPosition').value.trim();
            const role = document.getElementById('memberRole').value;

            if (!name || !position) {
                alert('Введите ФИО и должность!');
                return;
            }

            await database.ref('members').push({ name, position, photo: '', role });
            alert('✅ Член добавлен в состав!');
            this.reset();
            await renderComposition();
        });
    }

    // ----- 15. ЗАПОЛНЕНИЕ ФОРМЫ ВЫБОРОВ ПРИ ОТКРЫТИИ ВКЛАДКИ -----
    // Навешиваем на вкладку "Выборы"
    const electionsTab = document.querySelector('[data-tab="elections"]');
    if (electionsTab) {
        electionsTab.addEventListener('click', async function() {
            console.log('✅ Открыта вкладка "Выборы"');
            const snapshot = await database.ref('elections').once('value');
            const elections = snapshot.val();
            if (elections) {
                document.getElementById('electionsDate').value = elections.date || '';
                document.getElementById('electionsTime').value = elections.time || '';
                document.getElementById('electionsFooter').value = elections.footer || '';
                document.getElementById('electionsFooterDate').value = elections.footerDate || '';
            }
            // Заполняем партии
            const partiesContainer = document.getElementById('partiesContainer');
            if (partiesContainer && elections && elections.parties) {
                partiesContainer.innerHTML = '';
                elections.parties.forEach(p => {
                    addPartyField(p.name, p.percent);
                });
            }
        });
    }

    function addPartyField(name = '', percent = '') {
        const container = document.getElementById('partiesContainer');
        if (!container) return;
        const div = document.createElement('div');
        div.className = 'party-field';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.style.alignItems = 'center';
        div.innerHTML = `
            <input type="text" class="party-name" placeholder="Название партии" value="${name}" style="flex:2; padding: 8px 12px; border: 2px solid var(--light-gray); border-radius: var(--radius); font-family: inherit; font-size: 14px;" />
            <input type="number" class="party-percent" placeholder="%" value="${percent}" style="flex:0.5; padding: 8px 12px; border: 2px solid var(--light-gray); border-radius: var(--radius); font-family: inherit; font-size: 14px; width: 80px;" />
            <button type="button" class="btn btn-danger remove-party-btn" style="padding: 4px 12px; font-size: 14px;">✕</button>
        `;
        container.appendChild(div);
        div.querySelector('.remove-party-btn').addEventListener('click', function() {
            if (container.children.length > 1) {
                container.removeChild(div);
            } else {
                alert('Должна быть хотя бы одна партия.');
            }
        });
    }

    // Кнопка "Добавить партию" в админке
    const addPartyBtn = document.getElementById('addPartyBtn');
    if (addPartyBtn) {
        addPartyBtn.addEventListener('click', function() {
            addPartyField('', '');
        });
    }

    // Сохранение выборов
    const electionsForm = document.getElementById('electionsForm');
    if (electionsForm) {
        electionsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('✅ Сохранение выборов');
            const date = document.getElementById('electionsDate').value.trim();
            const time = document.getElementById('electionsTime').value.trim();
            const footer = document.getElementById('electionsFooter').value.trim();
            const footerDate = document.getElementById('electionsFooterDate').value.trim();

            const partyFields = document.querySelectorAll('.party-field');
            const parties = [];
            partyFields.forEach(field => {
                const name = field.querySelector('.party-name').value.trim();
                const percent = parseFloat(field.querySelector('.party-percent').value);
                if (name && !isNaN(percent)) {
                    parties.push({ name, percent });
                }
            });

            if (parties.length === 0) {
                alert('Добавьте хотя бы одну партию с корректными данными.');
                return;
            }

            await database.ref('elections').set({ parties, date, time, footer, footerDate });
            alert('✅ Данные о выборах обновлены!');
        });
    }

    // ----- 16. НАСТРОЙКИ ВИДИМОСТИ -----
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('✅ Сохранение настроек видимости');
            const newSettings = {
                showElections: document.getElementById('showElections').checked,
                showComposition: document.getElementById('showComposition').checked,
                showPress: document.getElementById('showPress').checked,
                showSymbols: document.getElementById('showSymbols').checked,
                showAbout: document.getElementById('showAbout').checked,
                showJoin: document.getElementById('showJoin').checked,
                showHistory: document.getElementById('showHistory').checked,
                showDocs: document.getElementById('showDocs').checked
            };
            const snapshot = await database.ref('settings').once('value');
            const settings = snapshot.val() || {};
            settings.visibility = newSettings;
            await database.ref('settings').set(settings);
            alert('✅ Настройки сохранены!');
        });
    }

    // ----- 17. РЕДАКТИРОВАНИЕ КОНТЕНТА -----
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('✅ Сохранение контента');
            const newContent = {
                heroTitle: document.getElementById('heroTitleInput').value,
                heroSubtitle: document.getElementById('heroSubtitleInput').value,
                missionText: document.getElementById('missionTextInput').value
            };
            const snapshot = await database.ref('settings').once('value');
            const settings = snapshot.val() || {};
            settings.content = newContent;
            await database.ref('settings').set(settings);
            alert('✅ Контент обновлён!');
        });
    }

    // ----- 18. ФОН: ПРИМЕНИТЬ -----
    const applyBgBtn = document.getElementById('applyBgBtn');
    if (applyBgBtn) {
        applyBgBtn.addEventListener('click', async function() {
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
            const photoData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            const snapshot = await database.ref('settings').once('value');
            const settings = snapshot.val() || {};
            settings.background = photoData;
            await database.ref('settings').set(settings);
            document.body.style.backgroundImage = `url(${photoData})`;
            alert('Фон успешно обновлён!');
            fileInput.value = '';
        });
    }

    // ----- 19. ФОН: СБРОСИТЬ -----
    const resetBgBtn = document.getElementById('resetBgBtn');
    if (resetBgBtn) {
        resetBgBtn.addEventListener('click', async function() {
            if (!confirm('Сбросить фоновое изображение?')) return;
            const snapshot = await database.ref('settings').once('value');
            const settings = snapshot.val() || {};
            delete settings.background;
            await database.ref('settings').set(settings);
            document.body.style.backgroundImage = '';
            alert('Фон сброшен.');
        });
    }

    // ----- 20. УДАЛЕНИЕ РАССМОТРЕННЫХ ЗАЯВОК -----
    const clearProcessedBtn = document.getElementById('clearProcessedBtn');
    if (clearProcessedBtn) {
        clearProcessedBtn.addEventListener('click', async function() {
            if (!confirm('Удалить все уже рассмотренные заявки (одобренные и отклонённые)?')) return;
            const users = await loadUsers();
            const processed = users.filter(u => u.status === 'approved' || u.status === 'rejected');
            if (processed.length === 0) {
                alert('Нет рассмотренных заявок для удаления.');
                return;
            }
            for (const user of processed) {
                await database.ref(`users/${user.id}`).remove();
            }
            alert(`Удалено ${processed.length} заявок.`);
        });
    }

    // ============================================================
    // ЗАПУСК ПРИЛОЖЕНИЯ
    // ============================================================
    initApp();

    // Восстановление состояния админа
    if (localStorage.getItem('admin_logged_in') === 'true') {
        isAdminLoggedIn = true;
        document.getElementById('loginBtn').textContent = 'Админ-панель';
        document.getElementById('loginBtn').classList.add('logged-in');
    }

    console.log('✅ Все обработчики событий навешаны!');
});
