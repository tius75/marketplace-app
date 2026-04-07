"use client";
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { ProductGallery } from '@/components/ImageZoomModal';

export default function ProductCard({ product }: { product: any }) {
  const addToCart = useCartStore((state: any) => state.addToCart);
  const isOutOfStock = product.stock <= 0;
  const images = product.imageUrls || (product.imageURL ? [product.imageURL] : []);
  const video = product.videoUrl;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition group relative">
      {/* Category Badge - Absolute positioned */}
      <span className="absolute top-6 left-6 z-10 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-gray-600 uppercase tracking-wider">
        {product.category || 'General'}
      </span>

      {/* Out of Stock Badge */}
      {isOutOfStock && (
        <span className="absolute top-6 right-6 z-10 bg-red-500 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase">
          Habis
        </span>
      )}

      {/* Product Gallery with Zoom */}
      <div className="mb-4">
        <ProductGallery images={images} video={video} />
      </div>

      <div className="space-y-1 mb-4 px-1">
        <h3 className="font-bold text-gray-800 line-clamp-1">{product.name}</h3>
        <div className="flex justify-between items-center">
          <p className="text-blue-600 font-black">Rp {product.price.toLocaleString()}</p>
          <p className={`text-[10px] font-bold ${isOutOfStock ? 'text-red-500' : 'text-gray-400'}`}>
            Stok: {product.stock}
          </p>
        </div>
      </div>

      <button
        onClick={() => addToCart(product)}
        disabled={isOutOfStock}
        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
          isOutOfStock
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
        }`}
      >
        {isOutOfStock ? 'Stok Habis' : 'Tambah Ke Keranjang'}
      </button>
    </div>
  );
}