const mongoose = require("mongoose");
const { MONGODB_CONNECTION_STRING } = require("../config/index");
// const connectionString = MONGODB_CONNECTION_STRING;
const dbConnect = async () => {
  try {
    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log(`Database is connected at to host: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error}`);
  }
};
module.exports = dbConnect;
