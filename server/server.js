
require("dotenv").config({
  path: require("node:path").join(__dirname, ".env"),
  quiet: true
});

const { poolPromise } = require("./config/db");
const app = require("./app");

const PORT = process.env.PORT || 3000;

poolPromise
  .then(() => {
    console.log("Connected to SQL Server");
  })
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
