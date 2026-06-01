/**
 * Event Types Edit Page
 */
import { useParams } from 'react-router-dom';
import { EventTypeForm } from './event-type-form';

const EventTypesEdit = () => {
  const { id } = useParams<{ id: string }>();
  return <EventTypeForm id={id} />;
};

export default EventTypesEdit;
