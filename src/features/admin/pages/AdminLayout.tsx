import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/components/ui/Spinner';
import { AdminTabs } from '@/features/admin/components/AdminTabs';

/**
 * Shell shared by every admin section: the heading and the sub-navigation
 * stay mounted while the section itself swaps, so switching tabs does not
 * flash the whole page.
 */
export function AdminLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">{t('admin.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('admin.subtitle')}</p>
      </header>

      <AdminTabs />

      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner label={t('common.loading')} />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </div>
  );
}
