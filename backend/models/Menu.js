import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, default: "" },
    category: { type: String, required: true },
    isAvailable: { type: Boolean, default: true }, // ✅ FIXED: isAvailable (not availability)
  },
  { timestamps: true }
);

export default mongoose.model("Menu", menuSchema);