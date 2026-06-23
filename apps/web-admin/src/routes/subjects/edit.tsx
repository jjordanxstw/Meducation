import { useParams } from 'react-router-dom';
import { SubjectTreeForm } from './subject-tree-form';

const SubjectsEdit = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <SubjectTreeForm id={id} />;
};

export default SubjectsEdit;
