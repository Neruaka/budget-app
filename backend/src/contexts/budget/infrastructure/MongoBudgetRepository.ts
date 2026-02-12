// src/contexts/budget/infrastructure/MongoBudgetRepository.ts

import mongoose, { Schema, Document, Model } from 'mongoose';
import { Budget }             from '../domain/Budget.js';
import { IBudgetRepository }  from '../domain/IBudgetRepository.js';

interface BudgetDoc extends Document {
  _id:             string;
  userId:          string;
  montantMax:      number;
  montantDepense:  number;
  mois:            number;
  annee:           number;
}

const budgetSchema = new Schema<BudgetDoc>({
  _id:            { type: String, required: true },
  userId:         { type: String, required: true },
  montantMax:     { type: Number, required: true },
  montantDepense: { type: Number, default: 0 },
  mois:           { type: Number, required: true },
  annee:          { type: Number, required: true },
}, { _id: false, versionKey: false });

// Un seul budget par userId + mois + annee
budgetSchema.index({ userId: 1, mois: 1, annee: 1 }, { unique: true });

const BudgetModel: Model<BudgetDoc> =
  mongoose.models['Budget'] as Model<BudgetDoc> ||
  mongoose.model<BudgetDoc>('Budget', budgetSchema);

export class MongoBudgetRepository implements IBudgetRepository {

  async save(budget: Budget): Promise<void> {
    const plain = budget.toPlainObject();
    await BudgetModel.findByIdAndUpdate(
      plain.id,
      { $set: plain },
      { upsert: true, new: true }
    );
  }

  async findByUserAndPeriod(userId: string, mois: number, annee: number): Promise<Budget | null> {
    const doc = await BudgetModel.findOne({ userId, mois, annee }).lean();
    if (!doc) return null;
    return Budget.fromPersistence({
      id:             String(doc._id),
      userId:         doc.userId,
      montantMax:     doc.montantMax,
      montantDepense: doc.montantDepense,
      mois:           doc.mois,
      annee:          doc.annee,
    });
  }

  async findByUserId(userId: string): Promise<Budget[]> {
    const docs = await BudgetModel
      .find({ userId })
      .sort({ annee: -1, mois: -1 })
      .lean();
    return docs.map(doc => Budget.fromPersistence({
      id:             String(doc._id),
      userId:         doc.userId,
      montantMax:     doc.montantMax,
      montantDepense: doc.montantDepense,
      mois:           doc.mois,
      annee:          doc.annee,
    }));
  }
}
