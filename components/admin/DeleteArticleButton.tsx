"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTrashCan } from "react-icons/fa6";

type DeleteArticleButtonProps = {
  articleId: string;
  title: string;
};

export function DeleteArticleButton({ articleId, title }: DeleteArticleButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteArticle() {
    const confirmed = window.confirm(`Delete "${title}"?`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={deleteArticle}
      disabled={isDeleting}
      title="Delete article"
      className="inline-grid size-9 place-items-center border border-red-200 text-red-700 transition hover:border-red-700 hover:bg-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FaTrashCan aria-hidden="true" />
    </button>
  );
}
