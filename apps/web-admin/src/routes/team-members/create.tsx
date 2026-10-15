import { Navigate } from 'react-router-dom';

/** Old URL — members are added in the side panel. */
const TeamMembersCreate = () => <Navigate to="/team-members?new=1" replace />;

export default TeamMembersCreate;
