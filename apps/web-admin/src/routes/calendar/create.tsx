import { Navigate } from 'react-router-dom';

/** Old URL — new events open in the Calendar page's editor modal. */
const CalendarCreate = () => <Navigate to="/calendar?new=1" replace />;

export default CalendarCreate;
