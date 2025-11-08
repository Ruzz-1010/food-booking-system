import mongoose from "mongoose";

const riderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["motorcycle", "bicycle", "car"],
      default: "motorcycle",
    },
    licenseNumber: {
      type: String,
      required: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    latitude: { type: Number },
longitude: { type: Number },

  },
  { timestamps: true }
);

export default mongoose.model("Rider", riderSchema);
