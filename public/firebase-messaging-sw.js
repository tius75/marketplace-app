importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAUDkSFWfC6fZJo1tSy7gt99iKPcPWICGo",
  projectId: "belanja-mudah-ae88a",
  messagingSenderId: "934294728680",
  appId: "1:934294728680:web:9e7f56a5d458cba482be5d"
});

const messaging = firebase.messaging();

// Menangani background notification
messaging.onBackgroundMessage((payload) => {
  console.log('Pesan di latar belakang diterima: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});