import React, { useState } from "react";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

export function Accordion({ title, children }: AccordionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-700 rounded bg-gray-800">
      <button
        className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600"
        onClick={() => setOpen(!open)}
      >
        {title}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}
