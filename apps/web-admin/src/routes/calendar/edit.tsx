/**
 * Calendar Events Edit Page
 */
import { useParams } from 'react-router-dom';
import { CalendarForm } from './calendar-form';

const CalendarEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <CalendarForm id={id} />;
};

export default CalendarEdit;
