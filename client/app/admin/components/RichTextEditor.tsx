'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/app/admin/components/ui/button';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  FileCode,
  UploadCloud,
} from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const RichTextEditor = ({ content, onChange, placeholder = 'Write something...' }: RichTextEditorProps) => {
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isImageMode, setIsImageMode] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          class: null,
          target: null,
          rel: null,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert focus:outline-none min-h-[200px] px-4 py-2 text-gray-900 dark:text-white max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (!isSourceMode) {
        onChange(editor.getHTML());
      }
    },
    immediatelyRender: false,
  });

  // Sync content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const openLinkModal = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setIsLinkMode(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      if (editor.isActive('link')) {
        // Editing existing link
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      } else {
        // Creating new link on selected text
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
    }
    setIsLinkMode(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const cancelLink = useCallback(() => {
    setIsLinkMode(false);
    setLinkUrl('');
  }, []);

  const openImageModal = useCallback(() => {
    if (!editor) return;
    setIsImageMode(true);
  }, [editor]);

  const applyImage = useCallback(() => {
    if (!editor) return;

    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setIsImageMode(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      // Convert to Base64 for preview - actual upload happens on form submit
      const base64 = await fileToBase64(file);

      if (editor) {
        // Insert Base64 data URL directly into editor for preview
        editor.chain().focus().setImage({ src: base64 }).run();
      }

      setIsImageMode(false);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const cancelImage = useCallback(() => {
    setIsImageMode(false);
    setImageUrl('');
  }, []);

  const toggleSourceMode = useCallback(() => {
    setIsSourceMode((prev) => !prev);
  }, []);

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onChange(newContent);
    if (editor) {
      editor.commands.setContent(newContent, { emitUpdate: false });
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 flex flex-wrap gap-1 items-center min-h-[40px]">
        {isLinkMode ? (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Enter URL..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                } else if (e.key === 'Escape') {
                  cancelLink();
                }
              }}
            />
            <Button size="sm" onClick={applyLink} type="button" className="h-7 px-2">
              Set
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelLink} type="button" className="h-7 px-2">
              Cancel
            </Button>
          </div>
        ) : isImageMode ? (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter Image URL..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-primary bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyImage();
                } else if (e.key === 'Escape') {
                  cancelImage();
                }
              }}
            />
            <Button size="sm" onClick={applyImage} type="button" className="h-7 px-2">
              Add URL
            </Button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            <label className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <div className="h-7 px-3 bg-primary text-white text-xs flex items-center rounded hover:bg-primary/90 transition-colors">
                <UploadCloud className="w-3 h-3 mr-1" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </div>
            </label>

            <Button size="sm" variant="ghost" onClick={cancelImage} type="button" className="h-7 px-2">
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run() || isSourceMode}
              className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run() || isSourceMode}
              className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run() || isSourceMode}
              className={editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              disabled={isSourceMode}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              disabled={isSourceMode}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              disabled={isSourceMode}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              disabled={isSourceMode}
              className={editor.isActive('heading', { level: 4 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Heading4 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
              disabled={isSourceMode}
              className={editor.isActive('heading', { level: 5 }) ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Heading5 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={isSourceMode}
              className={editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              disabled={isSourceMode}
              className={editor.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              disabled={isSourceMode}
              className={editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
            <Button
              variant="ghost"
              size="sm"
              onClick={openLinkModal}
              disabled={isSourceMode}
              className={editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openImageModal}
              disabled={isSourceMode}
              type="button"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run() || isSourceMode}
              type="button"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run() || isSourceMode}
              type="button"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 self-center" />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSourceMode}
              className={isSourceMode ? 'bg-gray-200 dark:bg-gray-700' : ''}
              type="button"
              title="View Source"
            >
              <FileCode className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {isSourceMode ? (
        <textarea
          value={content}
          onChange={handleSourceChange}
          className="w-full h-[500px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none resize-none"
        />
      ) : (
        <EditorContent editor={editor} className="max-h-[500px] overflow-y-auto" />
      )}
      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #adb5bd;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror {
          min-height: 150px;
          outline: none;
        }
        .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5em;
        }
        .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5em;
        }
        .ProseMirror h1 {
            font-size: 2em;
            font-weight: bold;
        }
        .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: bold;
        }
        .ProseMirror h3 {
            font-size: 1.17em;
            font-weight: bold;
        }
        .ProseMirror h4 {
            font-size: 1em;
            font-weight: bold;
        }
        .ProseMirror h5 {
            font-size: 0.83em;
            font-weight: bold;
        }
        .ProseMirror blockquote {
            border-left: 3px solid #ccc;
            padding-left: 1em;
            margin-left: 0;
            font-style: italic;
        }
        .ProseMirror pre {
            background: #0d0d0d;
            color: #fff;
            font-family: 'JetBrainsMono', monospace;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
        }
        .ProseMirror pre code {
            color: inherit;
            padding: 0;
            background: none;
            font-size: 0.8rem;
        }
        .ProseMirror img {
            max-width: 100%;
            height: auto;
        }
        .ProseMirror a {
            color: #0066cc;
            text-decoration: underline;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
