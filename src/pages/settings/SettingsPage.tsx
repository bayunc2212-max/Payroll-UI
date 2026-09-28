import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { settingsApi, authApi } from "../../api";
import { PageHeader, PageLoader } from "../../components/ui";

const tabs = ["Company Profile", "BPJS Configuration", "Tax Configuration", "Change Password"];

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  // Company
  const { data: company, isLoading: compLoading } = useQuery({
    queryKey: ["company-profile"],
    queryFn: () => settingsApi.getCompany().then(r => r.data.data),
  });
  const [compForm, setCompForm] = useState<any>({});
  useEffect(() => { if (company) setCompForm(company); }, [company]);

  // BPJS
  const { data: bpjs, isLoading: bpjsLoading } = useQuery({
    queryKey: ["bpjs-config"],
    queryFn: () => settingsApi.getBpjs().then(r => r.data.data),
    enabled: activeTab === 1,
  });
  const [bpjsForm, setBpjsForm] = useState<any>({});
  useEffect(() => { if (bpjs) setBpjsForm(bpjs); }, [bpjs]);

  // Tax
  const { data: tax, isLoading: taxLoading } = useQuery({
    queryKey: ["tax-config"],
    queryFn: () => settingsApi.getTax().then(r => r.data.data),
    enabled: activeTab === 2,
  });
  const [taxForm, setTaxForm] = useState<any>({});
  useEffect(() => { if (tax) setTaxForm(tax); }, [tax]);

  const compMutation = useMutation({
    mutationFn: (d: any) => settingsApi.updateCompany(d),
    onSuccess: () => { toast.success("Company profile saved"); qc.invalidateQueries({ queryKey: ["company-profile"] }); },
  });

  const bpjsMutation = useMutation({
    mutationFn: (d: any) => settingsApi.updateBpjs(d),
    onSuccess: () => { toast.success("BPJS configuration saved"); qc.invalidateQueries({ queryKey: ["bpjs-config"] }); },
  });

  const taxMutation = useMutation({
    mutationFn: (d: any) => settingsApi.updateTax(d),
    onSuccess: () => { toast.success("Tax configuration saved"); qc.invalidateQueries({ queryKey: ["tax-config"] }); },
  });

  // Change Password
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwDirty, setPwDirty] = useState(false);
  const pwMutation = useMutation({
    mutationFn: (d: any) => authApi.changePassword(d),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwDirty(false);
    },
  });

  const handleChangePassword = () => {
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error("All fields are required"); return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters"); return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Password confirmation does not match"); return;
    }
    pwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  const F = ({ label, name, form, setForm, type = "text", placeholder = "" }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        step="any"
        className="input-base"
        placeholder={placeholder}
        value={form[name] || ""}
        onChange={e => setForm((p: any) => ({ ...p, [name]: e.target.value }))}
      />
    </div>
  );

  const Toggle = ({ label, name, form, setForm, hint }: any) => (
    <label className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer">
      <input
        type="checkbox"
        className="w-5 h-5 mt-0.5"
        checked={form[name] !== false}
        onChange={e => setForm((p: any) => ({ ...p, [name]: e.target.checked }))}
      />
      <span>
        <span className="block text-sm font-semibold text-gray-800">{label}</span>
        {hint && <span className="block text-xs text-gray-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Payroll system configuration" />

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === i ? "border-primary-600 text-primary-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Company */}
      {activeTab === 0 && (
        <div className="card p-6 max-w-2xl">
          {compLoading ? <PageLoader /> : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <F label="Company Name" name="name" form={compForm} setForm={setCompForm} />
                <F label="NPWP" name="npwp" form={compForm} setForm={setCompForm} placeholder="01.234.567.8-901.000" />
                <F label="Phone" name="phone" form={compForm} setForm={setCompForm} />
                <F label="Email" name="email" form={compForm} setForm={setCompForm} type="email" />
              </div>
              <F label="Address" name="address" form={compForm} setForm={setCompForm} />
              <div className="flex justify-end">
                <button onClick={() => compMutation.mutate(compForm)} className="btn-primary" disabled={compMutation.isPending}>
                  {compMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BPJS */}
      {activeTab === 1 && (
        <div className="card p-6 max-w-2xl">
          {bpjsLoading ? <PageLoader /> : (
            <div className="space-y-6">
              <Toggle
                label="Enable BPJS Deductions"
                hint="Turn off so all employees receive salary without BPJS deductions (net = gross)."
                name="applyBpjs"
                form={bpjsForm}
                setForm={setBpjsForm}
              />
              {bpjsForm.applyBpjs === false ? (
                <div className="flex justify-end">
                  <button onClick={() => bpjsMutation.mutate(bpjsForm)} className="btn-primary" disabled={bpjsMutation.isPending}>
                    {bpjsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              ) : (
              <>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">BPJS Kesehatan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Employee Contribution (decimal, e.g. 0.01 = 1%)" name="healthEmployeeRate" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="0.01" />
                  <F label="Company Contribution (decimal, e.g. 0.04 = 4%)" name="healthCompanyRate" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="0.04" />
                  <F label="Maximum Salary Limit" name="healthMaxSalary" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="12000000" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">BPJS Ketenagakerjaan - JHT</h3>
                <div className="grid grid-cols-2 gap-4">
                  <F label="JHT Employee (e.g. 0.02 = 2%)" name="jhtEmployeeRate" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="0.02" />
                  <F label="JHT Company (e.g. 0.037 = 3.7%)" name="jhtCompanyRate" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="0.037" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">BPJS Ketenagakerjaan - JP</h3>
                <div className="grid grid-cols-2 gap-4">
                  <F label="JP Employee (e.g. 0.01 = 1%)" name="jpEmployeeRate" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="0.01" />
                  <F label="JP Company (e.g. 0.02 = 2%)" name="jpCompanyRate" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="0.02" />
                  <F label="JP Maximum Salary Limit" name="jpMaxSalary" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="9077600" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">JKK & JKM (borne by company)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <F label="JKK Rate (e.g. 0.0024)" name="jkkRate" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="0.0024" />
                  <F label="JKM Rate (e.g. 0.003)" name="jkmRate" form={bpjsForm} setForm={setBpjsForm} type="number" placeholder="0.003" />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => bpjsMutation.mutate(bpjsForm)} className="btn-primary" disabled={bpjsMutation.isPending}>
                  {bpjsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
              </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tax */}
      {activeTab === 2 && (
        <div className="card p-6 max-w-2xl">
          {taxLoading ? <PageLoader /> : (
            <div className="space-y-6">
              <Toggle
                label="Enable PPh 21 Tax Deductions"
                hint="Turn off so all employees receive salary without tax deductions (net = gross)."
                name="applyTax"
                form={taxForm}
                setForm={setTaxForm}
              />
              {taxForm.applyTax === false ? (
                <div className="flex justify-end">
                  <button onClick={() => taxMutation.mutate(taxForm)} className="btn-primary" disabled={taxMutation.isPending}>
                    {taxMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              ) : (
              <>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Annual PTKP (Rupiah)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["ptkpTk0", "TK/0 - Single, 0 dependents"],
                    ["ptkpTk1", "TK/1 - Single, 1 dependent"],
                    ["ptkpTk2", "TK/2 - Single, 2 dependents"],
                    ["ptkpTk3", "TK/3 - Single, 3 dependents"],
                    ["ptkpK0", "K/0 - Married, 0 dependents"],
                    ["ptkpK1", "K/1 - Married, 1 dependent"],
                    ["ptkpK2", "K/2 - Married, 2 dependents"],
                    ["ptkpK3", "K/3 - Married, 3 dependents"],
                    ["ptkpHb0", "HB/0 - Dual income, 0 dependents"],
                    ["ptkpHb1", "HB/1 - Dual income, 1 dependent"],
                  ].map(([name, label]) => (
                    <F key={name} label={label} name={name} form={taxForm} setForm={setTaxForm} type="number" />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Position Cost</h3>
                <div className="grid grid-cols-2 gap-4">
                  <F label="Position Cost Rate (e.g. 0.05 = 5%)" name="occupationalExpenseRate" form={taxForm} setForm={setTaxForm} type="number" />
                  <F label="Maximum Position Cost/Year" name="occupationalExpenseMax" form={taxForm} setForm={setTaxForm} type="number" />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => taxMutation.mutate(taxForm)} className="btn-primary" disabled={taxMutation.isPending}>
                  {taxMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
              </div>
              </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Change Password */}
      {activeTab === 3 && (
        <div className="card p-6 max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Change Password</h3>
              <p className="text-xs text-gray-500">Use a new password of at least 8 characters</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password *</label>
              <input
                type="password"
                className="input-base"
                autoComplete="current-password"
                value={pwForm.currentPassword}
                onChange={e => { setPwForm(p => ({ ...p, currentPassword: e.target.value })); setPwDirty(true); }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password *</label>
                <input
                  type="password"
                  className="input-base"
                  autoComplete="new-password"
                  value={pwForm.newPassword}
                  onChange={e => { setPwForm(p => ({ ...p, newPassword: e.target.value })); setPwDirty(true); }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password *</label>
                <input
                  type="password"
                  className="input-base"
                  autoComplete="new-password"
                  value={pwForm.confirmPassword}
                  onChange={e => { setPwForm(p => ({ ...p, confirmPassword: e.target.value })); setPwDirty(true); }}
                />
              </div>
            </div>
            {pwDirty && pwForm.newPassword !== pwForm.confirmPassword && (
              <p className="text-xs text-red-500">Password confirmation does not match</p>
            )}
            <div className="flex justify-end pt-2">
              <button onClick={handleChangePassword} className="btn-primary" disabled={pwMutation.isPending}>
                {pwMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
