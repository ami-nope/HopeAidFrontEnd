'use client';

import { Activity, Globe, Mail, MapPin, Phone, Shield, Truck, User } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useVolunteers } from '@/hooks/useData';
import { getDisplayEmail } from '@/lib/contact';

export default function VolunteerProfilePage() {
  const { user, orgName } = useAuth();
  const { volunteers, loading } = useVolunteers(1, 100);
  const displayEmail = getDisplayEmail(user?.email);

  const volunteerRecord = volunteers.find((item) => item.user_id === user?.id) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-gray-300">
          Account details and linked volunteer information.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User size={18} className="text-slate-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-slate-900 dark:text-gray-100">{user?.full_name || user?.name || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-slate-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-slate-900 dark:text-gray-100">{displayEmail || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-slate-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Phone</p>
                <p className="font-medium text-slate-900 dark:text-gray-100">{user?.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-slate-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Role</p>
                <p className="font-medium capitalize text-slate-900 dark:text-gray-100">
                  {user?.role?.replace(/_/g, ' ') || '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-slate-400 dark:text-gray-500" />
              <div>
                <p className="text-xs text-slate-500 dark:text-gray-400">Organization</p>
                <p className="font-medium text-slate-900 dark:text-gray-100">{orgName || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Volunteer Record</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500 dark:text-gray-400">Loading volunteer details...</p>
            ) : volunteerRecord ? (
              <>
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-slate-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Availability</p>
                    <p className="font-medium capitalize text-slate-900 dark:text-gray-100">
                      {volunteerRecord.availability_status.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-slate-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Current Location</p>
                    <p className="font-medium text-slate-900 dark:text-gray-100">
                      {volunteerRecord.current_location_name || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Truck size={18} className="text-slate-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Transport</p>
                    <p className="font-medium text-slate-900 dark:text-gray-100">
                      {volunteerRecord.has_transport
                        ? volunteerRecord.vehicle_type || 'Available'
                        : 'Not available'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Skills</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-gray-100">
                    {volunteerRecord.skills?.length ? volunteerRecord.skills.join(', ') : 'No skills listed'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Languages</p>
                  <p className="mt-1 text-sm text-slate-900 dark:text-gray-100">
                    {volunteerRecord.languages?.length ? volunteerRecord.languages.join(', ') : 'No languages listed'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-gray-400">
                No linked volunteer record was found for this account yet. The dashboard still works,
                but assignment-specific views will need a user-to-volunteer mapping.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
