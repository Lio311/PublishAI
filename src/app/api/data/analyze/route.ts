import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('dataset') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in the dataset field' }, { status: 400 });
    }

    // Read the file into a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the file in memory using xlsx
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    if (workbook.SheetNames.length === 0) {
      return NextResponse.json({ error: 'Workbook is empty' }, { status: 400 });
    }

    // Get the first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to JSON, treating the first row as headers
    const rawData = xlsx.utils.sheet_to_json(worksheet) as Record<string, any>[];

    // Get the first 5 rows of data for sample
    const sampleData = rawData.slice(0, 5);

    // If there is no data, just return empty arrays
    if (sampleData.length === 0) {
      return NextResponse.json({ columns: [], sampleData: [] });
    }

    // Extract column names and infer basic data types from the sample
    const allKeys = new Set<string>();
    for (const row of sampleData) {
        for (const key of Object.keys(row)) {
            allKeys.add(key);
        }
    }

    const columns = Array.from(allKeys).map(key => {
      let type = 'string'; // Default fallback
      
      // Look for the first valid value to infer the type
      for (const row of sampleData) {
        const value = row[key];
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'number') {
            type = 'number';
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          }
          break;
        }
      }
      
      return { name: key, type };
    });

    return NextResponse.json({
      columns,
      sampleData
    });

  } catch (error) {
    console.error('Error processing dataset upload:', error);
    return NextResponse.json(
      { error: 'Failed to process the uploaded file' },
      { status: 500 }
    );
  }
}
