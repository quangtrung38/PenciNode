// TypeScript utilities for Mongoose model typing fixes
import type { Document, Model } from 'mongoose';
import { Types } from 'mongoose';

// Type assertion helper for Mongoose model methods
export function mongooseModelCast<T extends Document>(model: any): Model<T> {
  return model as Model<T>;
}

// Helper for ObjectId type casting
export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

// Generic find by ID helper
export async function findByIdTyped<T extends Document>(
  model: any,
  id: string,
): Promise<T | null> {
  return await (model as Model<T>).findById(toObjectId(id));
}

// Generic find one helper
export async function findOneTyped<T extends Document>(
  model: any,
  query: any,
): Promise<T | null> {
  return await (model as Model<T>).findOne(query);
}

// Generic find helper
export async function findTyped<T extends Document>(
  model: any,
  query: any = {},
): Promise<T[]> {
  return await (model as Model<T>).find(query);
}

// Generic create helper
export async function createTyped<T extends Document>(
  model: any,
  data: any,
): Promise<T> {
  return await (model as Model<T>).create(data);
}

// Generic findByIdAndUpdate helper
export async function findByIdAndUpdateTyped<T extends Document>(
  model: any,
  id: string,
  update: any,
  options: any = { new: true },
): Promise<T | null> {
  return await (model as Model<T>).findByIdAndUpdate(toObjectId(id), update, options) as unknown as T | null;
}

// Generic findByIdAndDelete helper
export async function findByIdAndDeleteTyped<T extends Document>(
  model: any,
  id: string,
): Promise<T | null> {
  return await (model as Model<T>).findByIdAndDelete(toObjectId(id));
}
