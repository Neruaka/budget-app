// src/contexts/budget/domain/Budget.ts


import { AggregateRoot, DomainEvent } from '../../../shared/DomainEvent.js';
import { BudgetErrors }               from './BudgetErrors.js';

interface CreateBudgetProps {
  userId:      string;
  montantMax:  number;
  mois:        number;
  annee:       number;
}

interface BudgetPersistenceData extends CreateBudgetProps {
  id:             string;
  montantDepense: number;
}

// Événements domaine Budget
class BudgetDepasseEvent extends DomainEvent {
  constructor(payload: { budgetId: string; userId: string; montantMax: number; montantDepense: number }) {
    super('BudgetDepasse', payload);
  }
}

export class Budget extends AggregateRoot {

  private _montantDepense: number = 0;

  private constructor(
    private readonly _id:         string,
    private readonly _userId:     string,
    private readonly _montantMax: number,
    private readonly _mois:       number,
    private readonly _annee:      number,
    montantDepenseInitial: number = 0,
  ) {
    super();
    this._montantDepense = montantDepenseInitial;
  }

  // ── Getters ───────────────────────────────────────────────
  get id():               string  { return this._id; }
  get userId():           string  { return this._userId; }
  get montantMax():       number  { return this._montantMax; }
  get mois():             number  { return this._mois; }
  get annee():            number  { return this._annee; }
  get montantDepense():   number  { return this._montantDepense; }

  // Propriétés calculées — règles métier pures
  get montantRestant():      number  { return this._montantMax - this._montantDepense; }
  get estDepasse():          boolean { return this._montantDepense > this._montantMax; }
  get pourcentageUtilise():  number  {
    return Math.round((this._montantDepense / this._montantMax) * 100);
  }

  // ── Factory : création ────────────────────────────────────
  static create(props: CreateBudgetProps): Budget {
    Budget.valider(props);
    return new Budget(
      crypto.randomUUID(),
      props.userId,
      props.montantMax,
      props.mois,
      props.annee,
    );
  }

  // ── Factory : reconstitution ──────────────────────────────
  static fromPersistence(data: BudgetPersistenceData): Budget {
    return new Budget(
      data.id,
      data.userId,
      data.montantMax,
      data.mois,
      data.annee,
      data.montantDepense,
    );
  }

  // ── Comportement : enregistrer une dépense ────────────────
  // Cette méthode est appelée quand une dépense est ajoutée.
  // Elle met à jour le total et émet un événement si dépassement.
  enregistrerDepense(montant: number): void {
    const etaitDepasseAvant = this.estDepasse;
    this._montantDepense += montant;

    // On émet l'événement seulement quand on PASSE le seuil
    // (pas à chaque dépense si on est déjà dépassé)
    if (this.estDepasse && !etaitDepasseAvant) {
      this.addEvent(new BudgetDepasseEvent({
        budgetId:       this._id,
        userId:         this._userId,
        montantMax:     this._montantMax,
        montantDepense: this._montantDepense,
      }));
    }
  }

  toPlainObject(): BudgetPersistenceData {
    return {
      id:             this._id,
      userId:         this._userId,
      montantMax:     this._montantMax,
      mois:           this._mois,
      annee:          this._annee,
      montantDepense: this._montantDepense,
    };
  }

  // ── Validation ────────────────────────────────────────────
  private static valider(props: CreateBudgetProps): void {
    if (!props.userId?.trim())        throw new Error(BudgetErrors.USER_ID_VIDE);
    if (props.montantMax <= 0)        throw new Error(BudgetErrors.MONTANT_MAX_INVALIDE);
    if (props.mois < 1 || props.mois > 12) throw new Error(BudgetErrors.MOIS_INVALIDE);
    if (props.annee < 2000)           throw new Error(BudgetErrors.ANNEE_INVALIDE);
  }
}
