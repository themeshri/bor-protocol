import { ReactNode } from 'react';

interface LinkProps {
  icon: ReactNode;
  text: string;
  active?: boolean;
}

export function Link({ icon, text, active }: LinkProps) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
        active ? 'text-[#fe2c55]' : 'text-gray-800 dark:text-gray-200'
      }`}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </a>
  );
}