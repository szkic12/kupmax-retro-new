import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  const jsonDirectory = path.join(process.cwd(), 'data');
  const filePath = path.join(jsonDirectory, 'stations.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return NextResponse.json(JSON.parse(fileContents));
  } catch (error) {
    console.error('Error reading stations:', error);
    return NextResponse.json(
      { message: 'Nie udało się odczytać pliku stacji.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const jsonDirectory = path.join(process.cwd(), 'data');
  const filePath = path.join(jsonDirectory, 'stations.json');

  try {
    const { name, url, genre } = await req.json();

    if (!name || !url || !genre) {
      return NextResponse.json(
        { message: 'Wszystkie pola są wymagane.' },
        { status: 400 }
      );
    }

    const fileContents = await fs.readFile(filePath, 'utf8');
    const stations = JSON.parse(fileContents);

    const newStation = {
      id: Date.now().toString(),
      name: name.trim(),
      url: url.trim(),
      genre: genre.trim(),
    };

    stations.push(newStation);

    await fs.writeFile(filePath, JSON.stringify(stations, null, 2));

    return NextResponse.json(newStation, { status: 201 });
  } catch (error) {
    console.error('Error saving station:', error);
    return NextResponse.json(
      { message: 'Nie udało się zapisać stacji.' },
      { status: 500 }
    );
  }
}
