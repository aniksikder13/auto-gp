import { Search } from "lucide-react";

interface Props {
    query: string | undefined;
    setQuery: (str:string) => void;
}

export default function SearchBar({setQuery, query}:Props) {
  return (
    <div className="flex items-center border border-gray-500 rounded-full px-3 py-3 sm:py-2 w-full">
      <Search className="text-gray-300 mr-2 w-5 h-5" />
      <input
        type="text"
        placeholder="Type Here"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="bg-transparent outline-none text-white placeholder-gray-400 flex-1 text-sm pr-1.5"
      />
      <button
        type="submit"
        className="text-gray-300 text-xs tracking-widest"
      >
        SEARCH
      </button>
    </div>
  );
}
