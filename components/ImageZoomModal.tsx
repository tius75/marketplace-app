"use client";
import { useState } from 'react';

// Image Zoom Modal Component
export default function ImageZoomModal({ images, onClose }: { images: string[]; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[1001] text-white text-3xl font-bold hover:text-gray-300"
      >
        ✕
      </button>

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold transition"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold transition"
            >
              ›
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`w-3 h-3 rounded-full transition ${
                    idx === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Product Gallery Component with Zoom
export function ProductGallery({ images, video }: { images: string[]; video?: string }) {
  const [showZoom, setShowZoom] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Image Gallery */}
      <div className="relative">
        <div
          className="relative cursor-pointer group"
          onClick={() => setShowZoom(true)}
        >
          <img
            src={images[0]}
            alt="Product"
            className="w-full aspect-square object-cover rounded-xl"
          />
          
          {/* Zoom Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center rounded-xl">
            <div className="opacity-0 group-hover:opacity-100 transition bg-white/90 rounded-full w-12 h-12 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>

          {/* Image Count Badge */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
              📷 {images.length}
            </div>
          )}

          {/* Video Badge */}
          {video && (
            <div className="absolute bottom-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              🎥 Video
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {images.slice(1, 4).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-75 transition flex-shrink-0"
                onClick={() => setShowZoom(true)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Player */}
      {video && (
        <div className="mt-3">
          <video controls className="w-full rounded-xl" poster={images[0]}>
            <source src={video} type="video/mp4" />
            Browser Anda tidak mendukung video tag.
          </video>
        </div>
      )}

      {/* Zoom Modal */}
      {showZoom && <ImageZoomModal images={images} onClose={() => setShowZoom(false)} />}
    </>
  );
}
