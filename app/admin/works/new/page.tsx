import { requireAdminPage } from "@/lib/auth/require-admin";
import { WorkForm } from "../work-form";
import { createWork } from "../_actions/save-work";

export default async function NewWorkPage() {
  await requireAdminPage();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-xl font-bold text-white">Work 新規登録</h1>
      <WorkForm submitLabel="登録する" onSubmitAction={createWork} />
    </div>
  );
}
