"use client";
import React from "react";
import type { Staff } from "../tables/StaffTable";

type UserAddressCardProps = {
  staff: Staff;
};

export default function UserAddressCard({ staff }: UserAddressCardProps) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Address Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Province</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{staff.province_name}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">District</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{staff.district_name}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Commune</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{staff.commune_name}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Village</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{staff.village_name}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Home & Street Address</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{staff.current_address}</p>
            </div>

          </div>
        </div>
        </div>
        </div>
  );
}
