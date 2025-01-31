const express = require("express");
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const mysql = require("mysql2/promise");
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors(
  {
    origin: ["https://flotist-app.vercel.app/"],
    methods: ["POST","GET"],
    credentials: true
  }
)); // Aktifkan CORS
app.use(bodyParser.json()); // Untuk parsing JSON
app.use(bodyParser.urlencoded({ extended: true })); // Untuk parsing form data

app.use(session({
  secret: 'alamak', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set false untuk development (non-HTTPS)
    maxAge: 1000 * 60 * 60 * 24 // 1 hari
  }
}));



// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "../public")));

// Route untuk root path
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Register endpoint
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  console.log(`Registering user: ${username}`); // Tambahkan log
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err); // Log error lebih rinci
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(`Attempting login for: ${username}`); // Tambahkan log
  try {
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);

    if (users.length === 0) {
      console.log('User not found'); // Log user tidak ditemukan
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('Password does not match'); // Log password tidak cocok
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.user = { id: user.id, username: user.username };
    res.json({ message: "Login successful" });

  } catch (err) {
    console.error(err); // Log error lebih rinci
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Logout endpoint
app.post("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "Could not log out" });
    }
    res.json({ message: "Logout successful" });
  });
});

// Endpoint untuk fetch produk
app.get("/products", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM products");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk fetch product by ID
app.get("/product/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
    if (results.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk menambahkan produk (hanya admin)
app.post("/product", async (req, res) => {
  const { name, description, price, image_url } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)",
      [name, description, price, image_url]
    );
    res.status(201).json({ id: result.insertId, name, description, price, image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk mengupdate produk (hanya admin)
app.put("/product/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE products SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?",
      [name, description, price, image_url, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ id, name, description, price, image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk menghapus produk (hanya admin)
app.delete("/product/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(204).send(); // No content
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Cek session
app.get("/check-session", (req, res) => {
  console.log("Session Data:", req.session);
  res.json({ session: req.session });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


module.exports = app; // Ekspor app agar bisa digunakan oleh Vercel
