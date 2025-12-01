import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';

interface Item {
    id: number;
    title: string;
    parentId: number | null;
    children?: Item[];
    [key: string]: any;
}

interface HierarchySelectorProps {
    items: Item[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    placeholder?: string;
    className?: string;
    clearable?: boolean;
}

export const HierarchySelector: React.FC<HierarchySelectorProps> = ({
    items,
    selectedId,
    onSelect,
    placeholder = "Select item...",
    className = "",
    clearable = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [tree, setTree] = useState<Item[]>([]);

    useEffect(() => {
        const buildTree = (items: Item[]): Item[] => {
            const itemMap = new Map<number, Item>();
            const roots: Item[] = [];

            // Clone items to avoid mutating original array
            items.forEach(item => {
                itemMap.set(item.id, { ...item, children: [] });
            });

            items.forEach(item => {
                const node = itemMap.get(item.id)!;
                if (item.parentId && itemMap.has(item.parentId)) {
                    const parent = itemMap.get(item.parentId)!;
                    parent.children?.push(node);
                } else {
                    roots.push(node);
                }
            });

            return roots;
        };

        setTree(buildTree(items));
    }, [items]);

    const selectedItem = items.find(i => i.id === selectedId);

    const toggleExpand = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const renderNode = (node: Item, depth: number = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedIds.has(node.id);
        const isSelected = node.id === selectedId;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={`
                        flex items-center py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer
                        ${isSelected ? 'bg-primary/10 text-primary' : 'text-gray-700 dark:text-gray-300'}
                    `}
                    style={{ paddingLeft: `${depth * 20 + 12}px` }}
                    onClick={() => {
                        onSelect(node.id);
                        setIsOpen(false);
                    }}
                >
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(e) => toggleExpand(e, node.id)}
                            className="p-1 mr-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                    ) : (
                        <span className="w-6 mr-1" />
                    )}
                    <span className="flex-1 truncate text-sm">{node.title}</span>
                    {isSelected && <Check className="h-4 w-4 ml-2" />}
                </div>

                {hasChildren && isExpanded && (
                    <div>
                        {node.children!.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`relative ${className}`}>
            <div
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`text-sm ${selectedItem ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                    {selectedItem ? selectedItem.title : placeholder}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {clearable && (
                            <div
                                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800"
                                onClick={() => {
                                    onSelect(null);
                                    setIsOpen(false);
                                }}
                            >
                                -- None --
                            </div>
                        )}
                        {tree.length > 0 ? (
                            <div className="py-1">
                                {tree.map(node => renderNode(node))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">No items found</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
