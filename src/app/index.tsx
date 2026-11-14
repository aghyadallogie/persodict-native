import { useAuth } from '@/lib/auth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { session } = useAuth();

  return <Redirect href={session ? '/home' : '/login'} />;
}
