import { saveCohort } from '../../../actions';
import { CohortForm } from '../../CohortForm';

export const metadata = { title: 'New cohort' };

export default function NewCohort() {
  return (
    <div className="stack">
      <p className="eyebrow">New cohort</p>
      <CohortForm
        action={saveCohort.bind(null, null)}
        submitLabel="Create cohort"
        defaults={{
          slug: '',
          title: 'Fieldwork: one day',
          starts_at: '',
          ends_at: '',
          venue_name: '',
          venue_address: '',
          joining_notes: '',
          capacity: 12,
          price: '1000',
          status: 'draft',
          pre_course_days: 5,
          follow_up_days: 1,
        }}
      />
    </div>
  );
}
