import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 初始化 Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2voO7A_v6-QRtMNNn02jI1S8X1zdOpyI",
  authDomain: "course-map-cdd81.firebaseapp.com",
  projectId: "course-map-cdd81",
  storageBucket: "course-map-cdd81.appspot.com",
  messagingSenderId: "913881017192",
  appId: "1:913881017192:web:fd3708b9fe9971cc4544dd",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM 元素
const interestSelect = document.getElementById("interestSelect");
const selectSearchBtn = document.getElementById("selectSearchBtn");
const aiInput = document.getElementById("aiInput");
const aiSearchBtn = document.getElementById("aiSearchBtn");
const courseList = document.getElementById("courseList");

// 興趣分類搜尋
selectSearchBtn.addEventListener("click", async () => {
  const selectedInterest = interestSelect.value.trim();
  courseList.innerHTML = "載入中...";

  if (!selectedInterest) {
    courseList.innerHTML = "<p>請先選擇興趣分類！</p>";
    return;
  }

  try {
    const q = query(
      collection(db, "courses"),
      where("interestTags", "array-contains", selectedInterest)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      courseList.innerHTML = "<p>沒有符合的課程。</p>";
      return;
    }

    courseList.innerHTML = "";
    snapshot.forEach((doc) => {
      const course = doc.data();
      const div = document.createElement("div");
      div.className = "course-item";
      div.innerHTML = `
        <h3>${course["課程名稱"] || "無課程名稱"}</h3>
        <p><strong>授課教師：</strong>${course["授課教師"] || "-"}</p>
        <p><strong>學分數：</strong>${course["學分數"] || "-"}</p>
        <p><strong>興趣分類：</strong>${(course.interestTags || []).join(", ")}</p>
        <p><strong>時間及地點：</strong>${course["上課時間及教室"] || "-"}</p>
      `;
      courseList.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    courseList.innerHTML = "<p>⚠️ 載入課程失敗，請稍後再試。</p>";
  }
});

// Gemini 2.0 Flash AI 問答
aiSearchBtn.addEventListener("click", async () => {
  const question = aiInput.value.trim();
  courseList.innerHTML = "";

  if (!question) {
    courseList.innerHTML = "<p>請輸入你的問題！</p>";
    return;
  }

  courseList.innerHTML = "<p>AI 查詢中，請稍候...</p>";

  try {
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCFmx7FZtLg0ivUWU0ajM1Cjt4OJ6u1N8s";

    const payload = {
      contents: [
        {
          parts: [{ text: question }]
        }
      ]
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API 錯誤：", errorText);
      throw new Error("Gemini API 回應失敗");
    }

    const data = await response.json();
    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    courseList.innerHTML = `<div class="course-item"><p>${output || "AI 沒有提供回答。"}</p></div>`;
  } catch (err) {
    console.error(err);
    courseList.innerHTML = "<p>⚠️ AI 查詢錯誤，請稍後再試。</p>";
  }
});
