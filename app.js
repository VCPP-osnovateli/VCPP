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
// DATABASE WRAPPER
// ============================================================
const dbFirebase = {
    _toArray(snapshot) {
        const data = snapshot.val();
        if (!data) return [];
        return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    },

    async getNews() {
        const snapshot = await database.ref('news').once('value');
        return this._toArray(snapshot);
    },
    async addNews(item) {
        const ref = database.ref('news').push();
        await ref.set(item);
        return ref.key;
    },
    async deleteNews(id) {
        await database.ref(`news/${id}`).remove();
    },
    async updateNews(id, newData) {
        await database.ref(`news/${id}`).update(newData);
    },

    async getUsers() {
        const snapshot = await database.ref('users').once('value');
        return this._toArray(snapshot);
    },
    async addUser(item) {
        const users = await this.getUsers();
        if (users.some(u => u.passport === item.passport || u.fullName === item.fullName)) {
            throw new Error('Пользователь с таким ФИО или паспортом уже существует');
        }
        const ref = database.ref('users').push();
        await ref.set(item);
        return ref.key;
    },
    async deleteUser(id) {
        await database.ref(`users/${id}`).remove();
    },
    async updateUser(id, newData) {
        await database.ref(`users/${id}`).update(newData);
    },

    async getMembers() {
        const snapshot = await database.ref('members').once('value');
        return this._toArray(snapshot);
    },
    async addMember(item) {
        if (!item.photo) item.photo = '';
        if (!item.position) item.position = '';
        const ref = database.ref('members').push();
        await ref.set(item);
        return ref.key;
    },
    async deleteMember(id) {
        await database.ref(`members/${id}`).remove();
    },
    async updateMember(id, newData) {
        await database.ref(`members/${id}`).update(newData);
    },

    // Настройки (включая символику и фон)
    async getSetting(key) {
        const snapshot = await database.ref(`settings/${key}`).once('value');
        return snapshot.val();
    },
    async setSetting(key, value) {
        await database.ref(`settings/${key}`).set(value);
    },
    async deleteSetting(key) {
        await database.ref(`settings/${key}`).remove();
    },

    // Символика (используем ключи symbol_* в settings)
    async getSymbol(symbolKey) {
        return this.getSetting(symbolKey);
    },
    async setSymbol(symbolKey, imageData) {
        await this.setSetting(symbolKey, imageData);
    },
    async resetSymbol(symbolKey) {
        await this.deleteSetting(symbolKey);
    },

    async getElections() {
        const snapshot = await database.ref('elections').once('value');
        const data = snapshot.val();
        if (!data) return null;
        if (data.parties && typeof data.parties === 'object' && !Array.isArray(data.parties)) {
            data.parties = Object.values(data.parties);
        }
        return data;
    },
    async setElections(data) {
        await database.ref('elections').set(data);
    },

    async seed() {
        const news = await this.getNews();
        if (news.length === 0) {
            const defaultNews = [
                { title: 'День России — вместе к новым вершинам', date: '12.06.2026', text: 'Сегодня мы вместе со всей страной отмечаем важнейший государственный праздник — День России. Эта знаменательная дата напоминает нам о великой истории нашей родины...' },
                { title: 'С Днём Великой Победы!', date: '09.05.2026', text: 'Партия «Новая Россия» и лично наш председатель от всей души поздравляют всех граждан с великим праздником 9 Мая. Этот торжественный день — символ мужества и единства...' },
                { title: 'Личный пример важнее слов', date: '05.05.2026', text: 'Вчера в Центральной городской больнице прошло важное мероприятие — День донора. Председатель партии «Новая Россия» лично принял участие в акции...' }
            ];
            for (const item of defaultNews) {
                await this.addNews(item);
            }
        }

        const members = await this.getMembers();
        if (members.length === 0) {
            const defaultMembers = [
                { name: 'Сухомлин Александр Дмитриевич', position: 'Председатель партии', photo: '', role: 'leader' },
                { name: 'Римская Мария Александровна', position: 'Первый заместитель Председателя, Кандидат в Губернаторы, Действующий Губернатор Рублевского федерального округа', photo: '', role: 'leader' },
                { name: 'Пушмынц Леонид Ильич', position: 'Руководитель Высшего Совета, Председатель Совета Федерации', photo: '', role: 'leader' },
                { name: 'Тиводар Евгений Александрович', position: 'Руководитель Центрального аппарата', photo: '', role: 'leader' },
                { name: 'Райтман Тимур Александрович', position: 'Председатель Законодательного Собрания, Председатель Законодательного Собрания Рублевского федерального округа VIII созыва', photo: '', role: 'leader' },
                { name: 'Мамаев Абрам Ахмедович', position: 'Заместитель Председателя Законодательного Собрания, Заместитель Председателя Законодательного Собрания Рублевского федерального округа VIII созыва', photo: '', role: 'leader' }
            ];
            for (const item of defaultMembers) {
                await this.addMember(item);
            }
        }

        const bg = await this.getSetting('background');
        if (bg === null) {
            await this.setSetting('background', '');
        }

        const elections = await this.getElections();
        if (!elections) {
            const defaultElections = {
                parties: [
                    { name: 'ВЦПП «Новая Россия»', percent: 42 },
                    { name: 'Партия «Свободная Россия»', percent: 26 },
                    { name: 'Политическая партия «Деловая Россия»', percent: 13 },
                    { name: 'Демократическая политическая партия России', percent: 8 },
                    { name: 'Партия «Родина в будущем»', percent: 7 },
                    { name: 'Любимая партия свободной страны', percent: 4 }
                ],
                date: '02.05.2026',
                time: '08:00 – 22:00',
                footer: 'ru Сила и гордость нашей страны! В преддверии Великого праздника, 9 Мая.',
                footerDate: '09.05.2026'
            };
            await this.setElections(defaultElections);
        }
    }
};

