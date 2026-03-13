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

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuthStore();
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Profile</h1>
        <p className="text-default-500 text-base">Manage your personal information</p>
      </div>

      {/* Profile Card */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-blue-50 gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              isBordered
              color="primary"
              name={profile?.full_name || user?.name}
              src={user?.picture}
              size="lg"
              className="ring-4 ring-white shadow-md"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold line-clamp-1">
                {profile?.full_name || user?.name}
              </h2>
              <p className="text-sm text-default-600 truncate">{user?.email}</p>
            </div>
          </div>
          <Chip
            variant="flat"
            color={profile?.role === 'admin' ? 'warning' : 'primary'}
            startContent={<FiShield className="text-xs" />}
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
            startContent={<FiMail />}
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
              startContent={<FiUser />}
            />
          ) : (
            <Input
              label="Full Name"
              labelPlacement="outside"
              placeholder="Your full name"
              value={profile?.full_name || ''}
              isReadOnly
              variant="flat"
              startContent={<FiUser />}
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
              startContent={<FiBook />}
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
              startContent={<FiBook />}
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
          <div className="flex justify-end gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="flat"
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
                  startContent={<FiSave />}
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
                onPress={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-bold">Account Information</h3>
        </CardHeader>
        <CardBody>
          <div className="flex justify-between py-2">
            <span className="text-sm text-default-500">Account Created</span>
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
          <div className="flex justify-between py-2">
            <span className="text-sm text-default-500">Account Type</span>
            <span className="text-sm font-medium">
              {profile?.role ? getRoleLabel(profile.role) : 'Student'}
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
