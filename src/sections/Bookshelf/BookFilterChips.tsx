import type { CSSProperties } from 'react';
import { translate } from '../../i18n';
import { BOOK_FILTERS, formatFilterLabel, getFilterPalette, type BookFilter } from './bookFilter';

export interface BookFilterChipsProps {
  activeFilter: BookFilter;
  bookCountByFilter: ReadonlyMap<BookFilter, number>;
  onFilterChange: (filter: BookFilter) => void;
}

interface FilterChipViewModel {
  filter: BookFilter;
  label: string;
  count: number;
  isActive: boolean;
  style: CSSProperties;
}

export function BookFilterChips({ activeFilter, bookCountByFilter, onFilterChange }: BookFilterChipsProps) {
  const chips: FilterChipViewModel[] = BOOK_FILTERS.map((filter) => {
    const palette = getFilterPalette(filter);
    return {
      filter,
      label: formatFilterLabel(filter),
      count: bookCountByFilter.get(filter) ?? 0,
      isActive: filter === activeFilter,
      style: { '--chip-fill': palette.fill, '--chip-ink': palette.ink },
    };
  });

  return (
    <div className="filter-chips" role="group" aria-label={translate('books.filterLabel')}>
      {chips.map((chip) => (
        <button
          key={chip.filter}
          type="button"
          className={`filter-chips__chip ${chip.isActive ? 'filter-chips__chip--active' : ''}`}
          style={chip.style}
          aria-pressed={chip.isActive}
          onClick={() => onFilterChange(chip.filter)}
        >
          {chip.label}
          <span className="filter-chips__count" aria-hidden="true">
            {chip.count}
          </span>
        </button>
      ))}
    </div>
  );
}
