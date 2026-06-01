import { useParams } from 'react-router-dom';
import { TeamMemberForm } from './team-member-form';

const TeamMembersEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <TeamMemberForm id={id} />;
};

export default TeamMembersEdit;
