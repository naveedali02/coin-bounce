const express = require("express");
const authController = require("../controller/authController");
const auth = require("../middlewares/auth");
const router = express.Router();
// Testing
router.get("/test", (req, res) => {
  res.json({
    msg: "this is testing route",
  });
});

// User

// Register
router.post("/register", authController.register);
// Login
router.post("/login", authController.login);
// logout
router.post("/logout", auth, authController.logout);

module.exports = router;
