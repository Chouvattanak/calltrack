"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

interface PaymentScheduleItem {
  paymentNumber: number;
  paymentDate: string;
  monthlyPayment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

interface LoanSummary {
  originalLoanAmount: number;
  downPayment: number;
  finalLoanAmount: number;
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  totalAmountPaid: number;
  interestRate: number;
  tenureMonths: number;
  startDate: string;
  endDate: string;
}

export default function CalculatedPaymentSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Call Pipeline", href: "/callpipeline" },
    { name: "Payment Schedule", href: "/callpipeline/payment_schedule" },
    { name: "Calculated Schedule" },
  ];

  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [loanSummary, setLoanSummary] = useState<LoanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show 12 months per page

  useEffect(() => {
    generatePaymentSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generatePaymentSchedule = () => {
    try {
      // Get parameters from URL
      const loanAmount = Number(searchParams.get('loanAmount') || '0');
      const tenureMonths = Number(searchParams.get('tenureMonths') || '12');
      const interestRate = Number(searchParams.get('interestRate') || '5');
      const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
      const originalLoanAmount = Number(searchParams.get('originalLoanAmount') || loanAmount);
      const downPayment = Number(searchParams.get('downPayment') || '0');

      if (loanAmount <= 0 || tenureMonths <= 0 || interestRate < 0) {
        throw new Error('Invalid loan parameters');
      }

      // Calculate monthly interest rate
      const monthlyInterestRate = interestRate / 100 / 12;
      
      // Calculate monthly payment using amortization formula
      let monthlyPayment: number;
      if (interestRate === 0) {
        // If no interest, just divide principal by number of payments
        monthlyPayment = loanAmount / tenureMonths;
      } else {
        // Standard amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
        const factor = Math.pow(1 + monthlyInterestRate, tenureMonths);
        monthlyPayment = loanAmount * (monthlyInterestRate * factor) / (factor - 1);
      }

      // Generate payment schedule
      const schedule: PaymentScheduleItem[] = [];
      let remainingBalance = loanAmount;
      let cumulativeInterest = 0;
      let cumulativePrincipal = 0;

      for (let i = 1; i <= tenureMonths; i++) {
        // Calculate interest payment for this period
        const interestPayment = remainingBalance * monthlyInterestRate;
        
        // Principal payment is monthly payment minus interest
        let principalPayment = monthlyPayment - interestPayment;
        
        // Adjust for final payment to avoid rounding issues
        if (i === tenureMonths) {
          principalPayment = remainingBalance;
          monthlyPayment = principalPayment + interestPayment;
        }

        // Update balances
        remainingBalance -= principalPayment;
        cumulativeInterest += interestPayment;
        cumulativePrincipal += principalPayment;

        // Calculate payment date
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + i);

        schedule.push({
          paymentNumber: i,
          paymentDate: paymentDate.toISOString().split('T')[0],
          monthlyPayment: Math.round(monthlyPayment * 100) / 100,
          principalPayment: Math.round(principalPayment * 100) / 100,
          interestPayment: Math.round(interestPayment * 100) / 100,
          remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100),
          cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
          cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
        });
      }

      // Calculate end date
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + tenureMonths);

      // Create loan summary
      const summary: LoanSummary = {
        originalLoanAmount,
        downPayment,
        finalLoanAmount: loanAmount,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalPayments: tenureMonths,
        totalInterest: Math.round(cumulativeInterest * 100) / 100,
        totalAmountPaid: Math.round((cumulativeInterest + loanAmount) * 100) / 100,
        interestRate,
        tenureMonths,
        startDate,
        endDate: endDate.toISOString().split('T')[0],
      };

      setPaymentSchedule(schedule);
      setLoanSummary(summary);
    } catch (error) {
      console.error('Error generating payment schedule:', error);
      alert('Error generating payment schedule. Please check your inputs and try again.');
      router.push('/callpipeline/payment_schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Pagination logic
  const totalPages = Math.ceil(paymentSchedule.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = paymentSchedule.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    router.push('/callpipeline/payment_schedule');
  };

  const handleSaveAndReturn = () => {
    // In the future, this will save to database via API
    // For now, we'll just show a success message and return to call pipeline
    alert('Payment schedule generated successfully! (Currently stored in memory)');
    router.push('/callpipeline');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Calculating payment schedule...</p>
        </div>
      </div>
    );
  }

  if (!loanSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">Error loading payment schedule.</p>
          <Button variant="primary" onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb crumbs={breadcrumbs} />
      
      <div className="space-y-6">
        {/* Loan Summary Card */}
        <ComponentCard title="Loan Summary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                Loan Amount
              </h4>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {formatCurrency(loanSummary.finalLoanAmount)}
              </p>
              {loanSummary.downPayment > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  After ${loanSummary.downPayment.toLocaleString()} down payment
                </p>
              )}
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                Monthly Payment
              </h4>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                {formatCurrency(loanSummary.monthlyPayment)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                for {loanSummary.tenureMonths} months
              </p>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">
                Total Interest
              </h4>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">
                {formatCurrency(loanSummary.totalInterest)}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {loanSummary.interestRate}% annual rate
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
                Total Amount
              </h4>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                {formatCurrency(loanSummary.totalAmountPaid)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Principal + Interest
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSummaryModal(true)}
            >
              View Details
            </Button>
          </div>
        </ComponentCard>

        {/* Payment Schedule Table */}
        <ComponentCard title={`Payment Schedule (${paymentSchedule.length} payments)`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Monthly Payment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Principal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Interest
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Remaining Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {currentPageData.map((payment) => (
                  <tr key={payment.paymentNumber} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {payment.paymentNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(payment.monthlyPayment)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400">
                      {formatCurrency(payment.principalPayment)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400">
                      {formatCurrency(payment.interestPayment)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                      {formatCurrency(payment.remainingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to {Math.min(endIndex, paymentSchedule.length)} of {paymentSchedule.length} payments
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(i + 1)}
                    className="min-w-[40px]"
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
            >
              ← Back to Calculator
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // Export to CSV functionality can be added here
                  alert('CSV export feature coming soon!');
                }}
              >
                Export CSV
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAndReturn}
              >
                Save & Return to Pipeline
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Loan Details Modal */}
      <Modal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        className="max-w-2xl p-6"
      >
        <div>
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white">
            Detailed Loan Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loan Details */}
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-3">Loan Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Original Property Price:</span>
                  <span className="font-medium">{formatCurrency(loanSummary.originalLoanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Down Payment:</span>
                  <span className="font-medium">{formatCurrency(loanSummary.downPayment)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Loan Amount:</span>
                  <span className="font-bold">{formatCurrency(loanSummary.finalLoanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                  <span className="font-medium">{loanSummary.interestRate}% annual</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Loan Term:</span>
                  <span className="font-medium">{loanSummary.tenureMonths} months</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h4 className="font-medium text-gray-800 dark:text-white mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                  <span className="font-medium">{formatCurrency(loanSummary.monthlyPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Interest:</span>
                  <span className="font-medium">{formatCurrency(loanSummary.totalInterest)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 dark:text-gray-400">Total Amount Paid:</span>
                  <span className="font-bold">{formatCurrency(loanSummary.totalAmountPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                  <span className="font-medium">{formatDate(loanSummary.startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                  <span className="font-medium">{formatDate(loanSummary.endDate)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              variant="primary"
              onClick={() => setShowSummaryModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
