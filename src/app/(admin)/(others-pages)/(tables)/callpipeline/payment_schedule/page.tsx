"use client";
import React, { useState } from "react";
import LoadingOverlay from "@/components/ui/loading/LoadingOverlay";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";

export default function PaymentSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get property price from URL params (passed from call pipeline success)
  const propertyPrice = searchParams.get('propertyPrice') || '0';
  const callPipelineId = searchParams.get('callPipelineId') || '';
  
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    { name: "Payment Schedule" },
  ];

  const [formData, setFormData] = useState({
    loanAmount: Number(propertyPrice),
    downPayment: 0,
    startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    tenureMonths: 12,
    interestRate: 5.0,
    paymentFrequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Calculate derived values
  const finalLoanAmount = formData.loanAmount - formData.downPayment;
  const downPaymentPercentage = formData.loanAmount > 0 ? (formData.downPayment / formData.loanAmount * 100) : 0;

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (formData.loanAmount <= 0) {
      newErrors.loanAmount = "Loan amount must be greater than 0.";
    }

    if (formData.downPayment < 0) {
      newErrors.downPayment = "Down payment cannot be negative.";
    }

    if (formData.downPayment >= formData.loanAmount) {
      newErrors.downPayment = "Down payment must be less than loan amount.";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required.";
    }

    if (formData.tenureMonths <= 0 || formData.tenureMonths > 360) {
      newErrors.tenureMonths = "Tenure must be between 1 and 360 months.";
    }

    if (formData.interestRate < 0 || formData.interestRate > 100) {
      newErrors.interestRate = "Interest rate must be between 0 and 100.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;

    setIsCalculating(true);

    try {
      // Prepare the loan calculation parameters
      const params = new URLSearchParams({
        loanAmount: String(finalLoanAmount),
        tenureMonths: String(formData.tenureMonths),
        interestRate: String(formData.interestRate),
        startDate: formData.startDate,
        paymentFrequency: formData.paymentFrequency,
        originalLoanAmount: String(formData.loanAmount),
        downPayment: String(formData.downPayment),
        callPipelineId: callPipelineId
      });

      // Navigate to the calculation results page
      router.push(`/callpipeline/payment_schedule/calculated?${params.toString()}`);
    } catch (error) {
      console.error('Error generating payment schedule:', error);
      alert('Failed to generate payment schedule. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCancel = () => {
    router.push("/callpipeline");
  };

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      <LoadingOverlay isLoading={isCalculating} />
      <div className="space-y-6">
        {/* Payment Schedule Input Form */}
        <ComponentCard title="Loan Payment Schedule Calculator">
          <div className="space-y-6">
            {/* Loan Amount Section */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-2">
              <div>
                <Label htmlFor="loanAmount">Property Price / Loan Amount *</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  placeholder="Enter loan amount"
                  value={formData.loanAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange("loanAmount", Number(e.target.value))}
                />
                {errors.loanAmount && (
                  <p className="text-sm text-red-500 mt-1">{errors.loanAmount}</p>
                )}
              </div>

              <div>
                <Label htmlFor="downPayment">Down Payment</Label>
                <Input
                  id="downPayment"
                  type="number"
                  placeholder="Enter down payment amount"
                  value={formData.downPayment}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange("downPayment", Number(e.target.value))}
                />
                {formData.downPayment > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {downPaymentPercentage.toFixed(1)}% of loan amount
                  </p>
                )}
                {errors.downPayment && (
                  <p className="text-sm text-red-500 mt-1">{errors.downPayment}</p>
                )}
              </div>
            </div>

            {/* Derived Loan Amount Display */}
            {formData.downPayment > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Final Loan Amount:
                  </span>
                  <span className="text-lg font-bold text-blue-900 dark:text-blue-200">
                    ${finalLoanAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Loan Terms Section */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">
              <div>
                <Label htmlFor="startDate">Loan Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange("startDate", e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="tenureMonths">Tenure (Months) *</Label>
                <Input
                  id="tenureMonths"
                  type="number"
                  placeholder="e.g., 12, 24, 36"
                  value={formData.tenureMonths}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange("tenureMonths", Number(e.target.value))}
                />
                {formData.tenureMonths > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.floor(formData.tenureMonths / 12)} years {formData.tenureMonths % 12} months
                  </p>
                )}
                {errors.tenureMonths && (
                  <p className="text-sm text-red-500 mt-1">{errors.tenureMonths}</p>
                )}
              </div>

              <div>
                <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step={0.1}
                  placeholder="e.g., 5.0, 7.5"
                  value={formData.interestRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    handleChange("interestRate", Number(e.target.value))}
                />
                {errors.interestRate && (
                  <p className="text-sm text-red-500 mt-1">{errors.interestRate}</p>
                )}
              </div>
            </div>

            {/* Payment Frequency Section */}
            <div>
              <Label htmlFor="paymentFrequency">Payment Frequency</Label>
              <select
                id="paymentFrequency"
                value={formData.paymentFrequency}
                onChange={(e) => handleChange("paymentFrequency", e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Info Section */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-1">
                    About Loan Calculations
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The payment schedule will be calculated using standard amortization formulas. 
                    Monthly payments include both principal and interest components.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInfoModal(true)}
                    className="p-0 mt-2 text-blue-600 dark:text-blue-400"
                  >
                    View calculation details →
                  </Button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isCalculating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleGenerate}
                disabled={isCalculating}
              >
                {isCalculating ? "Calculating..." : "Generate Payment Schedule"}
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Information Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        className="max-w-lg p-6"
      >
        <div>
          <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
            Loan Calculation Method
          </h3>
          
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Formula Used:</h4>
              <p>Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]</p>
              <ul className="mt-2 ml-4 space-y-1">
                <li>• P = Principal loan amount (after down payment)</li>
                <li>• r = Monthly interest rate (annual rate / 12)</li>
                <li>• n = Total number of payments (tenure in months)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-2">Payment Breakdown:</h4>
              <ul className="space-y-1">
                <li>• Each payment consists of principal and interest</li>
                <li>• Early payments have more interest, later payments have more principal</li>
                <li>• Total interest decreases over the loan term</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              variant="primary"
              onClick={() => setShowInfoModal(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
