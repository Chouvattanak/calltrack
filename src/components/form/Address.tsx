"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { MapPinIcon } from "@heroicons/react/24/outline";
import api from "@/lib/api";
import formatApiDataForSelect from "@/lib/utils";

interface ISelectOption {
  value: string;
  label: string;
}

export interface IAddress {
  province: ISelectOption | null;
  district: ISelectOption | null;
  commune: ISelectOption | null;
  village: ISelectOption | null;
  homeAddress: string;
  streetAddress: string;
}

interface AddressProps {
  value: IAddress;
  onSave: (address: IAddress) => void;
  error?: string;
  label?: string;
}

export default function Address({ value, onSave, error, label = "Address" }: AddressProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localAddress, setLocalAddress] = useState<IAddress>(value);
  const [provinces, setProvinces] = useState<ISelectOption[]>([]);
  const [districts, setDistricts] = useState<ISelectOption[]>([]);
  const [communes, setCommunes] = useState<ISelectOption[]>([]);
  const [villages, setVillages] = useState<ISelectOption[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof IAddress, string>>>({});

  const handleLocalChange = (field: keyof IAddress, fieldValue: ISelectOption | string | null) => {
    setLocalAddress(prev => {
      const newState = { ...prev, [field]: fieldValue };

      if (field === "province") {
        newState.district = null;
        newState.commune = null;
        newState.village = null;
      } else if (field === "district") {
        newState.commune = null;
        newState.village = null;
      } else if (field === "commune") {
        newState.village = null;
      }

      return newState;
    });

    setErrors(prev => ({ ...prev, [field]: undefined }));
  };


  // Fetch provinces when modal opens
  useEffect(() => {
    if (isModalOpen) {
      if (provinces.length === 0) {
        api
          .get("common/address/province")
          .then(res => {
            setProvinces(formatApiDataForSelect(res.data, "province_id", "province_name"));
          })
          .catch(err => console.error("Failed to fetch provinces", err));
      }
      // If province is set, fetch districts
      if (value.province?.value) {
        api
          .get(`common/address/district/${value.province.value}`)
          .then(res => {
            setDistricts(formatApiDataForSelect(res.data, "district_id", "district_name"));
          })
          .catch(err => console.error("Failed to fetch districts", err));
      }
      // If district is set, fetch communes
      if (value.district?.value) {
        api
          .get(`common/address/commune/${value.district.value}`)
          .then(res => {
            setCommunes(formatApiDataForSelect(res.data, "commune_id", "commune_name"));
          })
          .catch(err => console.error("Failed to fetch communes", err));
      }
      // If commune is set, fetch villages
      if (value.commune?.value) {
        api
          .get(`common/address/village/${value.commune.value}`)
          .then(res => {
            setVillages(formatApiDataForSelect(res.data, "village_id", "village_name"));
          })
          .catch(err => console.error("Failed to fetch villages", err));
      }
    }
  }, [isModalOpen, value]);

  // When province changes, fetch districts
  useEffect(() => {
    const provinceId = localAddress.province?.value;
    setDistricts([]);
    if (provinceId) {
      api
        .get(`common/address/district/${provinceId}`)
        .then(res => {
          setDistricts(formatApiDataForSelect(res.data, "district_id", "district_name"));
        })
        .catch(err => console.error("Failed to fetch districts", err));
    }
  }, [localAddress.province]);

  // When district changes, fetch communes
  useEffect(() => {
    const districtId = localAddress.district?.value;
    setCommunes([]);
    if (districtId) {
      api
        .get(`common/address/commune/${districtId}`)
        .then(res => {
          setCommunes(formatApiDataForSelect(res.data, "commune_id", "commune_name"));
        })
        .catch(err => console.error("Failed to fetch communes", err));
    }
  }, [localAddress.district]);

  // When commune changes, fetch villages
  useEffect(() => {
    const communeId = localAddress.commune?.value;
    setVillages([]);
    if (communeId) {
      api
        .get(`common/address/village/${communeId}`)
        .then(res => {
          setVillages(formatApiDataForSelect(res.data, "village_id", "village_name"));
        })
        .catch(err => console.error("Failed to fetch villages", err));
    }
  }, [localAddress.commune]);

  // Keep localAddress in sync with value
  useEffect(() => {
    setLocalAddress(value);
  }, [value]);

const handleSaveClick = (e?: React.MouseEvent) => {
    console.log("Address save clicked, validating...");
    // Prevent any form submission
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    const newErrors: typeof errors = {};
    if (!localAddress.province) newErrors.province = "Province is required.";
    if (!localAddress.district) newErrors.district = "District is required.";
    if (!localAddress.commune) newErrors.commune = "Commune is required.";
    if (!localAddress.village) newErrors.village = "Village is required.";

    if (Object.keys(newErrors).length > 0) {
        console.log("Validation errors:", newErrors);
        setErrors(newErrors);
        return;
    }

    console.log("Address validated successfully, saving:", localAddress);
    setErrors({});
    onSave(localAddress);
    setIsModalOpen(false);
};

  const handleCancelClick = (e?: React.MouseEvent) => {
    console.log("Address cancel clicked");
    // Prevent any form submission
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    setLocalAddress(value);
    setErrors({});
    setIsModalOpen(false);
  };

  const displayAddress = [
    value.province?.label,
    value.district?.label,
    value.commune?.label,
    value.village?.label,
    value.homeAddress ? `# ${value.homeAddress}` : '',
    value.streetAddress ? `Street ${value.streetAddress}` : ''
  ]
    .filter(Boolean)
    .join(", ");

  // Create primary and secondary address lines for better display
  const homeAddressWithPrefix = value.homeAddress ? `# ${value.homeAddress}` : '';
  const streetAddressWithPrefix = value.streetAddress ? `Street ${value.streetAddress}` : '';
  
  const primaryAddress = [
    homeAddressWithPrefix,
    streetAddressWithPrefix
  ].filter(Boolean).join(", ");

  const secondaryAddress = [
    value.village?.label,
    value.commune?.label,
    value.district?.label,
    value.province?.label
  ].filter(Boolean).join(", ");

  const hasAddress = displayAddress.length > 0;

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1">
        {hasAddress ? (
          // Selected address display (card style)
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-800 dark:text-white">
                  {primaryAddress || secondaryAddress}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {primaryAddress && secondaryAddress ? secondaryAddress : ""}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }}
            >
              Change
            </Button>
          </div>
        ) : (
          // Initial state - using Choose Lead design pattern
          <Button
            variant="outline"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3"
          >
            <MapPinIcon className="h-5 w-5" />
            Click to input address
          </Button>
        )}
      </div>
      
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setLocalAddress(value);
          setErrors({});
          setIsModalOpen(false);
        }}
        className="max-w-[800px] p-4 lg:p-11"
      >
        <div className="px-2 lg:pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Select Address
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Choose or enter the address details for this location.
          </p>
        </div>
          
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Province</Label>
              <Select
                options={provinces}
                value={localAddress.province || undefined}
                onChange={opt => handleLocalChange("province", opt)}
              />
              {errors.province && <p className="text-sm text-red-500 mt-1">{errors.province}</p>}
            </div>

            <div>
              <Label>District</Label>
              <Select
                options={districts}
                value={localAddress.district || undefined}
                onChange={opt => handleLocalChange("district", opt)}
              />
              {errors.district && <p className="text-sm text-red-500 mt-1">{errors.district}</p>}
            </div>

            <div>
              <Label>Commune</Label>
              <Select
                options={communes}
                value={localAddress.commune || undefined}
                onChange={opt => handleLocalChange("commune", opt)}
              />
              {errors.commune && <p className="text-sm text-red-500 mt-1">{errors.commune}</p>}
            </div>

            <div>
              <Label>Village</Label>
              <Select
                options={villages}
                value={localAddress.village || undefined}
                onChange={opt => handleLocalChange("village", opt)}
              />
              {errors.village && <p className="text-sm text-red-500 mt-1">{errors.village}</p>}
            </div>

            <div className="md:col-span-2">
              <Label>Home Address</Label>
              <Input
                type="text"
                placeholder="e.g., House #123"
                value={localAddress.homeAddress}
                onChange={e => handleLocalChange("homeAddress", e.target.value)}
              />
            </div>

            <div>
              <Label>Street Address</Label>
              <Input
                type="text"
                placeholder="e.g., Street 456"
                value={localAddress.streetAddress}
                onChange={e => handleLocalChange("streetAddress", e.target.value)}
              />
            </div>
          </div>
          
        </div>
                  <div className="flex justify-end gap-4 mt-6 pt-4  border-gray-200 dark:border-white/[0.05]">
            <Button variant="outline" type="button" onClick={handleCancelClick}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveClick}>Save Address</Button>
          </div>
      </Modal>
    </div>
  );
}
