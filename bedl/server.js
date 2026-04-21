require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("REQ:", req.method, req.originalUrl);
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("OK ROOT");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("SERVER_STARTED_PORT=", PORT);
});
