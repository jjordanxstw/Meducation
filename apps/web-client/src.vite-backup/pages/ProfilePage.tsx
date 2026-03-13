/**
 * Profile Page
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
} from '@heroui/react';
import { useAuthStore } from '../stores/auth.store';
import { api } from '../lib/api';
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
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-in px-3 sm:px-0">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-medical-gray-900 mb-1 sm:mb-2">Profile</h1>
        <p className="text-medical-gray-500 text-base sm:text-lg">Manage your personal information</p>
      </div>

      {/* Profile Card */}
      <Card className="card-rounded shadow-xl border-0 overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <Avatar
              isBordered
              color="primary"
              name={profile?.full_name || user?.name}
              src={user?.picture}
              size="lg"
              className="ring-2 sm:ring-4 ring-white shadow-lg flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-medical-gray-900 mb-1 break-words">
                {profile?.full_name || user?.name}
              </h2>
              <p className="text-xs sm:text-sm text-medical-gray-600 font-medium truncate">{user?.email}</p>
            </div>
          </div>
          <Chip
            variant="flat"
            color={profile?.role === 'admin' ? 'warning' : 'primary'}
            startContent={<FiShield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            className="font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-sm text-xs sm:text-sm flex-shrink-0"
          >
            {profile?.role ? getRoleLabel(profile.role) : 'Student'}
          </Chip>
        </CardHeader>

        <Divider className="my-0" />

        <CardBody className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Email (Read-only) */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-medical-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <FiMail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600" />
              </div>
              Email
            </label>
            <Input
              value={user?.email || ''}
              isReadOnly
              isDisabled
              variant="flat"
              classNames={{
                inputWrapper: 'bg-medical-gray-50 border-medical-gray-200 rounded-xl h-11 sm:h-12',
                input: 'text-sm sm:text-base',
              }}
            />
            <p className="text-xs text-medical-gray-400 mt-2 ml-9 sm:ml-10">
              Email cannot be changed
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-medical-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <FiUser className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600" />
              </div>
              Full Name
            </label>
            {isEditing ? (
              <Input
                value={formData.full_name}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, full_name: value }))
                }
                placeholder="Enter your full name"
                classNames={{
                  inputWrapper: 'rounded-xl h-11 sm:h-12 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200',
                  input: 'text-sm sm:text-base',
                }}
              />
            ) : (
              <Input
                value={profile?.full_name || ''}
                isReadOnly
                variant="flat"
                classNames={{
                  inputWrapper: 'bg-medical-gray-50 border-medical-gray-200 rounded-xl h-11 sm:h-12',
                  input: 'text-sm sm:text-base',
                }}
              />
            )}
          </div>

          {/* Year Level */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-medical-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <FiBook className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600" />
              </div>
              Year Level
            </label>
            {isEditing ? (
              <Select
                label="Year Level"
                aria-label="Select year level"
                selectedKeys={[formData.year_level]}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, year_level: e.target.value }))
                }
                classNames={{
                  trigger: 'rounded-xl h-11 sm:h-12 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200',
                  label: 'text-xs sm:text-sm font-semibold',
                  value: 'text-sm sm:text-base',
                }}
              >
                {YEAR_LEVELS.map((year) => (
                  <SelectItem key={year.toString()}>
                    {getYearLevelLabel(year)}
                  </SelectItem>
                ))}
              </Select>
            ) : (
              <Input
                value={profile?.year_level ? getYearLevelLabel(profile.year_level) : '-'}
                isReadOnly
                variant="flat"
                classNames={{
                  inputWrapper: 'bg-medical-gray-50 border-medical-gray-200 rounded-xl h-11 sm:h-12',
                  input: 'text-sm sm:text-base',
                }}
              />
            )}
          </div>

          {/* Student ID */}
          {profile?.student_id && (
            <div>
              <label className="text-xs sm:text-sm font-medium text-medical-gray-700 mb-2">
                Student ID
              </label>
              <Input
                value={profile.student_id}
                isReadOnly
                variant="flat"
                classNames={{
                  inputWrapper: 'bg-medical-gray-50 rounded-xl h-11 sm:h-12',
                  input: 'text-sm sm:text-base',
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-medical-gray-200">
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
                  className="rounded-xl px-4 sm:px-6 font-semibold text-sm sm:text-base w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  startContent={<FiSave className="w-4 h-4" />}
                  onPress={handleSave}
                  isLoading={isSaving}
                  className="btn-primary rounded-xl px-4 sm:px-6 font-semibold shadow-lg text-sm sm:text-base w-full sm:w-auto"
                >
                  Save
                </Button>
              </>
            ) : (
              <Button 
                color="primary" 
                variant="flat" 
                onPress={() => setIsEditing(true)}
                className="rounded-xl px-4 sm:px-6 font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 text-sm sm:text-base w-full sm:w-auto"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Account Info Card */}
      <Card className="card-rounded shadow-xl border-0">
        <CardHeader className="p-4 sm:p-6 bg-medical-gray-50">
          <h3 className="font-heading text-lg sm:text-xl font-bold text-medical-gray-900">Account Information</h3>
        </CardHeader>
        <CardBody className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2">
            <span className="text-xs sm:text-sm text-medical-gray-600">Account Created</span>
            <span className="font-medium text-xs sm:text-sm text-right sm:text-left">
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 py-2">
            <span className="text-xs sm:text-sm text-medical-gray-600">Account Type</span>
            <span className="font-medium text-xs sm:text-sm text-right sm:text-left">
              {profile?.role ? getRoleLabel(profile.role) : 'Student'}
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
