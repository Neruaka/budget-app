// src/contexts/expenses/infrastructure/MongoExpenseRepository.ts


import mongoose, { Schema, Document, Model } from 'mongoose';
import { Expense }            from '../domain/Expense.js';
import { IExpenseRepository } from '../domain/IExpenseRepository.js';

// ─── Schéma Mongoose ─────────────────────────────────────────
interface ExpenseDoc extends Document {
  _id:         string;
  montant:     number;
  description: string;
  categorie:   string;
  userId:      string;
  date:        Date;
}

const expenseSchema = new Schema<ExpenseDoc>({
  _id:         { type: String, required: true },
  montant:     { type: Number, required: true },
  description: { type: String, default: '' },
  categorie:   { type: String, required: true, index: true },
  userId:      { type: String, required: true, index: true },
  date:        { type: Date,   default: Date.now, index: true },
}, {
  _id: false, // on gère notre propre _id (UUID depuis le domaine)
  timestamps: false,
  versionKey: false,
});

// Index composé pour les requêtes userId + période
expenseSchema.index({ userId: 1, date: -1 });

// Lazy creation pour éviter les erreurs de re-compilation Mongoose
const ExpenseModel: Model<ExpenseDoc> =
  mongoose.models['Expense'] as Model<ExpenseDoc> ||
  mongoose.model<ExpenseDoc>('Expense', expenseSchema);

// ─── Repository ───────────────────────────────────────────────
export class MongoExpenseRepository implements IExpenseRepository {

  async save(expense: Expense): Promise<void> {
    const plain = expense.toPlainObject();
    // upsert : crée ou met à jour selon l'_id
    await ExpenseModel.findByIdAndUpdate(
      plain.id,
      {
        _id:         plain.id,
        montant:     plain.montant,
        description: plain.description,
        categorie:   plain.categorie,
        userId:      plain.userId,
        date:        plain.date,
      },
      { upsert: true, new: true }
    );
  }

  async findById(id: string): Promise<Expense | null> {
    const doc = await ExpenseModel.findById(id).lean();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByUserId(userId: string): Promise<Expense[]> {
    const docs = await ExpenseModel
      .find({ userId })
      .sort({ date: -1 })
      .limit(50)
      .lean();
    return docs.map(d => this.toDomain(d));
  }

  async findByUserAndPeriod(userId: string, mois: number, annee: number): Promise<Expense[]> {
    // Calculer les bornes de la période
    const debut = new Date(annee, mois - 1, 1);         // 1er du mois
    const fin   = new Date(annee, mois, 0, 23, 59, 59); // dernier jour du mois

    const docs = await ExpenseModel
      .find({ userId, date: { $gte: debut, $lte: fin } })
      .sort({ date: -1 })
      .lean();
    return docs.map(d => this.toDomain(d));
  }

  async update(expense: Expense): Promise<void> {
    await this.save(expense); // upsert gère la mise à jour
  }

  async delete(id: string): Promise<void> {
    await ExpenseModel.findByIdAndDelete(id);
  }

  // Mapper MongoDB → Domaine
  private toDomain(doc: ExpenseDoc | Record<string, unknown>): Expense {
    return Expense.fromPersistence({
      id:          String(doc._id),
      montant:     doc.montant as number,
      description: (doc.description as string) || '',
      categorie:   doc.categorie as string,
      userId:      doc.userId as string,
      date:        doc.date as Date,
    });
  }
}