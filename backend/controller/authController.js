const Joi = require("joi");
const User = require("../modals/user");
const bcrypt = require("bcryptjs");
const UserDto = require("../dto/user");
// const passwordRagx = /^(?=.*[a-z])(?=.[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
const passwordRagx = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
const authController = {
  async register(req, res, next) {
    // validate user input
    const userRegisterSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordRagx).required(),
      confirmPassword: Joi.ref("password"),
    });

    const { error } = userRegisterSchema.validate(req.body);
    // if error in validation => return error via middleware

    if (error) {
      return next(error);
    }
    // if email or username is already registered => return an error
    const { username, name, email, password } = req.body;
    try {
      const emailInUse = await User.exists({ email });
      const userNameInUse = await User.exists({ username });
      if (emailInUse) {
        const error = {
          status: 409,
          message: "Email is already registered. Please use another email!",
        };
        return next(error);
      }
      if (userNameInUse) {
        const error = {
          status: 409,
          message: "Username is not available, Choose another username",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    // password hash
    const hashedPassowrd = await bcrypt.hash(password, 10);
    // store user data in db
    const userToRegister = new User({
      username,
      name,
      email,
      password: hashedPassowrd,
    });
    const user = await userToRegister.save();
    // respond send
    return res.status(201).json({ user });
  },
  async login(req, res, next) {
    const userLoginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordRagx),
    });
    const { error } = userLoginSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    // match username and password
    const { username, password } = req.body;
    let user;

    try {
      user = await User.findOne({ username: username });
      if (!user) {
        const error = {
          status: 401,
          message: "Invalid username",
        };
        return next(error);
      }
      //    match password
      const matchPassword = await bcrypt.compare(password, user.password);
      if (!matchPassword) {
        const error = {
          status: 401,
          message: "Invalid password",
        };
        return next(error);
      }
    } catch {
      return next(error);
    }
    const filterData = new UserDto(user);
    return res.status(200).json({ user: filterData });
  },
};
module.exports = authController;
