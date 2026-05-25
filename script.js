// ================= LOGIN =================

function login() {

    let role = document.getElementById("role").value;

    if (role === "student") {
        window.location.href = "student.html";
    }

    if (role === "vendor") {
        window.location.href = "vendor.html";
    }

    if (role === "admin") {
        window.location.href = "admin.html";
    }
}



// ================= CART =================

let cart = JSON.parse(localStorage.getItem("cart")) || [];



// ================= ADD ITEM =================

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



// ================= REMOVE ITEM =================

function decreaseQty(item) {

    let existing = cart.find(i => i.item === item);

    if (!existing) return;

    existing.qty -= 1;

    if (existing.qty <= 0) {

        cart = cart.filter(i => i.item !== item);
    }

    updateCart();
}



// ================= UPDATE CART =================

function updateCart() {

    localStorage.setItem("cart", JSON.stringify(cart));

    // TOTAL
    let total = cart.reduce(
        (sum, i) => sum + (Number(i.price) * i.qty),
        0
    );

    let totalEl = document.getElementById("total");

    if (totalEl) {
        totalEl.innerText = total;
    }

    // UPDATE QUANTITY
    cart.forEach(i => {

        let qtyEl = document.getElementById(
            `qty-${i.item.replace(/\s+/g, '-')}`
        );

        if (qtyEl) {
            qtyEl.innerText = i.qty;
        }

    });

    // RESET EMPTY ITEMS TO 0
    document.querySelectorAll('[id^="qty-"]').forEach(el => {

        let itemName = el.id.replace("qty-", "");

        let found = cart.find(
            i => i.item.replace(/\s+/g, '-') === itemName
        );

        if (!found) {
            el.innerText = 0;
        }

    });
}



// ================= SUMMARY PAGE =================

function goToSummary() {

    if (cart.length === 0) {

        showToast("Your cart is empty", "error");

        return;
    }

    window.location.href = "summary.html";
}



// ================= ORDER CONFIRM =================

function confirmOrder() {

    window.location.href = "qr.html";
}



// ================= FINISH ORDER =================

function finishOrder() {

    showToast("Order completed. Thank you!", "success");

    localStorage.clear();

    setTimeout(() => {

        window.location.href = "login.html";

    }, 1500);
}



// ================= TOAST =================

function showToast(message, type = "success") {

    let container = document.getElementById("toast-container");

    if (!container) {

        container = document.createElement("div");

        container.id = "toast-container";

        document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 3000);
}



// ================= INITIAL LOAD =================

document.addEventListener("DOMContentLoaded", () => {

    updateCart();

});