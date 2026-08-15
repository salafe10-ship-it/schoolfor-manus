import { UnitOfWork } from '../UnitOfWork';
import { GeneralLedger } from '../../types';
import { SQLCommandBuilder } from '../transactions/SQLCommand';

export class GeneralLedgerRepository {
  /**
   * Enlists the creation of a General Ledger line inside a UnitOfWork.
   */
  public static enlistCreateGeneralLedger(
    id: string,
    schoolId: string,
    accountId: string,
    date: string,
    debit: number,
    credit: number,
    balanceAfter: number,
    referenceType: string,
    referenceId: string,
    description: string,
    createdAt: string,
    glLine: GeneralLedger
  ): void {
    const command = SQLCommandBuilder.create({
        sqlText: `INSERT INTO general_ledger (id, school_id, account_id, date, debit, credit, balance_after, reference_type, reference_id, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        parameters: [id, schoolId, accountId, date, debit, credit, balanceAfter, referenceType, referenceId, description, createdAt],
        executionContext: 'Create General Ledger'
    });
    UnitOfWork.enlistCreate('general_ledger', id, glLine, command);
  }

  /**
   * Enlists the deletion of General Ledger lines for a given journal reference inside a UnitOfWork.
   */
  public static enlistDeleteGeneralLedgerByReference(
    schoolId: string,
    referenceId: string,
    referenceType: string
  ): void {
    const command = SQLCommandBuilder.create({
        sqlText: `DELETE FROM general_ledger WHERE reference_id = $1 AND reference_type = $2 AND school_id = $3;`,
        parameters: [referenceId, referenceType, schoolId],
        executionContext: 'Delete General Ledger By Reference'
    });
    UnitOfWork.enlistDelete('general_ledger', `gl_ref_${referenceId}`, command);
  }
}
