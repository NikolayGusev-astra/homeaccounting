import type { Visibility } from '@/types/family';

interface VisibilityToggleProps {
  visibility: Visibility;
  onChange: (visibility: Visibility) => void;
  disabled?: boolean;
}

export function VisibilityToggle({ visibility, onChange, disabled }: VisibilityToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Видимость:</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange('personal')}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            visibility === 'personal'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Личное
        </button>
        <button
          type="button"
          onClick={() => onChange('family')}
          disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            visibility === 'family'
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/50'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Семейное
        </button>
      </div>
    </div>
  );
}