// ============================================================
// GLOBAL VARIABLES
// ============================================================
let isAdminLoggedIn = false;
let currentUser = null;
let isEditingProfile = false;

// ============================================================
// RENDER FUNCTIONS
// ============================================================
async function renderNews() {
    try {
        const news = await dbFirebase.getNews();
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
                    <button class="btn btn-danger" data-news-id="${item.id}">Удалить</button>
                </div>
            `).join('');

            adminList.querySelectorAll('[data-news-id]').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const id = this.getAttribute('data-news-id');
                    await dbFirebase.deleteNews(id);
                    await renderNews();
                    await renderComposition();
                });
            });
        }
    } catch (e) {
        console.error('renderNews error:', e);
    }
}

async function renderComposition() {
    try {
        const members = await dbFirebase.getMembers();
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
    } catch (e) {
        console.error('renderComposition error:', e);
    }
}

async function renderApplications() {
    try {
        const users = await dbFirebase.getUsers();
        const list = document.getElementById('applicationsList');
        if (!list) return;

        if (users.length === 0) {
            list.innerHTML = '<p>Заявок пока нет.</p>';
            return;
        }

        list.innerHTML = users.map(user => `
            <div class="application-item">
                <div class="app-header">
                    <span class="app-name">${user.fullName}</span>
                    <span class="app-status ${user.status}">${user.status === 'pending' ? 'На рассмотрении' : user.status === 'approved' ? 'Одобрена' : 'Отклонена'}</span>
                </div>
                <div class="app-details">
                    <p><strong>Возраст (IC):</strong> ${user.icAge} | <strong>OOC:</strong> ${user.oocAge}</p>
                    <p><strong>Паспорт:</strong> ${user.passport} | <strong>Discord:</strong> ${user.discord}</p>
                    <p><strong>Мотивация:</strong> ${user.motivation}</p>
                    <p><strong>Поддержка:</strong> ${user.support}</p>
                    ${user.passportLink ? `<p><strong>Ссылка на паспорт:</strong> <a href="${user.passportLink}" target="_blank">${user.passportLink}</a></p>` : ''}
                </div>
                ${user.status === 'pending' ? `
                <div class="app-actions">
                    <button class="btn btn-success" data-user-id="${user.id}" data-action="approve">Одобрить</button>
                    <button class="btn btn-danger" data-user-id="${user.id}" data-action="reject">Отклонить</button>
                </div>` : ''}
            </div>
        `).join('');

        list.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async function() {
                const userId = this.getAttribute('data-user-id');
                const action = this.getAttribute('data-action');
                await handleApplication(userId, action);
            });
        });
    } catch (e) {
        console.error('renderApplications error:', e);
    }
}

async function handleApplication(userId, action) {
    try {
        const users = await dbFirebase.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return;

        if (action === 'approve') {
            user.status = 'approved';
            await dbFirebase.updateUser(userId, { status: 'approved' });
            await dbFirebase.addMember({ name: user.fullName, position: 'Член партии', photo: '', role: 'member' });
            await renderApplications();
            await renderComposition();
            await renderAdminMembers();
        } else if (action === 'reject') {
            user.status = 'rejected';
            await dbFirebase.updateUser(userId, { status: 'rejected' });
            await renderApplications();
        }
    } catch (e) {
        console.error('handleApplication error:', e);
    }
}

// Удаление всех рассмотренных заявок
document.getElementById('clearProcessedBtn').addEventListener('click', async function() {
    if (!confirm('Удалить все уже рассмотренные заявки (одобренные и отклонённые)?')) return;
    const users = await dbFirebase.getUsers();
    const processed = users.filter(u => u.status === 'approved' || u.status === 'rejected');
    if (processed.length === 0) {
        alert('Нет рассмотренных заявок для удаления.');
        return;
    }
    for (const user of processed) {
        await dbFirebase.deleteUser(user.id);
    }
    await renderApplications();
    alert(`Удалено ${processed.length} заявок.`);
});

async function renderAdminMembers() {
    try {
        const members = await dbFirebase.getMembers();
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
                    <button class="btn btn-edit btn-sm" data-member-id="${m.id}">✏️ Редактировать</button>
                    <button class="btn btn-danger btn-sm" data-member-id="${m.id}">Удалить</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.btn-danger[data-member-id]').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = this.getAttribute('data-member-id');
                if (confirm('Удалить этого члена из состава?')) {
                    await dbFirebase.deleteMember(id);
                    await renderAdminMembers();
                    await renderComposition();
                }
            });
        });

        list.querySelectorAll('.btn-edit[data-member-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-member-id');
                openEditMemberModal(id);
            });
        });
    } catch (e) {
        console.error('renderAdminMembers error:', e);
    }
}

// ============================================================
// EDIT MEMBER MODAL
// ============================================================
const editMemberModal = document.getElementById('editMemberModal');
const editMemberModalClose = document.getElementById('editMemberModalClose');
const editMemberForm = document.getElementById('editMemberForm');
const editMemberId = document.getElementById('editMemberId');
const editMemberName = document.getElementById('editMemberName');
const editMemberPosition = document.getElementById('editMemberPosition');
const editMemberPhoto = document.getElementById('editMemberPhoto');
const editMemberRole = document.getElementById('editMemberRole');

async function openEditMemberModal(memberId) {
    const members = await dbFirebase.getMembers();
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    editMemberId.value = memberId;
    editMemberName.value = member.name;
    editMemberPosition.value = member.position || '';
    editMemberRole.value = member.role || 'member';
    editMemberPhoto.value = '';
    editMemberModal.classList.add('open');
}

function closeEditMemberModal() {
    editMemberModal.classList.remove('open');
}

editMemberModalClose.addEventListener('click', closeEditMemberModal);
editMemberModal.addEventListener('click', function(e) {
    if (e.target === this) closeEditMemberModal();
});

editMemberForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = editMemberId.value;
    const name = editMemberName.value.trim();
    const position = editMemberPosition.value.trim();
    const role = editMemberRole.value;

    if (!name || !position) {
        alert('Заполните ФИО и должность!');
        return;
    }

    let photoData = null;
    if (editMemberPhoto.files && editMemberPhoto.files[0]) {
        const file = editMemberPhoto.files[0];
        if (!file.type.startsWith('image/')) {
            alert('Пожалуйста, выберите файл изображения.');
            return;
        }
        photoData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsDataURL(file);
        });
    }

    const updateData = { name, position, role };
    if (photoData) {
        updateData.photo = photoData;
    }

    await dbFirebase.updateMember(id, updateData);
    await renderAdminMembers();
    await renderComposition();
    closeEditMemberModal();
    alert('✅ Данные члена партии обновлены!');
});

// ============================================================
// ELECTIONS
// ============================================================
async function renderElections() {
    const elections = await dbFirebase.getElections();
    const container = document.getElementById('electionsBlock');
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

async function populateElectionsForm() {
    const elections = await dbFirebase.getElections();
    if (!elections) return;

    document.getElementById('electionsDate').value = elections.date || '';
    document.getElementById('electionsTime').value = elections.time || '';
    document.getElementById('electionsFooter').value = elections.footer || '';
    document.getElementById('electionsFooterDate').value = elections.footerDate || '';

    const partiesContainer = document.getElementById('partiesContainer');
    partiesContainer.innerHTML = '';
    if (elections.parties && elections.parties.length) {
        elections.parties.forEach((p, index) => {
            addPartyField(index, p.name, p.percent);
        });
    } else {
        addPartyField(0, '', '');
    }
}

function addPartyField(index, name = '', percent = '') {
    const container = document.getElementById('partiesContainer');
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

document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'addPartyBtn') {
        addPartyField(document.querySelectorAll('.party-field').length);
    }
});

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
        if (name && !isNaN(percent)) {
            parties.push({ name, percent });
        }
    });

    if (parties.length === 0) {
        alert('Добавьте хотя бы одну партию с корректными данными.');
        return;
    }

    const electionsData = { parties, date, time, footer, footerDate };
    await dbFirebase.setElections(electionsData);
    await renderElections();
    alert('✅ Данные о выборах обновлены!');
});

// ============================================================
// SYMBOLS (публичная страница)
// ============================================================
async function renderSymbolsPage() {
    const container = document.getElementById('symbolsContainer');
    if (!container) return;

    const gerb = await dbFirebase.getSymbol('symbol_gerb');
    const stamp = await dbFirebase.getSymbol('symbol_stamp');
    const seal = await dbFirebase.getSymbol('symbol_seal');

    const symbols = [
        { key: 'gerb', label: 'Герб ВЦПП', desc: 'Официальный герб партии.', image: gerb },
        { key: 'stamp', label: 'Штамп', desc: 'Официальный штамп организации.', image: stamp },
        { key: 'seal', label: 'Печать', desc: 'Официальная печать партии.', image: seal }
    ];

    let html = '';
    symbols.forEach(s => {
        const imgHtml = s.image && s.image.startsWith('data:image') ?
            `<img src="${s.image}" alt="${s.label}" style="max-width:200px; max-height:200px; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />` :
            `<div style="width:200px; height:200px; display:flex; align-items:center; justify-content:center; background:var(--light-gray); border-radius:12px; color:#6a7a8e; font-size:14px;">Изображение не загружено</div>`;
        html += `
            <div class="symbol-card">
                <div class="symbol-image">
                    ${imgHtml}
                </div>
                <h3>${s.label}</h3>
                <p>${s.desc}</p>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ============================================================
// SYMBOLS ADMIN
// ============================================================
async function loadSymbolsAdmin() {
    const gerb = await dbFirebase.getSymbol('symbol_gerb');
    const stamp = await dbFirebase.getSymbol('symbol_stamp');
    const seal = await dbFirebase.getSymbol('symbol_seal');

    const updatePreview = (key, imageData, previewId, fileNameId) => {
        const preview = document.getElementById(previewId);
        const fileName = document.getElementById(fileNameId);
        if (imageData && imageData.startsWith('data:image')) {
            preview.innerHTML = `<img src="${imageData}" style="max-width:100px; max-height:100px; border-radius:8px; border:2px solid var(--red);" />`;
            if (fileName) fileName.textContent = 'Изображение загружено';
        } else {
            preview.innerHTML = `<span style="color:#6a7a8e; font-size:13px;">Изображение не загружено</span>`;
            if (fileName) fileName.textContent = 'Файл не выбран';
        }
    };

    updatePreview('gerb', gerb, 'symbolGerbPreview', 'symbolGerbFileName');
    updatePreview('stamp', stamp, 'symbolStampPreview', 'symbolStampFileName');
    updatePreview('seal', seal, 'symbolSealPreview', 'symbolSealFileName');
}

async function deleteSymbol(key) {
    if (!confirm(`Удалить изображение для "${key}"?`)) return;
    await dbFirebase.deleteSetting(`symbol_${key}`);
    await loadSymbolsAdmin();
    await renderSymbolsPage();
    alert(`✅ Изображение "${key}" удалено.`);
}

// Обработчики для кнопок удаления в символике
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('delete-symbol-btn')) {
        const key = e.target.getAttribute('data-key');
        deleteSymbol(key);
    }
});

// Отображение имени выбранного файла
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', function() {
        const idMap = {
            'symbolGerbFile': 'symbolGerbFileName',
            'symbolStampFile': 'symbolStampFileName',
            'symbolSealFile': 'symbolSealFileName'
        };
        const spanId = idMap[this.id];
        if (spanId) {
            const span = document.getElementById(spanId);
            if (span) {
                if (this.files && this.files[0]) {
                    span.textContent = this.files[0].name;
                } else {
                    span.textContent = 'Файл не выбран';
                }
            }
        }
    });
});

// Сохранение символики
document.getElementById('symbolsAdminForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const fileInputs = {
        gerb: document.getElementById('symbolGerbFile'),
        stamp: document.getElementById('symbolStampFile'),
        seal: document.getElementById('symbolSealFile')
    };

    let hasChanges = false;
    for (const [key, input] of Object.entries(fileInputs)) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            if (!file.type.startsWith('image/')) {
                alert(`Файл для ${key} не является изображением.`);
                return;
            }
            const data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e.target.error);
                reader.readAsDataURL(file);
            });
            await dbFirebase.setSymbol(`symbol_${key}`, data);
            input.value = '';
            const idMap = {
                'symbolGerbFile': 'symbolGerbFileName',
                'symbolStampFile': 'symbolStampFileName',
                'symbolSealFile': 'symbolSealFileName'
            };
            const spanId = idMap[input.id];
            if (spanId) {
                const span = document.getElementById(spanId);
                if (span) span.textContent = 'Файл не выбран';
            }
            hasChanges = true;
        }
    }

    if (!hasChanges) {
        alert('Вы не выбрали ни одного файла для загрузки.');
        return;
    }

    await loadSymbolsAdmin();
    await renderSymbolsPage();
    alert('✅ Символика обновлена!');
});

// ============================================================
// PROFILE FUNCTIONS
// ============================================================
function showProfileContent(user) {
    const profileLoginForm = document.getElementById('profileLoginForm');
    const profileContent = document.getElementById('profileContent');
    const profileInfo = document.getElementById('profileInfo');
    const editProfileToggleBtn = document.getElementById('editProfileToggleBtn');
    const profileEditForm = document.getElementById('profileEditForm');
    const withdrawBtn = document.getElementById('withdrawApplicationBtn');
    const resubmitBtn = document.getElementById('resubmitApplicationBtn');

    profileLoginForm.style.display = 'none';
    profileContent.style.display = 'block';

    const statusText = user.status === 'pending' ? 'На рассмотрении' : user.status === 'approved' ? 'Одобрена' : 'Отклонена';
    profileInfo.innerHTML = `
        <h3 style="margin-bottom:8px;">${user.fullName}</h3>
        <p><strong>Статус заявки:</strong> <span class="app-status ${user.status}">${statusText}</span></p>
        <p><strong>Игровой возраст:</strong> ${user.icAge}</p>
        <p><strong>Реальный возраст:</strong> ${user.oocAge}</p>
        <p><strong>Discord:</strong> ${user.discord}</p>
        <p><strong>Мотивация:</strong> ${user.motivation}</p>
        <p><strong>Поддержка:</strong> ${user.support}</p>
        ${user.status === 'approved' ? '<p style="color:#2e7d32; font-weight:600;">✓ Вы приняты в партию! Добро пожаловать!</p>' : ''}
        ${user.status === 'rejected' ? '<p style="color:#d32f2f; font-weight:600;">✗ К сожалению, ваша заявка отклонена.</p>' : ''}
    `;

    withdrawBtn.style.display = (user.status === 'pending') ? 'inline-block' : 'none';
    resubmitBtn.style.display = (user.status === 'rejected') ? 'inline-block' : 'none';

    document.getElementById('editProfileFullName').value = user.fullName || '';
    document.getElementById('editProfileIcAge').value = user.icAge || '';
    document.getElementById('editProfileOocAge').value = user.oocAge || '';
    document.getElementById('editProfileDiscord').value = user.discord || '';
    document.getElementById('editProfileMotivation').value = user.motivation || '';
    document.getElementById('editProfileSupport').value = user.support || '';

    profileEditForm.style.display = 'none';
    isEditingProfile = false;
    editProfileToggleBtn.textContent = '✏️ Редактировать профиль';
}

document.getElementById('editProfileToggleBtn').addEventListener('click', function() {
    const form = document.getElementById('profileEditForm');
    if (isEditingProfile) {
        form.style.display = 'none';
        isEditingProfile = false;
        this.textContent = '✏️ Редактировать профиль';
    } else {
        form.style.display = 'block';
        isEditingProfile = true;
        this.textContent = '❌ Отменить редактирование';
    }
});

document.getElementById('cancelEditProfileBtn').addEventListener('click', function() {
    const form = document.getElementById('profileEditForm');
    form.style.display = 'none';
    isEditingProfile = false;
    document.getElementById('editProfileToggleBtn').textContent = '✏️ Редактировать профиль';
});

document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!currentUser) return;

    const fullName = document.getElementById('editProfileFullName').value.trim();
    const icAge = parseInt(document.getElementById('editProfileIcAge').value);
    const oocAge = parseInt(document.getElementById('editProfileOocAge').value);
    const discord = document.getElementById('editProfileDiscord').value.trim();
    const motivation = document.getElementById('editProfileMotivation').value.trim();
    const support = document.getElementById('editProfileSupport').value.trim();

    if (!fullName || !icAge || !oocAge || !discord || !motivation || !support) {
        alert('Все поля обязательны для заполнения!');
        return;
    }

    const updatedData = { fullName, icAge, oocAge, discord, motivation, support };
    try {
        await dbFirebase.updateUser(currentUser.id, updatedData);
        currentUser = { ...currentUser, ...updatedData };
        showProfileContent(currentUser);
        if (isAdminLoggedIn) await renderApplications();
        alert('✅ Данные профиля обновлены!');
    } catch (error) {
        alert('Ошибка при обновлении профиля: ' + error.message);
    }
});

document.getElementById('withdrawApplicationBtn').addEventListener('click', async function() {
    if (!currentUser || currentUser.status !== 'pending') return;
    if (!confirm('Вы уверены, что хотите отозвать свою заявку?')) return;
    try {
        await dbFirebase.deleteUser(currentUser.id);
        currentUser = null;
        saveUserState(null);
        document.getElementById('profileLoginForm').style.display = 'block';
        document.getElementById('profileContent').style.display = 'none';
        if (isAdminLoggedIn) await renderApplications();
        alert('Заявка отозвана.');
        closeProfileModal();
    } catch (error) {
        alert('Ошибка при отзыве заявки: ' + error.message);
    }
});

document.getElementById('resubmitApplicationBtn').addEventListener('click', function() {
    if (!currentUser || currentUser.status !== 'rejected') return;
    closeProfileModal();
    showPage('join');
    document.getElementById('joinForm').reset();
    alert('Заполните анкету заново для повторной подачи заявки.');
});

// ============================================================
// BACKGROUND
// ============================================================
async function applyBackground() {
    const bg = await dbFirebase.getSetting('background');
    if (bg && bg.startsWith('data:image')) {
        document.body.style.backgroundImage = `url(${bg})`;
    } else {
        document.body.style.backgroundImage = '';
    }
}

// ============================================================
// SAVE / RESTORE STATE
// ============================================================
function saveAdminState(loggedIn) {
    if (loggedIn) {
        localStorage.setItem('admin_logged_in', 'true');
    } else {
        localStorage.removeItem('admin_logged_in');
    }
}

function saveUserState(userId) {
    if (userId) {
        localStorage.setItem('user_id', userId);
    } else {
        localStorage.removeItem('user_id');
    }
}

async function restoreState() {
    const adminLogged = localStorage.getItem('admin_logged_in') === 'true';
    if (adminLogged) {
        isAdminLoggedIn = true;
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.textContent = 'Админ-панель';
        loginBtn.classList.add('logged-in');
    }

    const userId = localStorage.getItem('user_id');
    if (userId) {
        const users = await dbFirebase.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            currentUser = user;
        } else {
            localStorage.removeItem('user_id');
        }
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
    const loginModal = document.getElementById('loginModal');
    const adminModal = document.getElementById('adminModal');
    const profileModal = document.getElementById('profileModal');
    const loginBtn = document.getElementById('loginBtn');
    const profileBtn = document.getElementById('profileBtn');
    const loginModalClose = document.getElementById('loginModalClose');
    const adminModalClose = document.getElementById('adminModalClose');
    const profileModalClose = document.getElementById('profileModalClose');
    const loginForm = document.getElementById('loginForm');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const profileLogin = document.getElementById('profileLogin');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    function openLoginModal() { loginModal.classList.add('open'); }
    function closeLoginModal() { loginModal.classList.remove('open'); }
    function openAdminModal() { adminModal.classList.add('open'); }
    function closeAdminModal() { adminModal.classList.remove('open'); }
    function openProfileModal() { profileModal.classList.add('open'); }
    function closeProfileModal() { profileModal.classList.remove('open'); }

    loginBtn.addEventListener('click', function() {
        if (isAdminLoggedIn) {
            openAdminModal();
            renderApplications();
            renderAdminMembers();
            populateElectionsForm();
            loadSymbolsAdmin();
        } else {
            openLoginModal();
        }
    });

    profileBtn.addEventListener('click', function() {
        openProfileModal();
        if (currentUser) {
            showProfileContent(currentUser);
        } else {
            document.getElementById('profileLoginForm').style.display = 'block';
            document.getElementById('profileContent').style.display = 'none';
        }
    });

    loginModalClose.addEventListener('click', closeLoginModal);
    adminModalClose.addEventListener('click', closeAdminModal);
    profileModalClose.addEventListener('click', closeProfileModal);
    loginModal.addEventListener('click', function(e) { if (e.target === this) closeLoginModal(); });
    adminModal.addEventListener('click', function(e) { if (e.target === this) closeAdminModal(); });
    profileModal.addEventListener('click', function(e) { if (e.target === this) closeProfileModal(); });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        if (username === 'admin' && password === 'admin') {
            isAdminLoggedIn = true;
            saveAdminState(true);
            loginBtn.textContent = 'Админ-панель';
            loginBtn.classList.add('logged-in');
            closeLoginModal();
            openAdminModal();
            renderApplications();
            renderAdminMembers();
            populateElectionsForm();
            loadSymbolsAdmin();
        } else {
            alert('Неверный логин или пароль!');
        }
    });

    adminLogoutBtn.addEventListener('click', function() {
        isAdminLoggedIn = false;
        saveAdminState(false);
        loginBtn.textContent = 'Вход';
        loginBtn.classList.remove('logged-in');
        closeAdminModal();
    });

    profileLogin.addEventListener('submit', async function(e) {
        e.preventDefault();
        const fullName = document.getElementById('profileLoginName').value.trim();
        const passport = document.getElementById('profileLoginPassport').value.trim();
        const users = await dbFirebase.getUsers();
        const user = users.find(u => u.fullName === fullName && u.passport === passport);
        if (user) {
            currentUser = user;
            saveUserState(user.id);
            showProfileContent(user);
        } else {
            alert('Пользователь с таким ФИО и паспортом не найден.');
        }
    });

    profileLogoutBtn.addEventListener('click', function() {
        currentUser = null;
        saveUserState(null);
        document.getElementById('profileLoginForm').style.display = 'block';
        document.getElementById('profileContent').style.display = 'none';
        closeProfileModal();
    });

    // ----- ADMIN FORMS -----
    const addNewsForm = document.getElementById('addNewsForm');
    const addMemberForm = document.getElementById('addMemberForm');
    const backgroundForm = document.getElementById('backgroundForm');
    const resetBgBtn = document.getElementById('resetBgBtn');

    addNewsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const title = document.getElementById('newsTitle').value;
        const date = document.getElementById('newsDate').value;
        const text = document.getElementById('newsText').value;
        if (title && date && text) {
            await dbFirebase.addNews({ title, date, text });
            addNewsForm.reset();
            await renderNews();
        } else {
            alert('Заполните все поля!');
        }
    });

    addMemberForm.addEventListener('submit', async function(e) {
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
            photoData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(e.target.error);
                reader.readAsDataURL(file);
            });
        }

        await dbFirebase.addMember({ name, position, photo: photoData, role });
        await renderAdminMembers();
        await renderComposition();
        addMemberForm.reset();
        fileInput.value = '';
    });

    backgroundForm.addEventListener('submit', async function(e) {
        e.preventDefault();
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
        const photoData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsDataURL(file);
        });
        await dbFirebase.setSetting('background', photoData);
        await applyBackground();
        alert('Фон успешно обновлён!');
        fileInput.value = '';
    });

    resetBgBtn.addEventListener('click', async function() {
        if (confirm('Сбросить фоновое изображение?')) {
            await dbFirebase.setSetting('background', '');
            await applyBackground();
            alert('Фон сброшен.');
        }
    });

    // ----- NAVIGATION -----
    const navLinks = document.querySelectorAll('.nav-links a');
    const pageSections = {
        home: document.getElementById('page-home'),
        about: document.getElementById('page-about'),
        symbols: document.getElementById('page-symbols'),
        composition: document.getElementById('page-composition'),
        press: document.getElementById('page-press'),
        join: document.getElementById('page-join'),
    };
    const allPageTriggers = document.querySelectorAll('[data-page]');

    function showPage(pageId) {
        Object.values(pageSections).forEach(el => el.classList.remove('active'));
        const target = pageSections[pageId];
        if (target) target.classList.add('active');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageId) {
                link.classList.add('active');
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page && pageSections[page]) {
                showPage(page);
            }
        });
    });

    allPageTriggers.forEach(el => {
        el.addEventListener('click', function(e) {
            const page = this.dataset.page;
            if (page && pageSections[page]) {
                e.preventDefault();
                showPage(page);
            }
        });
    });

    // ----- JOIN FORM -----
    document.getElementById('joinForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const fullName = document.getElementById('joinFullName').value.trim();
        const icAge = parseInt(document.getElementById('joinIcAge').value);
        const oocAge = parseInt(document.getElementById('joinOocAge').value);
        const passport = document.getElementById('joinPassport').value.trim();
        const passportLink = document.getElementById('joinPassportLink').value.trim();
        const motivation = document.getElementById('joinMotivation').value.trim();
        const support = document.getElementById('joinSupport').value.trim();
        const discord = document.getElementById('joinDiscord').value.trim();

        if (!fullName || !icAge || !oocAge || !passport || !passportLink || !motivation || !support || !discord) {
            alert('Заполните все поля!');
            return;
        }

        try {
            await dbFirebase.addUser({
                fullName,
                icAge,
                oocAge,
                passport,
                passportLink,
                motivation,
                support,
                discord,
                status: 'pending'
            });
            alert('✅ Заявка успешно отправлена! Ожидайте решения администрации.');
            this.reset();
            if (isAdminLoggedIn) await renderApplications();
        } catch (error) {
            alert(error.message);
        }
    });

    // ----- ADMIN TABS -----
    document.querySelectorAll('.admin-tabs button').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.admin-tabs button').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.admin-panel-section').forEach(s => s.classList.remove('active'));
            document.getElementById('adminTab' + tabName.charAt(0).toUpperCase() + tabName.slice(1)).classList.add('active');
            if (tabName === 'applications') renderApplications();
            if (tabName === 'members') renderAdminMembers();
            if (tabName === 'elections') populateElectionsForm();
            if (tabName === 'symbols-admin') loadSymbolsAdmin();
        });
    });

    const currentActive = document.querySelector('.nav-links a.active');
    if (!currentActive) {
        const homeLink = document.querySelector('.nav-links a[data-page="home"]');
        if (homeLink) homeLink.classList.add('active');
    }
}

// ============================================================
// STARTUP
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    (async function() {
        try {
            await dbFirebase.seed();
            await restoreState();
            await renderNews();
            await renderComposition();
            await renderApplications();
            await renderAdminMembers();
            await renderElections();
            await renderSymbolsPage();
            const members = await dbFirebase.getMembers();
            document.getElementById('totalMembers').textContent = members.length;
            await applyBackground();
        } catch (e) {
            console.error('Ошибка инициализации:', e);
        }
    })();
});
