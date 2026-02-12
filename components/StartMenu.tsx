'use client';

import { signOut } from 'next-auth/react';

interface DesktopIcon {
  id: string;
  icon: string;
  label: string;
  type: "app" | "link" | "folder";
  action: () => void;
  folder?: string;
  iconImage?: string;
}

interface StartMenuProps {
  show: boolean;
  onClose: () => void;
  desktopIcons: DesktopIcon[];
  session: any; // Simplified type for session
}

export default function StartMenu({ show, onClose, desktopIcons, session }: StartMenuProps) {
  if (!show) {
    return null;
  }

  const folderCategories = ['SYSTEM', 'SPOŁECZNOŚĆ', 'ROZRYWKA', 'ZASOBY'];

  return (
    <div className="absolute top-9 left-1 w-60 bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-black border-b-black z-[120] text-black p-1">
        <div className="flex flex-col">
            {folderCategories.map(category => (
                <div key={category} className="mb-1">
                    <div className="px-2 py-1 font-bold text-left text-sm bg-gray-300 border-b-2 border-gray-500">{category}</div>
                    <div className="bg-white py-1">
                        {desktopIcons.filter(icon => icon.folder === category && icon.type === 'app').map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    item.action();
                                    onClose();
                                }}
                                className="w-full text-left px-2 py-1 hover:bg-[#000080] hover:text-white flex items-center gap-2 text-sm"
                            >
                                {item.iconImage ? (
                                    <img src={item.iconImage} alt="" className="w-4 h-4 object-contain" />
                                ) : (
                                    <span className="text-base">{item.icon}</span>
                                )}
                                <span>{item.label.replace('.exe', '')}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            <div className="border-t-2 border-gray-200 my-1"></div>
            {session ? (
                 <button onClick={() => signOut()} className="w-full text-left px-2 py-2 hover:bg-[#000080] hover:text-white flex items-center gap-2 font-bold text-sm bg-gray-300 border-t-2 border-gray-400">
                    <span className="text-base">🔑</span>
                    <span>Wyloguj</span>
                </button>
            ) : (
                 <button className="w-full text-left px-2 py-2 hover:bg-[#000080] hover:text-white flex items-center gap-2 font-bold text-sm bg-gray-300 border-t-2 border-gray-400">
                    <span className="text-base">🔑</span>
                    <span>Zaloguj</span>
                </button>
            )}
        </div>
    </div>
  );
}
