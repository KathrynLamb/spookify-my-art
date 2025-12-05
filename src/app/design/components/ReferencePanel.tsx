'use client';

type ReferencePanelProps = {
  referencesNeeded?: string[];  // can be undefined, null, [], or ["label"]
  onUpload: (label: string, file: File) => void;
};

export function ReferencePanel({ referencesNeeded, onUpload }: ReferencePanelProps) {
  // if the model isn’t asking for anything, hide the panel entirely
  if (!Array.isArray(referencesNeeded) || referencesNeeded.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-white/70">
        I’ll need a few photos to get this right:
      </div>

      {referencesNeeded.map((label) => (
        <label
          key={label}
          className="block rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm cursor-pointer hover:border-white/40"
        >
          <div className="text-white/80 mb-1">Upload: {label}</div>
          <div className="text-xs text-white/40">Click to upload</div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onUpload(label, file);
                e.target.value = "";
              }
            }}
          />
        </label>
      ))}
    </div>
  );
}

