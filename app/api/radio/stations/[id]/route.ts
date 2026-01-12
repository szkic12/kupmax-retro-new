import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jsonDirectory = path.join(process.cwd(), 'data');
  const filePath = path.join(jsonDirectory, 'stations.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    let stations = JSON.parse(fileContents);
    const stationIndex = stations.findIndex((station: any) => station.id.toString() === id);

    if (stationIndex === -1) {
      return NextResponse.json({ message: 'Nie znaleziono stacji.' }, { status: 404 });
    }

    stations.splice(stationIndex, 1);
    await fs.writeFile(filePath, JSON.stringify(stations, null, 2));

    return NextResponse.json({ message: 'Stacja została usunięta.' });
  } catch (error) {
    console.error('Error deleting station:', error);
    return NextResponse.json({ message: 'Błąd serwera.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const jsonDirectory = path.join(process.cwd(), 'data');
  const filePath = path.join(jsonDirectory, 'stations.json');

  try {
    const { name, url, genre } = await req.json();

    if (!name || !url || !genre) {
      return NextResponse.json({ message: 'Wszystkie pola są wymagane.' }, { status: 400 });
    }

    const fileContents = await fs.readFile(filePath, 'utf8');
    let stations = JSON.parse(fileContents);
    const stationIndex = stations.findIndex((station: any) => station.id.toString() === id);

    if (stationIndex === -1) {
      return NextResponse.json({ message: 'Nie znaleziono stacji.' }, { status: 404 });
    }

    const updatedStation = {
      ...stations[stationIndex],
      name: name.trim(),
      url: url.trim(),
      genre: genre.trim(),
    };

    stations[stationIndex] = updatedStation;
    await fs.writeFile(filePath, JSON.stringify(stations, null, 2));

    return NextResponse.json(updatedStation);
  } catch (error) {
    console.error('Error updating station:', error);
    return NextResponse.json({ message: 'Błąd serwera.' }, { status: 500 });
  }
}
