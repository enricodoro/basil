import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Constraints,
  createTransaction,
  Transaction,
  TransactionId,
} from '../api/BasilApi';
import { ApiException } from '../api/createHttpClient';
import { usePendingState } from './usePendingState';

export const useTransaction = (id?: TransactionId) => {
  const { setPending: setGlobalPending } = usePendingState();
  const [pending, setPending] = useState(false);
  const [transaction, setTransaction] = useState<Transaction>(null);
  const [error, setError] =
    useState<ApiException<Constraints<Transaction>>>(null);

  useEffect(() => {
    setGlobalPending(pending);
  }, [pending, setGlobalPending]);

  const upsertTransaction = (transaction: Partial<Transaction>) => {
    if (!transaction.id) {
      setPending(true);
      return createTransaction(transaction)
        .then(t => {
          setTransaction(t);
          return t;
        })
        .catch(e => {
          setError(e);
          toast.error(e.message);
        })
        .finally(() => setPending(false));
    }
  };

  // useEffect(() => {
  //   if (id) {
  //     setPending(true);
  //     getTransaction(id)
  //       .then(setTransaction)
  //       .catch(e => {
  //         setError(e);
  //         toast.error(e.message);
  //       })
  //       .finally(() => setPending(false));
  //   }
  // }, [id, setPending]);
  return { transaction, upsertTransaction, pending, error };
};
