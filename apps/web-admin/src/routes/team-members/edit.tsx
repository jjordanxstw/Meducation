import { Navigate, useParams } from 'react-router-dom';

/** Old URL — members open in the side panel. */
const TeamMembersEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/team-members?edit=${id}` : '/team-members'} replace />;
};

export default TeamMembersEdit;
