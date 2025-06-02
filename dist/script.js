import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// TODO: 換成你自己的 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD2voO7A_v6-QRtMNNn02jI1S8X1zdOpyI",
  authDomain: "course-map-cdd81.firebaseapp.com",
  projectId: "course-map-cdd81",
  storageBucket: "course-map-cdd81.firebasestorage.app",
  messagingSenderId: "913881017192",
  appId: "1:913881017192:web:fd3708b9fe9971cc4544dd",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    // Firestore 沒辦法直接查陣列是否含某值，需要用 where() 和 array-contains
    // 但若你課程的 interestTags 欄位是陣列，這樣查最有效
    const q = query(
      collection(db, "courses"),
      // 這裡用 "interestTags" 是欄位名稱，要確保你的資料符合
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
        <h3>${course["課程名稱"] || course.title || "無課程名稱"}</h3>
        <p><strong>授課教師：</strong>${course["授課教師"] || course.teacher || "-"}</p>
        <p><strong>學分數：</strong>${course["學分數"] || course.credits || "-"}</p>
        <p><strong>興趣分類：</strong>${(course.interestTags || []).join(", ")}</p>
        <p><strong>時間及地點：</strong>${course["上課時間及教室"] || "-"}</p>
      `;
      courseList.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    courseList.innerHTML = "<p>載入課程資料出錯，請稍後再試。</p>";
  }
});

// AI 問答查課程（呼叫 Gemini API）
aiSearchBtn.addEventListener("click", async () => {
  const question = aiInput.value.trim();
  courseList.innerHTML = "";

  if (!question) {
    courseList.innerHTML = "<p>請輸入你的問題！</p>";
    return;
  }

  courseList.innerHTML = "<p>AI 查詢中，請稍候...</p>";

  try {
    // 呼叫 Gemini API 的範例
    const response = await fetch("https://gemini.api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 請替換成你自己的 Gemini API key
        Authorization: "Bearer AIzaSyCFmx7FZtLg0ivUWU0ajM1Cjt4OJ6u1N8s",
      },
      body: JSON.stringify({
        model: "gemini-1.0",
        messages: [
          { role: "system", content: "你是一個幫助學生選課的助理。" },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("API 回應失敗");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "AI 沒有回覆內容。";

    courseList.innerHTML = `<p>${answer}</p>`;
  } catch (err) {
    console.error(err);
    courseList.innerHTML = "<p>⚠️ AI 查詢錯誤，請稍後再試。</p>";
  }
});