// 1. المنتجات الافتراضية
const defaultProducts = [
    { id: 1, name: "سماعة رأس محيطية مضيئة", price: 299, icon: "🎧", isTextIcon: true },
    { id: 2, name: "ماوس ألعاب لاسلكي سريع", price: 180, icon: "🖱️", isTextIcon: true },
    { id: 3, name: "ساعة ذكية شاشة OLED", price: 450, icon: "⌚", isTextIcon: true },
    { id: 4, name: "لوحة مفاتيح ميكانيكية RGB", price: 350, icon: "⌨️", isTextIcon: true }
];

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

let currentSelectedProduct = null;
let authMode = "login"; 

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
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3500);
    }
}
function renderProducts() {
    const container = document.getElementById("products-container");
    if (!container) return;
    container.innerHTML = "";
    
    const currentProducts = JSON.parse(localStorage.getItem("store_products")) || defaultProducts;
    
    currentProducts.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        
        const imageHTML = p.isTextIcon 
            ? p.icon 
            : `<img src="${p.icon}" alt="${p.name}">`;

        div.innerHTML = `
            <div class="product-image">${imageHTML}</div>
            <h3>${p.name}</h3>
            <div class="product-price">${p.price} ر.س</div>
            <button class="btn-primary" onclick="openOrderModal(${p.id})">شراء الآن ⚡</button>
        `;
        container.appendChild(div);
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    
    const sec = document.getElementById(sectionId);
    if (sec) sec.classList.add('active');
    
    const activeLink = Array.from(document.querySelectorAll('.nav-links a')).find(a => a.getAttribute('onclick')?.includes(sectionId));
    if (activeLink) activeLink.classList.add('active');
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
        eta: "قيد المراجعة وتحديد الوقت من الإدارة"
    };

    let orders = JSON.parse(localStorage.getItem("orders"));
    orders.push(newOrder);
    localStorage.setItem("orders", JSON.stringify(orders));
    showToast(`🎉 شكراً لك يا ${name}! تم إرسال طلبك بنجاح. رقم الطلب: #${newOrder.orderId}`);
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
        document.getElementById("auth-toggle-link").innerText = "لديك حساب بالفعل؟ سجل دخولك";
    } else {
        authMode = "login";
        document.getElementById("auth-title").innerText = "تسجيل الدخول";
        document.getElementById("auth-submit-btn").innerText = "دخول";
        document.getElementById("auth-toggle-link").innerText = "ليس لديك حساب؟ سجل الآن";
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

    let users = JSON.parse(localStorage.getItem("users"));

    if (authMode === "login") {
        const foundUser = users.find(u => u.username === user && u.password === pass);
        if (foundUser) {
            const userSession = { username: foundUser.username, name: foundUser.name, role: "customer" };
            sessionStorage.setItem("loggedInUser", JSON.stringify(userSession));
            
            showToast(`👋 مرحباً بعودتك يا ${foundUser.name}! تم تسجيل الدخول.`);
            closeModal("auth-modal");
            checkSession();
            showSection("home-sec"); 
        } else {
            showToast("❌ خطأ في اسم المستخدم أو كلمة المرور!");
        }
    } else {
        const userExists = users.some(u => u.username === user);
        if (userExists) {
            showToast("⚠️ اسم المستخدم هذا محجوز مسبقاً، اختر اسماً آخر.");
            return;
        }
        const newUser = { username: user, password: pass, name: user }; 
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        
        const userSession = { username: newUser.username, name: newUser.name, role: "customer" };
        sessionStorage.setItem("loggedInUser", JSON.stringify(userSession));
        
        showToast("✨ مبروك! تم إنشاء حسابك الجديد بنجاح.");
        closeModal("auth-modal");
        checkSession();
        showSection("home-sec"); 
    }
    document.getElementById("auth-user").value = "";
    document.getElementById("auth-pass").value = "";
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
            if (authBtn) authBtn.innerText = "حسابي الشخصي 👤";
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

    let users = JSON.parse(localStorage.getItem("users"));
    let userIndex = users.findIndex(u => u.username === loggedUser.username);

    if (userIndex !== -1) {
        users[userIndex].name = newName;
        users[userIndex].password = newPass;
        localStorage.setItem("users", JSON.stringify(users));

        loggedUser.name = newName;
        sessionStorage.setItem("loggedInUser", JSON.stringify(loggedUser));
        
        showToast("✅ تم تحديث معلومات ملفك الشخصي وإعداداتك بنجاح.");
        checkSession();
    }
}

function loadUserOrders(username) {
    const container = document.getElementById("user-orders-list");
    if (!container) return;
    container.innerHTML = "";
    const orders = JSON.parse(localStorage.getItem("orders")).filter(o => o.customerUsername === username);

    if (orders.length === 0) {
        container.innerHTML = "<p style='color:var(--text-muted);'>لم تقم بأي طلبات شراء بعد.</p>";
        return;
    }
    orders.forEach(o => {
        const div = document.createElement("div");
        div.className = "order-tracking-item";
        div.innerHTML = `
            <strong>طلب رقم: #${o.orderId}</strong> - ${o.productName}<br>
            <small style="color:var(--accent-color);">وقت التوصيل المقدر: ${o.eta}</small>
        `;
        container.appendChild(div);
    });
}

