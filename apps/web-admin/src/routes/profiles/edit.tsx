/**
 * Profiles Edit Page
 */
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm as useRefineForm } from '@refinedev/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { UserRole } from '@medical-portal/shared';
import type { Profile } from '@medical-portal/shared';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

const schema = z.object({
  email: z.string().optional(),
  full_name: z.string().trim().min(1, 'Please enter a full name'),
  student_id: z.string().optional(),
  year_level: z.string().optional(),
  role: z.string().min(1, 'Please select a role'),
});

type Values = z.infer<typeof schema>;

const ProfilesEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { onFinish, queryResult, formLoading } = useRefineForm<Profile>({
    resource: 'profiles',
    action: 'edit',
    id,
    redirect: 'list',
  });

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', full_name: '', student_id: '', year_level: '', role: '' },
  });

  const record = queryResult?.data?.data;
  useEffect(() => {
    if (record) {
      form.reset({
        email: record.email ?? '',
        full_name: record.full_name ?? '',
        student_id: record.student_id ?? '',
        year_level: record.year_level ? String(record.year_level) : '',
        role: record.role ?? '',
      });
    }
  }, [record, form]);

  const submit = form.handleSubmit(async (values) => {
    await onFinish({
      full_name: values.full_name,
      student_id: values.student_id || null,
      year_level: values.year_level ? Number(values.year_level) : null,
      role: values.role,
    });
  });

  return (
    <div>
      <PageHeader
        title="Edit Profile"
        actions={
          <Button asChild variant="ghost">
            <Link to="/profiles">
              <ArrowLeft />
              Back
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={submit}>
            <CardContent className="flex flex-col gap-5 p-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input disabled {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Level</FormLabel>
                    <Select value={field.value || '__none'} onValueChange={(v) => field.onChange(v === '__none' ? '' : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select year level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none">Not set</SelectItem>
                        {[1, 2, 3, 4, 5, 6].map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            Year {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                        <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button asChild variant="secondary">
                <Link to="/profiles">Cancel</Link>
              </Button>
              <Button type="submit" loading={formLoading}>
                Save changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilesEdit;
