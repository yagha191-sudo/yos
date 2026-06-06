// 1. قائمة الأجهزة الإلكترونية الافتراضية الموحدة لجميع المتصفحات
const defaultProducts = [
    { id: 1, name: "سماعة رأس محيطية مضيئة", price: 299, icon: "🎧", isTextIcon: true },
    { id: 2, name: "ماوس ألعاب لاسلكي سريع", price: 180, icon: "🖱️", isTextIcon: true },
    { id: 3, name: "ساعة ذكية شاشة OLED", price: 450, icon: "⌚", isTextIcon: true },
    { id: 4, name: "لوحة مفاتيح ميكانيكية RGB", price: 350, icon: "⌨️", isTextIcon: true }
];

// بيانات حساب الآدمن الخاصة بك للدخول من أي جهاز
const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

let currentSelectedProduct = null;
let authMode = "login"; 

// تحميل وتثبيت وتهيئة النظام فور فتح الموقع
document.addEventListener("DOMContentLoaded", () => {
    initMockDatabase();
    renderProducts();
    checkSession();
});

function initMockDatabase() {
    if (!localStorage.getItem("users")) localStorage.setItem("users", JSON.stringify([]));
    if (!localStorage.getItem("orders")) localStorage.setItem("orders", JSON.stringify([]));
    if (!localStorage.getItem("store_products")) {
        localStorage.setItem("store_products", JSON.stringify(defaultProducts));
    }
}

function showToast(message) {
    const toast = document.getElementById("custom-toast");
    if (toast) {
        toast.innerText = message;
        toast.classList.add("show");
        setTimeout(() => { toast.classList.remove("show"); }, 3500);
    }
}
// دالة عرض المنتجات الموحدة
function renderProducts() {
    const container = document.getElementById("products-container");
    if (!container) return;
    container.innerHTML = "";
    const currentProducts = JSON.parse(localStorage.getItem("store_products")) || defaultProducts;
    currentProducts.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        const imageHTML = p.isTextIcon ? p.icon : `<img src="${p.icon}" alt="${p.name}">`;
        div.innerHTML = `
            <div class="product-image">${imageHTML}</div>
            <h3>${p.name}</h3>
            <div class="product-price">${p.price} ر.س</div>
            <button class="btn-primary" onclick="openOrderModal(${p.id})">شراء الآن ⚡</button>
        `;
        container.appendChild(div);
    });
}

// دالة الانتقال بين أقسام الموقع وتحديث أزرار الجوال السفلية والعلوية بالتزامن
function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => item.classList.remove('active'));
    
    const sec = document.getElementById(sectionId);
    if (sec) sec.classList.add('active');
    
    // إضاءة الزر العلوي النشط للكمبيوتر
    const activeLink = Array.from(document.querySelectorAll('.nav-links a')).find(a => a.getAttribute('onclick')?.includes(sectionId));
    if (activeLink) activeLink.classList.add('active');

    // إضاءة الزر السفلي النشط للجوال
    const activeBotLink = Array.from(document.querySelectorAll('.bottom-nav .nav-item')).find(item => item.getAttribute('onclick')?.includes(sectionId));
    if (activeBotLink) activeBotLink.classList.add('active');
}
function openOrderModal(productId) {
    const currentProducts = JSON.parse(localStorage.getItem("store_products"));
    currentSelectedProduct = currentProducts.find(p => p.id === productId);
    document.getElementById("order-product-title").innerText = `طلب: ${currentSelectedProduct.name} (- بسعر ${currentSelectedProduct.price} ر.س)`;
    const loggedUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (loggedUser && loggedUser.role === "customer") {
        document.getElementById("cust-name").value = loggedUser.name;
    } else {
        document.getElementById("cust-name").value = "";
    }
    document.getElementById("order-modal").classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

function submitOrder(e) {
    e.preventDefault();
    const name = document.getElementById("cust-name").value;
    const phone = document.getElementById("cust-phone").value;
    const address = document.getElementById("cust-address").value;
    const loggedUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

    const newOrder = {
        orderId: Math.floor(1000 + Math.random() * 9000),
        customerUsername: loggedUser && loggedUser.role === "customer" ? loggedUser.username : "guest_user",
        customerName: name,
        phone: phone,
        address: address,
        productName: currentSelectedProduct.name,
        eta: "قيد المراجعة"
    };

    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));
    showToast(`🎉 شكراً لك يا ${name}! تم استلام طلبك بنجاح.`);
    closeModal("order-modal");
    document.getElementById("cust-phone").value = "";
    document.getElementById("cust-address").value = "";
    checkSession(); 
}
function openAuthModal() {
    const loggedUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    if (loggedUser) { 
        showSection("dashboard-sec"); 
    } else { 
        document.getElementById("auth-modal").classList.add("active"); 
    }
}

