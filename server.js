const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "fatima_collection",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database!");
});

// Endpoint to fetch product by ID
app.get("/product/:id", (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM products WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(results[0]);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
