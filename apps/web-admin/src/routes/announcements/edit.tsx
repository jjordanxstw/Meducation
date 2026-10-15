import { Navigate, useParams } from 'react-router-dom';

/** Old URL — announcements open in the side panel. */
const AnnouncementsEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/announcements?edit=${id}` : '/announcements'} replace />;
};

export default AnnouncementsEdit;
