import mongoose from "mongoose";

export interface ICountry {
  name: string;
  code?: string;
  isActive?: boolean;
}

const countrySchema = new mongoose.Schema<ICountry>(
  {
    name: {
      type: String,
      required: [true, "Country name is required"],
      unique: true,
      trim: true,

    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for faster queries
// countrySchema.index({ name: 1 });
countrySchema.index({ isActive: 1 });

const Country =
  mongoose.models.Country || mongoose.model<ICountry>("Country", countrySchema);

export default Country;

