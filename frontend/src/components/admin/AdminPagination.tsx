interface AdminPaginationProps {
  page: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({
  page,
  total,
  totalPages,
  onPageChange,
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-summary">
        Toplam {total} kayit, sayfa {page} / {totalPages}
      </span>

      <div className="admin-pagination-actions">
        <button
          className="admin-ghost-button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Onceki
        </button>
        <button
          className="admin-ghost-button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
