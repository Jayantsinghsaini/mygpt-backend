import mongoose from "mongoose";

const mySchema = new mongoose.Schema({
  chatId: Number,
  conversationId: Number,
  request: String,
  response: String,
  chat: Number
})

export default mySchema
