"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { SearchDialog } from "./SearchDialog";

export function SearchButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 px-4 py-3 text-sm font-semibold transition flex items-center gap-2 text-zinc-300 hover:text-white"
      >
        <Search className="w-4 h-4" />
        Search Aptitude
      </button>
      <SearchDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
