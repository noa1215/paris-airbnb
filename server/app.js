
const express = require("express");

const app = express();
const listingsRouter = require("./routes/listings.routes");
const hostsRouter = require("./routes/hosts.routes");

app.use(express.json());

app.use("/api/listings", listingsRouter);
app.use("/api/hosts", hostsRouter);

// ייצוא האפליקציה
module.exports = app;
