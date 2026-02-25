"use client";

import { useFormStatus } from "react-dom";

type Props = {
  action: (formData: FormData) => Promise<void>;
  initial?: {
    slug: string;
    redirectUrl: string;
    status: string;
    metaTitle: string | null;
    metaDescription: string | null;
    ogImage: string | null;
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
    >
      {pending ? "Salvando…" : "Salvar"}
    </button>
  );
}

export default function CampaignForm({ action, initial }: Props) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Slug (único)</label>
        <input
          name="slug"
          defaultValue={initial?.slug}
          required
          placeholder="minha-campanha"
          className="w-full rounded border border-gray-300 px-3 py-2 font-mono text-gray-900"
          pattern="[a-z0-9-]+"
          title="Apenas letras minúsculas, números e hífens"
        />
        <p className="mt-1 text-xs text-gray-500">
          URL: /r/[slug]
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">URL de redirecionamento</label>
        <input
          name="redirectUrl"
          type="url"
          defaultValue={initial?.redirectUrl}
          required
          placeholder="https://..."
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
        <select
          name="status"
          defaultValue={initial?.status ?? "OPEN"}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
        >
          <option value="OPEN">Aberta (redireciona para a URL)</option>
          <option value="CLOSED">Fechada (redireciona para Google, mas registra acesso)</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Meta título (opcional)</label>
        <input
          name="metaTitle"
          defaultValue={initial?.metaTitle ?? ""}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Meta descrição (opcional)</label>
        <textarea
          name="metaDescription"
          defaultValue={initial?.metaDescription ?? ""}
          rows={2}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">OG Image URL (opcional)</label>
        <input
          name="ogImage"
          type="url"
          defaultValue={initial?.ogImage ?? ""}
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
        />
      </div>
      <div className="flex gap-2">
        <SubmitButton />
        <a
          href="/admin/campaigns"
          className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}
