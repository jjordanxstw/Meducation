'use client';

/**
 * Profile Page
 * Next.js adapted version
 */

import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Button,
  Input,
  Select,
  SelectItem,
  Divider,
  Chip,
} from '@nextui-org/react';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { FiUser, FiMail, FiBook, FiSave, FiShield } from 'react-icons/fi';
import { getYearLevelLabel, getRoleLabel, YEAR_LEVELS } from '@medical-portal/shared';
import { ProfileSkeleton } from '@/components/skeletons/DashboardSkeletons';

export default function ProfilePage() {
  const { user, profile, updateProfile, isLoading, isInitialized } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    year_level: profile?.year_level?.toString() || '1',
  });

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const response = await api.profile.update(profile.id, {
        full_name: formData.full_name,
        year_level: parseInt(formData.year_level),
      });

      if (response.data.success) {
        updateProfile(response.data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Unable to save data');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isInitialized || isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink-1)]">Profile</h1>
        <p className="text-base text-[var(--ink-2)]">Manage your personal information</p>
      </div>

      {/* Profile Card */}
      <Card className="glass-surface">
        <CardHeader className="flex flex-col gap-4 bg-gradient-to-r from-white/30 to-sky-100/20 dark:from-slate-800/35 dark:to-sky-900/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              isBordered
              color="primary"
              name={profile?.full_name || user?.name}
              src={user?.picture}
              size="lg"
              className="ring-4 ring-white shadow-md"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink-1)] line-clamp-1">
                {profile?.full_name || user?.name}
              </h2>
              <p className="truncate text-sm text-[var(--ink-2)]">{user?.email}</p>
            </div>
          </div>
          <Chip
            variant="flat"
            color={profile?.role === 'admin' ? 'warning' : 'primary'}
            startContent={<span className="icon-with-text"><FiShield className="h-3 w-3" /></span>}
          >
            {profile?.role ? getRoleLabel(profile.role) : 'Student'}
          </Chip>
        </CardHeader>

        <Divider />

        <CardBody className="gap-6">
          {/* Email (Read-only) */}
          <Input
            label="Email"
            labelPlacement="outside"
            placeholder="your@email.com"
            value={user?.email || ''}
            isReadOnly
            isDisabled
            variant="flat"
            startContent={<span className="icon-with-text"><FiMail className="h-4 w-4" /></span>}
            description="Email cannot be changed"
          />

          {/* Full Name */}
          {isEditing ? (
            <Input
              label="Full Name"
              labelPlacement="outside"
              placeholder="Enter your full name"
              value={formData.full_name}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, full_name: value }))
              }
              startContent={<span className="icon-with-text"><FiUser className="h-4 w-4" /></span>}
            />
          ) : (
            <Input
              label="Full Name"
              labelPlacement="outside"
              placeholder="Your full name"
              value={profile?.full_name || ''}
              isReadOnly
              variant="flat"
              startContent={<span className="icon-with-text"><FiUser className="h-4 w-4" /></span>}
            />
          )}

          {/* Year Level */}
          {isEditing ? (
            <Select
              label="Year Level"
              labelPlacement="outside"
              placeholder="Select year level"
              selectedKeys={[formData.year_level]}
              onSelectionChange={(keys) =>
                setFormData((prev) => ({ ...prev, year_level: Array.from(keys)[0] as string }))
              }
              startContent={<span className="icon-with-text"><FiBook className="h-4 w-4" /></span>}
            >
              {YEAR_LEVELS.map((year) => (
                <SelectItem key={year.toString()}>
                  {getYearLevelLabel(year)}
                </SelectItem>
              ))}
            </Select>
          ) : (
            <Input
              label="Year Level"
              labelPlacement="outside"
              placeholder="Year level"
              value={profile?.year_level ? getYearLevelLabel(profile.year_level) : '-'}
              isReadOnly
              variant="flat"
              startContent={<span className="icon-with-text"><FiBook className="h-4 w-4" /></span>}
            />
          )}

          {/* Student ID */}
          {profile?.student_id && (
            <Input
              label="Student ID"
              labelPlacement="outside"
              placeholder="Student ID"
              value={profile.student_id}
              isReadOnly
              variant="flat"
            />
          )}

          <Divider />

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {isEditing ? (
              <>
                <Button
                  variant="flat"
                  className="btn-precise w-full justify-center sm:w-auto"
                  onPress={() => {
                    setIsEditing(false);
                    setFormData({
                      full_name: profile?.full_name || '',
                      year_level: profile?.year_level?.toString() || '1',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  startContent={<span className="icon-with-text"><FiSave className="h-4 w-4" /></span>}
                  className="btn-precise w-full justify-center sm:w-auto"
                  onPress={handleSave}
                  isLoading={isSaving}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                color="primary"
                variant="flat"
                className="btn-precise w-full justify-center sm:w-auto"
                onPress={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Account Info Card */}
      <Card className="glass-surface">
        <CardHeader>
          <h3 className="text-lg font-bold text-[var(--ink-1)]">Account Information</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-[var(--ink-2)]">Account Created</span>
            <span className="text-sm font-medium">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </span>
          </div>
          <Divider />
          <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-[var(--ink-2)]">Account Type</span>
            <span className="text-sm font-medium">
              {profile?.role ? getRoleLabel(profile.role) : 'Student'}
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
