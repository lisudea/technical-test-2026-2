import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-dark">
        <Compass className="h-8 w-8" aria-hidden />
      </div>
      <div>
        <h1 className="text-xl font-bold text-ink">404</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('common.notFoundDetail')}</p>
      </div>
      <Link to="/">
        <Button variant="primary" size="md">
          {t('common.goHome')}
        </Button>
      </Link>
    </div>
  );
}
