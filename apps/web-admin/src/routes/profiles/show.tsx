/**
 * Profiles Show Page
 */
import { Link, useParams } from 'react-router-dom';
import { useShow } from '@refinedev/core';
import { ArrowLeft, Pencil } from 'lucide-react';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}

const ProfilesShow = () => {
  const { id } = useParams<{ id: string }>();
  const { queryResult } = useShow<Profile>({ resource: 'profiles', id });
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <div>
      <PageHeader
        title="Profile Details"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link to="/profiles">
                <ArrowLeft />
                Back
              </Link>
            </Button>
            {id ? (
              <Button asChild>
                <Link to={`/profiles/edit/${id}`}>
                  <Pencil />
                  Edit
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />
      <Card className="max-w-2xl">
        <CardContent className="p-6 pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <div>
              <Row label="Email">{record?.email}</Row>
              <Row label="Full Name">{record?.full_name}</Row>
              <Row label="Student ID">{record?.student_id || '-'}</Row>
              <Row label="Year Level">{record?.year_level ? `Year ${record.year_level}` : '-'}</Row>
              <Row label="Role">
                {record?.role === UserRole.ADMIN ? (
                  <Badge variant="warning">Admin</Badge>
                ) : (
                  <Badge variant="brand">Student</Badge>
                )}
              </Row>
              <Row label="Created At">
                {record?.created_at ? new Date(record.created_at).toLocaleString('en-US') : '-'}
              </Row>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilesShow;
