import { cookies } from 'next/headers';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import Settings from '@/components/user/Settings.client';
import { SETTINGS_QUERY_KEY } from '@/hooks/common/useSettingsQuery';
import { mergeSettings } from '@/lib/utils/settingsUtils';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';

async function getSettingsServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STORAGE_KEYS.ACCESS_TOKEN)?.value;

  if (!token) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.success && data.data) {
      return data.data.profile?.settings_metadata;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export default async function SettingsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const serverSettings = await getSettingsServer();
      return mergeSettings(serverSettings);
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Settings />
    </HydrationBoundary>
  );
}
