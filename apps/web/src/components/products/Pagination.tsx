'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="btn btn-secondary px-3 py-2 disabled:opacity-50"
      >
        &lt;
      </button>

      {/* Page Numbers */}
      {pages.map((page) => {
        const isCurrentPage = page === currentPage;
        const isNearCurrent = Math.abs(page - currentPage) <= 2;
        const isFirstOrLast = page === 1 || page === totalPages;

        if (!isNearCurrent && !isFirstOrLast) {
          if (pages[page - 2] === page - 1) {
            return (
              <span key={page} className="px-2 text-text-secondary">
                ...
              </span>
            );
          }
          return null;
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              w-10 h-10 rounded-md font-medium transition-all
              ${isCurrentPage
                ? 'bg-accent text-white'
                : 'bg-bg-surface text-text-primary hover:bg-bg-card'
              }
            `}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="btn btn-secondary px-3 py-2 disabled:opacity-50"
      >
        &gt;
      </button>
    </div>
  );
}
