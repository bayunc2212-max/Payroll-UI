import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { employeeApi, departmentApi, positionApi } from "../../api";
import { PageLoader } from "../../components/ui";
import { TAX_STATUS_OPTIONS } from "../../utils";

export default function EmployeeFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const { data: emp, isLoading: empLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeeApi.getById(id!).then((r) => r.data.data),
    enabled: isEdit,
  });

  const { data: deptData } = useQuery({
    queryKey: ["departments", "all"],
    queryFn: () => departmentApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const { data: posData } = useQuery({
    queryKey: ["positions", "all"],
    queryFn: () => positionApi.getAll({ limit: 100 }).then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<any>();

  useEffect(() => {
    if (emp) reset(emp);
  }, [emp]);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? employeeApi.update(id!, data)
      : employeeApi.create(data),
    onSuccess: (res) => {
      toast.success(isEdit ? "Employee data updated successfully" : "Employee added successfully");
      qc.invalidateQueries({ queryKey: ["employees"] });
      navigate(`/employees/${isEdit ? id : res.data.data.id}`);
    },
  });

  if (isEdit && empLoading) return <PageLoader />;

  const onSubmit = (data: any) => mutation.mutate(data);

  const Field = ({ label, required, error, children }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={isEdit ? `/employees/${id}` : "/employees"} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold">{isEdit ? "Edit Employee" : "Add New Employee"}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identitas */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Employee Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="NIK" required error={errors.nik?.message}>
              <input {...register("nik", { required: "NIK is required" })} className="input-base" placeholder="3271234567890001" />
            </Field>
            <Field label="Employee No." required error={errors.employeeNumber?.message}>
              <input {...register("employeeNumber", { required: "Employee no. is required" })} className="input-base" placeholder="EMP001" />
            </Field>
            <Field label="Full Name" required error={errors.name?.message}>
              <input {...register("name", { required: "Name is required" })} className="input-base" placeholder="Employee full name" />
            </Field>
            <Field label="Gender">
              <select {...register("gender")} className="input-base">
                <option value="">-- Select --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Birth Place">
              <input {...register("birthPlace")} className="input-base" placeholder="Jakarta" />
            </Field>
            <Field label="Birth Date">
              <input {...register("birthDate")} type="date" className="input-base" />
            </Field>
            <Field label="Phone">
              <input {...register("phone")} className="input-base" placeholder="081234567890" />
            </Field>
            <Field label="Email">
              <input {...register("email")} type="email" className="input-base" placeholder="email@example.com" />
            </Field>
            <Field label="Address">
              <input {...register("address")} className="input-base" placeholder="Full address" />
            </Field>
          </div>
        </div>

        {/* Kepegawaian */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Employment Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Department">
              <select {...register("departmentId")} className="input-base">
                <option value="">-- Select Department --</option>
                {deptData?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Position">
              <select {...register("positionId")} className="input-base">
                <option value="">-- Select Position --</option>
                {posData?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Join Date" required error={errors.joinDate?.message}>
              <input {...register("joinDate", { required: "Join date is required" })} type="date" className="input-base" />
            </Field>
            <Field label="Marital Status">
              <select {...register("maritalStatus")} className="input-base">
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </Field>
            <Field label="Number of Dependents">
              <input {...register("dependents")} type="number" min="0" max="3" className="input-base" defaultValue={0} />
            </Field>
            <Field label="Tax Status (PTKP)">
              <select {...register("taxStatus")} className="input-base">
                {TAX_STATUS_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.value} - {t.label.split(' - ')[1]}</option>)}
              </select>
            </Field>
            <Field label="NPWP">
              <input {...register("npwp")} className="input-base" placeholder="12.345.678.9-001.000" />
            </Field>
          </div>
        </div>

        {/* Gaji */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Salary Components</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Base Salary" required error={errors.basicSalary?.message}>
              <input {...register("basicSalary", { required: "Base salary is required" })} type="number" className="input-base" placeholder="5000000" />
            </Field>
            <Field label="Transport Allowance">
              <input {...register("allowanceTransport")} type="number" className="input-base" placeholder="0" defaultValue={0} />
            </Field>
            <Field label="Meal Allowance">
              <input {...register("allowanceMeal")} type="number" className="input-base" placeholder="0" defaultValue={0} />
            </Field>
            <Field label="Position Allowance">
              <input {...register("allowancePosition")} type="number" className="input-base" placeholder="0" defaultValue={0} />
            </Field>
            <Field label="Other Allowances">
              <input {...register("allowanceOther")} type="number" className="input-base" placeholder="0" defaultValue={0} />
            </Field>
          </div>
        </div>

        {/* BPJS */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">BPJS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input {...register("isBpjsHealth")} type="checkbox" id="bpjsHealth" className="w-4 h-4" defaultChecked />
              <label htmlFor="bpjsHealth" className="text-sm text-gray-700">Enroll in BPJS Kesehatan</label>
            </div>
            <Field label="BPJS Kesehatan No.">
              <input {...register("bpjsHealthNumber")} className="input-base" />
            </Field>
            <div className="flex items-center gap-3">
              <input {...register("isBpjsEmployment")} type="checkbox" id="bpjsEmploy" className="w-4 h-4" defaultChecked />
              <label htmlFor="bpjsEmploy" className="text-sm text-gray-700">Enroll in BPJS Ketenagakerjaan</label>
            </div>
            <Field label="BPJS Ketenagakerjaan No.">
              <input {...register("bpjsEmploymentNumber")} className="input-base" />
            </Field>
          </div>
        </div>

        {/* Bank */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Bank Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Bank Name">
              <input {...register("bankName")} className="input-base" placeholder="BCA, Mandiri, BNI, etc." />
            </Field>
            <Field label="Account Number">
              <input {...register("bankAccountNumber")} className="input-base" placeholder="1234567890" />
            </Field>
            <Field label="Account Holder Name">
              <input {...register("bankAccountName")} className="input-base" />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link to={isEdit ? `/employees/${id}` : "/employees"} className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={isSubmitting || mutation.isPending}>
            {(isSubmitting || mutation.isPending) ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (isEdit ? "Save Changes" : "Add Employee")}
          </button>
        </div>
      </form>
    </div>
  );
}
