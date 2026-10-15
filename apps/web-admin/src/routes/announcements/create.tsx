import { Navigate } from 'react-router-dom';

/** Old URL — announcements are written in the side panel. */
const AnnouncementsCreate = () => <Navigate to="/announcements?new=1" replace />;

export default AnnouncementsCreate;
