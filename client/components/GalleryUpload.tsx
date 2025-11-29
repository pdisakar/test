import React, { useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface GalleryImage {
  id: string;
  file: File | null;
  preview: string;
}

interface GalleryUploadProps {
  label: string;
  images: GalleryImage[];
  onImagesChange: (images: GalleryImage[]) => void;
  disabled?: boolean;
}

interface SortableImageProps {
  img: GalleryImage;
  onRemove: (id: string) => void;
  disabled?: boolean;
  getSrc: (url: string) => string;
}

function SortableImage({ img, onRemove, disabled, getSrc }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group touch-none"
    >
      <img
        src={getSrc(img.preview)}
        alt="Gallery preview"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation(); // Prevent drag start
            onRemove(img.id);
          }}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on button click
          disabled={disabled}
          className="p-2 bg-white dark:bg-gray-800 rounded-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function GalleryUpload({
  label,
  images,
  onImagesChange,
  disabled = false
}: GalleryUploadProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: GalleryImage = {
          id: Date.now() + Math.random().toString(),
          file,
          preview: reader.result as string
        };
        onImagesChange([...images, newImage]);
      };
      reader.readAsDataURL(file);
    });
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeGalleryImage = async (id: string) => {
    // Find the image to delete
    const imageToDelete = images.find(img => img.id === id);

    // If it's an existing image from the database (has preview but no file), delete from server
    if (imageToDelete && imageToDelete.preview && !imageToDelete.file) {
      try {
        await fetch('http://localhost:3001/api/upload/image', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: imageToDelete.preview }),
        });
        console.log('[DEBUG] Deleted gallery image from server:', imageToDelete.preview);
      } catch (err) {
        console.error('Failed to delete gallery image from backend:', err);
      }
    }

    // Remove from state
    onImagesChange(images.filter(img => img.id !== id));
  };

  const getSrc = (url: string) => {
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http')) {
      return url;
    }
    return `http://localhost:3001${url}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{label}</h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={images.map(img => img.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img) => (
              <SortableImage
                key={img.id}
                img={img}
                onRemove={removeGalleryImage}
                disabled={disabled}
                getSrc={getSrc}
              />
            ))}

            <div
              onClick={() => !disabled && galleryInputRef.current?.click()}
              className={`aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400`}
            >
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">Add Media</span>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
              disabled={disabled}
            />
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
