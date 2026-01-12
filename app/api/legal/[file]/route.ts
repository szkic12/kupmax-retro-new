import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  // Dozwolone pliki
  const allowedFiles = [
    'POLITYKA_PRYWATNOSCI',
    'POLITYKA_COOKIES',
    'REGULAMIN_PORTALU',
    'REGULAMIN_SKLEPU',
    'FAQ',
    'OBSLUGA_KLIENTA',
    'POLITYKA_DOSTEPNOSCI',
    'REGULAMIN_VIBEHUB3D'
  ];

  if (!allowedFiles.includes(file)) {
    return NextResponse.json({ error: 'Plik nie znaleziony' }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), 'documents', 'active', `${file}.md`);
    const content = fs.readFileSync(filePath, 'utf-8');

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Błąd wczytywania pliku:', error);
    return NextResponse.json({ error: 'Błąd wczytywania pliku' }, { status: 500 });
  }
}
