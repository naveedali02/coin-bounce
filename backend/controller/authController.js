const Joi = require("joi");
const User = require("../modals/user");
const bcrypt = require("bcryptjs");
const UserDto = require("../dto/user");
const JWTService = require("../services/JWTService");
const RefreshToken = require("../modals/token");
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
    let accessToken;
    let refreshToken;
    let user;
    try {
      const userToRegister = new User({
        username,
        name,
        email,
        password: hashedPassowrd,
      });
      user = await userToRegister.save();
      // token generation
      accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
      refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");
    } catch (error) {
      return next(error);
    }
    // store refresh token
    await JWTService.storeRefreshToken(refreshToken, user._id);
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      hettpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      hettpOnly: true,
    });

    // respond send
    const userDto = new UserDto(user);
    return res.status(201).json({ user: userDto, auth: true });
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
    const accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
    const refreshToken = JWTService.signRefreshToken({ _id: user._id }, "30m");
    // update refresh token in db
    try {
      await RefreshToken.updateOne(
        {
          _id: user._id,
        },
        {
          token: refreshToken,
        },
        {
          upsert: true,
        }
      );
    } catch (error) {
      return next(error);
    }

    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      htppOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      htppOnly: true,
    });
    const filterData = new UserDto(user);
    return res.status(200).json({ user: filterData, auth: true });
  },
  async logout(req, res, next) {
    // delete refresh token from db
    const { refreshToken } = req.cookies;
    try {
      await RefreshToken.deleteOne({ token: refreshToken });
    } catch (error) {
      return next(error);
    }
    // delete cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    // response
    res.status(200).json({ user: null, auth: false });
  },
  async refresh(req, res, next) {
    // 1. get refresh token from cookies
    // 2. verify refreshToken
    // 3. Generate new tokens
    // 4. update db, return response
    const orignalRefreshToken = req.cookies.refreshToken;
    let id;
    try {
      id = JWTService.verifyRefreshToken(orignalRefreshToken)._id;
    } catch (e) {
      const error = {
        status: 401,
        message: "Unauthorized",
      };
      return next(error);
    }
    try {
      const match = RefreshToken.findOne({
        _id: id,
        token: orignalRefreshToken,
      });
      if (!match) {
        const error = {
          status: 401,
          message: "Unauthorized",
        };
        return next(error);
      }
    } catch (e) {
      return next(e);
    }

    try {
      const accessToken = JWTService.signAccessToken({ _id: id }, "30m");
      const refreshToken = JWTService.signRefreshToken({ _id: id }, "60m");
      await RefreshToken.updateOne({ _id: id }, { token: refreshToken });
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 24 * 24,
        httpOnly: true,
      });

      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 24 * 24,
        httpOnly: true,
      });
    } catch (e) {
      return next(e);
    }

    const user = await User.findOne({ _id: id });
    const userDto = new UserDto(user);
    return res.status(200).json({ user: userDto, auth: true });
  },
};
module.exports = authController;
