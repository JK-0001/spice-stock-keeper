import type { KeyboardEvent } from 'react';

// Keyboard arrow-navigation for data-entry forms. The client asked that
// "left / right / up / down buttons must work on software" so the operator can
// move around a form without reaching for the mouse.
//
// Two handlers share the caret helpers below:
//   • handleGridNavKeyDown — 2-D navigation for the line-item tables in Sale
//     Orders and Builty (row/col coordinates). Self-contained: it stops the
//     event so the linear form handler never also fires for a grid cell.
//   • handleFormNavKeyDown — linear DOM-order navigation for every other stacked
//     form (Items, Parties, Inventory, Outgoing, Cold Storage, and the top /
//     notes fields of the Sale Order & Builty dialogs).

// Text-like inputs we may hijack arrows on. Date/time inputs are deliberately
// excluded — their own arrow keys move between the day/month/year segments, and
// Radio/checkbox/buttons aren't text fields at all.
const EDITABLE_TYPES = new Set([
  '',
  'text',
  'number',
  'search',
  'tel',
  'url',
  'email',
  'password',
]);

function isEditableInput(el: Element | null): el is HTMLInputElement {
  return (
    !!el &&
    el.tagName === 'INPUT' &&
    EDITABLE_TYPES.has((el as HTMLInputElement).type)
  );
}

// selectionStart throws on number/date inputs; treat those as "at the edge" so
// left/right always navigate out of them.
function caretAtStart(input: HTMLInputElement): boolean {
  try {
    return input.selectionStart === 0 && input.selectionEnd === 0;
  } catch {
    return true;
  }
}
function caretAtEnd(input: HTMLInputElement): boolean {
  try {
    return (
      input.selectionStart === input.value.length &&
      input.selectionEnd === input.value.length
    );
  } catch {
    return true;
  }
}

function focusField(el: HTMLElement | null | undefined): boolean {
  if (!el) return false;
  el.focus();
  // Select existing text so typing overwrites, like a spreadsheet cell.
  const asInput = el as HTMLInputElement;
  if (typeof asInput.select === 'function') {
    try {
      asInput.select();
    } catch {
      /* date/number inputs don't support select() everywhere */
    }
  }
  return true;
}

// ── 2-D grid navigation (Sale Order / Builty line-item tables) ───────────────
// Attach to the <tbody>; tag each editable input with data-nav-row / data-nav-col.
//   Up / Down    → same column, prev / next row.
//   Left / Right → prev / next field in the row, only at the caret edge so
//                  in-cell text editing still works.
// The grid owns all four arrows for its cells and stops propagation, so it never
// collides with the linear form handler on the enclosing <form>.
export function handleGridNavKeyDown(
  e: KeyboardEvent<HTMLElement>,
  grid: { rows: number; cols: number }
) {
  const key = e.key;
  if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
    return;
  }

  const input = e.target as HTMLElement | null;
  if (!isEditableInput(input)) return;

  const row = Number(input.getAttribute('data-nav-row'));
  const col = Number(input.getAttribute('data-nav-col'));
  if (Number.isNaN(row) || Number.isNaN(col)) return;

  const container = e.currentTarget as HTMLElement;
  const move = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) return;
    focusField(
      container.querySelector<HTMLInputElement>(
        `input[data-nav-row="${r}"][data-nav-col="${c}"]`
      )
    );
  };

  switch (key) {
    case 'ArrowUp':
      e.preventDefault();
      e.stopPropagation();
      move(row - 1, col);
      break;
    case 'ArrowDown':
      e.preventDefault();
      e.stopPropagation();
      move(row + 1, col);
      break;
    case 'ArrowLeft':
      if (caretAtStart(input)) {
        e.preventDefault();
        e.stopPropagation();
        move(row, col - 1);
      }
      break;
    case 'ArrowRight':
      if (caretAtEnd(input)) {
        e.preventDefault();
        e.stopPropagation();
        move(row, col + 1);
      }
      break;
  }
}

// ── Linear DOM-order navigation (every stacked form) ─────────────────────────
// Attach to the <form>. Moves focus between editable fields in document order:
//   Up / Left(at start)   → previous field
//   Down / Right(at end)  → next field
// Date inputs and Radix selects keep their native arrow behaviour (we only act
// when the focused element is a text-like input); they're still reachable by Tab.
export function handleFormNavKeyDown(e: KeyboardEvent<HTMLElement>) {
  const key = e.key;
  if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
    return;
  }

  const input = e.target as HTMLElement | null;
  if (!isEditableInput(input)) return;
  // Grid cells are handled (and stopped) by handleGridNavKeyDown; ignore them.
  if (input.hasAttribute('data-nav-row')) return;

  const form = e.currentTarget as HTMLElement;
  // Editable fields in document order: text-like inputs + textareas, skipping
  // disabled ones, grid cells, and non-text input types.
  const fields = Array.from(
    form.querySelectorAll<HTMLElement>('input, textarea')
  ).filter((el) => {
    if ((el as HTMLInputElement | HTMLTextAreaElement).disabled) return false;
    if (el.hasAttribute('data-nav-row')) return false;
    if (el.tagName === 'TEXTAREA') return true;
    const t = (el as HTMLInputElement).type;
    // Allow date/number/etc as destinations even though we don't hijack them
    // while focused — just exclude non-field input types.
    return t !== 'hidden' && t !== 'checkbox' && t !== 'radio' &&
      t !== 'button' && t !== 'submit' && t !== 'reset';
  });

  const idx = fields.indexOf(input);
  if (idx === -1) return;

  const go = (target: HTMLElement | undefined) => {
    if (focusField(target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  switch (key) {
    case 'ArrowUp':
      e.preventDefault();
      focusField(fields[idx - 1]);
      break;
    case 'ArrowDown':
      e.preventDefault();
      focusField(fields[idx + 1]);
      break;
    case 'ArrowLeft':
      if (caretAtStart(input)) go(fields[idx - 1]);
      break;
    case 'ArrowRight':
      if (caretAtEnd(input)) go(fields[idx + 1]);
      break;
  }
}
