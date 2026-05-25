/************ TOAST NOTIFICATIONS ************/
function showToast(message, type = 'success') {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : '❌';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/************ LOGIN ************/
function login() {
    let role = document.getElementById("role").value;
    let name = document.getElementById("username").value.trim();
    let passwordField = document.getElementById("password");
    let password = passwordField ? passwordField.value.trim() : "";

    if (role === "student") {
        if (name === "" || password === "") {
            showToast("Please enter name and password", "error");
            return;
        }

        const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

        // Verify with backend
        fetch(API_BASE + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                showToast(data.error, "error");
            } else {
                localStorage.setItem("studentName", data.user.name);
                localStorage.setItem("studentRoll", data.user.roll);
                localStorage.setItem("studentMobile", data.user.mobile);
                showToast("Login Successful!", "success");
                setTimeout(() => {
                    window.location.href = "student.html";
                }, 1000);
            }
        })
        .catch(err => {
            showToast("Login failed. Backend inactive?", "error");
            console.error(err);
        });
        
        return; // Wait for fetch
    }

    if (role === "vendor") {
        window.location.href = "vendor.html";
    }

    if (role === "admin") {
        window.location.href = "admin.html";
    }
}

/************ CART ************/
/************ CART ************/
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ADD ITEM */
function increaseQty(item, price) {

    let existing = cart.find(i => i.item === item);

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({
            item: item,
            price: Number(price),
            qty: 1
        });
    }

    updateCart();

    showToast(item + " added", "success");
}

/* REMOVE ITEM */
function decreaseQty(item) {

    let existing = cart.find(i => i.item === item);

    if (!existing) return;

    existing.qty -= 1;

    if (existing.qty <= 0) {
        cart = cart.filter(i => i.item !== item);
    }

    updateCart();
}

/* UPDATE TOTAL + UI */
function updateCart() {

    localStorage.setItem("cart", JSON.stringify(cart));

    let total = cart.reduce((sum, i) =>
        sum + (Number(i.price) * i.qty), 0);

    let totalEl = document.getElementById("total");

    if (totalEl) {
        totalEl.innerText = total;
    }

    /* UPDATE ALL QUANTITY COUNTS */
    cart.forEach(i => {

        let qtyEl = document.getElementById(`qty-${i.item}`);

        if (qtyEl) {
            qtyEl.innerText = i.qty;
        }
    });

    /* RESET EMPTY ITEMS TO 0 */
    document.querySelectorAll("[id^='qty-']").forEach(el => {

        let itemName = el.id.replace("qty-", "");

        let found = cart.find(i => i.item === itemName);

        if (!found) {
            el.innerText = 0;
        }
    });
}

/************ GO TO SUMMARY ************/
function goToSummary() {

    if (cart.length === 0) {
        showToast("Your cart is empty", "error");
        return;
    }

    window.location.href = "summary.html";
}

/************ ORDER CONFIRM ************/
function confirmOrder() {
    window.location.href = "qr.html";
}

/************ FINISH ORDER ************/
function finishOrder() {
    showToast("Order completed. Thank you!", "success");
    localStorage.clear();
    setTimeout(() => {
        window.location.href = "login.html";
    }, 1500);
}

/************ SEND ORDER TO BACKEND ************/
function sendOrderToBackend() {
    let studentName = localStorage.getItem("studentName");
    let studentRoll = localStorage.getItem("studentRoll");
    let studentMobile = localStorage.getItem("studentMobile");
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        showToast("No items to send", "error");
        return;
    }

    let total = cart.reduce((sum, i) => sum + Number(i.price), 0);

    let orderData = {
        name: studentName,
        roll: studentRoll,
        mobile: studentMobile,
        items: cart,
        total: total,
        time: new Date().toLocaleString()
    };

const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

    fetch(API_BASE + "/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    })
    .then(res => res.json())
    .then(data => {
        if (data.order && data.order.id) {
            localStorage.setItem("currentOrderId", data.order.id);
        }
        showToast("Order sent to canteen successfully", "success");
        console.log("Backend response:", data);
        setTimeout(() => {
            window.location.href = "qr.html";
        }, 1500);
    })
    .catch(err => {
        showToast("Backend connection failed", "error");
        console.error(err);
    });
}

/************ REGISTER USER ************/
function registerUser() {
    let name = document.getElementById("reg-name").value.trim();
    let roll = document.getElementById("reg-roll").value.trim();
    let dept = document.getElementById("reg-dept").value.trim();
    let mobile = document.getElementById("reg-mobile").value.trim();
    let password = document.getElementById("reg-password").value.trim();

    if (!name || !roll || !dept || !mobile || !password) {
        showToast("Please fill all fields", "error");
        return;
    }

    const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

    fetch(API_BASE + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, roll, dept, mobile, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, "error");
        } else {
            showToast("Registration successful! Please login.", "success");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        }
    })
    .catch(err => {
        showToast("Registration failed. Backend inactive?", "error");
        console.error(err);
    });
}
