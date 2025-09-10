"use client";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { getUserFromToken } from "@/lib/utils";


export default function Profile() {
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
// ...existing code...
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      setError("");
      try {
        // Get userid from token

        const currentUser = getUserFromToken();
        // Print the decoded token payload for debugging
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              console.log('[Profile] Decoded token payload:', payload);
            } catch (e) {
              console.error('[Profile] Error decoding token:', e);
            }
          } else {
            console.warn('[Profile] No token found in localStorage.');
          }
        }
        console.log('[Profile] currentUser from token:', currentUser);

        if (!currentUser?.userid) {
          setError("Unable to get current user information. Please log in again.");
          setLoading(false);
          return;
        }
        const response = await api.post("/staff/pagination", {
          page_number: "1",
          page_size: "10",
          search_type: "staff_id",
          query_search: Number(currentUser.userid),
        });
        const apiResult = response.data[0];
        if (apiResult && apiResult.data && apiResult.data.length > 0) {
          setStaff(apiResult.data[0]);
        } else {
          setError("Staff not found");
        }
      } catch (err) {
        setError("Failed to fetch staff data");
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>;
  }
  if (error || !staff) {
    return <div className="p-8 text-center text-red-500">{error || "No staff data found."}</div>;
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard staff={staff} />
          <UserInfoCard staff={staff} />
          <UserAddressCard staff={staff} />
        </div>
      </div>
    </div>
  );
}
