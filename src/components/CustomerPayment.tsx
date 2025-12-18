import React, { useState } from 'react';
import { CreditCard, ChevronRight, Download, TrendingUp, CheckCircle, DollarSign, FileText, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CustomerPaymentProps {
  setActiveTab: (tab: string) => void;
}

export default function CustomerPayment({ setActiveTab }: CustomerPaymentProps) {
  const [contactsToPurchase, setContactsToPurchase] = useState(100);
  const PRICE_PER_CONTACT = 0.40;
  const totalCost = contactsToPurchase * PRICE_PER_CONTACT;

  const handlePayment = () => {
    // PayPal integration would go here
    alert(`Proceeding to PayPal checkout for $${totalCost.toFixed(2)}`);
  };

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-6 shadow-sm">
        <div>
          <h1 className="text-[#030000]">Make Payment</h1>
          <p className="text-gray-600 mt-1">Pay only for the contacts you download — no subscriptions, no hidden fees</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto">
        {/* Pricing Model Hero */}
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#EF8037] to-[#EB432F] rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#EF8037]/5 to-[#EB432F]/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-orange-100 to-red-100 rounded-full blur-2xl"></div>
            
            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EF8037] to-[#EB432F] shadow-xl mb-4">
                  <DollarSign className="text-white" size={40} />
                </div>
                <h2 className="text-3xl font-semibold text-[#030000] mb-2">Pay-Per-Contact Pricing</h2>
                <p className="text-gray-600 text-lg">Only pay for what you download</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Download className="text-white" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-[#030000] mb-1">$0.40</div>
                  <div className="text-sm text-gray-600">Per Contact</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-[#030000] mb-1">$0</div>
                  <div className="text-sm text-gray-600">Subscription Fee</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Zap className="text-white" size={24} />
                  </div>
                  <div className="text-3xl font-bold text-[#030000] mb-1">$0</div>
                  <div className="text-sm text-gray-600">Hidden Fees</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#030000] mb-2">How It Works</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                        <span>Search and filter contacts using our advanced search tools</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                        <span>Select the contacts you want to download</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                        <span>Pay only $0.40 per contact via PayPal</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                        <span>Download your contacts immediately in XLS format</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Calculator */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Calculator */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-[#030000] mb-6">Calculate Your Payment</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Contacts
                  </label>
                  <Input
                    type="number"
                    min="50"
                    value={contactsToPurchase}
                    onChange={(e: { target: { value: string } }) => setContactsToPurchase(Math.max(50, parseInt(e.target.value) || 50))}
                    className="h-14 text-lg"
                  />
                  <p className="text-sm text-gray-500 mt-2">Minimum 50 contacts per purchase</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Contacts:</span>
                    <span className="font-semibold text-gray-900">{contactsToPurchase.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Price per contact:</span>
                    <span className="font-semibold text-gray-900">${PRICE_PER_CONTACT.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-gray-200"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-[#030000]">Total:</span>
                    <span className="text-2xl font-bold text-[#EF8037]">${totalCost.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  className="w-full h-14 text-lg"
                  style={{ backgroundColor: '#EF8037' }}
                  disabled={contactsToPurchase < 50}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay with PayPal
                </Button>

                <div className="flex items-center justify-center gap-4 pt-4">
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 124 33'%3E%3Cpath fill='%23003087' d='M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z'/%3E%3Cpath fill='%23009cde' d='M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317z'/%3E%3Cpath fill='%23003087' d='M119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z'/%3E%3Cpath fill='%23009cde' d='M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2.087c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z'/%3E%3Cpath fill='%23012169' d='M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z'/%3E%3Cpath fill='%23003087' d='M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z'/%3E%3Cpath fill='%23009cde' d='M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z'/%3E%3C/svg%3E"
                    alt="PayPal"
                    className="h-8"
                  />
                  <div className="text-xs text-gray-500">Secure payment powered by PayPal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-[#030000] mb-4">This Month</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Downloads</span>
                    <span className="font-semibold text-gray-900">1,247</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: '62%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Spent</div>
                  <div className="text-2xl font-bold text-[#030000]">$498.80</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#030000] mb-1">Benefits</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-600"></div>
                      <span>No monthly fees</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-600"></div>
                      <span>Instant downloads</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-600"></div>
                      <span>Cancel anytime</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-600"></div>
                      <span>24/7 support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#030000]">Downloadable Invoice History</h2>
              <p className="text-gray-600 text-sm mt-1">View and download your payment invoices</p>
            </div>
            <Button
              onClick={() => setActiveTab('invoices')}
              variant="outline"
              className="border-orange-200 text-[#EF8037] hover:bg-orange-50"
            >
              View All
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-8 py-4 text-gray-700 text-sm">Date</th>
                  <th className="text-left px-8 py-4 text-gray-700 text-sm">Contacts</th>
                  <th className="text-left px-8 py-4 text-gray-700 text-sm">Status</th>
                  <th className="text-right px-8 py-4 text-gray-700 text-sm">Amount</th>
                  <th className="text-right px-8 py-4 text-gray-700 text-sm">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: 'Oct 12, 2025', contacts: 250, status: 'Paid', amount: '$100.00' },
                  { date: 'Oct 08, 2025', contacts: 180, status: 'Paid', amount: '$72.00' },
                  { date: 'Oct 05, 2025', contacts: 320, status: 'Paid', amount: '$128.00' },
                ].map((transaction, index) => (
                  <tr key={index} className="border-b border-gray-50 hover:bg-orange-50/50 transition-colors">
                    <td className="px-8 py-4 text-gray-600">{transaction.date}</td>
                    <td className="px-8 py-4 text-[#030000]">{transaction.contacts} contacts</td>
                    <td className="px-8 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1.5 w-fit">
                        <CheckCircle size={12} />
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right font-semibold text-[#030000]">{transaction.amount}</td>
                    <td className="px-8 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-[#EF8037] hover:text-[#EB432F]">
                        <FileText size={16} className="mr-1" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
