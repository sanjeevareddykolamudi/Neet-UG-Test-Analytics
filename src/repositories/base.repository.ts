/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, FilterQuery, UpdateQuery, QueryOptions } from "mongoose";

export interface IBaseRepository<T> {
  find(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<any[]>;
  findOne(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<any | null>;
  findById(id: string, projection?: any, options?: QueryOptions): Promise<any | null>;
  create(item: any): Promise<any>;
  update(id: string, item: UpdateQuery<T>, options?: QueryOptions): Promise<any | null>;
  delete(id: string, userId?: string): Promise<any | null>;
}

export class BaseRepository<T> implements IBaseRepository<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async find(
    filter: FilterQuery<T> = {},
    projection?: any,
    options: QueryOptions = {}
  ): Promise<any[]> {
    const queryFilter = { isDeleted: false, ...filter };
    return this.model
      .find(queryFilter, projection, { lean: true, ...options })
      .exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    projection?: any,
    options: QueryOptions = {}
  ): Promise<any | null> {
    const queryFilter = { isDeleted: false, ...filter };
    return this.model
      .findOne(queryFilter, projection, { lean: true, ...options })
      .exec();
  }

  async findById(
    id: string,
    projection?: any,
    options: QueryOptions = {}
  ): Promise<any | null> {
    return this.model
      .findOne({ _id: id, isDeleted: false } as any, projection, { lean: true, ...options })
      .exec();
  }

  async create(item: any): Promise<any> {
    const created = await this.model.create(item);
    return created.toObject();
  }

  async update(
    id: string,
    updateDoc: UpdateQuery<T>,
    options: QueryOptions = {}
  ): Promise<any | null> {
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: false } as any, updateDoc, {
        new: true,
        lean: true,
        ...options
      })
      .exec();
  }

  async delete(id: string, userId?: string): Promise<any | null> {
    const updateDoc: any = {
      isDeleted: true,
      deletedAt: new Date()
    };
    if (userId) {
      updateDoc.deletedBy = userId;
    }
    return this.model
      .findOneAndUpdate({ _id: id, isDeleted: false } as any, updateDoc, {
        new: true,
        lean: true
      })
      .exec();
  }
}
