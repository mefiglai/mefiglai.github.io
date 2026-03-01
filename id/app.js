// 1. Импорты (Добавлены функции для регистрации и записи в базу)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. ВСТАВЬ СВОЙ КОНФИГ СЮДА!
const firebaseConfig = {
  apiKey: "AIzaSyBFUFGzJd-9yGuGYLem-ZQuOpzAeTiwmcw",
  authDomain: "mefiglaiid.firebaseapp.com",
  projectId: "mefiglaiid",
  storageBucket: "mefiglaiid.firebasestorage.app",
  messagingSenderId: "707999406925",
  appId: "1:707999406925:web:85b39f3166790db10df504",
  measurementId: "G-V0CN9X9BNK"
};

// 3. Инициализация
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. Элементы UI (Секции)
const authSection = document.getElementById('auth-section');
const regSection = document.getElementById('reg-section');
const appSection = document.getElementById('app-section');

// Навигация
document.getElementById('go-to-reg').addEventListener('click', () => {
    authSection.style.display = 'none';
    regSection.style.display = 'block';
});
document.getElementById('go-to-login').addEventListener('click', () => {
    regSection.style.display = 'none';
    authSection.style.display = 'block';
});

// Элементы Входа
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorMsg = document.getElementById('error-msg');

// Элементы Регистрации
const regEmail = document.getElementById('reg-email');
const regPass = document.getElementById('reg-password');
const regFname = document.getElementById('reg-fname');
const regLname = document.getElementById('reg-lname');
const regBdate = document.getElementById('reg-bdate');
const regBplace = document.getElementById('reg-bplace');
const regGender = document.getElementById('reg-gender');
const registerBtn = document.getElementById('register-btn');
const regErrorMsg = document.getElementById('reg-error-msg');

// Элементы Приложения
const welcomeText = document.getElementById('welcome-text');
const logoutBtn = document.getElementById('logout-btn');

// 5. Проверка состояния (Слушатель авторизации)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        authSection.style.display = 'none';
        regSection.style.display = 'none';
        appSection.style.display = 'block';
        
        const docRef = doc(db, "citizens", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Показываем статус верификации и данные
            const status = user.emailVerified ? "✅ Verified" : "⚠️ Email not verified";
            welcomeText.innerText = `Citizen: ${data.firstName} ${data.lastName}\nID: ${data.passportId}\nStatus: ${status}`;
        } else {
            welcomeText.innerText = "Citizen data not found in registry.";
        }
    } else {
        authSection.style.display = 'block';
        regSection.style.display = 'none';
        appSection.style.display = 'none';
    }
});

// 6. Логика ВХОДА
loginBtn.addEventListener('click', () => {
    loginBtn.innerText = "PROCESSING...";
    signInWithEmailAndPassword(auth, emailInput.value, passInput.value)
        .then(() => {
            errorMsg.innerText = "";
            loginBtn.innerText = "LOGIN";
        })
        .catch((error) => {
            errorMsg.innerText = error.message;
            loginBtn.innerText = "LOGIN";
        });
});

// 7. Логика РЕГИСТРАЦИИ (Выпуск паспорта)
registerBtn.addEventListener('click', async () => {
    const email = regEmail.value.trim();
    const pass = regPass.value.trim();
    const fname = regFname.value.trim();
    const lname = regLname.value.trim();
    const bdate = regBdate.value.trim();
    const bplace = regBplace.value.trim();
    const gender = regGender.value;

    if (!email || !pass || !fname || !lname) {
        regErrorMsg.innerText = "Please fill in all core fields.";
        return;
    }

    registerBtn.innerText = "PROCESSING...";

    try {
        // Создаем юзера в Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // Генерируем ID паспорта
        const passportId = "QGK-" + Math.floor(10000 + Math.random() * 90000);

        // Пишем анкету в базу Firestore
        await setDoc(doc(db, "citizens", user.uid), {
            email: email,
            firstName: fname,
            lastName: lname,
            birthDate: bdate,
            birthPlace: bplace,
            gender: gender,
            passportId: passportId,
            citizenshipDate: Date.now().toString(),
            photoUrl: ""
        });

        // Отправляем письмо подтверждения
        await sendEmailVerification(user);

        regErrorMsg.innerText = "";
        registerBtn.innerText = "ISSUANCE PASSPORT";
        // После успеха onAuthStateChanged сам перекинет нас на главный экран
    } catch (error) {
        regErrorMsg.innerText = error.message;
        registerBtn.innerText = "ISSUANCE PASSPORT";
    }
});

// 8. Логика ВЫХОДА
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});