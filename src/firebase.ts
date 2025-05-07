import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC0ylgwDzrdA7xTaR3sgi3W_ARzGwO1CQg",
  authDomain: "xoxo-1d234.firebaseapp.com",
  databaseURL: "https://xoxo-1d234-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "xoxo-1d234",
  storageBucket: "xoxo-1d234.appspot.com",
  messagingSenderId: "948530246082",
  appId: "1:948530246082:web:67f59e94a61c643564665b"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); 