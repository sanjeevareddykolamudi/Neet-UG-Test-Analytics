/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseRepository } from "./base.repository";
import { QuestionBank, QuestionBankDocument } from "@/models/QuestionBank";

export class QuestionBankRepository extends BaseRepository<QuestionBankDocument> {
  constructor() {
    super(QuestionBank);
  }

  async findByHash(questionHash: string): Promise<any | null> {
    return this.findOne({ questionHash, isDeleted: false });
  }

  async findByTopic(
    subject: string,
    chapter?: string,
    topic?: string
  ): Promise<any[]> {
    const filter: any = { subject };
    if (chapter) filter.chapter = chapter;
    if (topic) filter.topic = topic;
    return this.find(filter);
  }

  async upsertQuestion(question: Partial<QuestionBankDocument>): Promise<any> {
    if (!question.questionHash) {
      throw new Error("questionHash is required for upsert");
    }

    return this.model
      .findOneAndUpdate(
        { questionHash: question.questionHash, isDeleted: false } as any,
        { $set: { ...question, isDeleted: false } },
        { new: true, upsert: true, lean: true }
      )
      .exec();
  }

  async bulkUpsert(questions: Array<Partial<QuestionBankDocument>>): Promise<any[]> {
    const operations = questions.map((q) => ({
      updateOne: {
        filter: { questionHash: q.questionHash, isDeleted: false },
        update: { $set: { ...q, isDeleted: false } },
        upsert: true
      }
    }));

    if (operations.length === 0) return [];
    
    await this.model.bulkWrite(operations);
    
    const hashes = questions.map((q) => q.questionHash);
    return this.find({ questionHash: { $in: hashes } });
  }
}

export const questionBankRepository = new QuestionBankRepository();