function loadAdminOrders() {
    const tbody = document.getElementById("admin-orders-table");
    if (!tbody) return;
    tbody.innerHTML = "";
    const orders = JSON.parse(localStorage.getItem("orders"));

    if (orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7' style='text-align:center; color:var(--text-muted);'>لا توجد طلبات شراء مسجلة.</td></tr>";
        return;
    }

    orders.forEach(o => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${o.orderId}</td>
            <td>${o.customerName} <br><small style='color:var(--text-muted);'>(${o.customerUsername})</small></td>
            <td>${o.phone}</td>
            <td>${o.address}</td>
            <td><strong>${o.productName}</strong></td>
            <td><span style='color:var(--accent-color);'>${o.eta}</span></td>
            <td>
                <input type="text" placeholder="مثال: يومين" id="eta-input-${o.orderId}" style="width:90px; margin:0; padding:4px; font-size:12px;">
                <button class="btn-primary" onclick="setOrderEta(${o.orderId})" style="padding:4px 8px; font-size:11px;">حفظ</button>
                <button class="btn-delete-order" onclick="deleteOrder(${o.orderId})">🗑️ حذف الطلب</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function deleteOrder(orderId) {
    if (confirm(`هل أنت متأكد من رغبتك في حذف وإلغاء الطلب رقم #${orderId} نهائياً؟`)) {
        let orders = JSON.parse(localStorage.getItem("orders"));
        orders = orders.filter(o => o.orderId !== orderId);
        localStorage.setItem("orders", JSON.stringify(orders));
        showToast(`🗑️ تم حذف وإلغاء الطلب رقم #${orderId} من السجلات.`);
        loadAdminOrders();
    }
}

function setOrderEta(orderId) {
    const inputVal = document.getElementById(`eta-input-${orderId}`).value.trim();
    if (!inputVal) {
        showToast("⚠️ من فضلك اكتب زمن التوصيل أولاً.");
        return;
    }
    let orders = JSON.parse(localStorage.getItem("orders"));
    let orderIndex = orders.findIndex(o => o.orderId === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].eta = inputVal;
        localStorage.setItem("orders", JSON.stringify(orders));
        showToast(`⏰ تم تحديث وقت الطلب #${orderId} إلى: ${inputVal}`);
        loadAdminOrders();
    }
}

function addNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById("prod-name").value.trim();
    const price = parseInt(document.getElementById("prod-price").value);
    const imageFile = document.getElementById("prod-image-file").files[0];

    if (!imageFile) {
        showToast("⚠️ الرجاء اختيار صورة للمنتج أولاً.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const base64Image = event.target.result;

        let currentProducts = JSON.parse(localStorage.getItem("store_products")) || defaultProducts;
        const newId = currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.id)) + 1 : 1;

        const newProduct = { id: newId, name: name, price: price, icon: base64Image, isTextIcon: false };
        currentProducts.push(newProduct);
        
        localStorage.setItem("store_products", JSON.stringify(currentProducts));
        
        showToast(`🚀 تم رفع الصورة ونشر منتج (${name}) بنجاح!`);
        document.getElementById("prod-name").value = "";
        document.getElementById("prod-price").value = "";
        document.getElementById("prod-image-file").value = "";
        
        renderProducts();   
        loadAdminProducts(); 
        showSection("home-sec"); 
    };
    reader.readAsDataURL(imageFile);
}

function loadAdminProducts() {
    const tbody = document.getElementById("admin-products-table");
    if (!tbody) return;
    tbody.innerHTML = "";
    const currentProducts = JSON.parse(localStorage.getItem("store_products")) || defaultProducts;

    currentProducts.forEach(p => {
        const tr = document.createElement("tr");
        
        const thumbHTML = p.isTextIcon 
            ? `<div style="font-size:24px; text-align:center;">${p.icon}</div>` 
            : `<img src="${p.icon}" class="admin-prod-thumb">`;

        tr.innerHTML = `
            <td>${thumbHTML}</td>
            <td><strong>${p.name}</strong></td>
            <td>${p.price} ر.س</td>
            <td>
                <button class="btn-delete-order" onclick="deleteProduct(${p.id})">🗑️ حذف من المتجر</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteProduct(productId) {
    if (confirm("هل أنت متأكد أنك تريد حذف هذا المنتج نهائياً من شاشة عرض المتجر؟")) {
        let currentProducts = JSON.parse(localStorage.getItem("store_products"));
        currentProducts = currentProducts.filter(p => p.id !== productId);
        localStorage.setItem("store_products", JSON.stringify(currentProducts));
        
        showToast("🗑️ تم حذف السلعة وإزالتها من المتجر فوراً.");
        renderProducts();     
        loadAdminProducts();   
    }
}

function loadRegisteredUsers() {
    const tbody = document.getElementById("admin-users-table");
    if (!tbody) return;
    tbody.innerHTML = "";
    const users = JSON.parse(localStorage.getItem("users"));

    if (users.length === 0) {
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:var(--text-muted);'>لا يوجد زبائن مسجلين.</td></tr>";
        return;
    }

    users.forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span style="color:var(--accent-color); font-weight:bold;">${u.username}</span></td>
            <td>${u.name}</td>
            <td><span style="color:var(--text-muted);">${u.password}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function logout() {
    sessionStorage.removeItem("loggedInUser");
    showToast("🔒 تم تسجيل الخروج بنجاح.");
    checkSession();
    showSection("home-sec");
}
