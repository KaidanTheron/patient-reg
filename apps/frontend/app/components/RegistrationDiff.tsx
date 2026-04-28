import type {
  ContactDetailsPayload,
  MedicalAidDetailsPayload,
  MedicalHistoryPayload,
  PatientProfilePayload,
  PersonalInformationPayload,
} from "~/graphql/graphql";
import {
  buildRegistrationDiff,
  type RegistrationDiffStatus,
} from "~/domain/registration/diff";

type RegistrationDocumentShape = {
  contactDetails?: ContactDetailsPayload | null;
  personalInformation?: PersonalInformationPayload | null;
  medicalAidDetails?: MedicalAidDetailsPayload | null;
  medicalHistory?: MedicalHistoryPayload | null;
};

export function RegistrationDiff({
  current,
  submitted,
}: {
  current?: PatientProfilePayload | null;
  submitted?: RegistrationDocumentShape | null;
}) {
  const rows = buildRegistrationDiff(current, submitted);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full border-collapse bg-white text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-3 py-2 font-semibold">Field</th>
            <th className="px-3 py-2 font-semibold">Change</th>
            <th className="px-3 py-2 font-semibold">Current record</th>
            <th className="px-3 py-2 font-semibold">Submitted document</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className={row.changed ? "bg-amber-50" : "bg-white"}
            >
              <td className="border-t border-slate-200 px-3 py-2 font-medium text-slate-700">
                {row.label}
              </td>
              <td className="border-t border-slate-200 px-3 py-2">
                <DiffStatusTag status={row.status} />
              </td>
              <td className="border-t border-slate-200 px-3 py-2 text-slate-700">
                {row.currentDisplay}
              </td>
              <td className="border-t border-slate-200 px-3 py-2 text-slate-950">
                {row.submittedDisplay}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DiffStatusTag({ status }: { status: RegistrationDiffStatus }) {
  const styles: Record<RegistrationDiffStatus, string> = {
    new: "bg-green-100 text-green-800",
    updated: "bg-amber-100 text-amber-800",
    missing: "bg-red-100 text-red-800",
    unchanged: "bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex min-w-20 justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
