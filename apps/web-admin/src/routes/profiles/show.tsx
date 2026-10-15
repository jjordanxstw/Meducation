import { Navigate, useParams } from 'react-router-dom';

/** Old detail URL — the student now opens in the Students side panel. */
const ProfilesShow = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/profiles?id=${id}` : '/profiles'} replace />;
};

export default ProfilesShow;
