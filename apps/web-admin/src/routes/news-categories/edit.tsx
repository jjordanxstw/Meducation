import { useParams } from 'react-router-dom';
import { NewsCategoryForm } from './news-category-form';

const NewsCategoriesEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <NewsCategoryForm id={id} />;
};

export default NewsCategoriesEdit;
