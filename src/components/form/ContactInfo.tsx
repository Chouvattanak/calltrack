"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { 
  PlusIcon, 
  XMarkIcon, 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  StarIcon,
  CameraIcon
} from "@heroicons/react/24/outline";
import { 
  StarIcon as StarSolidIcon 
} from "@heroicons/react/24/solid";
import { EnvelopeIcon } from "@/icons";
import api from "@/lib/api";
import formatApiDataForSelect from "@/lib/utils"; 

// Phone number formatting function
const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return "";
  
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");
  
  // Handle different phone number formats
  if (digits.startsWith("855")) {
    // Already has country code
    const remaining = digits.slice(3);
    if (remaining.length >= 6) {
      const part1 = remaining.slice(0, 3);
      const part2 = remaining.slice(3, 6);
      const part3 = remaining.slice(6);
      return `(+855) ${part1}-${part2}-${part3}`;
    }
  } else if (digits.length >= 6) {
    // Assume it's a local number, add Cambodia country code
    const part1 = digits.slice(0, 3);
    const part2 = digits.slice(3, 6);
    const part3 = digits.slice(6);
    return `(+855) ${part1}-${part2}-${part3}`;
  }
  
  // If formatting fails, return original with country code prefix
  return `(+855) ${phoneNumber}`;
};

// Format contact display string: (+855) 000-000-0000 | Name
const formatContactDisplay = (contact: IContactValue): string => {
  const formattedPhone = formatPhoneNumber(contact.contact_number);
  const name = contact.user_name?.trim();
  
  if (name) {
    return `${formattedPhone} | ${name}`;
  }
  return formattedPhone;
}; 

export interface IContactValue {
    id: number;
    user_name: string;
    contact_number: string;
    remark: string;
    is_primary: boolean;
}

export interface IContactChannel {
    id: number;
    channel_type: ISelectOption | null;
    contact_values: IContactValue[];
}

interface ISelectOption {
    value: string;
    label: string;
}

interface ContactInfoProps {
    value: IContactChannel[];
    onChange: (contacts: IContactChannel[]) => void;
    error?: string;
}

// Type for modal-specific validation errors
type ModalErrors = {
    channel_type?: string;
    contact_values?: {
        contact_number?: string;
        user_name?: string;
    }[];
}[];

// Contact type icon mapping
const getContactIcon = (channelTypeId: string) => {
  switch (channelTypeId) {
    case "3": return DevicePhoneMobileIcon; // Phone Number
    case "2": return ChatBubbleLeftRightIcon; // Facebook
    case "4": return ChatBubbleLeftRightIcon; // WhatsApp
    case "5": return ChatBubbleLeftRightIcon; // WeChat
    case "6": return CameraIcon; // Instagram
    default: return PhoneIcon;
  }
};

// Contact type color mapping
const getContactColor = (channelTypeId: string) => {
  switch (channelTypeId) {
    case "3": return "bg-blue-500"; // Phone Number
    case "2": return "bg-blue-600"; // Facebook
    case "4": return "bg-green-500"; // WhatsApp
    case "5": return "bg-green-600"; // WeChat
    case "6": return "bg-purple-500"; // Instagram
    default: return "bg-gray-500";
  }
};

// Contact type label override mapping - using actual API data
const getContactLabel = (channelType: ISelectOption | null) => {
  if (!channelType) return 'Contact';
  
  // The API returns channel_type_name directly, so we can use it
  // But we can still override if needed for display purposes
  switch (channelType.value) {
    case "3": return "Phone Number";
    case "2": return "Facebook";
    case "4": return "WhatsApp";
    case "5": return "WeChat";
    case "6": return "Instagram";
    default: return channelType.label;
  }
};

