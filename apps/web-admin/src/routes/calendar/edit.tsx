import { Navigate, useParams } from 'react-router-dom';

/** Old URL — events open in the Calendar page's editor modal. */
const CalendarEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/calendar?edit=${id}` : '/calendar'} replace />;
};

export default CalendarEdit;
