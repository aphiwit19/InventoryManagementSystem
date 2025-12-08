import SharedProfilePage from '../../components/shared/ProfilePage';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { t } = useTranslation();
  return (
    <SharedProfilePage
      headerTitle={t('customer.my_profile')}
      headerSubtitle={t('user.user_info')}
    />
  );
}
