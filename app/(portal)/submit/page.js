import ComplaintForm from "./complaint-form";

export const metadata = {
  title: "Submit a Complaint",
};

export default function SubmitComplaintPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Submit a Complaint
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Please give us as much detail as you can so we can help quickly.
          Fields marked with an asterisk are required.
        </p>
      </div>

      <ComplaintForm />
    </div>
  );
}
