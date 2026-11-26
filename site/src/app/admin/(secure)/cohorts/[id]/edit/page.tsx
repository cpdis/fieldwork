import { notFound } from 'next/navigation';
import { getCohortById } from '@/lib/cohorts';
import { getSql } from '@/lib/db';
import { toPerthLocal } from '@/lib/time';
import { saveCohort } from '../../../../actions';
import { CohortForm } from '../../../CohortForm';

export const metadata = { title: 'Edit cohort' };

export default async function EditCohort({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getCohortById(getSql(), id);
  if (!c) notFound();
  return (
    <div className="stack">
      <p className="eyebrow">Edit · {c.title}</p>
      <CohortForm
        action={saveCohort.bind(null, c.id)}
        submitLabel="Save changes"
        defaults={{
          slug: c.slug,
          title: c.title,
          starts_at: toPerthLocal(c.starts_at),
          ends_at: toPerthLocal(c.ends_at),
          venue_name: c.venue_name ?? '',
          venue_address: c.venue_address ?? '',
          joining_notes: c.joining_notes ?? '',
          capacity: c.capacity,
          price: (c.price_cents / 100).toFixed(2).replace(/\.00$/, ''),
          status: c.status,
          pre_course_days: c.pre_course_days,
          follow_up_days: c.follow_up_days,
        }}
      />
    </div>
  );
}
