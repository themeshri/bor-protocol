import { Search, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SearchBar() {
  return (
    <div className="bg-white p-4 flex items-center justify-between border-b">
      <div className="flex-1 max-w-md relative">
        <Input
          type="text"
          placeholder="Search"
          className="pl-10 pr-4"
        />
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="outline">Log in</Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-6 h-6 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}