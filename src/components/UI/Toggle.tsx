interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      {label && <span>{label}</span>}
      <div
        className={`w-10 h-5 rounded-full transition-colors duration-200 ${
          checked ? "bg-blue-500" : "bg-gray-600"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`h-5 w-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );
}
