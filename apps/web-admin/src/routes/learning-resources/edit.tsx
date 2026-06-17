import { useParams } from 'react-router-dom';
import { LearningResourceForm } from './learning-resource-form';

const LearningResourcesEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <LearningResourceForm id={id} />;
};

export default LearningResourcesEdit;
