import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import s3Service from '../../../../lib/aws-s3.js';

// Domyślne stacje (używane gdy S3 jest puste)
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

export async function GET() {
  try {
    const stations = await getStations();
    return NextResponse.json(stations);
  } catch (error) {
    logger.error('Error reading stations:', error);
    return NextResponse.json(
      { message: 'Nie udało się odczytać stacji.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, url, genre } = await req.json();

    if (!name || !url || !genre) {
      return NextResponse.json(
        { message: 'Wszystkie pola są wymagane.' },
        { status: 400 }
      );
    }

    const stations = await getStations();

    const newStation = {
      id: Date.now().toString(),
      name: name.trim(),
      url: url.trim(),
      genre: genre.trim(),
    };

    stations.push(newStation);

    // Zapisz do S3
    const saveResult = await saveStations(stations);

    if (!saveResult.success) {
      return NextResponse.json(
        { message: 'Nie udało się zapisać do S3.' },
        { status: 500 }
      );
    }

    return NextResponse.json(newStation, { status: 201 });
  } catch (error) {
    logger.error('Error saving station:', error);
    return NextResponse.json(
      { message: 'Nie udało się zapisać stacji.' },
      { status: 500 }
    );
  }
}
