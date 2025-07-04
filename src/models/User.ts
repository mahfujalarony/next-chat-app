import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
