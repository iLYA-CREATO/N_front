import React from 'react';
import { 
    Bold, Italic, Underline, Strikethrough, 
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    Undo, Redo, RotateCcw, Type
} from 'lucide-react';

const RichTextToolbar = ({ onFormat, onUndo, onRedo, onClear }) => {
    const formatOptions = [
        { icon: <Bold size={16} />, title: 'Жирный', action: 'bold' },
        { icon: <Italic size={16} />, title: 'Курсив', action: 'italic' },
        { icon: <Underline size={16} />, title: 'Подчёркнутый', action: 'underline' },
        { icon: <Strikethrough size={16} />, title: 'Зачёркнутый', action: 'strikeThrough' },
    ];

    const listOptions = [
        { icon: <List size={16} />, title: 'Маркированный список', action: 'unorderedList' },
        { icon: <ListOrdered size={16} />, title: 'Нумерованный список', action: 'orderedList' },
    ];

    const alignOptions = [
        { icon: <AlignLeft size={16} />, title: 'По левому краю', action: 'alignLeft' },
        { icon: <AlignCenter size={16} />, title: 'По центру', action: 'alignCenter' },
        { icon: <AlignRight size={16} />, title: 'По правому краю', action: 'alignRight' },
    ];

    return (
        <div className="flex flex-wrap gap-1 p-2 bg-gray-100 border border-gray-300 rounded-t-lg">
            {/* History buttons */}
            <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
                <button
                    type="button"
                    onClick={onUndo}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Отменить"
                >
                    <Undo size={16} />
                </button>
                <button
                    type="button"
                    onClick={onRedo}
                    className="p-1.5 hover:bg-gray-200 rounded transition"
                    title="Повторить"
                >
                    <Redo size={16} />
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    className="p-1.5 hover:bg-red-100 text-red-600 rounded transition"
                    title="Очистить форматирование"
                >
                    <RotateCcw size={16} />
                </button>
            </div>

            {/* Text formatting */}
            <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
                {formatOptions.map((option) => (
                    <button
                        key={option.action}
                        type="button"
                        onClick={() => onFormat(option.action)}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title={option.title}
                    >
                        {option.icon}
                    </button>
                ))}
            </div>

            {/* Lists */}
            <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
                {listOptions.map((option) => (
                    <button
                        key={option.action}
                        type="button"
                        onClick={() => onFormat(option.action)}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title={option.title}
                    >
                        {option.icon}
                    </button>
                ))}
            </div>

            {/* Alignment */}
            <div className="flex gap-1">
                {alignOptions.map((option) => (
                    <button
                        key={option.action}
                        type="button"
                        onClick={() => onFormat(option.action)}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title={option.title}
                    >
                        {option.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RichTextToolbar;
