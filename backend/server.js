const express = require("express");
const dbConnect = require("./database/index");
const { PORT } = require("./config/index");
const router = require("./routes/index");
const errorHandler = require("./middlewares/errorHandler");
const cookieParser = require("cookie-parser");
// const port = 5000;
const app = express();
app.use(cookieParser());
// middleware
app.use(express.json());
// use routes
app.use(router);
// database connected
dbConnect();
app.use("/storage", express.static("storage"));
// error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
