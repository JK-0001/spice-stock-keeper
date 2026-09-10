import { forwardRef, useId } from 'react';
import { Input } from '@/components/ui/input';

interface AutocompleteInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suggestions?: string[];
}

export const AutocompleteInput = forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ suggestions = [], ...props }, ref) => {
    const listId = useId();
    return (
      <>
        <Input {...props} ref={ref} list={listId} autoComplete="off" />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </>
    );
  }
);
AutocompleteInput.displayName = 'AutocompleteInput';
