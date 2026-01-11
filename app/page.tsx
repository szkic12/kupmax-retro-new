'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import HeroSlider from '@/components/HeroSlider';
import RollupImage from '@/components/RollupImage';
import RollupVideo from '@/components/RollupVideo';

// Lazy load 3D components (heavy)
const Rollup3D = dynamic(() => import('@/components/Rollup3D'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-full" />
});

const RollupCharacter = dynamic(() => import('@/components/RollupCharacter'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-full" />
});

export default function Home() {
  const slides = [
    {
      title: 'Koniec odkładania. Czas tworzenia.',
      imageUrl: '/images/slider-1.jpg',
      linkTo: 'https://www.facebook.com/annajuszczakfotografia/',
    },
    {
      title: 'Przestań marzyć. Zacznij działać.',
      imageUrl: '/images/slider-2.jpg',
      linkTo: 'https://www.facebook.com/annajuszczakfotografia/',
    },
    {
      title: 'Każdy wielki projekt zaczyna się od pierwszego kroku. Zrób go teraz.',
      imageUrl: '/images/slider-3.jpg',
      linkTo: 'https://www.facebook.com/annajuszczakfotografia/',
    },
  ];

  return (
    <main className="min-h-screen bg-black p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-screen max-h-screen">
        {/* Center - Hero Slider */}
        <div className="lg:col-span-2 lg:row-span-2 h-full">
          <HeroSlider slides={slides} />
        </div>

        {/* Right column - Rollups */}
        <div className="flex flex-col gap-4 h-full">
          <div className="flex-1">
            <RollupImage
              src="/images/chlapak.avif"
              alt="Reklama - Chlapak"
              linkTo="https://kupmax.pl"
            />
          </div>

          <div className="flex-1">
            <RollupVideo src="/videos/reklama.mp4" />
          </div>
        </div>

        {/* Bottom row - 3D models */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          <Suspense fallback={<div className="animate-pulse bg-gray-800 rounded-lg h-full min-h-[300px]" />}>
            <Rollup3D src="/models/koszulka.glb" />
          </Suspense>

          <Suspense fallback={<div className="animate-pulse bg-gray-800 rounded-lg h-full min-h-[300px]" />}>
            <RollupCharacter src="/models/postac.glb" />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
