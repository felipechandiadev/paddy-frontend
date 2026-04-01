"use client";

import Link from "next/link";
import { useActiveTab } from "@/shared/providers/ActiveTabProvider";

export interface TabItem {
  url: string; // Updated href to url
  label: string;
}

interface TabsProps {
  items: TabItem[];
}

const Tabs: React.FC<TabsProps> = ({ items }) => {
  const { activeTab } = useActiveTab();

  return (
    <nav className="flex" data-test-id="tabs-root">
      {items.map((tab) => {
        const isActive = activeTab === tab.url.split("=")[1];

        return (
          <Link
            key={tab.url}
            href={tab.url}
            className={`inline-flex items-center border-b-2 px-6 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default Tabs;
