import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Asset } from '../types/finance';
import { formatBDT, formatDhakaDate, getCurrentDhakaDateString } from '../i18n/formatters';
import { Building, Plus, X, Gem, Car, Laptop, Briefcase, Landmark } from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const { assets, accounts, createAsset, createTransaction } = useFinance();
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sellingAsset, setSellingAsset] = useState<Asset | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Asset['category']>('gold');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => getCurrentDhakaDateString());
  const [linkedAccountId, setLinkedAccountId] = useState(accounts[0]?.id || '');
  const [description, setDescription] = useState('');

  // Sale form states
  const [salePrice, setSalePrice] = useState('');
  const [saleAccountId, setSaleAccountId] = useState(accounts[0]?.id || '');

  const activeAssets = assets.filter((a) => !a.deletedAt && a.status === 'active');
  const totalAssetValue = activeAssets.reduce((sum, a) => sum + (a.currentEstimatedValue || a.purchasePrice), 0);

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(purchasePrice);
    if (isNaN(price) || price <= 0) return;

    try {
      await createAsset({
        name: name.trim(),
        category,
        purchaseDate,
        purchasePrice: Math.round(price),
        currentEstimatedValue: parseFloat(currentValue) || Math.round(price),
        linkedAccountId: linkedAccountId || undefined,
        description,
        status: 'active',
      });

      setIsModalOpen(false);
      setName('');
      setPurchasePrice('');
      setCurrentValue('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Failed to record asset');
    }
  };

  const handleSellAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingAsset) return;
    const price = parseFloat(salePrice);
    if (isNaN(price) || price <= 0) return;

    try {
      // 1. Post asset_sale transaction (adds money to receiving account)
      await createTransaction({
        type: 'asset_sale',
        amount: Math.round(price),
        accountId: saleAccountId,
        relatedAssetId: sellingAsset.id,
        occurredAt: getCurrentDhakaDateString(),
        timezone: 'Asia/Dhaka',
        description: `Sold Asset: ${sellingAsset.name}`,
        paymentMethod: 'Account',
        status: 'posted',
      });

      // 2. Mark asset as sold
      // (in production dbService, update asset status)
      setSellingAsset(null);
      setSalePrice('');
    } catch (err: any) {
      alert(err.message || 'Failed to record sale');
    }
  };

  const getAssetCategoryIcon = (cat: Asset['category']) => {
    switch (cat) {
      case 'gold':
        return <Gem className="w-5 h-5 text-amber-500" />;
      case 'vehicle':
        return <Car className="w-5 h-5 text-blue-500" />;
      case 'electronics':
        return <Laptop className="w-5 h-5 text-indigo-500" />;
      case 'business':
        return <Briefcase className="w-5 h-5 text-emerald-500" />;
      default:
        return <Landmark className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('navAssets')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gold, Vehicles, Real Estate, Land, Electronics & Valuable Properties
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-md shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addAsset')}</span>
        </button>
      </div>

      {/* Overview Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
            Total Physical Asset Valuation
          </span>
          <div className="text-3xl font-extrabold mt-1">
            {formatBDT(totalAssetValue)}
          </div>
        </div>
        <div className="text-xs text-cyan-100 max-w-xs">
          Asset purchases reduce account balances and increase asset values without double-counting as an operating expense.
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeAssets.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            No physical assets recorded yet. Click Add Asset to track property, gold, or vehicles!
          </div>
        ) : (
          activeAssets.map((asset) => (
            <div
              key={asset.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                    {getAssetCategoryIcon(asset.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {asset.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 capitalize">
                      {asset.category} • Purchased {formatDhakaDate(asset.purchaseDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Valuation:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatBDT(asset.currentEstimatedValue || asset.purchasePrice)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Purchase Price:</span>
                  <span>{formatBDT(asset.purchasePrice)}</span>
                </div>
              </div>

              {asset.description && (
                <p className="text-xs text-slate-500">{asset.description}</p>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSellingAsset(asset);
                    setSalePrice((asset.currentEstimatedValue || asset.purchasePrice).toString());
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Sell Asset
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('addAsset')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('assetName')} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 22K Gold Chain, Toyota Car, Purbachal Plot"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {t('assetCategory')} *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="gold">Gold & Jewelry</option>
                  <option value="land">Land Property</option>
                  <option value="building">House / Flat / Building</option>
                  <option value="vehicle">Vehicle (Car / Bike)</option>
                  <option value="electronics">Electronics & Tech</option>
                  <option value="business">Business Ownership</option>
                  <option value="other">Other Asset</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('purchasePrice')} (৳) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="20000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {t('currentValue')} (৳)
                  </label>
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    placeholder="20000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Paid From Account (Optional)
                  </label>
                  <select
                    value={linkedAccountId}
                    onChange={(e) => setLinkedAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="">None / External</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-md"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Asset Modal */}
      {sellingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sell Asset: {sellingAsset.name}
              </h3>
              <button onClick={() => setSellingAsset(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSellAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Sale Realized Amount (৳) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Deposit Funds To Account *
                </label>
                <select
                  required
                  value={saleAccountId}
                  onChange={(e) => setSaleAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSellingAsset(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-md"
                >
                  Confirm Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
