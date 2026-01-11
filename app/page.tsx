'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Window from '@/components/Window';
import HeroSlider from '@/components/HeroSlider';
import RollupImage from '@/components/RollupImage';
import RollupVideo from '@/components/RollupVideo';

// Lazy load 3D
const Rollup3D = dynamic(() => import('@/components/Rollup3D'), { ssr: false });
const RollupCharacter = dynamic(() => import('@/components/RollupCharacter'), { ssr: false });

export default function Home() {
  const [windows, setWindows] = useState({
    slider: true,
    image: false,
    video: false,
    model3d: false,
    character: false,
  });

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
      title: 'Każdy wielki projekt zaczyna się od pierwszego kroku.',
      imageUrl: '/images/slider-3.jpg',
      linkTo: 'https://www.facebook.com/annajuszczakfotografia/',
    },
  ];

  return (
    <main className="w-screen h-screen relative overflow-hidden">
      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-4 z-0">
        <div
          className="desktop-icon"
          onDoubleClick={() => setWindows({ ...windows, slider: true })}
        >
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded flex items-center justify-center text-2xl">
            🖼️
          </div>
          <span>Gallery.exe</span>
        </div>

        <div
          className="desktop-icon"
          onDoubleClick={() => setWindows({ ...windows, image: true })}
        >
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded flex items-center justify-center text-2xl">
            📷
          </div>
          <span>Chlapak.bmp</span>
        </div>

        <div
          className="desktop-icon"
          onDoubleClick={() => setWindows({ ...windows, video: true })}
        >
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded flex items-center justify-center text-2xl">
            🎬
          </div>
          <span>Movie.avi</span>
        </div>

        <div
          className="desktop-icon"
          onDoubleClick={() => setWindows({ ...windows, model3d: true })}
        >
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded flex items-center justify-center text-2xl">
            👕
          </div>
          <span>Shirt3D.obj</span>
        </div>

        <div
          className="desktop-icon"
          onDoubleClick={() => setWindows({ ...windows, character: true })}
        >
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded flex items-center justify-center text-2xl">
            🧑
          </div>
          <span>Character.3ds</span>
        </div>
      </div>

      {/* Windows */}
      {windows.slider && (
        <Window
          title="KUPMAX Gallery - Internet Explorer"
          icon="🖼️"
          width="800px"
          height="600px"
          x={100}
          y={50}
          onClose={() => setWindows({ ...windows, slider: false })}
        >
          <div className="w-full h-full">
            <HeroSlider slides={slides} />
          </div>
        </Window>
      )}

      {windows.image && (
        <Window
          title="Chlapak.bmp - Paint"
          icon="📷"
          width="500px"
          height="400px"
          x={150}
          y={100}
          onClose={() => setWindows({ ...windows, image: false })}
        >
          <div className="p-4">
            <RollupImage
              src="/images/chlapak.avif"
              alt="Reklama - Chlapak"
              linkTo="https://kupmax.pl"
            />
          </div>
        </Window>
      )}

      {windows.video && (
        <Window
          title="Movie.avi - Windows Media Player"
          icon="🎬"
          width="600px"
          height="450px"
          x={200}
          y={150}
          onClose={() => setWindows({ ...windows, video: false })}
        >
          <div className="p-4">
            <RollupVideo src="/videos/reklama.mp4" />
          </div>
        </Window>
      )}

      {windows.model3d && (
        <Window
          title="Shirt3D.obj - 3D Viewer"
          icon="👕"
          width="700px"
          height="500px"
          x={250}
          y={80}
          onClose={() => setWindows({ ...windows, model3d: false })}
        >
          <Rollup3D src="/models/koszulka.glb" />
        </Window>
      )}

      {windows.character && (
        <Window
          title="Character.3ds - 3D Studio MAX"
          icon="🧑"
          width="700px"
          height="500px"
          x={300}
          y={120}
          onClose={() => setWindows({ ...windows, character: false })}
        >
          <RollupCharacter src="/models/postac.glb" />
        </Window>
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-[#c0c0c0] border-t-2 border-t-white border-b-2 border-b-black flex items-center px-2 gap-2 z-50">
        <button className="win95-button px-3 h-6 font-bold flex items-center gap-2">
          <span className="text-lg">🪟</span>
          <span>Start</span>
        </button>
        <div className="flex-1" />
        <div className="text-xs px-2 border-2 border-[#808080] border-t-black border-l-black h-6 flex items-center">
          {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </main>
  );
}
