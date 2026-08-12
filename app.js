// Конфигурация Firebase (замени своими ключами из Firebase Console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Инициализация Firebase
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
}

const db = typeof firebase !== 'undefined' && firebase.apps.length ? firebase.firestore() : null;

// Модальное окно
const modal = document.getElementById('joinModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const partyForm = document.getElementById('partyForm');
const formStatus = document.getElementById('formStatus');

function openJoinModal() {
  modal.style.display = 'flex';
}

function closeJoinModal() {
  modal.style.display = 'none';
  formStatus.innerText = '';
  partyForm.reset();
}

openModalBtn.addEventListener('click', openJoinModal);
closeModalBtn.addEventListener('click', closeJoinModal);

window.addEventListener('click', (e) => {
  if (e.target === modal) closeJoinModal();
});

// Отправка формы в Firebase Firestore
partyForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    fullName: document.getElementById('fullName').value,
    phone: document.getElementById('phone').value,
    email: document.getElementById('email').value,
    region: document.getElementById('region').value,
    createdAt: new Date().toISOString()
  };

  formStatus.style.color = 'var(--primary)';
  formStatus.innerText = 'Отправка заявки...';

  try {
    if (db) {
      // Сохранение в коллекцию 'applications'
      await db.collection('applications').add(formData);
    } else {
      console.warn('Firebase не настроен. Данные формы:', formData);
    }

    formStatus.style.color = 'green';
    formStatus.innerText = 'Заявка успешно отправлена!';
    setTimeout(() => {
      closeJoinModal();
    }, 2000);

  } catch (error) {
    console.error('Ошибка при отправке:', error);
    formStatus.style.color = 'var(--accent)';
    formStatus.innerText = 'Произошла ошибка. Попробуйте позже.';
  }
});