function toggleAuthMode() {
    if (authMode === "login") {
        authMode = "register";
        document.getElementById("auth-title").innerText = "إنشاء حساب جديد";
        document.getElementById("auth-submit-btn").innerText = "سجل الآن";
        document.getElementById("auth-toggle-link").innerText = "لديك حساب بالفعل? سجل دخولك";
    } else {
        authMode = "login";
        document.getElementById("auth-title").innerText = "تسجيل الدخول";
        document.getElementById("auth-submit-btn").innerText = "دخول";
        document.getElementById("auth-toggle-link").innerText = "ليس لديك حساب? سجل الآن";
    }
}

function handleAuth(e) {
    e.preventDefault();
    const user = document.getElementById("auth-user").value.trim();
    const pass = document.getElementById("auth-pass").value;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        const adminSession = { username: ADMIN_USER, role: "admin" };
        sessionStorage.setItem("loggedInUser", JSON.stringify(adminSession));
        showToast("🔓 أهلاً بك يا مدير الموقع في لوحة التحكم.");
        closeModal("auth-modal");
        checkSession();
        showSection("dashboard-sec");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    if (authMode === "login") {
        const foundUser = users.find(u => u.username === user && u.password === pass);
        if (foundUser) {
            const userSession = { username: foundUser.username, name: foundUser.name, role: "customer" };
            sessionStorage.setItem("loggedInUser", JSON.stringify(userSession));
            showToast(`👋 مرحباً بعودتك يا ${foundUser.name}!`);
            closeModal("auth-modal");
            checkSession();
            showSection("home-sec"); 
        } else {
            showToast("❌ خطأ في الحساب أو كلمة المرور!");
        }
    } else {
        if (users.some(u => u.username === user)) {
            showToast("⚠️ اسم المستخدم محجوز مسبقاً!");
            return;
        }
        const newUser = { username: user, password: pass, name: user }; 
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        const userSession = { username: newUser.username, name: newUser.name, role: "customer" };
        sessionStorage.setItem("loggedInUser", JSON.stringify(userSession));
        showToast("✨ تم إنشاء حسابك بنجاح.");
        closeModal("auth-modal");
        checkSession();
        showSection("home-sec"); 
    }
}
function checkSession() {
    const loggedUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    const authBtn = document.getElementById("auth-btn");
    const adminLink = document.getElementById("nav-dash-link");
    
    document.getElementById("user-panel").style.display = "none";
    document.getElementById("admin-panel").style.display = "none";
    if (adminLink) adminLink.style.display = "none";

    if (loggedUser) {
        if (loggedUser.role === "admin") {
            if (authBtn) authBtn.innerText = "لوحة الآدمن 🔐";
            if (adminLink) adminLink.style.display = "inline-block";
            document.getElementById("admin-panel").style.display = "block";
            loadAdminOrders();
            loadRegisteredUsers();
            loadAdminProducts(); 
        } else if (loggedUser.role === "customer") {
            if (authBtn) authBtn.innerText = "حسابي 👤";
            document.getElementById("user-panel").style.display = "block";
            document.getElementById("user-display-name").innerText = loggedUser.name;
            document.getElementById("update-name").value = loggedUser.name;
            loadUserOrders(loggedUser.username);
        }
    } else {
        if (authBtn) authBtn.innerText = "تسجيل الدخول";
    }
}
function updateProfile(e) {
    e.preventDefault();
    const loggedUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
    const newName = document.getElementById("update-name").value;
    const newPass = document.getElementById("update-pass").value;
    let users = JSON.parse(localStorage.getItem("users")) || [];
    let idx = users.findIndex(u => u.username === loggedUser.username);
    if (idx !== -1) {
        users[idx].name = newName; users[idx].password = newPass;
        localStorage.setItem("users", JSON.stringify(users));
        loggedUser.name = newName; sessionStorage.setItem("loggedInUser", JSON.stringify(loggedUser));
        showToast("✅ تم تحديث البيانات الشخصية.");
        checkSession();
    }
}

