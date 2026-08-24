"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function SubmissionCard({ submission, onView, onApprove, onReject, busyId }) {
  const { isStaff } = useAuth();
  const statusStyles = {
    pending: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
    approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    rejected: "border-accent-red/40 bg-accent-red/10 text-accent-red",
  };
  const statusLabels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

  return (
    <div className="card-gradient-border p-5 transition hover:shadow-glow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link
            href={`/demon/${submission.demon_id}`}
            className="font-display font-semibold text-white hover:text-accent-red"
          >
            #{submission.demon_position} {submission.demon_name}
          </Link>
          <p className="text-sm text-zinc-400">
            por <span className="text-zinc-200">{submission.submitter_username}</span>
          </p>
          <p className="text-xs text-zinc-500">
            Enviado el {new Date(submission.created_at).toLocaleString()}
            {submission.fps ? ` · ${submission.fps} FPS` : ""}
            {submission.refresh_rate ? ` · ${submission.refresh_rate}Hz` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`card-gradient-border rounded-full px-3 py-1 text-xs font-medium ${statusStyles[submission.status]}`}>
            {statusLabels[submission.status]}
          </span>
          <a
            href={submission.video_url}
            target="_blank"
            rel="noreferrer"
            className="card-gradient-border rounded-lg px-3 py-1.5 text-sm text-accent-red hover:opacity-90"
          >
            Ver vídeo ↗
          </a>
        </div>
      </div>

      {submission.comment && <p className="mt-2 text-sm text-zinc-400">"{submission.comment}"</p>}

      {isStaff && submission.status === "pending" && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            placeholder="Motivo de rechazo (opcional)"
            defaultValue={submission.rejection_reason || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") onReject?.(submission, e.target.value);
            }}
            className="input-gradient-border flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-accent-purple"
            id={`reject-${submission.id}`}
          />
          <div className="flex gap-2">
            <button
              disabled={busyId === submission.id}
              onClick={() => onApprove?.(submission)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              disabled={busyId === submission.id}
              onClick={() => {
                const input = document.getElementById(`reject-${submission.id}`);
                onReject?.(submission, input?.value || "");
              }}
              className="rounded-xl bg-accent-red px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {submission.rejection_reason && submission.status === "rejected" && (
        <p className="mt-2 text-xs text-zinc-500">Motivo: {submission.rejection_reason}</p>
      )}
    </div>
  );
}
