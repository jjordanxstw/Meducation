import { useParams } from 'react-router-dom';
import { NewsForm } from './news-form';

const NewsEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <NewsForm id={id} />;
};

export default NewsEdit;
