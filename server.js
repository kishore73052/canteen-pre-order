const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT||3000;

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
let users = [];

app.post("/register", (req, res) => {
  const { name, password, mobile, roll } = req.body;

  const existingUser = users.find(u => u.name === name);

  if (existingUser) {
    return res.json({ error: "User already exists" });
  }

  users.push({
    name,
    password,
    mobile,
    roll
  });

  res.json({ success: true });
});

app.post("/login", (req, res) => {
  const { name, password } = req.body;

  const user = users.find(
    u => u.name === name && u.password === password
  );

  if (!user) {
    return res.json({ error: "Invalid name or password" });
  }

  res.json({
    success: true,
    user
  });
});

// POST /order - Receive new order from student
app.post('/order', (req, res) => {
    const { name, roll, items, total, time } = req.body;
    
    if (!name || !roll || !items) {
        return res.status(400).json({ error: "Missing REQUIRED fields" });
    }

    const newOrder = {
        id: nextOrderId++,
        name,
        roll,
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
