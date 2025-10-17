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
  apiKey: ,
  authDomain: ,
  projectId: ,
  storageBucket: ,
  messagingSenderId: ,
  appId: ,
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM 元素
const interestSelect = document.getElementById("interestSelect");
const selectSearchBtn = document.getElementById("selectSearchBtn");
const aiInput = document.getElementById("aiInput");
const aiSearchBtn = document.getElementById("aiSearchBtn");
const courseList = document.getElementById("courseList");

// 課程時間對照表
const TIME_MAP = {
  "1": "8:00~8:50",
  "2": "9:00~9:50",
  "3": "10:00~10:50",
  "4": "11:00~11:50",
  "Z": "12:00~12:50",
  "5": "13:00~13:50",
  "6": "14:00~14:50",
  "7": "15:00~15:50",
  "8": "16:00~16:50",
  "9": "17:00~17:50",
  "A": "18:00~18:50",
  "B": "19:00~19:50",
  "C": "20:00~20:50",
  "D": "21:00~21:50"
};

const WEEKDAY_MAP = {
  "一": "Monday",
  "二": "Tuesday",
  "三": "Wednesday",
  "四": "Thursday",
  "五": "Friday",
  "六": "Saturday",
  "日": "Sunday"
};

// 從 Firebase 獲取所有課程資料
async function getAllCourses() {
  const coursesRef = collection(db, "courses");
  const snapshot = await getDocs(coursesRef);
  const courses = [];
  snapshot.forEach(doc => {
    courses.push(doc.data());
  });
  return courses;
}

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

// AI 問答搜尋
aiSearchBtn.addEventListener("click", async () => {
  const question = aiInput.value.trim();
  courseList.innerHTML = "";

  if (!question) {
    courseList.innerHTML = "<p>請輸入你的問題！</p>";
    return;
  }

  courseList.innerHTML = "<p>AI 查詢中，請稍候...</p>";

  try {
    const allCourses = await getAllCourses();
    
    const prompt = `你是一個課程查詢助手。請根據以下的課程資料和時間規則回答問題。

課程時間規則：
1. 星期：一到日（一=星期一，二=星期二，以此類推）
2. 節次時間對照：
   - 第1節 = 8:00~8:50
   - 第2節 = 9:00~9:50
   - 第3節 = 10:00~10:50
   - 第4節 = 11:00~11:50
   - 第Z節 = 12:00~12:50（中午）
   - 第5節 = 13:00~13:50
   - 第6節 = 14:00~14:50
   - 第7節 = 15:00~15:50
   - 第8節 = 16:00~16:50
   - 第9節 = 17:00~17:50
   - 第A節 = 18:00~18:50
   - 第B節 = 19:00~19:50
   - 第C節 = 20:00~20:50
   - 第D節 = 21:00~21:50

3. 時間格式範例：
   "二 5 / I1-509" 表示星期二第5節課(13:00~13:50)在I1-509教室
   "三 2,3,4 / E1-102" 表示星期三第2,3,4節課(9:00~11:50)在E1-102教室

課程資料：${JSON.stringify(allCourses)}

用戶問題：${question}

請根據以上資訊回答問題，並注意：
1. 嚴格檢查課程的"上課時間及教室"欄位
2. 如果問到特定時段，請同時說明實際的上課時間
3. 排除沒有時間或時間未定的課程
4. 按照以下格式列出課程：
   課程名稱: 教師, 時間/地點, 學分數

請提供準確且簡潔的回答。`;

    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";
    
    const payload = {
      contents: [
        {
          parts: [{ text: prompt }]
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
      throw new Error("Gemini API 回應失敗");
    }

    const data = await response.json();
    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    courseList.innerHTML = `<div class="course-item"><p style="white-space: pre-line">${output || "AI 沒有提供回答。"}</p></div>`;

  } catch (err) {
    console.error(err);
    courseList.innerHTML = "<p>⚠️ AI 查詢錯誤，請稍後再試。</p>";
  }
});