// Modern Primary Toggle Component
const PrimaryToggle = ({ isPrimary, onToggle, disabled = false }: { 
  isPrimary: boolean; 
  onToggle: () => void; 
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200
        ${isPrimary 
          ? 'border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' 
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {isPrimary ? (
        <StarSolidIcon className="h-4 w-4" />
      ) : (
        <StarIcon className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {isPrimary ? 'Primary' : 'Set as Primary'}
      </span>
    </button>
  );
};

// Individual Contact Card Component
const ContactCard = ({ 
  contact, 
  valueIndex, 
  channelType,
  canRemove,
  onValueChange,
  onSetPrimary,
  onRemove,
  error 
}: {
  contact: IContactValue;
  valueIndex: number;
  channelType: ISelectOption | null;
  canRemove: boolean;
  onValueChange: (field: keyof IContactValue, value: string | boolean) => void;
  onSetPrimary: () => void;
  onRemove: () => void;
  error?: { contact_number?: string; user_name?: string };
}) => {
  const IconComponent = channelType ? getContactIcon(channelType.value) : PhoneIcon;
  const colorClass = channelType ? getContactColor(channelType.value) : "bg-gray-500";

  return (
    <div className={`
      relative rounded-xl border-2 transition-all duration-200 p-4
      ${contact.is_primary 
        ? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-600 dark:bg-yellow-900/10' 
        : 'border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800'
      }
    `}>
      {/* Primary Badge */}
      {contact.is_primary && (
        <div className="absolute -top-2 -right-2">
          <div className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
            <StarSolidIcon className="h-3 w-3" />
            Primary
          </div>
        </div>
      )}

      {/* Remove Button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -left-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}

      <div className="space-y-4">
        {/* Contact Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass} text-white`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {getContactLabel(channelType)}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {contact.contact_number ? 
                formatContactDisplay(contact) : 
                `Contact #${valueIndex + 1}`
              }
            </p>
          </div>
        </div>

        {/* Contact Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name
            </Label>
            <Input
              placeholder="e.g., John Doe"
              value={contact.user_name}
              onChange={(e) => onValueChange('user_name', e.target.value)}
              className="mt-1"
            />
            {error?.user_name && (
              <p className="text-xs text-red-500 mt-1">{error.user_name}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Number/ID *
            </Label>
            <Input
              placeholder={
                channelType?.value === "3" ? "(+855) 012-345-678" : // Phone Number only
                channelType?.value === "2" ? "facebook.com/username" : // Facebook
                channelType?.value === "4" ? "WhatsApp number" : // WhatsApp (no +855 format)
                channelType?.value === "5" ? "wechat_username" : // WeChat
                channelType?.value === "6" ? "@instagram_username" : // Instagram
                "Contact info"
              }
              value={contact.contact_number}
              onChange={(e) => onValueChange('contact_number', e.target.value)}
              className="mt-1"
              error={!!error?.contact_number}
            />
            {error?.contact_number && (
              <p className="text-xs text-red-500 mt-1">{error.contact_number}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Contact
            </Label>
            <div className="mt-1">
              <PrimaryToggle
                isPrimary={contact.is_primary}
                onToggle={onSetPrimary}
                disabled={contact.is_primary}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ContactInfo({ value, onChange, error }: ContactInfoProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [localContacts, setLocalContacts] = useState<IContactChannel[]>([]);
    const [channelTypes, setChannelTypes] = useState<ISelectOption[]>([]);
    const [modalErrors, setModalErrors] = useState<ModalErrors>([]);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        if (isModalOpen && channelTypes.length === 0) {
            api.get('channel-type/channel-type').then(res => {
                setChannelTypes(formatApiDataForSelect(res.data, 'channel_type_id', 'channel_type_name'));
            }).catch(err => console.error("Failed to fetch channel types", err));
        }
    }, [isModalOpen, channelTypes.length]);

    // Initialize localContacts with all channel types when modal opens
    useEffect(() => {
        if (isModalOpen && channelTypes.length > 0) {
            const existingContacts = value.length > 0 ? JSON.parse(JSON.stringify(value)) : [];
            const allChannelContacts: IContactChannel[] = [];
            
            // Create a contact channel for each channel type
            channelTypes.forEach((channelType, index) => {
                // Check if this channel type already exists in current contacts
                const existingChannel = existingContacts.find((c: IContactChannel) => 
                    c.channel_type?.value === channelType.value
                );
                
                if (existingChannel) {
                    // Use existing channel data
                    allChannelContacts.push(existingChannel);
                } else {
                    // Create new empty channel
                    allChannelContacts.push({
                        id: Date.now() + index,
                        channel_type: channelType,
                        contact_values: []
                    });
                }
            });
            
            setLocalContacts(allChannelContacts);
            setModalErrors([]);
        }
    }, [isModalOpen, channelTypes, value]);

    const handleOpenModal = () => {
        setActiveTab(0);
        setIsModalOpen(true);
    };
    
    const addContactValue = (channelIndex: number) => {
        const newContacts = [...localContacts];
        const channelType = newContacts[channelIndex].channel_type;
        const remark = getContactLabel(channelType); // Automatically set remark to channel type name
        
        newContacts[channelIndex].contact_values.push({
            id: Date.now(),
            user_name: "",
            contact_number: "",
            remark: remark,
            is_primary: !localContacts.some(c => c.contact_values.some(v => v.is_primary)),
        });
        setLocalContacts(newContacts);
    };

    const removeContactValue = (channelIndex: number, valueIndex: number) => {
        const newContacts = [...localContacts];
        const wasPrimary = newContacts[channelIndex].contact_values[valueIndex].is_primary;
        newContacts[channelIndex].contact_values.splice(valueIndex, 1);
        
        // Auto-assign primary if it was removed
        if (wasPrimary) {
            for (const channel of newContacts) {
                for (const contact of channel.contact_values) {
                    if (contact.contact_number.trim()) {
                        contact.is_primary = true;
                        break;
                    }
                }
                if (newContacts.some(c => c.contact_values.some(v => v.is_primary))) break;
            }
        }
        
        setLocalContacts(newContacts);
    };
    
    const handleValueChange = (channelIndex: number, valueIndex: number, field: keyof IContactValue, fieldValue: string | boolean) => {
        const newContacts = [...localContacts];
        newContacts[channelIndex].contact_values[valueIndex] = {
            ...newContacts[channelIndex].contact_values[valueIndex],
            [field]: fieldValue
        };
        setLocalContacts(newContacts);

        // Clear errors
        if (field === 'contact_number' && modalErrors[channelIndex]?.contact_values?.[valueIndex]?.contact_number) {
            const newErrors = [...modalErrors];
            if (!newErrors[channelIndex]) newErrors[channelIndex] = {};
            if (!newErrors[channelIndex].contact_values) newErrors[channelIndex].contact_values = [];
            newErrors[channelIndex].contact_values![valueIndex] = { 
                ...newErrors[channelIndex].contact_values![valueIndex], 
                contact_number: undefined 
            };
            setModalErrors(newErrors);
        }
    };

    const setAsPrimary = (channelIndex: number, valueIndex: number) => {
        const newContacts = localContacts.map((channel, cIdx) => ({
            ...channel,
            contact_values: channel.contact_values.map((contact, vIdx) => ({
                ...contact,
                is_primary: cIdx === channelIndex && vIdx === valueIndex
            }))
        }));
        setLocalContacts(newContacts);
    };

    const validateModal = (): boolean => {
        let isValid = true;
        const newErrors: ModalErrors = [];

        localContacts.forEach((channel, cIdx) => {
            const channelErrors: ModalErrors[number] = {};
            
            // Only validate channels that have contact values
            if (channel.contact_values.length > 0) {
                const valueErrors: { contact_number?: string; user_name?: string }[] = [];
                channel.contact_values.forEach((contact, vIdx) => {
                    const contactErrors: { contact_number?: string; user_name?: string } = {};
                    if (!contact.contact_number.trim()) {
                        contactErrors.contact_number = "Contact number is required.";
                        isValid = false;
                    }
                    valueErrors[vIdx] = contactErrors;
                });

                if (valueErrors.some(e => e.contact_number)) {
                    channelErrors.contact_values = valueErrors;
                }
            }
            newErrors[cIdx] = channelErrors;
        });

        setModalErrors(newErrors);
        return isValid;
    };
    
    const handleSave = () => {
        if (validateModal()) {
            // Only save channels that have contact values
            const contactsWithData = localContacts.filter(channel => 
                channel.contact_values.length > 0 && 
                channel.contact_values.some(contact => contact.contact_number.trim())
            );
            onChange(contactsWithData);
            setIsModalOpen(false);
        }
    };

    const primaryContact = value.flatMap(c => c.contact_values).find(v => v.is_primary);
    const allContacts = value.flatMap(c => c.contact_values).filter(v => 
        v.contact_number && 
        v.contact_number.trim().length > 0 && 
        /[a-zA-Z0-9]/.test(v.contact_number)
    );
    const hasContacts = allContacts.length > 0;

    return (
        <div>
            <Label>Contact Information</Label>
            <div className="mt-1">
                {hasContacts ? (
                    <div className="space-y-2">
                        {/* Primary Contact Display */}
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 text-white rounded-lg">
                                    <StarSolidIcon className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {primaryContact ? 
                                            formatContactDisplay(primaryContact) : 
                                            formatContactDisplay(allContacts[0])
                                        }
                                    </div>
                                    <div className="text-sm text-blue-600 dark:text-blue-400">
                                        Primary Contact • {primaryContact?.remark || allContacts[0]?.remark || 'No label'} • {allContacts.length} total contact{allContacts.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </div>
                            <Button 
                                type="button" 
                                size="sm" 
                                variant="outline"
                                onClick={handleOpenModal}
                                className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                            >
                                Manage Contacts
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button 
                        type="button"
                        variant="outline"
                        onClick={handleOpenModal}
                        className="w-full flex items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500 transition-colors"
                    >
                        <PlusIcon className="h-6 w-6" />
                        <div className="text-center">
                            <div className="font-medium">Add Contact Information</div>
                            <div className="text-sm text-gray-500">Phone, email, messaging apps</div>
                        </div>
                    </Button>
                )}
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

            {/* Enhanced Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Contact Information
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Manage phone numbers, emails, and messaging contacts
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        {/* Contact Channels Tabs */}
                        <div className="px-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex gap-2 overflow-x-auto">
                                {localContacts.map((channel, index) => {
                                    const IconComponent = channel.channel_type ? getContactIcon(channel.channel_type.value) : PhoneIcon;
                                    const isActive = activeTab === index;
                                    const hasContacts = channel.contact_values.length > 0;
                                    return (
                                        <button
                                            key={channel.id}
                                            type="button"
                                            onClick={() => setActiveTab(index)}
                                            className={`
                                                flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                                                ${isActive 
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                }
                                            `}
                                        >
                                            <IconComponent className="h-4 w-4" />
                                            <span className="font-medium">
                                                {getContactLabel(channel.channel_type)}
                                            </span>
                                            {hasContacts && (
                                                <span className="text-xs bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                                    {channel.contact_values.length}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {localContacts.length === 0 ? (
                                <div className="text-center py-12">
                                    <EnvelopeIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Loading Contact Types...
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        Please wait while we load available contact channels
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {localContacts[activeTab] && (
                                        <div>
                                            {/* Channel Header */}
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    {localContacts[activeTab].channel_type && (() => {
                                                        const IconComponent = getContactIcon(localContacts[activeTab].channel_type!.value);
                                                        const colorClass = getContactColor(localContacts[activeTab].channel_type!.value);
                                                        return (
                                                            <div className={`p-3 rounded-xl ${colorClass} text-white`}>
                                                                <IconComponent className="h-6 w-6" />
                                                            </div>
                                                        );
                                                    })()}
                                                    <div>
                                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                            {getContactLabel(localContacts[activeTab].channel_type)}
                                                        </h3>
                                                        <p className="text-gray-600 dark:text-gray-400">
                                                            {localContacts[activeTab].contact_values.length > 0 
                                                                ? `${localContacts[activeTab].contact_values.length} contact${localContacts[activeTab].contact_values.length !== 1 ? 's' : ''}`
                                                                : 'No contacts added yet'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addContactValue(activeTab)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <PlusIcon className="h-4 w-4" />
                                                        Add Contact
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Contact Cards */}
                                            {localContacts[activeTab].contact_values.length > 0 ? (
                                                <div className="grid gap-6">
                                                    {localContacts[activeTab].contact_values.map((contact, valueIndex) => (
                                                        <ContactCard
                                                            key={contact.id}
                                                            contact={contact}
                                                            valueIndex={valueIndex}
                                                            channelType={localContacts[activeTab].channel_type}
                                                            canRemove={true}
                                                            onValueChange={(field, value) => handleValueChange(activeTab, valueIndex, field, value)}
                                                            onSetPrimary={() => setAsPrimary(activeTab, valueIndex)}
                                                            onRemove={() => removeContactValue(activeTab, valueIndex)}
                                                            error={modalErrors[activeTab]?.contact_values?.[valueIndex]}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                                    {localContacts[activeTab].channel_type && (() => {
                                                        const IconComponent = getContactIcon(localContacts[activeTab].channel_type!.value);
                                                        return <IconComponent className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />;
                                                    })()}
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                                        No {getContactLabel(localContacts[activeTab].channel_type)?.toLowerCase()} contacts yet
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                        Add your first {getContactLabel(localContacts[activeTab].channel_type)?.toLowerCase()} contact to get started
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addContactValue(activeTab)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <PlusIcon className="h-4 w-4" />
                                                        Add First Contact
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {localContacts.length} channel{localContacts.length !== 1 ? 's' : ''} • {' '}
                                {localContacts.reduce((acc, ch) => acc + ch.contact_values.length, 0)} total contacts
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSave}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    Save Contacts
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
