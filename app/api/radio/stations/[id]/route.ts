import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import s3Service from '../../../../../lib/aws-s3.js';

// Domyślne stacje
const DEFAULT_STATIONS = [
  {
    id: '1',
    name: 'Fun Radio',
    url: 'https://vrt.streamabc.net/vrt-klaracontinuo-mp3-128-6851541',
    genre: 'International',
  },
  {
    id: '2',
    name: 'DiscoPolo80',
    url: 'http://s1.discoparty.pl:7432/;',
    genre: 'DiscoPolo',
  },
];

// Pobierz stacje z S3
async function getStations() {
  const result = await s3Service.loadJsonData('stations', DEFAULT_STATIONS);
  return result.data || DEFAULT_STATIONS;
}

// Zapisz stacje do S3
async function saveStations(stations: any[]) {
  return await s3Service.saveJsonData('stations', stations);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    let stations = await getStations();
    const stationIndex = stations.findIndex((station: any) => station.id.toString() === id);

    if (stationIndex === -1) {
      return NextResponse.json({ message: 'Nie znaleziono stacji.' }, { status: 404 });
    }

    stations.splice(stationIndex, 1);

    // Zapisz do S3
    await saveStations(stations);

    return NextResponse.json({ message: 'Stacja została usunięta.' });
  } catch (error) {
    logger.error('Error deleting station:', error);
    return NextResponse.json({ message: 'Błąd serwera.' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { name, url, genre } = await req.json();

    if (!name || !url || !genre) {
      return NextResponse.json({ message: 'Wszystkie pola są wymagane.' }, { status: 400 });
    }

    let stations = await getStations();
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

    // Zapisz do S3
    await saveStations(stations);

    return NextResponse.json(updatedStation);
  } catch (error) {
    logger.error('Error updating station:', error);
    return NextResponse.json({ message: 'Błąd serwera.' }, { status: 500 });
  }
}
