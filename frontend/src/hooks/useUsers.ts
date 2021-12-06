import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getUsers, User } from '../api/BasilApi';
import { ApiException } from '../api/createHttpClient';
import { usePendingState } from './usePendingState';

export const useUsers = () => {
  const { setPending: setGlobalPending } = usePendingState();
  const [pending, setPending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<ApiException>(null);

  useEffect(() => {
    setGlobalPending(pending);
  }, [pending, setGlobalPending]);

  useEffect(() => {
    setPending(true);
    getUsers()
      .then(setUsers)
      .catch(e => {
        setError(e);
        toast.error(e.message);
      })
      .finally(() => setPending(false));
  }, [setPending]);

  return { users, pending, error };
};
