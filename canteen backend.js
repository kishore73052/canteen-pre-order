const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// In-memory array to store orders
let orders = [];
let nextOrderId = 1;

// In-memory array to store menu
let menu = [
    { id: 1, name: "Veg Burger", price: 60, category: "Main Course", image: "images/veg_burger.png", inStock: true },
    { id: 2, name: "Chicken Roll", price: 90, category: "Main Course", image: "images/chicken_roll.png", inStock: true },
    { id: 3, name: "Chicken Biryani", price: 150, category: "Main Course", image: "images/chicken_biryani.png", inStock: true },
    { id: 4, name: "Samosa", price: 20, category: "Snacks", image: "images/samosa.png", inStock: true },
    { id: 5, name: "Coffee", price: 25, category: "Beverages", image: "images/hot_coffee.png", inStock: true },
    { id: 6, name: "Tea", price: 15, category: "Beverages", image: "images/logo2.png.png", inStock: true }
];
let nextMenuId = 7;

// POST /order - Receive new order from student
app.post('/order', (req, res) => {
    const { name, roll, mobile, items, total, time } = req.body;
    
    if (!name || !roll || !mobile || !items) {
        return res.status(400).json({ error: "Missing REQUIRED fields" });
    }

    const newOrder = {
        id: nextOrderId++,
        name,
        roll,
        mobile,
        items,
        total,
        time: time || new Date().toLocaleString(),
        status: 'pending' // pending or completed
    };

    orders.push(newOrder);
    res.status(201).json({ message: "Order received successfully", order: newOrder });
});

// GET /orders - Fetch all orders (for Admin/Vendor)
app.get('/orders', (req, res) => {
    res.json(orders);
});

// GET /orders/:id - Fetch single order
app.get('/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
});

// PUT /orders/:id/prepare - Mark order as preparing (for Admin)
app.put('/orders/:id/prepare', (req, res) => {
    const orderId = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
        return res.status(404).json({ error: "Order not found" });
    }

    const waitTime = req.body.time || 15; // default 15 minutes

    orders[orderIndex].status = 'preparing';
    orders[orderIndex].waitTime = waitTime;
    res.json({ message: "Order marked as preparing", order: orders[orderIndex] });
});

// PUT /orders/:id/complete - Mark order as complete (for Vendor)
app.put('/orders/:id/complete', (req, res) => {
    const orderId = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        return res.status(404).json({ error: "Order not found" });
    }

    orders[orderIndex].status = 'completed';
    orders[orderIndex].waitTime = 0;
    res.json({ message: "Order marked as completed", order: orders[orderIndex] });
});

// DELETE /orders - Clear all orders (for Admin)
app.delete('/orders', (req, res) => {
    orders = [];
    nextOrderId = 1;
    res.json({ message: "All orders cleared" });
});

// ==========================================
// REAL WEBHOOK & PAYMENT POLLING SYSTEM
// ==========================================
let pendingTransactions = {}; // Stores payment status using txnId

// 1. Initialize a transaction when student reaches checkout
app.post('/init-payment', (req, res) => {
    const txnId = 'txn_' + Date.now();
    pendingTransactions[txnId] = 'pending';
    // In a real system (like Razorpay/Cashfree), you'd generate a real order payload here.
    res.json({ txnId, status: 'pending' });
});

// 2. The Real Webhook Endpoint (Payment Gateways like Razorpay send POST requests here)
app.post('/webhook/payment', (req, res) => {
    // A real gateway sends payload with order_id and signature
    const { txnId, status } = req.body; 
    
    // Verify signature in real app here!
    if (txnId && pendingTransactions[txnId]) {
        pendingTransactions[txnId] = status || 'completed';
        console.log(`[!] Webhook triggered: Transaction ${txnId} is now ${pendingTransactions[txnId]}`);
        return res.json({ success: true, message: "Webhook received and payment verified" });
    }
    res.status(404).json({ error: "Transaction not found" });
});

// 3. Frontend polling endpoint to check if webhook verified the payment
app.get('/payment-status/:txnId', (req, res) => {
    const txnId = req.params.txnId;
    res.json({ status: pendingTransactions[txnId] || 'unknown' });
});

// ==========================================
// USER REGISTRATION SYSTEM
// ==========================================
let users = []; // Store registered students

app.post('/register', (req, res) => {
    const { name, roll, dept, mobile, password } = req.body;
    
    if (!name || !roll || !dept || !mobile || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    if (users.find(u => u.roll === roll)) {
        return res.status(400).json({ error: "User with this Roll Number already exists" });
    }

    const newUser = { id: users.length + 1, name, roll, dept, mobile, password };
    users.push(newUser);
    console.log(`[!] New User Registered: ${name} (${dept})`);
    
    res.status(201).json({ message: "Registration successful" });
});

app.post('/login', (req, res) => {
    const { name, password } = req.body;
    
    if (!name || !password) {
        return res.status(400).json({ error: "Name and password are required" });
    }

    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: "Invalid name or password. Have you registered?" });
    }

    res.json({ success: true, user: { name: user.name, roll: user.roll, mobile: user.mobile, dept: user.dept } });
});

// Menu Management endpoints
app.get('/menu', (req, res) => res.json(menu));

app.post('/menu', (req, res) => {
    const { name, price, category, image } = req.body;
    const newItem = {
        id: nextMenuId++,
        name,
        price: Number(price),
        category: category || "Snacks",
        image: image || "images/logo2.png.png",
        inStock: true
    };
    menu.push(newItem);
    res.json(newItem);
});

app.put('/menu/:id', (req, res) => {
    const item = menu.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({error: "Not found"});
    if (req.body.name !== undefined) item.name = req.body.name;
    if (req.body.price !== undefined) item.price = Number(req.body.price);
    if (req.body.inStock !== undefined) item.inStock = req.body.inStock;
    res.json(item);
});

app.delete('/menu/:id', (req, res) => {
    menu = menu.filter(i => i.id !== parseInt(req.params.id));
    res.json({success: true});
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
