import React, { useState, useRef, useEffect } from 'react';
import { 
    Bold, Italic, Underline, Strikethrough, 
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    Undo, Redo, RotateCcw
} from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder = 'Введите текст...' }) => {
    const editorRef = useRef(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Save current state to history
    const saveToHistory = () => {
        const html = editorRef.current?.innerHTML || '';
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            return [...newHistory, html];
        });
        setHistoryIndex(prev => prev + 1);
    };

    // Apply formatting
    const formatText = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        saveToHistory();
        onChange(editorRef.current?.innerHTML || '');
    };

    // Undo
    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            editorRef.current.innerHTML = history[newIndex];
            onChange(history[newIndex]);
        }
    };

    // Redo
    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            editorRef.current.innerHTML = history[newIndex];
            onChange(history[newIndex]);
        }
    };

    // Clear formatting
    const clearFormatting = () => {
        editorRef.current?.focus();
        document.execCommand('removeFormat', false, null);
        saveToHistory();
        onChange(editorRef.current?.innerHTML || '');
    };

    // Handle input
    const handleInput = () => {
        onChange(editorRef.current?.innerHTML || '');
    };

    // Initialize history with initial value
    useEffect(() => {
        if (editorRef.current && value && history.length === 0) {
            editorRef.current.innerHTML = value || '';
            setHistory([value || '']);
            setHistoryIndex(0);
        }
    }, []);

    // Toolbar buttons configuration
    const formatOptions = [
        { icon: <Bold size={16} />, title: 'Жирный', action: 'bold' },
        { icon: <Italic size={16} />, title: 'Курсив', action: 'italic' },
        { icon: <Underline size={16} />, title: 'Подчёркнутый', action: 'underline' },
        { icon: <Strikethrough size={16} />, title: 'Зачёркнутый', action: 'strikeThrough' },
    ];

    const listOptions = [
        { icon: <List size={16} />, title: 'Маркированный', action: 'insertUnorderedList' },
        { icon: <ListOrdered size={16} />, title: 'Нумерованный', action: 'insertOrderedList' },
    ];

    const alignOptions = [
        { icon: <AlignLeft size={16} />, title: 'По левому краю', action: 'justifyLeft' },
        { icon: <AlignCenter size={16} />, title: 'По центру', action: 'justifyCenter' },
        { icon: <AlignRight size={16} />, title: 'По правому краю', action: 'justifyRight' },
    ];

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 bg-gray-100 border-b border-gray-300">
                {/* History buttons */}
                <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
                    <button
                        type="button"
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        className="p-1.5 hover:bg-gray-200 rounded transition disabled:opacity-50"
                        title="Отменить"
                    >
                        <Undo size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={redo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-1.5 hover:bg-gray-200 rounded transition disabled:opacity-50"
                        title="Повторить"
                    >
                        <Redo size={16} />
                    </button>
                    <button
                        type="button"
                        onClick={clearFormatting}
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
                            onClick={() => formatText(option.action)}
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
                            onClick={() => formatText(option.action)}
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
                            onClick={() => formatText(option.action)}
                            className="p-1.5 hover:bg-gray-200 rounded transition"
                            title={option.title}
                        >
                            {option.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="w-full px-3 py-2 min-h-[100px] max-h-[300px] overflow-y-auto focus:outline-none"
                data-placeholder={placeholder}
                suppressContentEditableWarning
                style={{ 
                    minHeight: '100px',
                }}
            />
        </div>
    );
};

export default RichTextEditor;
