// src/contexts/expenses/domain/Expense.ts


import { AggregateRoot, DomainEvent } from '../../../shared/DomainEvent.js';
import { ExpenseErrors }              from './ExpenseErrors.js';

// ─── Types ───────────────────────────────────────────────────
interface CreateExpenseProps {
  montant:      number;
  categorie:    string;
  userId:       string;
  description?: string;
  date?:        Date;
}

interface ExpensePersistenceData {
  id:           string;
  montant:      number;
  categorie:    string;
  userId:       string;
  description:  string;
  date:         Date;
}

// ─── Événement domaine ────────────────────────────────────────
class ExpenseCreatedEvent extends DomainEvent {
  constructor(payload: { expenseId: string; montant: number; categorie: string; userId: string }) {
    super('ExpenseCreated', payload);
  }
}

// ─── L'agrégat ───────────────────────────────────────────────
export class Expense extends AggregateRoot {

  // Propriétés privées — on accède via les getters
  // pour garder le contrôle sur la lecture des données
  private constructor(
    private readonly _id:          string,
    private readonly _montant:     number,
    private readonly _description: string,
    private readonly _categorie:   string,
    private readonly _userId:      string,
    private readonly _date:        Date,
  ) {
    super();
  }

  // ── Getters ───────────────────────────────────────────────
  get id():          string { return this._id; }
  get montant():     number { return this._montant; }
  get description(): string { return this._description; }
  get categorie():   string { return this._categorie; }
  get userId():      string { return this._userId; }
  get date():        Date   { return this._date; }

  // ── Factory method : création (avec validation + événement) ──
  // On utilise une static factory plutôt qu'un constructeur public
  // pour pouvoir lever des erreurs et émettre des événements.
  static create(props: CreateExpenseProps): Expense {
    // Validation des invariants
    Expense.valider(props);

    const expense = new Expense(
      crypto.randomUUID(),
      props.montant,
      props.description ?? '',
      props.categorie,
      props.userId,
      props.date ?? new Date(),
    );

    // Émettre l'événement domaine
    expense.addEvent(new ExpenseCreatedEvent({
      expenseId: expense._id,
      montant:   expense._montant,
      categorie: expense._categorie,
      userId:    expense._userId,
    }));

    return expense;
  }

  // ── Factory method : reconstitution depuis la BDD ─────────
  // PAS de validation (les données sont déjà valides en BDD)
  // PAS d'événement (c'est une reconstruction, pas une création)
  static fromPersistence(data: ExpensePersistenceData): Expense {
    return new Expense(
      data.id,
      data.montant,
      data.description,
      data.categorie,
      data.userId,
      data.date,
    );
  }

  // ── Comportement : mise à jour (retourne une nouvelle instance) ──
  update(props: { montant?: number; description?: string; categorie?: string }): Expense {
    if (props.montant !== undefined) {
      Expense.valider({ montant: props.montant, categorie: props.categorie ?? this._categorie, userId: this._userId });
    }
    return new Expense(
      this._id,
      props.montant     ?? this._montant,
      props.description ?? this._description,
      props.categorie   ?? this._categorie,
      this._userId,
      this._date,
    );
  }

  // ── Sérialisation ─────────────────────────────────────────

  toPlainObject(): ExpensePersistenceData {
    return {
      id:          this._id,
      montant:     this._montant,
      description: this._description,
      categorie:   this._categorie,
      userId:      this._userId,
      date:        this._date,
    };
  }

  // ── Validation des invariants (privée) ────────────────────
  private static valider(props: CreateExpenseProps): void {
    if (props.montant < 0)          throw new Error(ExpenseErrors.MONTANT_NEGATIF);
    if (props.montant === 0)        throw new Error(ExpenseErrors.MONTANT_ZERO);
    if (props.montant > 100_000)    throw new Error(ExpenseErrors.MONTANT_TROP_ELEVE);
    if (!props.categorie?.trim())   throw new Error(ExpenseErrors.CATEGORIE_VIDE);
    if (!props.userId?.trim())      throw new Error(ExpenseErrors.USER_ID_VIDE);
  }
}