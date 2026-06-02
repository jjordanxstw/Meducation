import { useParams } from 'react-router-dom';
import { SubjectForm } from './subject-form';

const SubjectsEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <SubjectForm id={id} />;
};

export default SubjectsEdit;