function loadUserOrders(username) {
    const container = document.getElementById("user-orders-list");
    if (!container) return; container.innerHTML = "";
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    const myOrders = orders.filter(o => o.customerUsername === username);
    if (myOrders.length === 0) {
        container.innerHTML = "<p style='color:var(--text-muted);'>لم تقم بأي طلبات بعد.</p>";
        return;
    }
    myOrders.forEach(o => {
        const div = document.createElement("div"); div.className = "order-tracking-item";
        div.innerHTML = `<strong>طلب رقم: #${o.orderId}</strong> - ${o.productName}<br><small style="color:var(--accent-color);">التوصيل: ${o.eta}</small>`;
        container.appendChild(div);
    });
}
function loadAdminOrders() {
    const tbody = document.getElementById("admin-orders-table");
    if (!tbody) return; tbody.innerHTML = "";
    const orders = JSON.parse(localStorage.getItem("orders")) || [];
    if (orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' style='text-align:center;'>لا توجد طلبات مسجلة حالياً.</td></tr>";
        return;
    }
    orders.forEach(o => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${o.orderId}</td>
            <td>${o.customerName}</td>
            <td>${o.phone}</td>
            <td>${o.address}</td>
            <td><strong>${o.productName}</strong></td>
            <td><span style='color:var(--accent-color); font-weight:bold;'>${o.eta}</span></td>
            <td>
                <input type="text" placeholder="يومين" id="eta-input-${o.orderId}" style="width:70px; margin:0; padding:4px; font-size:12px; display:inline-block;">
                <button class="btn-primary" onclick="setOrderEta(${o.orderId})" style="padding:4px 8px; font-size:11px; width:auto; display:inline-block;">حفظ</button>
                <button class="btn-delete-order" onclick="deleteOrder(${o.orderId})" style="padding:4px 8px; font-size:11px; display:inline-block;">حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteOrder(orderId) {
    if (confirm("هل تريد حذف هذا الطلب نهائياً؟")) {
        let orders = JSON.parse(localStorage.getItem("orders")) || [];
        orders = orders.filter(o => o.orderId !== orderId);
        localStorage.setItem("orders", JSON.stringify(orders));
        showToast("🗑️ تم حذف الطلب.");
        loadAdminOrders();
    }
}
function setOrderEta(orderId) {
    const val = document.getElementById(`eta-input-${orderId}`).value.trim();
    if (!val) return;
    let orders = JSON.parse(localStorage.getItem("orders")) || [];
    let idx = orders.findIndex(o => o.orderId === orderId);
    if (idx !== -1) {
        orders[idx].eta = val;
        localStorage.setItem("orders", JSON.stringify(orders));
        showToast("⏰ تم تحديث وقت التوصيل.");
        loadAdminOrders();
    }
}

function addNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById("prod-name").value.trim();
    const price = parseInt(document.getElementById("prod-price").value);
    const fileInput = document.getElementById("prod-image-file").files;
    if (!fileInput || fileInput.length === 0) return;
    const reader = new FileReader();
    reader.onload = function (event) {
        let currentProducts = JSON.parse(localStorage.getItem("store_products")) || defaultProducts;
        const newId = currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.id)) + 1 : 1;
        currentProducts.push({ id: newId, name: name, price: price, icon: event.target.result, isTextIcon: false });
        localStorage.setItem("store_products", JSON.stringify(currentProducts));
        showToast("🚀 تم نشر المنتج الجديد بنجاح!");
        renderProducts(); loadAdminProducts(); showSection("home-sec");
    };
    reader.readAsDataURL(fileInput);
}
function loadAdminProducts() {
    const tbody = document.getElementById("admin-products-table");
    if (!tbody) return; tbody.innerHTML = "";
    const currentProducts = JSON.parse(localStorage.getItem("store_products")) || defaultProducts;
    currentProducts.forEach(p => {
        const tr = document.createElement("tr");
        const thumb = p.isTextIcon ? `<div style="font-size:20px;">${p.icon}</div>` : `<img src="${p.icon}" class="admin-prod-thumb">`;
        tr.innerHTML = `<td>${thumb}</td><td><strong>${p.name}</strong></td><td>${p.price} ر.س</td><td><button class="btn-delete-order" onclick="deleteProduct(${p.id})">حذف</button></td>`;
        tbody.appendChild(tr);
    });
}

function deleteProduct(productId) {
    if (confirm("هل تريد حذف هذا المنتج؟")) {
        let currentProducts = JSON.parse(localStorage.getItem("store_products"));
        currentProducts = currentProducts.filter(p => p.id !== productId);
        localStorage.setItem("store_products", JSON.stringify(currentProducts));
        showToast("🗑️ تم حذف السلعة من المتجر.");
        renderProducts(); loadAdminProducts();
    }
}

function loadRegisteredUsers() {
    const tbody = document.getElementById("admin-users-table");
    if (!tbody) return; tbody.innerHTML = "";
    const users = JSON.parse(localStorage.getItem("users")) || [];
    users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td><span style="color:var(--accent-color);">${u.username}</span></td><td>${u.name}</td><td><span>${u.password}</span></td>`;
        tbody.appendChild(tr);
    });
}

function logout() {
    sessionStorage.removeItem("loggedInUser"); showToast("🔒 تم تسجيل الخروج."); checkSession(); showSection("home-sec");
}
