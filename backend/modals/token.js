const { string } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const refreshTokenSchema = new Schema(
  {
    token: { type: String, required: true },
    userID: { type: mongoose.SchemaTypes.ObjectId, ref: "users" },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("RefreshToken", refreshTokenSchema, "tokens");
