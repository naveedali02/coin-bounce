const express = require("express");
const authController = require("../controller/authController");
const blogController = require("../controller/blogController");
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
// Refresh
router.get("/refresh", authController.refresh);
// Blog //
// 1 create
router.post("/blog", auth, blogController.create);
// 2 get all
router.get("/blog/all", auth, blogController.getAll);
// 3 get blog by id

router.get("/blog/:id", auth, blogController.getById);
// 4 update blog
router.put("/blog", auth, blogController.update);
// 5 delete blog
router.delete("/blog/:id", auth, blogController.delete);

module.exports = router;
