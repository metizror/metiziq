import { connectToDatabase } from "../lib/db";
import Activity from "../models/activity.model";

export const createActivity = async (action: string, details: string, userId: string, user: string) => {
  await connectToDatabase();
  const activity = await Activity.create({ action, details, userId, user });
  return activity;
};