/**
 * Announcements Edit Page
 */
import { useParams } from 'react-router-dom';
import { AnnouncementForm } from './announcement-form';

const AnnouncementsEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <AnnouncementForm id={id} />;
};

export default AnnouncementsEdit;
