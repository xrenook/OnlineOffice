// 🔍 快速诊断脚本 - 复制粘贴到浏览器Console中运行

console.log("🔍 ===== 开始诊断 =====\n");

// 1. 检查localStorage
console.log("📦 1. localStorage状态:");
const userProfile = localStorage.getItem("userProfile");
const lastActive = localStorage.getItem("lastActive");

if (userProfile) {
  console.log("  ✅ userProfile:", JSON.parse(userProfile));
} else {
  console.log("  ❌ userProfile: null (没有保存的资料)");
}

if (lastActive) {
  const elapsed = (Date.now() - parseInt(lastActive)) / 1000;
  console.log(
    "  ✅ lastActive:",
    new Date(parseInt(lastActive)).toLocaleString()
  );
  console.log("  ⏱️  距离现在:", elapsed.toFixed(0), "秒");
  console.log("  ⏱️  在1分钟内?", elapsed < 60 ? "✅ 是" : "❌ 否");
} else {
  console.log("  ❌ lastActive: null");
}

console.log("\n");

// 2. 检查当前页面状态
console.log("🌐 2. 页面状态:");
console.log("  URL:", window.location.href);
console.log(
  "  Document hidden?",
  document.hidden ? "❌ 是（页面不可见）" : "✅ 否（页面可见）"
);

console.log("\n");

// 3. 检查环境变量
console.log("⚙️  3. 环境变量:");
try {
  const hasApiKey = !!import.meta.env.VITE_FIREBASE_API_KEY;
  const hasProjectId = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  console.log("  Firebase API Key:", hasApiKey ? "✅ 已配置" : "❌ 未配置");
  console.log(
    "  Firebase Project ID:",
    hasProjectId ? "✅ 已配置" : "❌ 未配置"
  );
} catch (e) {
  console.log("  ⚠️  无法检查环境变量（这是正常的）");
}

console.log("\n");

// 4. 建议的操作
console.log("💡 4. 建议的操作:");

if (!userProfile) {
  console.log("  ⚠️  没有保存的用户资料");
  console.log("  👉 这是第一次登录，需要设置角色");
  console.log("  👉 应该看到角色设置界面");
} else if (lastActive) {
  const elapsed = (Date.now() - parseInt(lastActive)) / 1000;
  if (elapsed < 60) {
    console.log("  ✅ 会话有效（<1分钟）");
    console.log("  👉 应该自动重新加入游戏");
    console.log("  👉 如果没有，检查Console是否有错误");
  } else {
    console.log("  ⚠️  会话已过期（>1分钟）");
    console.log("  👉 需要重新设置角色");
    console.log("  👉 但Google登录状态应该保留");
  }
}

console.log("\n");

// 5. 快速操作
console.log("🛠️  5. 快速操作命令:");
console.log(
  '  清除会话: localStorage.removeItem("userProfile"); localStorage.removeItem("lastActive");'
);
console.log(
  '  查看资料: console.log(JSON.parse(localStorage.getItem("userProfile")));'
);
console.log("  刷新页面: location.reload();");

console.log("\n🔍 ===== 诊断完成 =====");
